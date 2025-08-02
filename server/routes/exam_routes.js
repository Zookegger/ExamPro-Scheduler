const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticate_jwt } = require('../middleware/auth');

/**
 * Exam Management Routes
 * 
 * This file contains routes for exam-related operations
 * such as creating, reading, updating, and deleting exams.
 */

// TODO: Add exam routes here
// Example routes might include:
// - GET /get-all-exams
// - POST /create-exam
// - PUT /update-exam/:exam_id
// - DELETE /delete-exam/:exam_id
// - GET /exam/:exam_id/students
// - POST /exam/:exam_id/assign-proctor

/**
 * Error Handler Middleware for Exam Routes
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
    console.error('❌ Exam route error:', error);
    
    // If response already sent, delegate to Express default error handler
    if (res.headersSent) {
        return next(error);
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
            message: 'Dữ liệu thi không hợp lệ',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Validation failed'
        });
    }
    
    // Default error response
    res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống quản lý thi',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
});

module.exports = router;