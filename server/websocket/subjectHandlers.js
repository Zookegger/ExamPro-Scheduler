const { models } = require('../models');
const { User, Notification } = models;
const { requireAdminPermission } = require('./authorizationHandlers');
const db = require('../models');

// Subject event constants
const SUBJECT_EVENTS = {
    TABLE_UPDATE: 'subject_table_update',
    ERROR: 'subject_error',
    NOTIFICATION: 'subject_notification'
};

// Error type constants
const ERROR_TYPES = {
    UNAUTHORIZED: 'unauthorized',
    DATABASE_ERROR: 'database_error',
    VALIDATION_ERROR: 'validation_error',
    SUBJECT_NOT_FOUND: 'subject_not_found'
};

class SubjectHandler {
    constructor(io) {
        this.io = io;
        this.events = SUBJECT_EVENTS;
        this.errors = ERROR_TYPES;
    }

    /**
     * Create and emit notification to admin users (excluding the actor)
     * @param {Object} subject_data - Subject information
     * @param {Object} admin_info - Admin who performed the action
     * @param {string} action - Action performed (create, update, delete)
     * @param {Object} transaction - Database transaction instance
     */
    async createAndEmitNotifications(subject_data, admin_info, action, transaction) {
        try {
            // Get all admin users to send notifications
            const admin_users = await User.findAll({
                where: { 
                    user_role: 'admin',
                    is_active: true 
                },
                attributes: ['user_id', 'full_name'],
                transaction
            });

            const notification_recipients = admin_users.filter(user => user.user_id !== admin_info?.user_id);

            if (notification_recipients.length > 0) {
                // Create notification messages based on action
                const action_messages = {
                    create: {
                        title: 'Môn học mới được tạo',
                        message: `Môn học "${subject_data.subject_name}" (${subject_data.subject_code}) đã được tạo bởi ${admin_info?.full_name || 'admin khác'}.`
                    },
                    update: {
                        title: 'Môn học được cập nhật',
                        message: `Môn học "${subject_data.subject_name}" (${subject_data.subject_code}) đã được cập nhật bởi ${admin_info?.full_name || 'admin khác'}.`
                    },
                    delete: {
                        title: 'Môn học bị xóa',
                        message: `Môn học "${subject_data.subject_name}" (${subject_data.subject_code}) đã bị xóa bởi ${admin_info?.full_name || 'admin khác'}.`
                    }
                };

                const message_info = action_messages[action];

                // Create notifications in database for persistence
                const notifications_to_create = notification_recipients.map(user => ({
                    user_id: user.user_id,
                    title: message_info.title,
                    message: message_info.message,
                    type: 'subject',
                    related_id: subject_data.subject_id,
                    related_type: 'subject',
                    is_read: false
                }));

                const created_notifications = await Notification.bulkCreate(notifications_to_create, { transaction });

                // Emit real-time notifications to connected users (exclude the creator)
                notification_recipients.forEach((user, index) => {
                    // Double-check: Don't send notification to the creator
                    if (user.user_id === admin_info?.user_id) {
                        return; // Skip this user
                    }
                    
                    const notification_data = {
                        notification_id: created_notifications[index].notification_id,
                        title: message_info.title,
                        message: message_info.message,
                        type: 'subject',
                        resource_type: 'subject',
                        resource_id: subject_data.subject_id,
                        is_read: false,
                        created_at: created_notifications[index].created_at,
                        metadata: {
                            name: subject_data.subject_name,
                            code: subject_data.subject_code,
                            action: action,
                            changed_by: admin_info?.full_name
                        }
                    };

                    // Emit to specific user's notification room
                    this.io.to(`notifications_${user.user_id}`).emit('new_notification', {
                        success: true,
                        notification: notification_data,
                        timestamp: new Date().toISOString()
                    });

                    // Update unread count
                    this.io.to(`notifications_${user.user_id}`).emit('unread_count_update', {
                        success: true,
                        unread_count: created_notifications.length // This should be calculated properly
                    });
                });

                console.log(`📨 Created and emitted ${created_notifications.length} notifications for subject ${action}`);
            }

        } catch (error) {
            console.error(`❌ Error creating notifications for subject ${action}:`, error);
            // Don't throw - notifications shouldn't break the main operation
        }
    }

