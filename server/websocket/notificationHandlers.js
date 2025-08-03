/**
 * Notification WebSocket Handlers - Real-time notification delivery
 * 
 * This module handles WebSocket events for real-time notification delivery.
 * It integrates with the notification system to push notifications to
 * connected clients immediately when they're created.
 * 
 * Features:
 * - Real-time notification delivery
 * - User-specific notification rooms
 * - Connection state management
 * - Notification acknowledgment
 * 
 * @example
 * // Usage in notification controller:
 * const { emit_notification_to_user } = require('../websocket/notificationHandlers');
 * await emit_notification_to_user(user_id, notification_data);
 */

const { models } = require('../models');
const { Notification, User } = models;

/**
 * Setup notification WebSocket handlers
 * @param {object} io - Socket.io server instance
 */
function setup_notification_handlers(io) {
    // Handle new client connections
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);
        
        // Join user to their personal notification room
        socket.on('join_notification_room', (user_id) => {
            try {
                const room_name = `notifications_${user_id}`;
                socket.join(room_name);
                socket.user_id = user_id; // Store user_id on socket
                
                console.log(`📡 User ${user_id} joined notification room: ${room_name}`);
                
                // Send acknowledgment
                socket.emit('notification_room_joined', {
                    success: true,
                    room: room_name,
                    message: 'Đã kết nối thông báo thời gian thực'
                });
                
            } catch (error) {
                console.error('❌ Error joining notification room:', error);
                socket.emit('notification_error', {
                    success: false,
                    message: 'Lỗi kết nối thông báo'
                });
            }
        });
        
        // Handle notification acknowledgment
        socket.on('acknowledge_notification', async (notification_id) => {
            try {
                if (!socket.user_id) {
                    socket.emit('notification_error', {
                        success: false,
                        message: 'Chưa xác thực người dùng'
                    });
                    return;
                }
                
                // Mark notification as read
                const [updated_rows] = await Notification.update(
                    { is_read: true },
                    {
                        where: {
                            notification_id: notification_id,
                            user_id: socket.user_id
                        }
                    }
                );
                
                if (updated_rows > 0) {
                    console.log(`✅ Notification ${notification_id} acknowledged by user ${socket.user_id}`);
                    
                    // Send confirmation
                    socket.emit('notification_acknowledged', {
                        success: true,
                        notification_id: notification_id
                    });
                } else {
                    socket.emit('notification_error', {
                        success: false,
                        message: 'Không tìm thấy thông báo'
                    });
                }
                
            } catch (error) {
                console.error('❌ Error acknowledging notification:', error);
                socket.emit('notification_error', {
                    success: false,
                    message: 'Lỗi xác nhận thông báo'
                });
            }
        });
        
        // Handle getting unread notification count
        socket.on('get_unread_count', async () => {
            try {
                if (!socket.user_id) {
                    socket.emit('notification_error', {
                        success: false,
                        message: 'Chưa xác thực người dùng'
                    });
                    return;
                }
                
                const unread_count = await Notification.count({
                    where: {
                        user_id: socket.user_id,
                        is_read: false
                    }
                });
                
                socket.emit('unread_count_update', {
                    success: true,
                    unread_count: unread_count
                });
                
            } catch (error) {
                console.error('❌ Error getting unread count:', error);
                socket.emit('notification_error', {
                    success: false,
                    message: 'Lỗi tải số thông báo chưa đọc'
                });
            }
        });
        
        // Handle disconnection
        socket.on('disconnect', () => {
            if (socket.user_id) {
                console.log(`🔌 User ${socket.user_id} disconnected from notifications`);
            } else {
                console.log(`🔌 Anonymous client disconnected: ${socket.id}`);
            }
        });
    });
}

/**
 * Emit notification to a specific user
 * @param {object} io - Socket.io server instance
 * @param {number} user_id - Target user ID
 * @param {object} notification - Notification data
 */
function emit_notification_to_user(io, user_id, notification) {
    try {
        const room_name = `notifications_${user_id}`;
        
        io.to(room_name).emit('new_notification', {
            success: true,
            notification: notification,
            timestamp: new Date().toISOString()
        });
        
        console.log(`📨 Emitted notification ${notification.notification_id} to user ${user_id}`);
        
    } catch (error) {
        console.error(`❌ Error emitting notification to user ${user_id}:`, error);
    }
}

/**
 * Emit notification to multiple users
 * @param {object} io - Socket.io server instance
 * @param {number[]} user_ids - Array of user IDs
 * @param {object} notification_data - Notification data
 */
function emit_notification_to_users(io, user_ids, notification_data) {
    try {
        user_ids.forEach(user_id => {
            emit_notification_to_user(io, user_id, notification_data);
        });
        
        console.log(`📨 Emitted notification to ${user_ids.length} users`);
        
    } catch (error) {
        console.error('❌ Error emitting notification to users:', error);
    }
}

/**
 * Broadcast system announcement to all connected users
 * @param {object} io - Socket.io server instance
 * @param {object} announcement - Announcement data
 */
function broadcast_system_announcement(io, announcement) {
    try {
        io.emit('system_announcement', {
            success: true,
            announcement: announcement,
            timestamp: new Date().toISOString()
        });
        
        console.log(`📢 Broadcasted system announcement: ${announcement.title}`);
        
    } catch (error) {
        console.error('❌ Error broadcasting system announcement:', error);
    }
}

/**
 * Update unread count for a user
 * @param {object} io - Socket.io server instance
 * @param {number} user_id - User ID
 * @param {number} unread_count - New unread count
 */
function update_unread_count(io, user_id, unread_count) {
    try {
        const room_name = `notifications_${user_id}`;
        
        io.to(room_name).emit('unread_count_update', {
            success: true,
            unread_count: unread_count
        });
        
        console.log(`📊 Updated unread count for user ${user_id}: ${unread_count}`);
        
    } catch (error) {
        console.error(`❌ Error updating unread count for user ${user_id}:`, error);
    }
}

module.exports = {
    setup_notification_handlers,
    emit_notification_to_user,
    emit_notification_to_users,
    broadcast_system_announcement,
    update_unread_count
};
