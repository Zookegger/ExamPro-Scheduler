const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticate_jwt } = require('../middleware/auth');

/**
 * Class Management Routes
 * 
 * This file contains routes for class management operations that are essential
 * for organizing students and scheduling exams efficiently in the ExamPro system.
 * 
 * All routes require authentication and appropriate role permissions.
 */

/**
 * Get all classes with statistics
 * 
 * @route GET /api/classes/get-all-classes
 * @description Retrieves all classes with student counts and exam statistics
 * @access Admin, Teacher (for exam planning and room allocation)
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {Array} response.data - Array of class objects with computed stats
 * @returns {string} response.message - Status message
 * 
 * @example
 * // Success Response (200)
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "class_id": 1,
 *       "class_code": "12A1",
 *       "class_name": "Lớp 12A1 - Khối Tự Nhiên",
 *       "academic_year": "2024-2025",
 *       "grade_level": 12,
 *       "student_count": 32,
 *       "upcoming_exams": 3,
 *       "available_spots": 3,
 *       "homeroom_teacher": {
 *         "full_name": "Nguyễn Văn A",
 *         "user_name": "teacher001"
 *       }
 *     }
 *   ],
 *   "message": "Classes retrieved successfully for exam management"
 * }
 */
router.get('/get-all-classes', authenticate_jwt, classController.get_all_classes);

/**
 * Get detailed information about a specific class
 * 
 * @route GET /api/classes/class-details/:class_id
 * @description Retrieves detailed class information including students and exam schedule
 * @access Admin, Teacher, Students (with restrictions)
 * 
 * @param {number} class_id - The unique identifier of the class
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {Object} response.data - Detailed class information
 * @returns {string} response.message - Status message
 * 
 * @example
 * // Request
 * GET /api/classes/class-details/1
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "data": {
 *     "class_id": 1,
 *     "class_code": "12A1",
 *     "class_name": "Lớp 12A1 - Khối Tự Nhiên",
 *     "students": [
 *       {
 *         "user_id": 15,
 *         "full_name": "Trần Thị B",
 *         "user_name": "student001"
 *       }
 *     ],
 *     "class_exams": [
 *       {
 *         "exam_id": 5,
 *         "title": "Kiểm tra giữa kỳ Toán",
 *         "exam_date": "2025-02-15T08:00:00.000Z",
 *         "subject": {
 *           "subject_name": "Toán học",
 *           "subject_code": "MATH12"
 *         }
 *       }
 *     ]
 *   },
 *   "message": "Class details retrieved successfully"
 * }
 */
router.get('/class-details/:class_id', authenticate_jwt, classController.get_class_details);

/**
 * Create a new class
 * 
 * @route POST /api/classes/create-class
 * @description Creates a new class for exam management
 * @access Admin only
 * 
 * @body {string} class_code - Unique class code (e.g., "12A1")
 * @body {string} class_name - Full name of the class
 * @body {string} academic_year - Academic year (e.g., "2024-2025")
 * @body {number} grade_level - Grade level (10, 11, or 12)
 * @body {number} [teacher_id] - Optional homeroom teacher ID
 * @body {number} [max_students=35] - Maximum number of students
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {Object} response.data - Created class object
 * @returns {string} response.message - Status message
 * 
 * @example
 * // Request
 * POST /api/classes/create-class
 * {
 *   "class_code": "12A1",
 *   "class_name": "Lớp 12A1 - Khối Tự Nhiên",
 *   "academic_year": "2024-2025",
 *   "grade_level": 12,
 *   "teacher_id": 5,
 *   "max_students": 35
 * }
 * 
 * // Success Response (201)
 * {
 *   "success": true,
 *   "data": {
 *     "class_id": 1,
 *     "class_code": "12A1",
 *     "class_name": "Lớp 12A1 - Khối Tự Nhiên",
 *     "academic_year": "2024-2025",
 *     "grade_level": 12,
 *     "teacher_id": 5,
 *     "max_students": 35,
 *     "current_students": 0,
 *     "is_active": true
 *   },
 *   "message": "Class created successfully for exam management"
 * }
 */
router.post('/create-class', authenticate_jwt, classController.create_class);

/**
 * Update class information
 * 
 * @route PUT /api/classes/update-class/:class_id
 * @description Updates class information
 * @access Admin only
 * 
 * @param {number} class_id - The unique identifier of the class to update
 * @body {Object} updates - Fields to update (partial class object)
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {Object} response.data - Updated class object
 * @returns {string} response.message - Status message
 * 
 * @example
 * // Request
 * PUT /api/classes/update-class/1
 * {
 *   "class_name": "Lớp 12A1 - Khối Tự Nhiên (Cập nhật)",
 *   "teacher_id": 8
 * }
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "data": {
 *     "class_id": 1,
 *     "class_code": "12A1",
 *     "class_name": "Lớp 12A1 - Khối Tự Nhiên (Cập nhật)",
 *     "teacher_id": 8
 *   },
 *   "message": "Class updated successfully"
 * }
 */
router.put('/update-class/:class_id', authenticate_jwt, classController.update_class);