    async handleCreated(data, socket) {
        // Start database transaction for notification consistency
        const transaction = await db.utility.sequelize.transaction();
        
        try {
            // 🔐 Authorization check - only admins can trigger subject operations
            if (!requireAdminPermission(socket)) {
                await transaction.rollback();
                return;
            }

            const { subject_data, admin_info } = data;
            console.log(`📚 Subject created by admin ${admin_info?.user_id || socket.user?.user_id}`);

            // Validate required data
            if (!subject_data || !subject_data.subject_id) {
                await transaction.rollback();
                socket.emit(SUBJECT_EVENTS.ERROR, {
                    success: false,
                    message: 'Dữ liệu môn học không hợp lệ',
                    error_type: ERROR_TYPES.VALIDATION_ERROR
                });
                return;
            }

            // Emit table update for real-time UI updates to OTHER connected clients (exclude the creator)
            socket.broadcast.emit(SUBJECT_EVENTS.TABLE_UPDATE, {
                action: 'create',
                subject: subject_data,
                timestamp: new Date().toISOString(),
                changed_by: admin_info || socket.user
            });

            // Create and emit notifications within transaction
            await this.createAndEmitNotifications(
                subject_data, 
                admin_info || socket.user, 
                'create', 
                transaction
            );

            // Commit transaction
            await transaction.commit();

            console.log(`✅ Subject creation notification flow completed for subject: ${subject_data.subject_name}`);

        } catch (error) {
            await transaction.rollback();
            console.error('❌ Error handling subject creation:', error);
            
            socket.emit(SUBJECT_EVENTS.ERROR, {
                success: false,
                message: 'Lỗi hệ thống khi xử lý tạo môn học',
                error_type: ERROR_TYPES.DATABASE_ERROR,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async handleUpdated(data, socket) {
        // Start database transaction for notification consistency
        const transaction = await db.utility.sequelize.transaction();
        
        try {
            // 🔐 Authorization check - only admins can trigger subject operations
            if (!requireAdminPermission(socket)) {
                await transaction.rollback();
                return;
            }

            const { subject_data, admin_info } = data;
            console.log(`📚 Subject updated by admin ${admin_info?.user_id || socket.user?.user_id}`);

            // Validate required data
            if (!subject_data || !subject_data.subject_id) {
                await transaction.rollback();
                socket.emit(SUBJECT_EVENTS.ERROR, {
                    success: false,
                    message: 'Dữ liệu môn học không hợp lệ',
                    error_type: ERROR_TYPES.VALIDATION_ERROR
                });
                return;
            }

            // Emit table update for real-time UI updates to OTHER connected clients (exclude the creator)
            socket.broadcast.emit(SUBJECT_EVENTS.TABLE_UPDATE, {
                action: 'update',
                subject: subject_data,
                timestamp: new Date().toISOString(),
                changed_by: admin_info || socket.user
            });

            // Create and emit notifications within transaction
            await this.createAndEmitNotifications(
                subject_data, 
                admin_info || socket.user, 
                'update', 
                transaction
            );

            // Commit transaction
            await transaction.commit();

            console.log(`✅ Subject update notification flow completed for subject: ${subject_data.subject_name}`);

        } catch (error) {
            await transaction.rollback();
            console.error('❌ Error handling subject update:', error);
            
            socket.emit(SUBJECT_EVENTS.ERROR, {
                success: false,
                message: 'Lỗi hệ thống khi xử lý cập nhật môn học',
                error_type: ERROR_TYPES.DATABASE_ERROR,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async handleDeleted(data, socket) {
        // Start database transaction for notification consistency
        const transaction = await db.utility.sequelize.transaction();
        
        try {
            // 🔐 Authorization check - only admins can trigger subject operations
            if (!requireAdminPermission(socket)) {
                await transaction.rollback();
                return;
            }

            const { subject_data, admin_info } = data;
            console.log(`📚 Subject deleted by admin ${admin_info?.user_id || socket.user?.user_id}`);

            // Validate required data
            if (!subject_data || !subject_data.subject_id) {
                await transaction.rollback();
                socket.emit(SUBJECT_EVENTS.ERROR, {
                    success: false,
                    message: 'Dữ liệu môn học không hợp lệ',
                    error_type: ERROR_TYPES.VALIDATION_ERROR
                });
                return;
            }

            // Emit table update for real-time UI updates to OTHER connected clients (exclude the creator)
            socket.broadcast.emit(SUBJECT_EVENTS.TABLE_UPDATE, {
                action: 'delete',
                subject: subject_data,
                timestamp: new Date().toISOString(),
                changed_by: admin_info || socket.user
            });

            // Create and emit notifications within transaction
            await this.createAndEmitNotifications(
                subject_data, 
                admin_info || socket.user, 
                'delete', 
                transaction
            );

            // Commit transaction
            await transaction.commit();

            console.log(`✅ Subject deletion notification flow completed for subject: ${subject_data.subject_name}`);

        } catch (error) {
            await transaction.rollback();
            console.error('❌ Error handling subject deletion:', error);
            
            socket.emit(SUBJECT_EVENTS.ERROR, {
                success: false,
                message: 'Lỗi hệ thống khi xử lý xóa môn học',
                error_type: ERROR_TYPES.DATABASE_ERROR,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

function register_subject_handlers(socket, io_stream) {
    console.log(`📚 Registering subject handlers for socket ${socket.id}`);
    const handler = new SubjectHandler(io_stream);

    // Event handlers for CRUD operations
    /**
     * 🧠 CRITICAL: Why we need .bind(handler)
     * 
     * When Socket.io calls our handler (like handleCreated), JavaScript *loses* 
     * the connection to our SubjectHandler instance ('this' becomes undefined).
     * 
     * .bind(handler) FIXES THIS by permanently locking 'this' to our handler instance,
     * so 'this.io' works correctly inside the method.
     * 
     * 🔥 Without .bind():
     *   - this.io → undefined (CRASH!)
     * 
     * ✅ With .bind(handler):
     *   - this.io → Our SubjectHandler's io instance (WORKS!)
     * 
     * 📋 Note: We pass socket as second parameter for authorization checks
     */
    socket.on('subject_created', (data) => handler.handleCreated(data, socket));
    socket.on('subject_updated', (data) => handler.handleUpdated(data, socket));  
    socket.on('subject_deleted', (data) => handler.handleDeleted(data, socket));
}

module.exports = {
    register_subject_handlers
}