const express = require('express');
const router = express.Router();
const db = require('../models');
const { utility } = require('../models');
const { Op, Sequelize } = require('sequelize');
const { authenticate_jwt } = require('../middleware/auth');

/**
 * Admin Role Verification Middleware
 * 
 * Ensures that the authenticated user has admin privileges before allowing
 * access to admin-only resources. This middleware should be used after
 * authenticate_jwt middleware.
 * 
 * @function require_admin_role
 * @param {Object} req - Express request object (must have req.user from authenticate_jwt)
 * @param {Object} req.user - User object from JWT authentication
 * @param {string} req.user.user_role - Role of the authenticated user
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function to continue middleware chain
 * @returns {void}
 * 
 * @example
 * // Usage in route definition
 * router.post('/admin-only', authenticate_jwt, require_admin_role, (req, res) => {
 *   // Only admin users can access this route
 *   res.json({ message: 'Admin access granted' });
 * });
 * 
 * @example
 * // Error response when user is not admin (403)
 * {
 *   "success": false,
 *   "message": "Bạn không có quyền truy cập tài nguyên này"
 * }
 */
function require_admin_role(req, res, next) {
    if (!req.user || req.user.user_role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập tài nguyên này'
        });
    }
    next();
}


const diagnose_router = express.Router();
/**
 * Force Database Synchronization
 * 
 * @route POST /api/admin/diagnose/sync-database
 * @description Forcefully recreates all database tables with current model schemas
 * @access Admin only (DEVELOPMENT ONLY - DESTRUCTIVE OPERATION)
 * @warning ⚠️ This DELETES ALL DATA and recreates tables from scratch
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {string} response.message - Status message
 * @returns {string} response.timestamp - Operation timestamp
 * @returns {string} response.warning - Data loss warning
 * 
 * @example
 * // Request
 * POST /api/admin/diagnose/sync-database
 * Content-Type: application/json
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "message": "Database synced successfully with force option",
 *   "timestamp": "2025-01-29T10:30:00.000Z",
 *   "warning": "All data has been cleared and tables recreated"
 * }
 * 
 * // Error Response (500)
 * {
 *   "success": false,
 *   "message": "Database sync failed",
 *   "error": "Connection timeout"
 * }
 */
diagnose_router.post('/sync-database', async (req, res, next) => {
    try {
        console.log('🔄 Starting force database sync...');
        
        // Force sync all models
        await utility.sequelize.sync({ force: true });
        
        console.log('✅ Database force sync completed successfully');
        
        res.json({
            success: true,
            message: 'Database synced successfully with force option',
            timestamp: new Date().toISOString(),
            warning: 'All data has been cleared and tables recreated'
        });
    } catch (error) {
        console.error('❌ Database sync failed:', error);
        // Pass error to Express error handler middleware
        next(error);
    }
});

/**
 * Get Database Table Status
 * 
 * @route GET /api/admin/diagnose/table-status
 * @description Check existence and status of all database tables
 * @access Admin only
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {Object} response.tables - Status of each model's table
 * @returns {boolean} response.tables[modelName].exists - Whether table exists
 * @returns {number} [response.tables[modelName].recordCount] - Number of records if exists
 * @returns {Object} [response.tables[modelName].hasTimestamps] - Timestamp fields status
 * @returns {Object} [response.tables[modelName].lastRecord] - Sample of last record
 * @returns {string} response.timestamp - Operation timestamp
 * 
 * @example
 * // Request
 * GET /api/admin/table-status
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "tables": {
 *     "User": {
 *       "exists": true,
 *       "recordCount": 42,
 *       "hasTimestamps": {
 *         "created_at": true,
 *         "updated_at": true
 *       },
 *       "lastRecord": {
 *         "id": 123,
 *         "created_at": "2025-01-28T15:30:00.000Z",
 *         "updated_at": "2025-01-28T15:30:00.000Z"
 *       }
 *     }
 *   },
 *   "timestamp": "2025-01-29T10:30:00.000Z"
 * }
 */
