const db = require('../db');

exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, email, role, created_at FROM users');
    const [count] = await db.query('SELECT COUNT(*) as total FROM users');
    res.json({ users, total: count[0].total });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    await db.query('UPDATE users SET ? WHERE id = ?', [updates, id]);
    const [user] = await db.query('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [id]);
    
    res.json({ msg: 'User updated', user: user[0] });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ msg: 'User deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
