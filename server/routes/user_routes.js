const express = require('express');
const router = express.Router();
const user_controller = require('../controllers/userController');
const rateLimit = require('express-rate-limit');
const { authenticate_jwt } = require('../middleware/auth');

/**
 * Rate limiter configuration for login endpoints to prevent brute force attacks
 * @module middlewares/rateLimiter
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 * 
 * @property {number} windowMs - Time window for rate limiting in milliseconds (15 minutes)
 * @property {number} max - Maximum number of allowed requests per window
 * @property {string} message - Error message returned when limit is exceeded (Vietnamese)
 * @property {boolean} [standardHeaders=true] - Enable rate limit headers (RFC compliant)
 * @property {boolean} [legacyHeaders=false] - Disable legacy X-RateLimit headers
 * 
 * @example
 * // Apply to login route
 * app.post('/login', loginLimit, authController.login);
 * 
 * @example
 * // Response when limit exceeded:
 * HTTP/1.1 429 Too Many Requests
 * {
 *   "message": "Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút"
 * }
 */
const loginLimit = rateLimit.rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Minutes
    max: 5, // Limit each IP to 4 login requests per window
    message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút'
});

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
router.post('/login', loginLimit, async (req, res) => {
    const { user_name, password } = req.body;
    
    if (!user_name || !password) {
        return res.status(400).json({
            success: false,
            message: 'Tên tài khoản hoặc mật khẩu không được để trống'
        });
    }

    try {
        await user_controller.login(user_name, password, res);
    } catch (error) {
        // Handle any unexpected errors in the controller
        console.error('Route-level login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

/**
 * @route POST /api/users/me
 * @description Returns authenticated user's information. Requires JWT authentication via Authorization header or cookie. Extracts user_id from verified JWT payload and returns user data. Bilingual error messages (Vietnamese/English).
 *
 * @param {Object} req - Express request object
 * @param {Object} req.user - Populated by authenticate_jwt middleware, contains JWT payload
 * @param {number} req.user.user_id - Authenticated user's ID
 * @param {Object} res - Express response object
 *
 * @returns {Object} JSON response with user information or error message
 * @returns {boolean} response.success - Indicates if request was successful
 * @returns {Object} response.user - User data (if successful)
 * @returns {string} response.message - Status message (bilingual: Vietnamese/English)
 *
 * @example
 * // Request (with valid JWT)
 * POST /api/users/me
 * Authorization: Bearer <token>
 *
 * // Success Response
 * {
 *   "success": true,
 *   "user": {
 *     "user_id": 1,
 *     "user_name": "admin",
 *     // ...other fields
 *   }
 * }
 *
 * // Error Response
 * {
 *   "success": false,
 *   "message": "Lỗi hệ thống"
 * }
 */
router.post('/me', authenticate_jwt, async(req, res) => {
    try {
        const user_id = req.user.user_id;
        console.log("HELLO");

        await user_controller.authorize(user_id, res);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
});

module.exports = router;