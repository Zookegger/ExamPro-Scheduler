const express = require('express');
const router = express.Router();

/**
 * Main API Router for ExamPro Scheduler
 * 
 * This file serves as the central hub for all API routes in the system.
 * It imports and organizes route modules for different resources, making
 * the API structure clean and maintainable.
 * 
 * @description Routes are organized by resource type (users, exams, etc.)
 * @version 1.0
 * 
 * Base URL: /api
 * 
 * Available route groups:
 * - /api/users - User management and profiles
 * - /api/exams - Exam creation and management  
 * - /api/auths - Authentication (login/logout)
 * - /api/registrations - Exam registration management
 * - /api/rooms - Classroom and venue management
 * - /api/subjects - Subject and course management
 */

// Import route modules
const user_routes = require('./user_routes');
const exam_routes = require('./exam_routes');
const auth_routes = require('./auth_routes');
const registration_routes = require('./registration_routes');
const room_routes = require('./room_routes');
const subject_routes = require('./subject_routes');

/**
 * Health Check Endpoint
 * 
 * Provides system status information for monitoring and debugging.
 * This endpoint can be used to verify that the API server is running.
 * 
 * @route GET /api/health
 * @access Public
 * @returns {Object} JSON object with server status and timestamp
 * 
 * @example
 * // GET /api/health
 * // Response:
 * {
 *   "status": "OK",
 *   "message": "Hệ thống đang hoạt động bình thường", 
 *   "timestamp": "2025-07-21T10:30:00.000Z",
 *   "version": "1.0.0"
 * }
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Hệ thống đang hoạt động bình thường',
        timestamp: new Date().toISOString(),
        version: process.env.API_VERSION || '1.0.0'
    });
});

/**
 * Mount Route Modules
 * 
 * Each route group is mounted with its base path. This creates a
 * modular structure where each resource has its own route file.
 * 
 * Route Structure:
 * /api/users/*        - User management routes
 * /api/exams/*        - Exam management routes  
 * /api/auths/*        - Authentication routes
 * /api/registrations/* - Registration management routes
 * /api/rooms/*        - Room management routes
 * /api/subjects/*     - Subject management routes
 */

// User management routes
router.use('/users', user_routes);

// Exam management routes  
router.use('/exams', exam_routes);

// Authentication routes
router.use('/auths', auth_routes);

// Registration management routes
router.use('/registrations', registration_routes);

// Room management routes 
router.use('/rooms', room_routes);

// Subject management routes
router.use('/subjects', subject_routes);

module.exports = router;