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

const { models } = require('../models');
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
    try {
        const { notification_ids } = req.body; // Array of notification IDs
        const user_id = req.user.user_id; // From auth middleware

        if (!notification_ids || !Array.isArray(notification_ids)) {
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
                }
            }
        );

        console.log(`✅ Marked ${updated_count} notifications as read for user ${user_id}`);

        res.status(200).json({
            success: true,
            updated_count,
            message: `Đã đánh dấu ${updated_count} thông báo là đã đọc`
        });

    } catch (error) {
        console.error('❌ Error marking notifications as read:', error);
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
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const user_id = req.user.user_id; // From auth middleware

        const [updated_count] = await Notification.update(
            { is_read: true },
            {
                where: {
                    user_id: user_id,
                    is_read: false
                }
            }
        );

        console.log(`✅ Marked all ${updated_count} notifications as read for user ${user_id}`);

        res.status(200).json({
            success: true,
            updated_count,
            message: `Đã đánh dấu tất cả thông báo là đã đọc`
        });

    } catch (error) {
        console.error('❌ Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi cập nhật tất cả thông báo',
            error: error.message
        });
    }
};

/**
 * Create a new notification (admin function or system use)
 * Used for system announcements and manual notifications
 * 
 * @param {number|object} user_id_or_req - User ID (for system calls) or req object (for API calls)
 * @param {object} notification_data_or_res - Notification data (for system calls) or res object (for API calls)
 */
const createNotification = async (user_id_or_req, notification_data_or_res) => {
    try {
        // Handle both API calls and direct function calls
        let user_id, notification_data, res;
        
        if (typeof user_id_or_req === 'number') {
            // Direct function call from other controllers
            user_id = user_id_or_req;
            notification_data = notification_data_or_res;
        } else {
            // API call via Express route
            const req = user_id_or_req;
            res = notification_data_or_res;
            
            const {
                user_id: target_user_id,
                title,
                message,
                type = 'info',
                related_id,
                related_type
            } = req.body;

            user_id = target_user_id;
            notification_data = { title, message, type, related_id, related_type };

            // Validate required fields for API calls
            if (!user_id || !title || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'user_id, title và message là bắt buộc'
                });
            }
        }

        // Verify target user exists
        const target_user = await User.findByPk(user_id);
        if (!target_user) {
            if (res) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng'
                });
            } else {
                throw new Error('Target user not found');
            }
        }

        const new_notification = await Notification.create({
            user_id,
            ...notification_data
        });

        console.log(`📨 Created notification ${new_notification.notification_id} for user ${user_id}`);

        // TODO: Emit WebSocket event for real-time delivery
        // io.to(`user_${user_id}`).emit('new_notification', new_notification);

        if (res) {
            // API response
            res.status(201).json({
                success: true,
                notification: new_notification,
                message: 'Tạo thông báo thành công'
            });
        } else {
            // Return for direct function calls
            return new_notification;
        }

    } catch (error) {
        console.error('❌ Error creating notification:', error);
        
        if (notification_data_or_res && notification_data_or_res.status) {
            // This is a res object, send error response
            notification_data_or_res.status(500).json({
                success: false,
                message: 'Lỗi tạo thông báo',
                error: error.message
            });
        } else {
            // This is a direct function call, throw error
            throw error;
        }
    }
};

/**
 * Delete a notification (usually for cleanup or user request)
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const deleteNotification = async (req, res) => {
    try {
        const { notification_id } = req.params;
        const user_id = req.user.user_id; // From auth middleware

        const deleted_count = await Notification.destroy({
            where: {
                notification_id: parseInt(notification_id),
                user_id: user_id // Ensure user can only delete their own notifications
            }
        });

        if (deleted_count === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo hoặc không có quyền truy cập'
            });
        }

        console.log(`🗑️ Deleted notification ${notification_id} for user ${user_id}`);

        res.status(200).json({
            success: true,
            message: 'Xóa thông báo thành công'
        });

    } catch (error) {
        console.error('❌ Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xóa thông báo',
            error: error.message
        });
    }
};

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
        
        // TODO: Emit WebSocket event
        // io.to(`user_${admin_user_id}`).emit('new_notification', notification);
        
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