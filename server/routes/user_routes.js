const express = require('express');
const router = express.Router();
const { userController } = require('../controllers/userController');
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
 * validates input, and delegates authentication logic to the userController.
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
router.post('/login', loginLimit, async (req, res, next) => {
    const { user_name, password } = req.body;
    
    if (!user_name || !password) {
        return res.status(400).json({
            success: false,
            message: 'Tên tài khoản hoặc mật khẩu không được để trống'
        });
    }

    try {
        await userController.login(user_name, password, res);
    } catch (error) {
        console.error('❌ Route-level login error:', error);
        // Pass to Express error handler
        next(error);
    }
});

router.post('/logout', async(req, res, next) => {
    try {
        await userController.logout(res);
    } catch (error) {
        console.error('❌ Route-level logout error:', error);
        // Pass to Express error handler
        next(error);
    }
})

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
router.post('/me', authenticate_jwt, async(req, res, next) => {
    try {
        const user_id = req.user.user_id;

        await userController.authorize(user_id, res);
    } catch (error) {
        console.error('❌ Route-level authorize error:', error);
        // Pass to Express error handler
        next(error);
    }
});

/**
 * @route POST /api/users/websocket-token
 * @description Generates a temporary JWT token for WebSocket authentication.
 * Validates the HTTP-only cookie session and returns a short-lived token
 * specifically for WebSocket connections. This maintains security by not
 * storing tokens in browser storage while enabling WebSocket authentication.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.user - Populated by authenticate_jwt middleware
 * @param {number} req.user.user_id - Authenticated user's ID
 * @param {Object} res - Express response object
 *
 * @returns {Object} JSON response with temporary WebSocket token
 * @returns {boolean} response.success - Indicates if request was successful
 * @returns {string} response.websocket_token - Temporary JWT token for WebSocket auth
 * @returns {number} response.expires_in - Token expiration time in seconds
 *
 * @example
 * // Request (with valid HTTP-only cookie)
 * POST /api/users/websocket-token
 * Cookie: jwt_token=<httponly_token>
 *
 * // Success Response
 * {
 *   "success": true,
 *   "websocket_token": "eyJhbGciOiJIUzI1NiIs...",
 *   "expires_in": 3600
 * }
 */
router.post('/websocket-token', authenticate_jwt, async(req, res, next) => {
    try {
        const user_id = req.user.user_id;

        await userController.get_websocket_token(user_id, res);
    } catch (error) {
        console.error('❌ Route-level websocket-token error:', error);
        next(error);
    }
});

/**
 * @route POST /api/users/renew-websocket-token
 * @description Renews an expired WebSocket token for continued real-time functionality.
 * Validates the HTTP session and issues a fresh WebSocket token without requiring
 * full re-authentication. Prevents constant reconnection loops when tokens expire.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.user - Populated by authenticate_jwt middleware
 * @param {number} req.user.user_id - Authenticated user's ID
 * @param {Object} res - Express response object
 *
 * @returns {Object} JSON response with renewed WebSocket token
 * @returns {boolean} response.success - Indicates if renewal was successful
 * @returns {string} response.websocket_token - New JWT token for WebSocket auth
 * @returns {number} response.expires_in - Token expiration time in seconds
 * @returns {string} response.renewed_at - ISO timestamp of renewal
 *
 * @example
 * // Request (with valid HTTP-only cookie)
 * POST /api/users/renew-websocket-token
 * Cookie: jwt_token=<httponly_token>
 *
 * // Success Response
 * {
 *   "success": true,
 *   "websocket_token": "eyJhbGciOiJIUzI1NiIs...",
 *   "expires_in": 3600,
 *   "renewed_at": "2025-08-04T10:30:00.000Z"
 * }
 */
router.post('/renew-websocket-token', authenticate_jwt, async(req, res, next) => {
    try {
        const user_id = req.user.user_id;

        await userController.renew_websocket_token(user_id, res);
    } catch (error) {
        console.error('❌ Route-level renew-websocket-token error:', error);
        next(error);
    }
});

/**
 * Error Handler Middleware for User Routes
 * 
 * Catches any errors passed via next(error) from route handlers
 * and provides consistent error response format for user-related operations.
 * 
 * @param {Error} error - The error object passed from previous middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next function
 */
router.use((error, req, res, next) => {
    console.error('❌ User route error:', error);
    
    // If response already sent, delegate to Express default error handler
    if (res.headersSent) {
        return next(error);
    }
    
    // Authentication errors
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ'
        });
    }
    
    // Database connection errors
    if (error.name === 'SequelizeConnectionError') {
        return res.status(503).json({
            success: false,
            message: 'Lỗi kết nối cơ sở dữ liệu',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Database unavailable'
        });
    }
    
    // Validation errors
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Validation failed'
        });
    }
    
    // Default error response
    res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
});

module.exports = router;