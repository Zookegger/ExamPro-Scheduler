/**
 * Notification Controller - Manages user notifications
 * 
 * This controller handles all notification-related operations including:
 * - Getting user notifications (read/unread filtering)
 * - Marking notifications as read
 * - Creating system notifications
 * - Real-time notification delivery via WebSocket
 * 
 * Integrates with WebSocket handlers for real-time notification delivery.
 */

const { models, utility } = require('../models');
const { Notification, User } = models;
const { Op } = require('sequelize');
const { notifyUser, createSystemAnnouncement } = require('../services/notificationService');

/**
 * Get all notifications for a specific user
 * Supports filtering by read status and pagination
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getUserNotifications = async (req, res) => {
    try {
        const { user_id } = req.user; // From JWT token
        const { 
            is_read, 
            limit = 20, 
            offset = 0,
            type 
        } = req.query;

        // Build where clause based on filters
        const where_clause = { user_id: parseInt(user_id) };
        
        if (is_read !== undefined) {
            where_clause.is_read = is_read === 'true';
        }
        
        if (type) {
            where_clause.type = type;
        }

        const notifications = await Notification.findAll({
            where: where_clause,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [{
                model: User,
                as: 'recipient',
                attributes: ['user_id', 'full_name', 'user_role']
            }]
        });

        // Get unread count for this user
        const unread_count = await Notification.count({
            where: {
                user_id: parseInt(user_id),
                is_read: false
            }
        });

        console.log(`📬 Retrieved ${notifications.length} notifications for user ${user_id}`);
        
        res.status(200).json({
            success: true,
            notifications,
            unread_count,
            message: 'Thông báo được tải thành công'
        });

    } catch (error) {
        console.error('❌ Error fetching user notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tải thông báo',
            error: error.message
        });
    }
};

/**
 * Mark specific notifications as read
 * Supports single notification or bulk operations
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const markNotificationsAsRead = async (req, res) => {
    const transaction = await utility.sequelize.transaction();
    
    try {
        const { notification_ids } = req.body; // Array of notification IDs
        const user_id = req.user.user_id; // From auth middleware

        if (!notification_ids || !Array.isArray(notification_ids)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Danh sách ID thông báo là bắt buộc'
            });
        }

        const [updated_count] = await Notification.update(
            { is_read: true },
            {
                where: {
                    notification_id: {
                        [Op.in]: notification_ids
                    },
                    user_id: user_id // Ensure user can only mark their own notifications
                },
                transaction
            }
        );

        await transaction.commit();
        console.log(`✅ Marked ${updated_count} notifications as read for user ${user_id} with transaction`);

        res.status(200).json({
            success: true,
            updated_count,
            message: `Đã đánh dấu ${updated_count} thông báo là đã đọc`
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Error marking notifications as read, transaction rolled back:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi cập nhật thông báo',
            error: error.message
        });
    }
};

/**
 * Mark all notifications as read for a user
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function markAllNotificationsAsRead(req, res, next) {
    const transaction = await utility.sequelize.transaction();
    
    try {
        const user_id = req.user.user_id;
        
        const [updated_count] = await Notification.update(
            { is_read: true },
            { 
                where: { 
                    user_id: user_id,
                    is_read: false 
                },
                transaction
            }
        );
        
        await transaction.commit();
        console.log(`✅ Marked ${updated_count} notifications as read for user ${user_id}`);
        
        res.json({
            success: true,
            updated_count,
            message: 'Đã đánh dấu tất cả thông báo là đã đọc'
        });
    } catch (error) {
        await transaction.rollback();
        console.error('❌ Mark all notifications as read failed, transaction rolled back:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi cập nhật thông báo',
            error: error.message
        });
    }
}

/**
 * Create a new notification (admin function or system use)
 * Used for system announcements and manual notifications
 * 
 * @param {number|object} user_id_or_req - User ID (for system calls) or req object (for API calls)
 * @param {object} notification_data_or_res - Notification data (for system calls) or res object (for API calls)
 */
async function createNotification(req, res, next) {
    const transaction = await utility.sequelize.transaction();
    
    try {
        const notification_data = req.body;
        const new_notification = await Notification.create(notification_data, { transaction });
        
        await transaction.commit();
        
        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: new_notification
        });
    } catch (error) {
        await transaction.rollback();
        console.error('❌ Create notification failed, transaction rolled back:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo thông báo',
            error: error.message
        });
    }
}

/**
 * Delete a notification (usually for cleanup or user request)
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function deleteNotification(req, res, next) {
    const transaction = await utility.sequelize.transaction();
    
    try {
        const notification_id = req.params.notification_id;
        const user_id = req.user.user_id;
        
        const notification = await Notification.findOne({
            where: {
                notification_id,
                user_id
            },
            transaction
        });
        
        if (!notification) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        await notification.destroy({ transaction });
        
        await transaction.commit();
        
        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        await transaction.rollback();
        console.error('❌ Delete notification failed, transaction rolled back:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xóa thông báo',
            error: error.message
        });
    }
}

/**
 * Helper function to create subject-related notifications
 * Called from subject controller when CRUD operations occur
 * 
 * @param {string} action - 'created', 'updated', 'deleted'
 * @param {object} subject_data - Subject information
 * @param {number} admin_user_id - Admin user to notify
 */
const create_subject_notification = async (action, subject_data, admin_user_id) => {
    try {
        const notification = await Notification.create_resource_notification(
            action,
            subject_data,
            admin_user_id
        );

        console.log(`📚 Created subject ${action} notification for admin ${admin_user_id}`);
        
        // Emit WebSocket event to notify user in real-time
        const websocket_io = require('../websocket').getIO();
        if (websocket_io) {
            websocket_io.to(`user_${admin_user_id}`).emit('new_notification', {
                notification: notification,
                action: action,
                subject_data: subject_data,
                timestamp: new Date().toISOString()
            });
            console.log(`🔔 Emitted new_notification WebSocket event to user_${admin_user_id}`);
        }
        
        return notification;
    } catch (error) {
        console.error('❌ Error creating subject notification:', error);
        throw error;
    }
};

module.exports = {
    getUserNotifications,
    markNotificationsAsRead,
    markAllNotificationsAsRead,
    createNotification,
    deleteNotification,
    create_subject_notification
};