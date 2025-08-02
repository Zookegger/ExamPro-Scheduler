/**
 * Admin-specific middleware functions for the ExamPro system
 * 
 * This module provides middleware functions specific to admin routes,
 * including role validation and admin-specific error handling.
 */

/**
 * Admin Role Middleware
 * 
 * Checks if the authenticated user has admin privileges.
 * Must be used after authenticate_jwt middleware.
 * 
 * @param {Object} req - Express request object with req.user from JWT
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @example
 * router.get('/admin-only', authenticate_jwt, require_admin_role, (req, res) => {
 *   // This route is only accessible to admins
 * });
 */
function require_admin_role(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Bạn chưa đăng nhập'
        });
    }

    if (req.user.user_role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền sử dụng tài nguyên này'
        });
    }

    next();
}

/**
 * Teacher or Admin Role Middleware
 * 
 * Checks if the authenticated user has teacher or admin privileges.
 * Must be used after authenticate_jwt middleware.
 * 
 * @param {Object} req - Express request object with req.user from JWT
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
function require_teacher_or_admin_role(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Bạn chưa đăng nhập'
        });
    }

    if (req.user.user_role !== 'admin' && req.user.user_role !== 'teacher') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền sử dụng tài nguyên này'
        });
    }

    next();
}

/**
 * Validate Request Body Middleware Factory
 * 
 * Creates a middleware function that validates required fields in request body.
 * 
 * @param {string[]} required_fields - Array of field names that must be present
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.post('/create', validate_required_fields(['name', 'email']), (req, res) => {
 *   // Request body is guaranteed to have name and email fields
 * });
 */
function validate_required_fields(required_fields) {
    return (req, res, next) => {
        const missing_fields = required_fields.filter(field => !req.body[field]);
        
        if (missing_fields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Thiếu trường bắt buộc: ${missing_fields.join(', ')}`
            });
        }
        
        next();
    };
}

module.exports = {
    require_admin_role,
    require_teacher_or_admin_role,
    validate_required_fields
};