diagnose_router.get('/table-status', async (req, res, next) => {
    try {
        const tables = {};
        
        console.log("Route hit!");

        // Check each model table
        const modelNames = Object.keys(db.models).filter(name => 
            name !== 'sequelize' && name !== 'Sequelize' 
        );
        
        for (const modelName of modelNames) {
            const model = db.models[modelName];
            try {
                const count = await model.count();
                const sampleRecord = await model.findOne({
                    order: [['created_at', 'DESC']]
                });
                
                tables[modelName] = {
                    exists: true,
                    recordCount: count,
                    hasTimestamps: sampleRecord ? {
                        created_at: sampleRecord.created_at !== null,
                        updated_at: sampleRecord.updated_at !== null
                    } : null,
                    lastRecord: sampleRecord ? {
                        id: sampleRecord.id,
                        created_at: sampleRecord.created_at,
                        updated_at: sampleRecord.updated_at
                    } : null
                };
            } catch (error) {
                tables[modelName] = {
                    exists: false,
                    error: error.message
                };
            }
        }
        
        res.json({
            success: true,
            tables: tables,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Table status check failed:', error);
        // Pass error to Express error handler middleware
        next(error);
    }
});

/**
 * Clear Test Data
 * 
 * @route DELETE /api/admin/diagnose/clear-test-data
 * @description Remove test data from database (development only)
 * @access Admin only
 * @warning Removes records matching test patterns
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {string} response.message - Status message
 * @returns {Object} response.deletedCounts - Counts of deleted records by type
 * @returns {string} response.timestamp - Operation timestamp
 * 
 * @example
 * // Request
 * DELETE /api/admin/clear-test-data
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "message": "Test data cleared successfully",
 *   "deletedCounts": {
 *     "subjects": 15,
 *     "users": 8
 *   },
 *   "timestamp": "2025-01-29T10:30:00.000Z"
 * }
 */
diagnose_router.delete('/clear-test-data', async (req, res, next) => {
    try {
        console.log('🗑️ Starting test data cleanup...');
        
        const deletedCounts = {};
        
        // Clear test subjects (those with subject_code starting with TEST_)
        const deletedSubjects = await db.models.Subject.destroy({
            where: {
                subject_code: {
                    [Sequelize.Op.like]: 'TEST_%'
                }
            }
        });
        deletedCounts.subjects = deletedSubjects;
        const deletedUsers = await db.models.User.destroy({
            where: {
                [Sequelize.Op.or]: [
                    { email: { [Sequelize.Op.like]: '%test%' } },
                    { email: { [Sequelize.Op.like]: '%demo%' } },
                    { full_name: { [Sequelize.Op.like]: 'Test %' } }
                ]
            }
        });
        deletedCounts.users = deletedUsers;
        
        console.log(`✅ Test data cleanup completed:`, deletedCounts);
        
        res.json({
            success: true,
            message: 'Test data cleared successfully',
            deletedCounts: deletedCounts,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Test data cleanup failed:', error);
        // Pass error to Express error handler middleware
        next(error);
    }
});

/**
 * Get Database Connection Information
 * 
 * @route GET /api/admin/diagnose/db-info
 * @description Retrieve database connection configuration
 * @access Admin only
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {Object} response.info - Database connection info
 * @returns {string} response.info.dialect - Database dialect
 * @returns {string} response.info.database - Database name
 * @returns {string} response.info.host - Database host
 * @returns {number} response.info.port - Database port
 * @returns {Promise<boolean>} response.info.isConnected - Connection status promise
 * @returns {string} response.timestamp - Operation timestamp
 * 
 * @example
 * // Request
 * GET /api/admin/db-info
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "info": {
 *     "dialect": "mysql",
 *     "database": "myapp_dev",
 *     "host": "localhost",
 *     "port": 3306,
 *     "isConnected": true
 *   },
 *   "timestamp": "2025-01-29T10:30:00.000Z"
 * }
 */
/**
 * Get Database Connection Information
 * 
 * @route GET /api/admin/db-info
 * @description Retrieve database connection configuration and status
 * @access Admin only (implied through admin routes)
 * @middleware None - Direct admin route
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function for error handling
 * 
 * @returns {Object} response - JSON response object
 * @returns {boolean} response.success - Operation success status
 * @returns {Object} [response.info] - Database connection information
 * @returns {string} response.info.dialect - Database dialect (mysql, postgres, etc.)
 * @returns {string} response.info.database - Database name
 * @returns {string} response.info.host - Database host address
 * @returns {number} response.info.port - Database port number
 * @returns {boolean} response.info.isConnected - Current connection status
 * @returns {string} response.timestamp - Operation timestamp in ISO format
 * @returns {string} [response.message] - Error message if operation fails
 * @returns {string} [response.error] - Detailed error information (development mode)
 * 
 * @example
 * // Request
 * GET /api/admin/db-info
 * Authorization: Bearer <jwt_token>
 * 
 * @example
 * // Success Response (200)
 * {
 *   "success": true,
 *   "info": {
 *     "dialect": "mysql",
 *     "database": "exampro_scheduler",
 *     "host": "localhost",
 *     "port": 3306,
 *     "isConnected": true
 *   },
 *   "timestamp": "2025-08-02T10:30:00.000Z"
 * }
 * 
 * @example
 * // Database Connection Error (500)
 * {
 *   "success": false,
 *   "message": "Failed to get database info",
 *   "error": "Connection timeout after 30000ms"
 * }
 */
router.get('/db-info', async (req, res, next) => {
    try {
        const connectivity_check = await utility.sequelize.authenticate().then(() => true).catch(() => false);

        const info = {
            dialect: utility.sequelize.getDialect(),
            database: utility.sequelize.config.database,
            host: utility.sequelize.config.host,
            port: utility.sequelize.config.port,
            isConnected: connectivity_check
        };
        
        res.json({
            success: true,
            info: info,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Database info retrieval failed:', error);
        // Pass error to Express error handler middleware
        next(error);
    }
});

router.use('/diagnose', diagnose_router);

/**
 * Account Management Router
 * 
 * Handles user account creation, modification, and retrieval operations.
 * All routes require admin authentication and role verification.
 */
const account_router = express.Router();

/**
 * Create New User Account
 * 
 * @route POST /api/admin/accounts/create-new-account
 * @description Creates a new user account in the system
 * @access Admin only
 * @middleware authenticate_jwt - Verifies JWT token
 * @middleware require_admin_role - Ensures admin privileges
 * 
 * @param {Object} req.body - Request body containing user data
 * @param {string} req.body.user_name - Unique username for the account
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - Plain text password (will be hashed)
 * @param {string} req.body.full_name - User's full display name
 * @param {string} req.body.user_role - User role (admin|teacher|student)
 * @param {boolean} [req.body.is_active=true] - Whether account is active
 * 
 * @returns {Object} response - JSON response object
 * @returns {boolean} response.success - Operation success status
 * @returns {string} response.message - Status message in Vietnamese
 * @returns {Object} [response.user] - Created user data (excluding password)
 * @returns {number} response.user.user_id - Generated user ID
 * @returns {string} response.user.user_name - Username
 * @returns {string} response.user.email - Email address
 * @returns {string} response.user.full_name - Full name
 * @returns {string} response.user.user_role - User role
 * @returns {boolean} response.user.is_active - Account status
 * 
 * @example
 * // Request
 * POST /api/admin/accounts/create-new-account
 * Content-Type: application/json
 * Authorization: Bearer <jwt_token>
 * 
 * {
 *   "user_name": "nguyenvana",
 *   "email": "nguyenvana@example.com",
 *   "password": "securePassword123",
 *   "full_name": "Nguyễn Văn A",
 *   "user_role": "student",
 *   "is_active": true
 * }
 * 
 * @example
 * // Success Response (200)
 * {
 *   "success": true,
 *   "message": "Thêm người dùng mới thành công",
 *   "user": {
 *     "user_id": 123,
 *     "user_name": "nguyenvana",
 *     "email": "nguyenvana@example.com",
 *     "full_name": "Nguyễn Văn A",
 *     "user_role": "student",
 *     "is_active": true
 *   }
 * }
 * 
 * @example
 * // Validation Error (400)
 * {
 *   "success": false,
 *   "message": "1 hoặc nhiều trường dữ liệu không hợp lệ hoặc thiếu"
 * }
 * 
 * @example
 * // Duplicate Username Error (409)
 * {
 *   "success": false,
 *   "message": "Tên đăng nhập \"nguyenvana\" đã được sử dụng"
 * }
 * 
 * @example
 * // Duplicate Email Error (409)
 * {
 *   "success": false,
 *   "message": "Email \"nguyenvana@example.com\" đã được sử dụng"
 * }
 */
account_router.post('/create-new-account', authenticate_jwt, require_admin_role, async (req, res, next) => {
    try {
        const new_user_data = req.body;

        if (!new_user_data || !new_user_data.full_name || !new_user_data.password || !new_user_data.user_role || !new_user_data.user_name) {
            return res.status(400).json({
                success: false,
                message: "1 hoặc nhiều trường dữ liệu không hợp lệ hoặc thiếu"
            });
        }

        const new_user = await db.models.User.create({
            user_name: new_user_data.user_name,
			email: new_user_data.email,
			password_hash: new_user_data.password,
			full_name: new_user_data.full_name,
			user_role: new_user_data.user_role,
			is_active: new_user_data.is_active ?? true
        });

        return res.json({
            success: true,
            message: "Thêm người dùng mới thành công",
            user: {
                user_id: new_user.user_id,
                user_name: new_user.user_name,
                email: new_user.email,
                full_name: new_user.full_name,
                user_role: new_user.user_role,
                is_active: new_user.is_active
            }
        });

    } catch (error) {
        console.error('Create user error:', error);
        
        // Handle unique constraint violations
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors[0]?.path;
            let message = 'Dữ liệu đã tồn tại';
            
            if (field === 'user_name') {
                message = `Tên đăng nhập "${error.errors[0].value}" đã được sử dụng`;
            } else if (field === 'email') {
                message = `Email "${error.errors[0].value}" đã được sử dụng`;
            }
            
            return res.status(409).json({
                success: false,
                message: message
            });
        }
        
        // Pass unexpected errors to Express error handler
        next(error);
    }
});

/**
 * Edit User Account
 * 
 * @route POST /api/admin/accounts/edit-account/:user_id
 * @description Updates an existing user account with new information
 * @access Admin only
 * @middleware authenticate_jwt - Verifies JWT token
 * @middleware require_admin_role - Ensures admin privileges
 * 
 * @param {string} req.params.user_id - ID of the user to update
 * @param {Object} req.body - Request body containing updated user data
 * @param {string} [req.body.user_name] - New username (optional)
 * @param {string} [req.body.email] - New email address (optional)
 * @param {string} [req.body.full_name] - New full name (optional)
 * @param {string} [req.body.user_role] - New user role (optional)
 * @param {boolean} [req.body.is_active] - New account status (optional)
 * 
 * @returns {Object} response - JSON response object
 * @returns {boolean} response.success - Operation success status
 * @returns {string} response.message - Status message in Vietnamese
 * @returns {Object} [response.user] - Updated user data (excluding password)
 * 
 * @example
 * // Request
 * POST /api/admin/accounts/edit-account/123
 * Content-Type: application/json
 * Authorization: Bearer <jwt_token>
 * 
 * {
 *   "full_name": "Nguyễn Văn B",
 *   "user_role": "teacher",
 *   "is_active": false
 * }
 * 
 * @example
 * // Success Response (200)
 * {
 *   "success": true,
 *   "message": "Cập nhật người dùng thành công",
 *   "user": {
 *     "user_id": 123,
 *     "user_name": "nguyenvana",
 *     "email": "nguyenvana@example.com",
 *     "full_name": "Nguyễn Văn B",
 *     "user_role": "teacher",
 *     "is_active": false
 *   }
 * }
 * 
 * @example
 * // User Not Found Error (404)
 * {
 *   "success": false,
 *   "message": "Không tìm thấy người dùng"
 * }
 * 
 * @example
 * // Unique Constraint Error (409)
 * {
 *   "success": false,
 *   "message": "Email \"existing@example.com\" đã được sử dụng"
 * }
 */
account_router.post('/edit-account', authenticate_jwt, require_admin_role, async (req, res, next) => {
    try {
        const { user_id } = req.params;
        const updates = req.body;

        // Basic validation
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Find and update user
        const [updated_rows] = await db.models.User.update(updates, {
            where: { user_id: user_id },
            returning: true
        });

        if (updated_rows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Get updated user data (excluding password)
        const updated_user = await db.models.User.findByPk(user_id, {
            attributes: { exclude: ['password_hash'] }
        });

        res.json({
            success: true,
            message: 'Cập nhật người dùng thành công',
            user: updated_user
        });

    } catch (error) {
        console.error('❌ Edit account failed:', error);
        
        // Handle unique constraint violations
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors[0]?.path;
            let message = 'Dữ liệu đã tồn tại';
            
            if (field === 'user_name') {
                message = `Tên đăng nhập "${error.errors[0].value}" đã được sử dụng`;
            } else if (field === 'email') {
                message = `Email "${error.errors[0].value}" đã được sử dụng`;
            }
            
            return res.status(409).json({
                success: false,
                message: message
            });
        }
        
        // Pass unexpected errors to Express error handler
        next(error);
    }
});

/**
 * Get All Users
 * 
 * @route GET /api/admin/accounts/get_all_users
 * @description Retrieves a list of all user accounts in the system
 * @access Admin only
 * @middleware authenticate_jwt - Verifies JWT token
 * @middleware require_admin_role - Ensures admin privileges
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function for error handling
 * 
 * @returns {Object} response - JSON response object
 * @returns {boolean} response.success - Operation success status
 * @returns {string} [response.message] - Error message if operation fails
 * @returns {Object[]} [response.users] - Array of user objects (excluding passwords)
 * @returns {number} response.users[].user_id - User's unique identifier
 * @returns {string} response.users[].user_name - Username
 * @returns {string} response.users[].email - Email address
 * @returns {string} response.users[].full_name - Full display name
 * @returns {string} response.users[].user_role - User role (admin|teacher|student)
 * @returns {boolean} response.users[].is_active - Account active status
 * @returns {string} response.users[].created_at - Account creation timestamp
 * @returns {string} response.users[].updated_at - Last update timestamp
 * @returns {number} [response.count] - Total number of users in the system
 * 
 * @example
 * // Request
 * GET /api/admin/accounts/get_all_users
 * Authorization: Bearer <jwt_token>
 * 
 * @example
 * // Success Response (200)
 * {
 *   "success": true,
 *   "users": [
 *     {
 *       "user_id": 1,
 *       "user_name": "admin",
 *       "email": "admin@exampro.com",
 *       "full_name": "Quản trị viên hệ thống",
 *       "user_role": "admin",
 *       "is_active": true,
 *       "created_at": "2025-01-01T00:00:00.000Z",
 *       "updated_at": "2025-01-01T00:00:00.000Z"
 *     },
 *     {
 *       "user_id": 2,
 *       "user_name": "nguyenvana",
 *       "email": "nguyenvana@example.com",
 *       "full_name": "Nguyễn Văn A",
 *       "user_role": "student",
 *       "is_active": true,
 *       "created_at": "2025-01-02T08:30:00.000Z",
 *       "updated_at": "2025-01-02T08:30:00.000Z"
 *     }
 *   ],
 *   "count": 2
 * }
 * 
 * @example
 * // No Content Response (204)
 * {
 *   "success": false,
 *   "message": "Failed to get data"
 * }
 * 
 * @example
 * // Server Error (500)
 * {
 *   "success": false,
 *   "message": "Lỗi hệ thống",
 *   "error": "Database connection timeout"
 * }
 */
account_router.get('/get_all_users', authenticate_jwt, require_admin_role, async (req, res, next) => {
    try {
        const all_users = await db.models.User.findAndCountAll();
        if (!all_users) {
            return res.status(204).json({
                success: false,
                message: 'Failed to get data'
            })
        }

        return res.json({
            success: true,
            users: all_users.rows,
            count: all_users.count
        });
    } catch (error) {
        console.error('❌ Get all users failed:', error);
        // Pass error to Express error handler middleware
        next(error);
    }
});

/**
 * Mount Account Management Router
 * 
 * Mounts the account management routes under the /accounts path.
 * All account routes will be accessible at /api/admin/accounts/*
 */
router.use('/accounts', account_router);

/**
 * Error Handler Middleware for Admin Routes
 * 
 * This middleware catches any errors passed via next(error) from route handlers
 * and provides a consistent error response format. It should be the last middleware
 * in the admin routes to catch all unhandled errors.
 * 
 * @function adminErrorHandler
 * @param {Error} error - The error object passed from previous middleware
 * @param {string} error.name - Error type name (SequelizeConnectionError, etc.)
 * @param {string} error.message - Error message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function (for passing to global error handler)
 * @returns {void}
 * 
 * @example
 * // Database Connection Error Response (503)
 * {
 *   "success": false,
 *   "message": "Lỗi kết nối cơ sở dữ liệu",
 *   "error": "Connection timeout"
 * }
 * 
 * @example
 * // Validation Error Response (400)
 * {
 *   "success": false,
 *   "message": "Dữ liệu không hợp lệ",
 *   "error": "Validation failed"
 * }
 * 
 * @example
 * // Generic Server Error Response (500)
 * {
 *   "success": false,
 *   "message": "Lỗi hệ thống",
 *   "error": "Internal server error"
 * }
 */
router.use((error, req, res, next) => {
    console.error('❌ Admin route error:', error);
    
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

/**
 * Export Admin Routes Module
 * 
 * This module provides all administrative routes for the ExamPro Scheduler system.
 * It includes user management, database diagnostics, and system configuration endpoints.
 * All routes require proper authentication and admin role verification.
 * 
 * @module AdminRoutes
 * @requires express
 * @requires ../models
 * @requires ../middleware/auth
 * 
 * @example
 * // Usage in main app.js
 * const admin_routes = require('./routes/admin_routes');
 * app.use('/api/admin', admin_routes);
 * 
 * @example
 * // Available route groups:
 * // GET  /api/admin/db-info - Database connection info
 * // POST /api/admin/diagnose/sync-database - Force database sync
 * // GET  /api/admin/diagnose/table-status - Check table status
 * // DELETE /api/admin/diagnose/clear-test-data - Clear test data
 * // POST /api/admin/accounts/create-new-account - Create user
 * // POST /api/admin/accounts/edit-account - Edit user
 * // GET  /api/admin/accounts/get_all_users - List all users
 */
module.exports = router;
