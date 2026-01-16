const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const kasCtrl = require('../controllers/kasController');

// User bisa tambah kas sendiri + lihat data
router.post('/', auth, kasCtrl.addKas);
router.get('/', auth, kasCtrl.getKas);
router.get('/count/:user_id', auth, kasCtrl.getKasCountBulanIni);

// Admin only
router.post('/kurangi-total', auth, adminAuth, kasCtrl.kurangiKasTotal);
router.get('/total-bulan-ini', auth, kasCtrl.getKasTotalBulanIni);
router.get('/admin-total', auth, adminAuth, kasCtrl.getTotalKasBulanIniAdmin);

module.exports = router;
