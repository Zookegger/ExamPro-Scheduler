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
 * - /api/classes - Class management and student organization
 */

// Import route modules
const user_routes = require('./user_routes');
const exam_routes = require('./exam_routes');
const auth_routes = require('./auth_routes');
const registration_routes = require('./registration_routes');
const room_routes = require('./room_routes');
const subject_routes = require('./subject_routes');
const admin_routes = require('./admin_routes');
const enrollment_routes = require('./enrollment_routes');
const class_routes = require('./class_routes');

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
 * /api/classes/*      - Class management routes
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

// Class management routes
router.use('/classes', class_routes);

// Enrollment management routes
router.use('/enrollments', enrollment_routes);

// Admin routes (development only)
router.use('/admin', admin_routes);

module.exports = router;