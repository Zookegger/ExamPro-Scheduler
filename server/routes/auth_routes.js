const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticate_jwt } = require('../middleware/auth');

/**
 * Authentication Routes
 * 
 * This file contains routes for authentication-related operations
 * such as password reset, email verification, etc.
 * Note: Basic login/logout is handled in user_routes.js
 */

// TODO: Add authentication routes here
// Example routes might include:
// - POST /forgot-password
// - POST /reset-password
// - POST /verify-email
// - POST /change-password

/**
 * Error Handler Middleware for Auth Routes
 * 
 * Catches any errors passed via next(error) from route handlers
 * and provides consistent error response format.
 * 
 * @param {Error} error - The error object passed from previous middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next function
 */
router.use((error, req, res, next) => {
    console.error('❌ Auth route error:', error);
    
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
    
    // Default error response
    res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống xác thực',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
});

module.exports = router;