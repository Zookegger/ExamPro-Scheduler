const db = require('../models');
const { notifyAdmins } = require('../services/notificationService');

// Constants for better maintainability
const RESOURCE_TYPE = 'subject';
const ADMIN_ROLE = 'admin';
const ERROR_MESSAGES = {
    PERMISSION_DENIED: 'Bạn không có quyền truy cập tài nguyên này',
    SUBJECT_NOT_FOUND: 'Không tìm thấy môn học',
    INVALID_QUERY: 'Invalid query parameters',
    INVALID_JSON: 'Dữ liệu JSON không hợp lệ',
    MISSING_FIELDS: 'Thiếu thông tin bắt buộc: mã môn học, tên môn học hoặc khoa',
    DUPLICATE_CODE: 'Mã môn học đã tồn tại',
    DUPLICATE_NAME: 'Tên môn học đã tồn tại',
    NO_CHANGES: 'Không có thay đổi nào được thực hiện',
    REFERENCED_SUBJECT: 'Không thể xóa môn học này vì đang có kỳ thi liên quan'
};

/**
 * Reusable helper function to notify admins about resource changes
 * @param {string} action - 'created', 'updated', 'deleted'
 * @param {object} resource_data - Subject information
 * @param {object} current_user - User who performed the action
 */
async function notifyAdminsAboutSubject(action, resource_data, current_user) {
    try {
        await notifyAdmins(RESOURCE_TYPE, action, resource_data, current_user);
    } catch (error) {
        console.error(`❌ Error notifying admins about subject ${action}:`, error);
    }
}

/**
 * Validates subject data
 * @param {object} subjectData - Subject data to validate
 * @returns {object} { isValid: boolean, message?: string }
 */
function validateSubjectData(subjectData) {
    if (!subjectData.subject_code || !subjectData.subject_name || !subjectData.department) {
        return { isValid: false, message: ERROR_MESSAGES.MISSING_FIELDS };
    }
    return { isValid: true };
}

/**
 * Handles database errors and returns appropriate response
 * @param {Error} error - The error object
 * @param {Response} res - Express response object
 * @returns {Response} Appropriate error response
 */
function handleDatabaseError(error, res) {
    if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path;
        const message = field === 'subject_code' ? ERROR_MESSAGES.DUPLICATE_CODE : 
                       field === 'subject_name' ? ERROR_MESSAGES.DUPLICATE_NAME : 
                       ERROR_MESSAGES.DUPLICATE_DATA;
        return res.status(409).json({ success: false, message });
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(409).json({ success: false, message: ERROR_MESSAGES.REFERENCED_SUBJECT });
    }
    
    if (error instanceof SyntaxError) {
        return res.status(400).json({ success: false, message: ERROR_MESSAGES.INVALID_JSON });
    }
    
    // For other errors, pass to the next middleware
    return null;
}

async function getAllSubjects(req, res, next) {
    try {
        const whereClause = req.query || {};

        if (typeof whereClause !== 'object' || Array.isArray(whereClause)) {
            return res.status(400).json({
                success: false,
                message: ERROR_MESSAGES.INVALID_QUERY
            });
        }

        const { rows, count } = await db.models.Subject.findAndCountAll({
            where: whereClause,
        });

        return res.json({ success: true, subjects: rows, count });
        
    } catch (error) {
        console.error('❌ Get all subjects failed:', error);
        const handledResponse = handleDatabaseError(error, res);
        if (handledResponse) return handledResponse;
        next(error);
    }
}

