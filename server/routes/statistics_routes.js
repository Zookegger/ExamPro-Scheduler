/**
 * Statistics Routes
 * 
 * Handles routing for administrative statistics endpoints.
 * Provides comprehensive system metrics, enrollment data, exam performance,
 * and real-time activity feeds for the ExamPro Scheduler dashboard.
 * 
 * All routes require admin authentication and return bilingual responses
 * for Vietnamese high school examination management system.
 */

const express = require('express');
const router = express.Router();
const { 
    getSystemStatistics, 
    getEnrollmentStatistics, 
    getExamStatistics, 
    getRecentActivity 
} = require('../controllers/statisticsController');
const { authenticate_jwt } = require('../middleware/auth');
const { require_admin_role } = require('../middleware/admin');

/**
 * @route   GET /api/statistics/system
 * @desc    Get comprehensive system statistics for admin dashboard
 * @access  Admin
 * @params  ?period=current_semester&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 */
router.get('/system', authenticate_jwt, require_admin_role, getSystemStatistics);

/**
 * @route   GET /api/statistics/enrollment
 * @desc    Get enrollment statistics by grade and subject
 * @access  Admin
 * @params  ?period=current_semester&grade_level=10
 */
router.get('/enrollment', authenticate_jwt, require_admin_role, getEnrollmentStatistics);

/**
 * @route   GET /api/statistics/exams
 * @desc    Get exam statistics including performance and utilization
 * @access  Admin
 * @params  ?period=current_semester&subject_code=MATH&status=completed
 */
router.get('/exams', authenticate_jwt, require_admin_role, getExamStatistics);

/**
 * @route   GET /api/statistics/rooms
 * @desc    Get room utilization statistics (alias for exam room data)
 * @access  Admin
 * @params  ?period=current_semester&room_id=1
 */
router.get('/rooms', authenticate_jwt, require_admin_role, (req, res) => {
    // Room statistics are included in exam statistics
    // This route provides a focused view of room utilization
    req.query.focus = 'room_utilization';
    getExamStatistics(req, res);
});

/**
 * @route   GET /api/statistics/recent-activity
 * @desc    Get recent system activity for admin dashboard feed
 * @access  Admin
 * @params  ?limit=10&type=user_registration
 */
router.get('/recent-activity', authenticate_jwt, require_admin_role, getRecentActivity);

module.exports = router;
