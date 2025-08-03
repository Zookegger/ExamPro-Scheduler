/**
 * WebSocket Authorization Handlers - Security middleware for real-time connections
 * 
 * This module provides authentication and authorization functionality for WebSocket connections
 * in the ExamPro system. It ensures that only authenticated users with proper permissions
 * can access protected WebSocket events.
 * 
 * Features:
 * - JWT token validation for WebSocket connections
 * - Role-based access control (admin, teacher, student)
 * - Per-event authorization checks
 * - Security event logging
 * 
 * Following ExamPro patterns:
 * - snake_case naming convention
 * - Vietnamese error messages for user-facing content
 * - Comprehensive logging for debugging and security auditing
 */

const jwt = require('jsonwebtoken');
const { models } = require('../models');
const { User } = models;

// Authorization event constants
const AUTH_EVENTS = {
    ERROR: 'authorization_error',
    SUCCESS: 'authorization_success',
    REQUIRED: 'authorization_required'
};

// Error message constants
const AUTH_ERRORS = {
    NO_TOKEN: 'Chưa xác thực người dùng',
    INVALID_TOKEN: 'Token không hợp lệ',
    EXPIRED_TOKEN: 'Phiên đăng nhập đã hết hạn',
    INSUFFICIENT_PERMISSIONS: 'Không có quyền thực hiện thao tác này',
    USER_NOT_FOUND: 'Không tìm thấy người dùng',
    ACCOUNT_INACTIVE: 'Tài khoản đã bị vô hiệu hóa'
};

/**
 * WebSocket Authentication Middleware
 * 
 * Validates JWT tokens and attaches user information to socket
 * Should be called when client connects or sends auth data
 * 
 * @param {Object} socket - Socket.io socket instance
 * @param {string} token - JWT token from client
 * @returns {Promise<boolean>} Success status
 */
