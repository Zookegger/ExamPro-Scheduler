const db = require('../models');
const { notify_admins } = require('../services/notificationService');

/**
 * Reusable helper function to notify admins about any resource changes
 * Uses the centralized notification service for consistency
 * @param {string} resource_type - Type of resource (subject, exam, user, etc.)
 * @param {string} action - 'created', 'updated', 'deleted', etc.
 * @param {object} resource_data - Resource information
 * @param {object} current_user - User who performed the action
 * @param {object} options - Additional notification options
 */
async function notify_admins_about_resource(resource_type, action, resource_data, current_user, options = {}) {
    try {
        await notify_admins(resource_type, action, resource_data, current_user, options);
    } catch (error) {
        console.error(`❌ Error notifying admins about ${resource_type} change:`, error);
        // Don't throw error - notifications shouldn't break main functionality
    }
}

/**
 * Legacy helper for backward compatibility
 * @deprecated Use notify_admins_about_resource instead
 */
async function notify_admins_about_subject(action, subject_data, current_user) {
    return await notify_admins_about_resource('subject', action, subject_data, current_user);
}


async function get_all_subject(req, res, next) {
    try {
        // Use query parameters instead of route parameters
        const where_clause = req.query || {};

        // Simple validation - no JSON parsing needed for query params
        if (typeof where_clause !== 'object' || Array.isArray(where_clause)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters'
            });
        }

        const subjects = await db.models.Subject.findAndCountAll({
            where: where_clause,
        });

        return res.json({
            success: true,
            subjects: subjects.rows,
            count: subjects.count,
        });
        
    } catch (error) {
        console.error('❌ Get all subjects failed:', error);
        
        if (error instanceof SyntaxError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON in query parameters'
            });
        }
        
        // Pass to Express error handler
        next(error);
    }
}

async function add_new_subject(req, res, next) {
    try {
        // Check admin permission
        if (req.user.user_role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập tài nguyên này'
            });
        }

        const new_subject_data = req.body;

        // Validate required fields
        if (!new_subject_data.subject_code ||
            !new_subject_data.subject_name ||
            !new_subject_data.department) 
        {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin bắt buộc: mã môn học, tên môn học hoặc khoa"
            });
        }

        // Create new subject
        const new_subject = await db.models.Subject.create({
            subject_code: new_subject_data.subject_code,
            subject_name: new_subject_data.subject_name,
            department: new_subject_data.department,
            description: new_subject_data.description || null,
            is_active: new_subject_data.is_active ?? true,
        });

        // Create notifications for other admins
        await notify_admins_about_subject('created', new_subject, req.user);

        // Return success response with created data
        return res.status(201).json({
            success: true,
            message: "Tạo môn học mới thành công",
            data: new_subject
        });

    } catch (error) {
        console.error('❌ Create subject failed:', error);
        
        // Handle unique constraint violations
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors[0]?.path;
            let message = 'Dữ liệu đã tồn tại trên hệ thống';
            
            if (field === 'subject_code') {
                message = 'Mã môn học đã tồn tại';
            } else if (field === 'subject_name') {
                message = 'Tên môn học đã tồn tại';
            }
                      
            return res.status(409).json({
                success: false,
                message: message
            });
        }
        
        if (error instanceof SyntaxError) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu JSON không hợp lệ'
            });
        }
        
        // Pass to Express error handler
        next(error);
    }
}

async function update_subject(req, res, next) {
    try {
        // Check admin permission
        if (req.user.user_role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập tài nguyên này'
            });
        }

        // Get subject_id from URL params and data from body
        const subject_id = req.params.subject_id;
        const new_subject_data = req.body;

        // First, let's await the database query
        const old_subject = await db.models.Subject.findByPk(subject_id);
        
        // Check if subject exists
        if (!old_subject) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy môn học'
            });
        }

        // Check if no changes were made
        if (old_subject.subject_code === new_subject_data.subject_code &&
            old_subject.subject_name === new_subject_data.subject_name &&
            old_subject.department === new_subject_data.department &&
            old_subject.description === new_subject_data.description &&
            old_subject.is_active === (new_subject_data.is_active ?? true)) {
            return res.status(400).json({
                success: false,
                message: "Không có thay đổi nào được thực hiện"
            });
        }

        // Validate required fields
        if (!new_subject_data.subject_code ||
            !new_subject_data.subject_name ||
            !new_subject_data.department) 
        {
            return res.status(400).json({
                success: false,
                message: "Trường dữ liệu bị thiếu"
            });
        }

        // Update subject with WHERE clause to specify which row to update
        const [updated_rows] = await db.models.Subject.update({
            subject_code: new_subject_data.subject_code,
            subject_name: new_subject_data.subject_name,
            department: new_subject_data.department,
            description: new_subject_data.description || null,
            is_active: new_subject_data.is_active ?? true,
        }, {
            where: { subject_id: subject_id }  // ✅ Critical: WHERE clause to specify which row to update
        });

        // Check if update was successful
        if (updated_rows === 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể cập nhật môn học"
            });
        }

        // Get the updated subject to return
        const updated_subject = await db.models.Subject.findByPk(subject_id);

        // Create notifications for other admins
        await notify_admins_about_subject('updated', updated_subject, req.user);

        // Return success response with updated data
        return res.status(200).json({
            success: true,
            message: "Cập nhật dữ liệu môn học thành công",
            data: updated_subject
        });

    } catch (error) {
        console.error('❌ Update subject failed:', error);
        
        // Handle unique constraint violations
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors[0]?.path;
            let message = 'Dữ liệu đã tồn tại trên hệ thống';
            
            if (field === 'subject_code') {
                message = 'Mã môn học đã tồn tại';
            } else if (field === 'subject_name') {
                message = 'Tên môn học đã tồn tại';
            }
                      
            return res.status(409).json({
                success: false,
                message: message
            });
        }
        
        if (error instanceof SyntaxError) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu JSON không hợp lệ'
            });
        }
        
        // Pass to Express error handler
        next(error);
    }
}

async function delete_subject(req, res, next) {
    try {
        // Check admin permission
        if (req.user.user_role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập tài nguyên này'
            });
        }

        // Get subject_id from URL params
        const subject_id = req.params.subject_id;

        // First, check if subject exists
        const subject_to_delete = await db.models.Subject.findByPk(subject_id);
        
        // Check if subject exists
        if (!subject_to_delete) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy môn học'
            });
        }

        // Delete the subject - await is critical here!
        await subject_to_delete.destroy();

        // Create notifications for other admins
        await notify_admins_about_subject('deleted', subject_to_delete, req.user);

        // Return success response
        return res.status(200).json({
            success: true,
            message: "Xóa môn học thành công",
            data: {
                deleted_subject_id: subject_id,
                deleted_subject_name: subject_to_delete.subject_name
            }
        });

    } catch (error) {
        console.error('❌ Delete subject failed:', error);
        
        // Handle foreign key constraint violations (if subject is referenced by exams)
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({
                success: false,
                message: 'Không thể xóa môn học này vì đang có kỳ thi liên quan'
            });
        }
        
        // Handle other database errors
        if (error.name === 'SequelizeDatabaseError') {
            return res.status(500).json({
                success: false,
                message: 'Lỗi cơ sở dữ liệu khi xóa môn học'
            });
        }
        
        // Pass to Express error handler
        next(error);
    }
}

module.exports = {
    get_all_subject,
    add_new_subject,
    update_subject,
    delete_subject
}