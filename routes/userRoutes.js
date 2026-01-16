const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const userCtrl = require('../controllers/userController');

router.get('/', auth, adminAuth, userCtrl.getAllUsers);
router.put('/:id', auth, adminAuth, userCtrl.updateUser);
router.delete('/:id', auth, adminAuth, userCtrl.deleteUser);

module.exports = router;
