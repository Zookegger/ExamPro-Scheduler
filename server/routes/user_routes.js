const express = require('express');
const router = express.Router();
const db = require('../models');

// Force sync database (for development only)
router.post('/login', async (req, res) => {
    try {
        const { user_name, password } = req.body;
        
        if (!user_name | !password) {
            res.status(400).json({
                success: false,
                message: 'Tên tài khoản hoặc mật khẩu không được để trống'
            })
        }

        const user = await db.models.User.findOne({
            where: {user_name}
        });
        
        console.log('🔍 User lookup result:', user ? 'Found' : 'Not found');

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Tài khoản không tồn tại',
            });    
        }

        const is_password_valid = await user.checkPassword(password);

        console.log('🔍 Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(user)));

        if (!is_password_valid) {
            return res.status(401).json({
                success: false,
                message: 'Mật khẩu không chính xác',
            });
        }

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            user: {
                id: user.user_id,
                username: user.user_name,
                role: user.user_role
            }
        });
    } catch (error) {
        console.error('❌ Login failed:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi đăng nhập',
            error: error.message
        });
    }
});

module.exports = router;