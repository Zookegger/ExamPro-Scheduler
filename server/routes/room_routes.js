const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticate_jwt } = require('../middleware/auth');
const { require_admin_role } = require('../middleware/admin');
const {
    getAllRooms,
    getRoomExamStatus,
    createRoom,
    updateRoom,
    deleteRoom
} = require('../controllers/roomController');

/**
 * Room Management Routes
 * 
 * This file contains routes for room/classroom management operations
 * such as creating, reading, updating, and deleting rooms.
 * 
 * All routes require admin authentication for data security.
 * 
 * Route Structure:
 * - GET /api/rooms/get-all-rooms - Get all rooms with optional filtering
 * - POST /api/rooms/create-room - Create a new room (Admin only)
 * - PUT /api/rooms/update-room/:room_id - Update existing room (Admin only)
 * - DELETE /api/rooms/delete-room/:room_id - Delete room (Admin only)
 */

/**
 * @route GET /api/rooms/get-all-rooms
 * @description Get all exam rooms with optional filtering
 * @access Admin only
 * @query {string} [building] - Filter by building name
 * @query {boolean} [is_active] - Filter by active status
 * @query {number} [min_capacity] - Filter by minimum capacity
 * @query {boolean} [has_computers] - Filter by computer availability
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {Array} response.rooms - Array of room objects
 * @returns {string} response.message - Status message
 * 
 * @example
 * // Get all active rooms with computers in building A
 * GET /api/rooms/get-all-rooms?building=Tòa nhà A&is_active=true&has_computers=true
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "rooms": [
 *     {
 *       "room_id": 1,
 *       "room_name": "Phòng A1",
 *       "building": "Tòa nhà A",
 *       "floor": 1,
 *       "capacity": 40,
 *       "has_computers": true,
 *       "features": "Máy chiếu, Điều hòa, Wifi",
 *       "is_active": true
 *     }
 *   ],
 *   "message": "Rooms retrieved successfully"
 * }
 */
router.get('/get-all-rooms', authenticate_jwt, require_admin_role, getAllRooms);

/**
 * @route GET /api/rooms/exam-status/:room_id
 * @description Get current exam status for a specific room
 * @access Admin only
 * @param {number} room_id - Room ID to check status
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {Object} response.exam_status - Room exam status information
 * @returns {string} response.exam_status.status - 'available', 'in_exam', 'scheduled'
 * @returns {string} response.exam_status.status_text - Vietnamese status text
 * @returns {string} response.exam_status.status_class - CSS class for styling
 * @returns {Object} [response.exam_status.current_exam] - Current exam details if active
 * @returns {Array} [response.exam_status.upcoming_exams] - Upcoming exams
 * @returns {string} response.message - Status message
 * 
 * @example
 * // Get room exam status
 * GET /api/rooms/exam-status/1
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "exam_status": {
 *     "status": "in_exam",
 *     "status_text": "Đang thi",
 *     "status_class": "bg-warning text-dark",
 *     "current_exam": {
 *       "exam_id": 123,
 *       "title": "Kỳ thi Toán học",
 *       "subject_code": "MATH101",
 *       "start_time": "09:00:00",
 *       "end_time": "11:00:00"
 *     }
 *   },
 *   "message": "Room exam status retrieved successfully"
 * }
 */
router.get('/exam-status/:room_id', authenticate_jwt, require_admin_role, async (req, res) => {
    try {
        const { room_id } = req.params;
        const exam_status = await getRoomExamStatus(parseInt(room_id));
        
        res.json({
            success: true,
            exam_status: exam_status,
            message: 'Room exam status retrieved successfully'
        });
    } catch (error) {
        console.error('❌ Error getting room exam status:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy trạng thái phòng thi',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route POST /api/rooms/create-room
 * @description Create a new exam room
 * @access Admin only
 * @body {string} room_name - Room name/number (required)
 * @body {string} [building] - Building name
 * @body {number} [floor=1] - Floor number
 * @body {number} capacity - Maximum capacity (required)
 * @body {boolean} [has_computers=false] - Computer availability
 * @body {string} [features] - Room features description
 * @body {boolean} [is_active=true] - Room status
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {Object} response.room - Created room object
 * @returns {string} response.message - Status message
 * 
 * @example
 * // Create new room
 * POST /api/rooms/create-room
 * {
 *   "room_name": "Phòng A1",
 *   "building": "Tòa nhà A",
 *   "floor": 1,
 *   "capacity": 40,
 *   "has_computers": true,
 *   "features": "Máy chiếu, Điều hòa, Wifi"
 * }
 * 
 * // Success Response (201)
 * {
 *   "success": true,
 *   "room": { ...created room data... },
 *   "message": "Phòng đã được tạo thành công"
 * }
 */
router.post('/create-room', authenticate_jwt, require_admin_role, createRoom);

/**
 * @route PUT /api/rooms/update-room/:room_id
 * @description Update an existing room
 * @access Admin only
 * @param {number} room_id - Room ID to update
 * @body {string} [room_name] - Room name/number
 * @body {string} [building] - Building name
 * @body {number} [floor] - Floor number
 * @body {number} [capacity] - Maximum capacity
 * @body {boolean} [has_computers] - Computer availability
 * @body {string} [features] - Room features description
 * @body {boolean} [is_active] - Room status
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {Object} response.room - Updated room object
 * @returns {string} response.message - Status message
 * 
 * @example
 * // Update room capacity and features
 * PUT /api/rooms/update-room/1
 * {
 *   "capacity": 45,
 *   "features": "Máy chiếu, Điều hòa, Wifi, Bảng thông minh"
 * }
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "room": { ...updated room data... },
 *   "message": "Phòng đã được cập nhật thành công"
 * }
 */
router.put('/update-room/:room_id', authenticate_jwt, require_admin_role, updateRoom);

/**
 * @route DELETE /api/rooms/delete-room/:room_id
 * @description Delete a room
 * @access Admin only
 * @param {number} room_id - Room ID to delete
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {string} response.message - Status message
 * 
 * @example
 * // Delete room
 * DELETE /api/rooms/delete-room/5
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "message": "Phòng đã được xóa thành công"
 * }
 * 
 * @example
 * // Error Response - Room in use (400)
 * {
 *   "success": false,
 *   "message": "Không thể xóa phòng đang được sử dụng cho kỳ thi"
 * }
 */
router.delete('/delete-room/:room_id', authenticate_jwt, require_admin_role, deleteRoom);

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