const db = require('../db');

exports.addKas = async (req, res) => {
  try {
    const { user_id, jumlah, keterangan } = req.body;
    const bulan = new Date().getFullYear(); // 2026
    const bulan_month = new Date().getMonth() + 1; // 1 (Januari)
    
    const [result] = await db.query(
      'INSERT INTO kas (user_id, jumlah, bulan, bulan_month, keterangan) VALUES (?, ?, ?, ?, ?)',
      [user_id, jumlah, bulan, bulan_month, keterangan]
    );
    
    res.json({ msg: 'Kas added successfully', id: result.insertId });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};

exports.getKas = async (req, res) => {
  try {
    const { user_id } = req.query;
    let query = 'SELECT k.*, u.username FROM kas k JOIN users u ON k.user_id = u.id';
    let params = [];
    
    if (user_id) {
      query += ' WHERE k.user_id = ?';
      params.push(user_id);
    }
    query += ' ORDER BY k.created_at DESC';
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getKasCountBulanIni = async (req, res) => {
  try {
    const bulan = new Date().getFullYear();
    const bulan_month = new Date().getMonth() + 1;
    const { user_id } = req.params;
    
    const [rows] = await db.query(
      'SELECT COALESCE(SUM(jumlah), 0) as total_dibayar, COUNT(*) as transaksi FROM kas WHERE user_id = ? AND bulan = ? AND bulan_month = ?',
      [user_id, bulan, bulan_month]
    );
    
    const total = parseFloat(rows[0].total_dibayar);
    const progress = (total / 20000 * 100).toFixed(2);
    const sisa = Math.max(0, 20000 - total);
    
    res.json({
      total_dibayar: total,
      transaksi: rows[0].transaksi || 0,
      progress,
      sisa,
      target: 20000,
      bulan,
      bulan_month
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.kurangiKasTotal = async (req, res) => {
  try {
    const { jumlah, keterangan } = req.body;
    const bulan = new Date().getFullYear();
    const bulan_month = new Date().getMonth() + 1;
    
    // Ambil total pemasukan dulu
    const [userKas] = await db.query(
      `SELECT COALESCE(SUM(jumlah), 0) as grand_total FROM kas WHERE bulan = ? AND bulan_month = ?`,
      [bulan, bulan_month]
    );
    const grandTotalPemasukan = parseFloat(userKas[0].grand_total) || 0;
    
    const [existing] = await db.query(
      'SELECT * FROM kas_total_bulanan WHERE bulan = ? AND bulan_month = ?',
      [bulan, bulan_month]
    );
    
    let sisaTotal;
    if (existing.length > 0) {
      sisaTotal = existing[0].total_uang - parseFloat(jumlah);
    } else {
      // Mulai dari grand_total_pemasukan, bukan 0!
      sisaTotal = grandTotalPemasukan - parseFloat(jumlah);
    }
    
    if (existing.length > 0) {
      await db.query(
        'UPDATE kas_total_bulanan SET total_uang = ?, keterangan = ? WHERE id = ?',
        [sisaTotal, keterangan, existing[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO kas_total_bulanan (bulan, bulan_month, total_uang, keterangan) VALUES (?, ?, ?, ?)',
        [bulan, bulan_month, sisaTotal, keterangan]
      );
    }
    
    res.json({
      msg: 'Kas total berhasil dikurangi',
      bulan,
      bulan_month,
      jumlah_dikurangi: parseFloat(jumlah),
      sisa_total: sisaTotal
    });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};


exports.getKasTotalBulanIni = async (req, res) => {
  try {
    const bulan = new Date().getFullYear();
    const bulan_month = new Date().getMonth() + 1;
    const [rows] = await db.query(
      'SELECT * FROM kas_total_bulanan WHERE bulan = ? AND bulan_month = ?',
      [bulan, bulan_month]
    );
    res.json(rows[0] || { total_uang: 0, keterangan: 'Belum ada data' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getTotalKasBulanIniAdmin = async (req, res) => {
  try {
    const bulan = new Date().getFullYear();
    const bulan_month = new Date().getMonth() + 1;
    
    const [userKas] = await db.query(
      `SELECT u.id, u.username, u.email, COALESCE(SUM(k.jumlah), 0) as total_dibayar, 
              COUNT(k.id) as transaksi 
       FROM users u 
       LEFT JOIN kas k ON u.id = k.user_id AND k.bulan = ? AND k.bulan_month = ?
       GROUP BY u.id`,
      [bulan, bulan_month]
    );
    
    const [kasTotal] = await db.query(
      'SELECT total_uang FROM kas_total_bulanan WHERE bulan = ? AND bulan_month = ?',
      [bulan, bulan_month]
    );
    
    const grandTotalPemasukan = userKas.reduce((sum, u) => sum + parseFloat(u.total_dibayar), 0);
    
    res.json({
      user_kas: userKas,
      kas_total_keseluruhan: kasTotal[0]?.total_uang || 0,
      grand_total_pemasukan: grandTotalPemasukan,
      bulan,
      bulan_month
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
