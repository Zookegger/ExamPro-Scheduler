/**
 * Notification Service - Reusable notification utilities
 * 
 * This service provides reusable functions for creating notifications
 * across different controllers and resources. It centralizes notification
 * logic and makes it easy to maintain consistent notification patterns.
 * 
 * Features real-time WebSocket integration for immediate notification delivery.
 * 
 * @example
 * // In any controller:
 * const { notifyAdmins, notifyUser, bulkNotify } = require('../services/notificationService');
 * 
 * // Notify admins about resource changes
 * await notifyAdmins('subject', 'created', subject_data, current_user);
 * 
 * // Notify specific user
 * await notifyUser(user_id, 'exam', 'reminder', exam_data);
 * 
 * // Bulk notify multiple users
 * await bulkNotify(user_ids, 'system', 'maintenance', maintenance_data);
 */

const { models } = require('../models');
const { Notification, User } = models;

// WebSocket integration - will be set by the main app
let io_instance = null;

/**
 * Set the Socket.io instance for real-time notifications
 * @param {object} io - Socket.io server instance
 */
const setSocketIO = (io) => {
    io_instance = io;
    console.log('📡 Socket.io instance set for notification service');
};

/**
 * Helper to emit real-time notification if WebSocket is available
 * @param {number} user_id - Target user ID
 * @param {object} notification - Notification data
 */
const emit_real_time_notification = (user_id, notification) => {
    if (io_instance) {
        try {
            const { emit_notification_to_user } = require('../websocket/notificationHandlers');
            emit_notification_to_user(io_instance, user_id, notification);
        } catch (error) {
            console.error('❌ Error emitting real-time notification:', error);
        }
    }
};

/**
 * Notify all admins about resource changes (except the actor)
 * @param {string} resource_type - Type of resource (subject, exam, user, etc.)
 * @param {string} action - Action performed (created, updated, deleted, etc.)
 * @param {object} resource_data - Resource data
 * @param {object} current_user - User who performed the action
 * @param {object} options - Additional notification options
 * @returns {Promise<number>} Number of notifications sent
 */
const notifyAdmins = async (resource_type, action, resource_data, current_user, options = {}) => {
    try {
        // Get all active admin users except the one who performed the action
        const admins = await User.findAll({
            where: { 
                user_role: 'admin', 
                is_active: true 
            }
        });
        
        let notification_count = 0;
        
        // Create notifications for all admins except the actor
        for (const admin of admins) {
            if (admin.user_id !== current_user.user_id) {
                // Add user context to the message
                const enhanced_options = {
                    ...options,
                    custom_message: options.custom_message ? 
                        `${options.custom_message} bởi ${current_user.full_name}` : 
                        undefined
                };
                
                await Notification.create_resource_notification(
                    resource_type, 
                    action, 
                    resource_data, 
                    admin.user_id,
                    enhanced_options
                );
                
                // Emit real-time notification
                const notification = await Notification.findOne({
                    where: { user_id: admin.user_id },
                    order: [['created_at', 'DESC']]
                });
                
                if (notification) {
                    emit_real_time_notification(admin.user_id, notification);
                }
                
                notification_count++;
            }
        }
        
        console.log(`📨 Notified ${notification_count} admins about ${resource_type} ${action}`);
        return notification_count;
        
    } catch (error) {
        console.error(`❌ Error notifying admins about ${resource_type} change:`, error);
        throw error;
    }
};

/**
 * Notify a specific user about resource changes
 * @param {number} user_id - Target user ID
 * @param {string} resource_type - Type of resource
 * @param {string} action - Action performed
 * @param {object} resource_data - Resource data
 * @param {object} options - Additional notification options
 * @returns {Promise<Notification>} Created notification
 */
const notifyUser = async (user_id, resource_type, action, resource_data, options = {}) => {
    try {
        // Verify target user exists
        const target_user = await User.findByPk(user_id);
        if (!target_user) {
            throw new Error(`User with ID ${user_id} not found`);
        }
        
        const notification = await Notification.create_resource_notification(
            resource_type, 
            action, 
            resource_data, 
            user_id,
            options
        );
        
        // Emit real-time notification
        emit_real_time_notification(user_id, notification);
        
        console.log(`📨 Notified user ${user_id} about ${resource_type} ${action}`);
        return notification;
        
    } catch (error) {
        console.error(`❌ Error notifying user ${user_id}:`, error);
        throw error;
    }
};

