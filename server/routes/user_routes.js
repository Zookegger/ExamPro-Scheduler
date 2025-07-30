const express = require('express');
const router = express.Router();
const user_controller = require('../controllers/userController');

/**
 * @route POST /api/users/login
 * @description Handles user login requests. Extracts user_name and password from request body,
 * validates input, and delegates authentication logic to the user_controller.
 * Returns a JSON response indicating success or failure.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user_name and password
 * @param {string} req.body.user_name - Username provided by the user
 * @param {string} req.body.password - Password provided by the user
 * @param {Object} res - Express response object
 * 
 * @returns {Object} JSON response with authentication status and message
 * @returns {boolean} response.success - Indicates if login was successful
 * @returns {string} response.message - Status message (bilingual: Vietnamese/English)
 * 
 * @example
 * // Request
 * POST /api/users/login
 * {
 *   "user_name": "admin",
 *   "password": "admin123"
 * }
 * 
 * // Success Response
 * {
 *   "success": true,
 *   "message": "Đăng nhập thành công"
 * }
 * 
 * // Error Response
 * {
 *   "success": false,
 *   "message": "Tên tài khoản hoặc mật khẩu không được để trống"
 * }
 */
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