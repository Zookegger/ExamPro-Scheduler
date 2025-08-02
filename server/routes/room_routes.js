const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticate_jwt } = require('../middleware/auth');

/**
 * Room Management Routes
 * 
 * This file contains routes for room/classroom management operations
 * such as creating, reading, updating, and deleting rooms.
 */

// TODO: Add room routes here
// Example routes might include:
// - GET /get-all-rooms
// - POST /create-room
// - PUT /update-room/:room_id
// - DELETE /delete-room/:room_id
// - GET /room/:room_id/availability
// - GET /room/:room_id/schedule

/**
 * Error Handler Middleware for Room Routes
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
    console.error('❌ Room route error:', error);
    
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
            message: 'Dữ liệu phòng học không hợp lệ',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Validation failed'
        });
    }
    
    // Default error response
    res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống quản lý phòng học',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
});

module.exports = router;