async function addNewSubject(req, res, next) {
    const transaction = await db.utility.sequelize.transaction();
    
    try {
        if (req.user.user_role !== ADMIN_ROLE) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: ERROR_MESSAGES.PERMISSION_DENIED
            });
        }

        const newSubjectData = req.body;
        const validation = validateSubjectData(newSubjectData);
        
        if (!validation.isValid) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        const newSubject = await db.models.Subject.create({
            subject_code: newSubjectData.subject_code,
            subject_name: newSubjectData.subject_name,
            department: newSubjectData.department,
            description: newSubjectData.description || null,
            is_active: newSubjectData.is_active ?? true,
        }, { transaction });

        await notifyAdminsAboutSubject('created', newSubject, req.user);

        await transaction.commit();
        console.log(`✅ Subject "${newSubject.subject_name}" created successfully with transaction`);

        return res.status(201).json({
            success: true,
            message: "Tạo môn học mới thành công",
            data: newSubject
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Create subject failed, transaction rolled back:', error);
        const handledResponse = handleDatabaseError(error, res);
        if (handledResponse) return handledResponse;
        next(error);
    }
}

async function updateSubject(req, res, next) {
    const transaction = await db.utility.sequelize.transaction();
    
    try {
        if (req.user.user_role !== ADMIN_ROLE) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: ERROR_MESSAGES.PERMISSION_DENIED
            });
        }

        const subjectId = req.params.subject_id;
        const newSubjectData = req.body;
        
        const validation = validateSubjectData(newSubjectData);
        if (!validation.isValid) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        const oldSubject = await db.models.Subject.findByPk(subjectId, { transaction });
        if (!oldSubject) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: ERROR_MESSAGES.SUBJECT_NOT_FOUND
            });
        }

        // Check for no changes
        if (oldSubject.subject_code === newSubjectData.subject_code &&
            oldSubject.subject_name === newSubjectData.subject_name &&
            oldSubject.department === newSubjectData.department &&
            oldSubject.description === newSubjectData.description &&
            oldSubject.is_active === (newSubjectData.is_active ?? true)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: ERROR_MESSAGES.NO_CHANGES
            });
        }

        const [updatedRows] = await db.models.Subject.update({
            subject_code: newSubjectData.subject_code,
            subject_name: newSubjectData.subject_name,
            department: newSubjectData.department,
            description: newSubjectData.description || null,
            is_active: newSubjectData.is_active ?? true,
        }, {
            where: { subject_id: subjectId },
            transaction
        });

        if (updatedRows === 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: "Không thể cập nhật môn học"
            });
        }

        const updatedSubject = await db.models.Subject.findByPk(subjectId, { transaction });
        await notifyAdminsAboutSubject('updated', updatedSubject, req.user);

        await transaction.commit();
        console.log(`✅ Subject "${updatedSubject.subject_name}" updated successfully with transaction`);

        return res.status(200).json({
            success: true,
            message: "Cập nhật dữ liệu môn học thành công",
            data: updatedSubject
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Update subject failed, transaction rolled back:', error);
        const handledResponse = handleDatabaseError(error, res);
        if (handledResponse) return handledResponse;
        next(error);
    }
}

async function deleteSubject(req, res, next) {
    const transaction = await db.utility.sequelize.transaction();
    
    try {
        if (req.user.user_role !== ADMIN_ROLE) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: ERROR_MESSAGES.PERMISSION_DENIED
            });
        }

        const subjectId = req.params.subject_id;
        const subjectToDelete = await db.models.Subject.findByPk(subjectId, { transaction });
        
        if (!subjectToDelete) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: ERROR_MESSAGES.SUBJECT_NOT_FOUND
            });
        }

        await subjectToDelete.destroy({ transaction });
        await notifyAdminsAboutSubject('deleted', subjectToDelete, req.user);

        await transaction.commit();
        console.log(`✅ Subject "${subjectToDelete.subject_name}" deleted successfully with transaction`);

        return res.status(200).json({
            success: true,
            message: "Xóa môn học thành công",
            data: {
                deleted_subject_id: subjectId,
                deleted_subject_name: subjectToDelete.subject_name
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Delete subject failed, transaction rolled back:', error);
        const handledResponse = handleDatabaseError(error, res);
        if (handledResponse) return handledResponse;
        next(error);
    }
}

module.exports = {
    getAllSubjects,
    addNewSubject,
    updateSubject,
    deleteSubject
};