const express = require('express');
const router = express.Router();
const db = require('../models');
const { utility } = require('../models');
const { Op, Sequelize } = require('sequelize');
const { authenticate_jwt } = require('../middleware/auth');

router.get('/get-all-subjects', async (req, res, next) => {
    try {
        const where_clause = req.params.dictionary ? JSON.parse(req.params.dictionary) : {};

        if (typeof where_clause !== 'object' || Array.isArray(where_clause)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters'
            });
        }

        const subjects = await db.models.Subject.findAndCountAll({
            where: where_clause,
        });

        return res.json({
            success: true,
            subjects: subjects.rows,
            count: subjects.count,
        });
        
    } catch (error) {
        console.error('❌ Get all subjects failed:', error);
        
        if (error instanceof SyntaxError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON in query parameters'
            });
        }
        
        // Pass to Express error handler
        next(error);
    }
});

router.post('/add-new-subject', authenticate_jwt, async(req, res, next) => {
    try {
        // Check admin permission
        if (req.user.user_role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập tài nguyên này'
            });
        }

        const new_subject_data = req.body;

        // Validate required fields
        if (!new_subject_data.subject_code ||
            !new_subject_data.subject_name ||
            !new_subject_data.department) 
        {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin bắt buộc: mã môn học, tên môn học hoặc khoa"
            });
        }

        // Create new subject
        const new_subject = await db.models.Subject.create({
            subject_code: new_subject_data.subject_code,
            subject_name: new_subject_data.subject_name,
            department: new_subject_data.department,
            description: new_subject_data.description || null,
            is_active: new_subject_data.is_active ?? true,
        });

        // Return success response with created data
        return res.status(201).json({
            success: true,
            message: "Tạo môn học mới thành công",
            data: new_subject
        });

    } catch (error) {
        console.error('❌ Create subject failed:', error);
        
        // Handle unique constraint violations
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors[0]?.path;
            let message = 'Dữ liệu đã tồn tại trên hệ thống';
            
            if (field === 'subject_code') {
                message = 'Mã môn học đã tồn tại';
            } else if (field === 'subject_name') {
                message = 'Tên môn học đã tồn tại';
            }
                      
            return res.status(409).json({
                success: false,
                message: message
            });
        }
        
        if (error instanceof SyntaxError) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu JSON không hợp lệ'
            });
        }
        
        // Pass to Express error handler
        next(error);
    }
});

/**
 * Error Handler Middleware for Subject Routes
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
    console.error('❌ Subject route error:', error);
    
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