/**
 * Notify users by role about resource changes
 * @param {string} role - User role to notify ('admin', 'teacher', 'student')
 * @param {string} resource_type - Type of resource
 * @param {string} action - Action performed
 * @param {object} resource_data - Resource data
 * @param {object} options - Additional notification options
 * @returns {Promise<number>} Number of notifications sent
 */
const notifyByRole = async (role, resource_type, action, resource_data, options = {}) => {
    try {
        const users = await User.findAll({
            where: { 
                user_role: role, 
                is_active: true 
            }
        });
        
        let notification_count = 0;
        
        for (const user of users) {
            await Notification.create_resource_notification(
                resource_type, 
                action, 
                resource_data, 
                user.user_id,
                options
            );
            notification_count++;
        }
        
        console.log(`📨 Notified ${notification_count} ${role}s about ${resource_type} ${action}`);
        return notification_count;
        
    } catch (error) {
        console.error(`❌ Error notifying ${role}s:`, error);
        throw error;
    }
};

/**
 * Bulk notify multiple users
 * @param {number[]} user_ids - Array of user IDs to notify
 * @param {string} resource_type - Type of resource
 * @param {string} action - Action performed
 * @param {object} resource_data - Resource data
 * @param {object} options - Additional notification options
 * @returns {Promise<number>} Number of notifications sent
 */
const bulkNotify = async (user_ids, resource_type, action, resource_data, options = {}) => {
    try {
        let notification_count = 0;
        
        for (const user_id of user_ids) {
            try {
                await notifyUser(user_id, resource_type, action, resource_data, options);
                notification_count++;
            } catch (error) {
                console.error(`❌ Failed to notify user ${user_id}:`, error);
                // Continue with other users
            }
        }
        
        console.log(`📨 Bulk notified ${notification_count}/${user_ids.length} users`);
        return notification_count;
        
    } catch (error) {
        console.error('❌ Error in bulk notification:', error);
        throw error;
    }
};

/**
 * Create system-wide announcement
 * @param {string} title - Announcement title
 * @param {string} message - Announcement message
 * @param {string} type - Notification type (default: 'system')
 * @param {string[]} target_roles - Roles to notify (default: all roles)
 * @returns {Promise<number>} Number of notifications sent
 */
const createSystemAnnouncement = async (title, message, type = 'system', target_roles = ['admin', 'teacher', 'student']) => {
    try {
        let total_notifications = 0;
        
        for (const role of target_roles) {
            const users = await User.findAll({
                where: { 
                    user_role: role, 
                    is_active: true 
                }
            });
            
            for (const user of users) {
                await Notification.create({
                    user_id: user.user_id,
                    title: title,
                    message: message,
                    type: type,
                    related_id: null,
                    related_type: 'system'
                });
                total_notifications++;
            }
        }
        
        console.log(`📢 Created system announcement for ${total_notifications} users`);
        return total_notifications;
        
    } catch (error) {
        console.error('❌ Error creating system announcement:', error);
        throw error;
    }
};

/**
 * Clean up old read notifications (for maintenance)
 * @param {number} days_old - Delete notifications older than this many days (default: 30)
 * @returns {Promise<number>} Number of notifications deleted
 */
const cleanupOldNotifications = async (days_old = 30) => {
    try {
        const cutoff_date = new Date();
        cutoff_date.setDate(cutoff_date.getDate() - days_old);
        
        const deleted_count = await Notification.destroy({
            where: {
                is_read: true,
                created_at: {
                    [require('sequelize').Op.lt]: cutoff_date
                }
            }
        });
        
        console.log(`🧹 Cleaned up ${deleted_count} old notifications`);
        return deleted_count;
        
    } catch (error) {
        console.error('❌ Error cleaning up notifications:', error);
        throw error;
    }
};

module.exports = {
    notifyAdmins,
    notifyUser,
    notifyByRole,
    bulkNotify,
    createSystemAnnouncement,
    cleanupOldNotifications,
    setSocketIO
};
