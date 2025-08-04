const express = require('express');
const router = express.Router();
const schedule_controller = require('../controllers/scheduleController');
const { authenticate_jwt } = require('../middleware/auth');
const { require_admin_role } = require('../middleware/admin');

/**
 * Schedule Routes
 * 
 * All routes require authentication. Admin routes require admin permissions.
 * Base path: /api/schedule
 */

// Middleware for all schedule routes - require authentication
router.use(authenticate_jwt);

/**
 * GET /api/schedule/overview
 * Get comprehensive schedule overview with statistics
 * 
 * Query parameters:
 * - start_date: Filter by start date (YYYY-MM-DD)
 * - end_date: Filter by end date (YYYY-MM-DD)
 * - room_id: Filter by room ID
 * - subject_code: Filter by subject code
 * - include_stats: Include statistics (default: true)
 * 
 * Response includes exam details with registration and proctor counts
 */
router.get('/overview', schedule_controller.getScheduleOverview);

/**
 * GET /api/schedule/unassigned
 * Get students and proctors not assigned to any published exams
 * 
 * Returns:
 * - unregistered_students: Students not registered for any published exam
 * - unassigned_proctors: Teachers not assigned as proctors to any exam
 */
router.get('/unassigned', require_admin_role, schedule_controller.getUnassignedData);

/**
 * POST /api/schedule/assign-students
 * Assign multiple students to an exam
 * 
 * Body:
 * - exam_id: ID of the exam
 * - student_ids: Array of student IDs to assign
 * - registration_status: Status for the registrations (default: 'approved')
 * 
 * Checks capacity and prevents duplicate registrations
 */
router.post('/assign-students', require_admin_role, schedule_controller.assignStudentsToExam);

/**
 * POST /api/schedule/assign-proctors
 * Assign multiple proctors to an exam
 * 
 * Body:
 * - exam_id: ID of the exam
 * - proctor_assignments: Array of objects with:
 *   - proctor_id: ID of the proctor
 *   - role: Role of proctor (primary, assistant, substitute, observer)
 *   - notes: Optional notes
 * 
 * Checks for scheduling conflicts and prevents duplicate assignments
 */
router.post('/assign-proctors', require_admin_role, schedule_controller.assignProctorsToExam);

/**
 * DELETE /api/schedule/remove-student/:exam_id/:student_id
 * Remove a student from an exam
 * 
 * Parameters:
 * - exam_id: ID of the exam
 * - student_id: ID of the student to remove
 */
router.delete('/remove-student/:exam_id/:student_id', require_admin_role, schedule_controller.removeStudentFromExam);

/**
 * DELETE /api/schedule/remove-proctor/:exam_id/:proctor_id
 * Remove a proctor from an exam
 * 
 * Parameters:
 * - exam_id: ID of the exam
 * - proctor_id: ID of the proctor to remove
 */
router.delete('/remove-proctor/:exam_id/:proctor_id', require_admin_role, schedule_controller.removeProctorFromExam);

/**
 * Error Handler Middleware for Schedule Routes
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
    console.error('❌ Schedule route error:', error);
    
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
            message: 'Xung đột lịch thi',
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
        message: 'Lỗi hệ thống lập lịch thi',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
});

module.exports = router;
