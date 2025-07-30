const express = require('express');
const router = express.Router();
const db = require('../models');
const user_controller = require('../controllers/userController');

// Force sync database (for development only)
router.post('/login', async (req, res) => {
    const { user_name, password } = req.body;
    
    if (!user_name | !password) {
        res.status(400).json({
            success: false,
            message: 'Tên tài khoản hoặc mật khẩu không được để trống'
        });
    }
    await user_controller.login(user_name, password, res);
});

module.exports = router;