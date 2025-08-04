const express = require('express');
const router = express.Router();
const exam_controller = require('../controllers/examController');
const { authenticate_jwt } = require('../middleware/auth');
const { require_admin_role } = require('../middleware/admin');

/**
 * Exam Routes
 * 
 * All routes require authentication. Admin/Teacher routes require admin permissions.
 * Base path: /api/exams
 */

// Middleware for all exam routes - require authentication
router.use(authenticate_jwt);

/**
 * GET /api/exams
 * Get all exams with optional filtering
 * 
 * Query parameters:
 * - status: Filter by exam status (draft, published, in_progress, completed, cancelled)
 * - subject_code: Filter by subject code
 * - upcoming: true to get only upcoming exams
 * - room_id: Filter by room ID
 * - proctor_id: Filter by proctor ID
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 50)
 */
router.get('/', exam_controller.getAllExams);

/**
 * GET /api/exams/:exam_id
 * Get a single exam by ID
 */
router.get('/:exam_id', exam_controller.getExamById);

/**
 * POST /api/exams
 * Create a new exam
 * 
 * Required fields:
 * - title: Exam title
 * - subject_code: Subject code
 * - exam_date: Date of the exam
 * - start_time: Start time
 * - end_time: End time
 * - duration_minutes: Duration in minutes
 * - method: Exam method (online, offline, hybrid)
 * 
 * Optional fields:
 * - description: Exam description
 * - max_students: Maximum number of students
 * - room_id: Room ID for offline/hybrid exams
 * - status: Exam status (default: draft)
 * - grade_level: Grade level
 * - class_id: Class ID if exam is for specific class
 */
router.post('/', require_admin_role, exam_controller.createExam);

/**
 * PUT /api/exams/:exam_id
 * Update an existing exam
 * 
 * All fields are optional - only provided fields will be updated
 */
router.put('/:exam_id', require_admin_role, exam_controller.updateExam);

/**
 * DELETE /api/exams/:exam_id
 * Delete an exam
 * 
 * Cannot delete exams that have student registrations
 */
router.delete('/:exam_id', require_admin_role, exam_controller.deleteExam);

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
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
        const validation_errors = error.errors.map(err => ({
            field: err.path,
            message: err.message
        }));
        
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors: validation_errors
        });
    }
    
    // Handle Sequelize unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            success: false,
            message: 'Dữ liệu đã tồn tại',
            error: error.message
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
    
    // Handle Sequelize database errors
    if (error.name && error.name.startsWith('Sequelize')) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi cơ sở dữ liệu',
            error: error.message
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