async function authenticateWebsocketUser(socket, token) {
    try {
        if (!token) {
            emitAuthError(socket, AUTH_ERRORS.NO_TOKEN, 'no_token');
            return false;
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database to ensure account is still active
        const user = await User.findByPk(decoded.user_id);
        
        if (!user) {
            emitAuthError(socket, AUTH_ERRORS.USER_NOT_FOUND, 'user_not_found');
            return false;
        }

        if (!user.is_active) {
            emitAuthError(socket, AUTH_ERRORS.ACCOUNT_INACTIVE, 'account_inactive');
            return false;
        }

        // Attach user info to socket for future authorization checks
        socket.user = {
            user_id: user.user_id,
            user_name: user.user_name,
            full_name: user.full_name,
            user_role: user.user_role,
            email: user.email,
            is_active: user.is_active
        };

        console.log(`🔐 WebSocket user authenticated: ${user.user_name} (${user.user_role})`);
        
        socket.emit(AUTH_EVENTS.SUCCESS, {
            success: true,
            message: 'Xác thực thành công',
            user_role: user.user_role
        });

        return true;

    } catch (error) {
        console.error('❌ WebSocket authentication failed:', error);
        
        if (error.name === 'TokenExpiredError') {
            emitAuthError(socket, AUTH_ERRORS.EXPIRED_TOKEN, 'token_expired');
        } else if (error.name === 'JsonWebTokenError') {
            emitAuthError(socket, AUTH_ERRORS.INVALID_TOKEN, 'invalid_token');
        } else {
            emitAuthError(socket, 'Lỗi hệ thống khi xác thực', 'system_error');
        }

        return false;
    }
}

/**
 * Admin Permission Middleware
 * 
 * Checks if authenticated user has admin privileges
 * Use this before any admin-only WebSocket operations
 * 
 * @param {Object} socket - Socket.io socket instance with user data
 * @returns {boolean} Whether user has admin permissions
 */
function requireAdminPermission(socket) {
    if (!socket.user) {
        emitAuthError(socket, AUTH_ERRORS.NO_TOKEN, 'not_authenticated');
        return false;
    }

    if (socket.user.user_role !== 'admin') {
        emitAuthError(socket, AUTH_ERRORS.INSUFFICIENT_PERMISSIONS, 'not_admin');
        console.log(`⚠️ Access denied: ${socket.user.user_name} (${socket.user.user_role}) attempted admin action`);
        return false;
    }

    return true;
}

/**
 * Teacher or Admin Permission Middleware
 * 
 * Checks if authenticated user has teacher or admin privileges
 * Use this for operations that teachers and admins can perform
 * 
 * @param {Object} socket - Socket.io socket instance with user data
 * @returns {boolean} Whether user has teacher/admin permissions
 */
function requireTeacherOrAdminPermission(socket) {
    if (!socket.user) {
        emitAuthError(socket, AUTH_ERRORS.NO_TOKEN, 'not_authenticated');
        return false;
    }

    const allowed_roles = ['admin', 'teacher'];
    if (!allowed_roles.includes(socket.user.user_role)) {
        emitAuthError(socket, AUTH_ERRORS.INSUFFICIENT_PERMISSIONS, 'insufficient_role');
        console.log(`⚠️ Access denied: ${socket.user.user_name} (${socket.user.user_role}) attempted teacher/admin action`);
        return false;
    }

    return true;
}

/**
 * Student Permission Middleware
 * 
 * Checks if authenticated user is a student
 * Use this for student-only operations
 * 
 * @param {Object} socket - Socket.io socket instance with user data
 * @returns {boolean} Whether user is a student
 */
function requireStudentPermission(socket) {
    if (!socket.user) {
        emitAuthError(socket, AUTH_ERRORS.NO_TOKEN, 'not_authenticated');
        return false;
    }

    if (socket.user.user_role !== 'student') {
        emitAuthError(socket, AUTH_ERRORS.INSUFFICIENT_PERMISSIONS, 'not_student');
        return false;
    }

    return true;
}

/**
 * Self-Access Permission Middleware
 * 
 * Checks if user is accessing their own data or is an admin
 * Use this for user-specific operations
 * 
 * @param {Object} socket - Socket.io socket instance with user data
 * @param {number} target_user_id - ID of user being accessed
 * @returns {boolean} Whether access is allowed
 */
function requireSelfOrAdminPermission(socket, target_user_id) {
    if (!socket.user) {
        emitAuthError(socket, AUTH_ERRORS.NO_TOKEN, 'not_authenticated');
        return false;
    }

    const is_self = socket.user.user_id === parseInt(target_user_id);
    const is_admin = socket.user.user_role === 'admin';

    if (!is_self && !is_admin) {
        emitAuthError(socket, AUTH_ERRORS.INSUFFICIENT_PERMISSIONS, 'not_self_or_admin');
        console.log(`⚠️ Access denied: ${socket.user.user_name} attempted to access user ${target_user_id} data`);
        return false;
    }

    return true;
}

/**
 * Helper function to emit authorization errors
 * 
 * @param {Object} socket - Socket.io socket instance
 * @param {string} message - Error message to display
 * @param {string} error_type - Error type for client handling
 */
function emitAuthError(socket, message, error_type) {
    socket.emit(AUTH_EVENTS.ERROR, {
        success: false,
        message: message,
        error_type: error_type,
        timestamp: new Date().toISOString()
    });
}

/**
 * Setup WebSocket authentication handlers
 * 
 * Registers authentication-related event listeners
 * Call this when setting up WebSocket connections
 * 
 * @param {Object} socket - Socket.io socket instance
 */
function setupAuthHandlers(socket) {
    console.log(`🔐 Setting up auth handlers for socket ${socket.id}`);

    // Handle authentication requests
    socket.on('authenticate', async (data) => {
        const { token } = data;
        await authenticateWebsocketUser(socket, token);
    });

    // Handle permission check requests
    socket.on('check_permissions', () => {
        if (socket.user) {
            socket.emit('permissions_result', {
                success: true,
                user_role: socket.user.user_role,
                permissions: {
                    is_admin: socket.user.user_role === 'admin',
                    is_teacher: socket.user.user_role === 'teacher',
                    is_student: socket.user.user_role === 'student'
                }
            });
        } else {
            emitAuthError(socket, AUTH_ERRORS.NO_TOKEN, 'not_authenticated');
        }
    });

    // Handle logout/deauth
    socket.on('logout', () => {
        if (socket.user) {
            console.log(`🔐 User ${socket.user.user_name} logged out from WebSocket`);
            socket.user = null;
            socket.emit('logout_success', {
                success: true,
                message: 'Đã đăng xuất thành công'
            });
        }
    });
}

module.exports = {
    authenticateWebsocketUser,
    requireAdminPermission,
    requireTeacherOrAdminPermission,
    requireStudentPermission,
    requireSelfOrAdminPermission,
    setupAuthHandlers,
    AUTH_EVENTS,
    AUTH_ERRORS
};