/**
 * Get students in a specific class
 * 
 * @route GET /api/classes/class-students/:class_id
 * @description Retrieves all students in a class for exam registration purposes
 * @access Admin, Teacher, Students in the same class
 * 
 * @param {number} class_id - The unique identifier of the class
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {Array} response.data - Array of student objects with enrollment info
 * @returns {string} response.message - Status message
 * 
 * @example
 * // Request
 * GET /api/classes/class-students/1
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "user_id": 15,
 *       "user_name": "student001",
 *       "full_name": "Nguyễn Văn A",
 *       "email": "student001@school.edu.vn",
 *       "subject_enrollments": [
 *         {
 *           "subject_code": "MATH12",
 *           "status": "active"
 *         },
 *         {
 *           "subject_code": "PHYS12",
 *           "status": "active"
 *         }
 *       ]
 *     }
 *   ],
 *   "message": "Students in class retrieved for exam management"
 * }
 */
router.get('/class-students/:class_id', authenticate_jwt, classController.get_class_students);

/**
 * Add student to class
 * 
 * @route POST /api/classes/add-student/:class_id
 * @description Adds a student to a specific class
 * @access Admin, Teacher
 * 
 * @param {number} class_id - The unique identifier of the class
 * @body {number} student_id - The unique identifier of the student to add
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {string} response.message - Status message
 * 
 * @example
 * // Request
 * POST /api/classes/add-student/1
 * {
 *   "student_id": 15
 * }
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "message": "Student added to class successfully"
 * }
 */
router.post('/add-student/:class_id', authenticate_jwt, classController.add_student_to_class);

/**
 * Remove student from class
 * 
 * @route DELETE /api/classes/remove-student/:class_id/:student_id
 * @description Removes a student from a specific class
 * @access Admin, Teacher
 * 
 * @param {number} class_id - The unique identifier of the class
 * @param {number} student_id - The unique identifier of the student to remove
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {string} response.message - Status message
 * 
 * @example
 * // Request
 * DELETE /api/classes/remove-student/1/15
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "message": "Student removed from class successfully"
 * }
 */
router.delete('/remove-student/:class_id/:student_id', authenticate_jwt, classController.remove_student_from_class);

/**
 * Get class exam schedule
 * 
 * @route GET /api/classes/exam-schedule/:class_id
 * @description Retrieves upcoming exam schedule for a specific class
 * @access Admin, Teacher, Students in the class
 * 
 * @param {number} class_id - The unique identifier of the class
 * @query {string} [start_date] - Start date for filtering (YYYY-MM-DD)
 * @query {string} [end_date] - End date for filtering (YYYY-MM-DD)
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {Array} response.data - Array of exam objects with details
 * @returns {string} response.message - Status message
 * 
 * @example
 * // Request
 * GET /api/classes/exam-schedule/1?start_date=2025-02-01&end_date=2025-02-28
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "exam_id": 5,
 *       "title": "Kiểm tra giữa kỳ Toán",
 *       "exam_date": "2025-02-15T08:00:00.000Z",
 *       "start_time": "08:00:00",
 *       "end_time": "10:00:00",
 *       "subject": {
 *         "subject_name": "Toán học",
 *         "subject_code": "MATH12"
 *       },
 *       "room": {
 *         "room_name": "Phòng A1",
 *         "building": "Tòa nhà A",
 *         "capacity": 40
 *       },
 *       "proctors": [
 *         {
 *           "full_name": "Nguyễn Văn A",
 *           "user_name": "teacher001"
 *         }
 *       ]
 *     }
 *   ],
 *   "message": "Class exam schedule retrieved successfully"
 * }
 */
router.get('/exam-schedule/:class_id', authenticate_jwt, classController.get_class_exam_schedule);

/**
 * Get class statistics
 * 
 * @route GET /api/classes/statistics
 * @description Retrieves system-wide class statistics for admin dashboard
 * @access Admin only
 * 
 * @query {string} [academic_year] - Filter by academic year (e.g., "2024-2025")
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {Object} response.data - Statistics object with overview and breakdowns
 * @returns {string} response.message - Status message
 * 
 * @example
 * // Request
 * GET /api/classes/statistics?academic_year=2024-2025
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "data": {
 *     "overview": {
 *       "total_classes": 15,
 *       "total_students": 450,
 *       "classes_without_teachers": 2,
 *       "full_classes": 3,
 *       "average_class_size": 30
 *     },
 *     "by_grade_level": [
 *       {
 *         "grade_level": 12,
 *         "class_count": 5,
 *         "total_students": 150,
 *         "avg_students_per_class": 30
 *       }
 *     ],
 *     "academic_year": "2024-2025"
 *   },
 *   "message": "Class statistics retrieved successfully"
 * }
 */
router.get('/statistics', authenticate_jwt, classController.get_class_statistics);

/**
 * Error Handler Middleware for Class Routes
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
    console.error('❌ Class route error:', error);
    
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
            message: 'Dữ liệu lớp học không hợp lệ',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Validation failed'
        });
    }
    
    // Unique constraint errors (duplicate class codes)
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            success: false,
            message: 'Mã lớp đã tồn tại trong năm học này',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Duplicate class code'
        });
    }
    
    // Default error response
    res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống quản lý lớp học',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
});

module.exports = router;
