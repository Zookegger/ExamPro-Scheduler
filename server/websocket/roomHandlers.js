/**
 * Room Management WebSocket Handlers - Real-time room updates
 * 
 * Handles real-time updates for room management including:
 * - Room CRUD operations
 * - Real-time exam status updates  
 * - Room availability changes
 * - Administrative notifications
 * 
 * Following ExamPro patterns:
 * - snake_case naming convention
 * - Vietnamese error messages
 * - Comprehensive logging
 * - Transaction support
 * 
 * @fileoverview WebSocket handlers for real-time room management
 */

const { models } = require('../models');
const { Room, Exam, User, Notification } = models;
const { requireAdminPermission } = require('./authorizationHandlers');
const { Op } = require('sequelize');
const db = require('../models');

// Event constants for room operations
const ROOM_EVENTS = {
    TABLE_UPDATE: 'room_table_update',
    STATUS_UPDATE: 'room_status_update',
    EXAM_STATUS_CHANGE: 'room_exam_status_change',
    ERROR: 'room_error',
    NOTIFICATION: 'room_notification'
};

// Error type constants
const ERROR_TYPES = {
    ROOM_NOT_FOUND: 'room_not_found',
    DUPLICATE_ROOM: 'duplicate_room_name',
    DATABASE_ERROR: 'database_error',
    UNAUTHORIZED: 'unauthorized',
    VALIDATION_ERROR: 'validation_error'
};

// Vietnamese error messages
const ERROR_MESSAGES = {
    ROOM_NOT_FOUND: 'Không tìm thấy phòng',
    DUPLICATE_ROOM: 'Tên phòng đã tồn tại trong tòa nhà này',
    DATABASE_ERROR: 'Lỗi cơ sở dữ liệu',
    UNAUTHORIZED: 'Không có quyền thực hiện thao tác này',
    VALIDATION_ERROR: 'Dữ liệu không hợp lệ'
};

/**
 * Room Management WebSocket Handler Class
 * 
 * Manages real-time communication for room operations including
 * CRUD operations, exam status tracking, and administrative notifications.
 */
class RoomHandler {
    constructor(io) {
        this.io = io;
        this.events = ROOM_EVENTS;
        this.errors = ERROR_TYPES;
        this.error_messages = ERROR_MESSAGES;
    }

    /**
     * Create and emit notification to admin users (excluding the actor)
     * @param {Object} room_data - Room information
     * @param {Object} admin_info - Admin who performed the action
     * @param {string} action - Action performed (create, update, delete)
     * @param {Object} transaction - Database transaction instance
     */
    async createAndEmitNotifications(room_data, admin_info, action, transaction) {
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

            const current_admin_id = admin_info?.user_id;
            const notification_recipients = admin_users.filter(user => 
                user.user_id !== current_admin_id
            );
            
            if (notification_recipients.length > 0) {
                // Create notification messages based on action
                const action_messages = {
                    create: {
                        title: 'Phòng thi mới được tạo',
                        message: `Phòng "${room_data.room_name}" (Sức chứa: ${room_data.capacity}) đã được tạo bởi ${admin_info?.full_name || 'admin khác'}.`
                    },
                    update: {
                        title: 'Phòng thi được cập nhật',
                        message: `Phòng "${room_data.room_name}" đã được cập nhật bởi ${admin_info?.full_name || 'admin khác'}.`
                    },
                    delete: {
                        title: 'Phòng thi bị xóa',
                        message: `Phòng "${room_data.room_name}" đã bị xóa bởi ${admin_info?.full_name || 'admin khác'}.`
                    }
                };

                const message_info = action_messages[action];

                // Create notifications in database for persistence
                const notifications_to_create = notification_recipients.map(user => ({
                    user_id: user.user_id,
                    title: message_info.title,
                    message: message_info.message,
                    type: 'room',
                    related_id: room_data.room_id,
                    related_type: 'room',
                    is_read: false
                }));

                const created_notifications = await Notification.bulkCreate(notifications_to_create, { transaction });

                // Emit real-time notifications to connected users (exclude the creator)
                notification_recipients.forEach((user, index) => {
                    const notification_data = {
                        notification_id: created_notifications[index].notification_id,
                        title: message_info.title,
                        message: message_info.message,
                        type: 'room',
                        resource_type: 'room',
                        resource_id: room_data.room_id,
                        is_read: false,
                        created_at: created_notifications[index].created_at,
                        metadata: {
                            name: room_data.room_name,
                            capacity: room_data.capacity,
                            building: room_data.building,
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

                console.log(`📨 Created and emitted ${created_notifications.length} notifications for room ${action}`);
            }

        } catch (error) {
            console.error(`❌ Error creating notifications for room ${action}:`, error);
            // Don't throw - notifications shouldn't break the main operation
        }
    }

    /**
     * Handle user joining room management interface
     * @param {Object} socket - Socket.io socket instance
     * @param {Object} data - Join request data
     */
    async handle_join_room_management(socket, data) {
        try {
            // Verify admin permission
            if (!requireAdminPermission(socket)) {
                return;
            }

            const room_name = 'room_management';
            socket.join(room_name);
            
            console.log(`👤 Admin ${socket.user?.full_name || socket.id} joined room management`);
            
            socket.emit('room_management_joined', {
                success: true,
                message: 'Đã tham gia quản lý phòng thời gian thực',
                room: room_name
            });

            // Send current room status to new participant
            await this.send_current_room_status(socket);

        } catch (error) {
            console.error('Error joining room management:', error);
            this.emit_error(socket, this.errors.DATABASE_ERROR, 'Lỗi tham gia quản lý phòng');
        }
    }

    /**
     * Handle user leaving room management interface
     * @param {Object} socket - Socket.io socket instance
     * @param {Object} data - Leave request data
     */
    handle_leave_room_management(socket, data) {
        try {
            const room_name = 'room_management';
            socket.leave(room_name);
            
            console.log(`👤 User ${socket.user?.full_name || socket.id} left room management`);
            
            socket.emit('room_management_left', {
                success: true,
                message: 'Đã rời khỏi quản lý phòng thời gian thực'
            });

        } catch (error) {
            console.error('Error leaving room management:', error);
            this.emit_error(socket, this.errors.DATABASE_ERROR, 'Lỗi rời khỏi quản lý phòng');
        }
    }

    /**
     * Handle room creation notification
     * @param {Object} socket - Socket.io socket instance
     * @param {Object} data - Created room data
     */
    async handle_room_created(socket, data) {
        // Start database transaction for notification consistency
        const transaction = await db.utility.sequelize.transaction();
        
        try {
            // 🔐 Authorization check - only admins can trigger room operations
            if (!requireAdminPermission(socket)) {
                await transaction.rollback();
                return;
            }

            // Handle different data formats
            let room_data;
            if (data && data.room_data) {
                // Format: { room_data: {...} }
                room_data = data.room_data;
            } else if (data && data.room_name) {
                // Format: { room_name: ..., capacity: ..., etc. } (direct room object)
                room_data = data;
            } else if (data) {
                // Try to use data directly
                room_data = data;
            } else {
                console.error('❌ Missing or invalid room data in handle_room_created:', data);
                await transaction.rollback();
                socket.emit(this.events.ERROR, {
                    success: false,
                    message: 'Dữ liệu phòng không hợp lệ',
                    error_type: this.errors.VALIDATION_ERROR
                });
                return;
            }
            
            // Validate room_data has required fields
            if (!room_data || !room_data.room_name) {
                console.error('❌ Missing room_name in room_data:', room_data);
                await transaction.rollback();
                socket.emit(this.events.ERROR, {
                    success: false,
                    message: 'Thiếu tên phòng',
                    error_type: this.errors.VALIDATION_ERROR
                });
                return;
            }

            const admin_info = data.admin_info || socket.user;
            console.log(`🏢 Room created: ${room_data.room_name} by admin ${admin_info?.user_id || socket.user?.user_id}`);

            // Emit table update for real-time UI updates to OTHER connected clients (exclude the creator)
            socket.broadcast.emit(this.events.TABLE_UPDATE, {
                action: 'create',
                room: room_data,
                timestamp: new Date().toISOString(),
                changed_by: admin_info
            });

            // Create and emit notifications within transaction
            await this.createAndEmitNotifications(
                room_data, 
                admin_info, 
                'create', 
                transaction
            );

            // Commit transaction
            await transaction.commit();

            console.log(`✅ Room creation notification flow completed for room: ${room_data.room_name}`);

        } catch (error) {
            await transaction.rollback();
            console.error('❌ Error handling room creation:', error);
            
            socket.emit(this.events.ERROR, {
                success: false,
                message: 'Lỗi hệ thống khi xử lý tạo phòng',
                error_type: this.errors.DATABASE_ERROR,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Handle room update notification
     * @param {Object} socket - Socket.io socket instance
     * @param {Object} data - Updated room data
     */
    async handle_room_updated(socket, data) {
        // Start database transaction for notification consistency
        const transaction = await db.utility.sequelize.transaction();
        
        try {
            // 🔐 Authorization check - only admins can trigger room operations
            if (!requireAdminPermission(socket)) {
                await transaction.rollback();
                return;
            }

            // Handle different data formats
            let room_data;
            if (data && data.room_data) {
                // Format: { room_data: {...} }
                room_data = data.room_data;
            } else if (data && data.room_name) {
                // Format: { room_name: ..., capacity: ..., etc. } (direct room object)
                room_data = data;
            } else if (data) {
                // Try to use data directly
                room_data = data;
            } else {
                console.error('❌ Missing or invalid room data in handle_room_updated:', data);
                await transaction.rollback();
                socket.emit(this.events.ERROR, {
                    success: false,
                    message: 'Dữ liệu phòng không hợp lệ',
                    error_type: this.errors.VALIDATION_ERROR
                });
                return;
            }
            
            // Validate room_data has required fields
            if (!room_data || !room_data.room_name) {
                console.error('❌ Missing room_name in room_data:', room_data);
                await transaction.rollback();
                socket.emit(this.events.ERROR, {
                    success: false,
                    message: 'Thiếu tên phòng',
                    error_type: this.errors.VALIDATION_ERROR
                });
                return;
            }

            const admin_info = data.admin_info || socket.user;
            console.log(`🏢 Room updated: ${room_data.room_name} by admin ${admin_info?.user_id || socket.user?.user_id}`);

            // Emit table update for real-time UI updates to OTHER connected clients (exclude the creator)
            socket.broadcast.emit(this.events.TABLE_UPDATE, {
                action: 'update',
                room: room_data,
                timestamp: new Date().toISOString(),
                changed_by: admin_info
            });

            // Create and emit notifications within transaction
            await this.createAndEmitNotifications(
                room_data, 
                admin_info, 
                'update', 
                transaction
            );

            // Check if exam status needs to be updated
            await this.check_and_update_room_exam_status(room_data.room_id);

            // Commit transaction
            await transaction.commit();

            console.log(`✅ Room update notification flow completed for room: ${room_data.room_name}`);

        } catch (error) {
            await transaction.rollback();
            console.error('❌ Error handling room update:', error);
            
            socket.emit(this.events.ERROR, {
                success: false,
                message: 'Lỗi hệ thống khi xử lý cập nhật phòng',
                error_type: this.errors.DATABASE_ERROR,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Handle room deletion notification
     * @param {Object} socket - Socket.io socket instance
     * @param {Object} data - Deleted room data
     */
    async handle_room_deleted(socket, data) {
        // Start database transaction for notification consistency
        const transaction = await db.utility.sequelize.transaction();
        
        try {
            // 🔐 Authorization check - only admins can trigger room operations
            if (!requireAdminPermission(socket)) {
                await transaction.rollback();
                return;
            }

            // Handle different data formats and normalize to consistent structure
            let room_data;
            if (data && data.room_data) {
                // Format: { room_data: {...} }
                room_data = data.room_data;
            } else if (data && data.room_name) {
                // Format: { room_name: ..., capacity: ..., etc. } (direct room object)
                room_data = data;
            } else if (data && data.deleted_room_name) {
                // Format: { deleted_room_id: '3', deleted_room_name: 'A1' } (deletion format)
                room_data = {
                    room_id: data.deleted_room_id,
                    room_name: data.deleted_room_name,
                    // Preserve original fields for reference
                    deleted_room_id: data.deleted_room_id,
                    deleted_room_name: data.deleted_room_name,
                    // Add default values for missing fields
                    capacity: data.capacity || 'Unknown',
                    building: data.building || 'Unknown'
                };
            } else if (data) {
                // Try to use data directly
                room_data = data;
            } else {
                console.error('❌ Missing or invalid room data in handle_room_deleted:', data);
                await transaction.rollback();
                socket.emit(this.events.ERROR, {
                    success: false,
                    message: 'Dữ liệu phòng không hợp lệ',
                    error_type: this.errors.VALIDATION_ERROR
                });
                return;
            }
            
            // Validate room_data has required fields (check both formats)
            if (!room_data || (!room_data.room_name && !room_data.deleted_room_name)) {
                console.error('❌ Missing room_name or deleted_room_name in room_data:', room_data);
                await transaction.rollback();
                socket.emit(this.events.ERROR, {
                    success: false,
                    message: 'Thiếu tên phòng',
                    error_type: this.errors.VALIDATION_ERROR
                });
                return;
            }

            // Ensure room_name is available for notification logic
            if (!room_data.room_name && room_data.deleted_room_name) {
                room_data.room_name = room_data.deleted_room_name;
            }

            const admin_info = data.admin_info || socket.user;
            console.log(`🏢 Room deleted: ${room_data.room_name} by admin ${admin_info?.user_id || socket.user?.user_id}`);

            // Emit table update for real-time UI updates to OTHER connected clients (exclude the creator)
            socket.broadcast.emit(this.events.TABLE_UPDATE, {
                action: 'delete',
                room: room_data,
                timestamp: new Date().toISOString(),
                changed_by: admin_info
            });

            // Create and emit notifications within transaction
            await this.createAndEmitNotifications(
                room_data, 
                admin_info, 
                'delete', 
                transaction
            );

            // Commit transaction
            await transaction.commit();

            console.log(`✅ Room deletion notification flow completed for room: ${room_data.room_name}`);

        } catch (error) {
            await transaction.rollback();
            console.error('❌ Error handling room deletion:', error);
            
            socket.emit(this.events.ERROR, {
                success: false,
                message: 'Lỗi hệ thống khi xử lý xóa phòng',
                error_type: this.errors.DATABASE_ERROR,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Handle room exam status change
     * @param {Object} socket - Socket.io socket instance
     * @param {Object} data - Room exam status data
     */
    async handle_room_exam_status_changed(socket, data) {
        try {
            const { room_id, status, exam_info } = data;

            console.log(`📊 Room ${room_id} exam status changed to: ${status}`);

            // Broadcast to all room management participants
            this.io.to('room_management').emit(this.events.EXAM_STATUS_CHANGE, {
                room_id: room_id,
                status: status,
                exam_info: exam_info,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error handling room exam status change:', error);
            this.emit_error(socket, this.errors.DATABASE_ERROR, 'Lỗi xử lý thay đổi trạng thái thi');
        }
    }

    /**
     * Handle request for room status update
     * @param {Object} socket - Socket.io socket instance
     * @param {Object} data - Request data
     */
    async handle_request_room_status_update(socket, data) {
        try {
            const { room_id } = data;

            if (room_id) {
                // Update specific room status
                await this.send_room_status_update(socket, room_id);
            } else {
                // Update all room statuses
                await this.send_current_room_status(socket);
            }

        } catch (error) {
            console.error('Error handling room status update request:', error);
            this.emit_error(socket, this.errors.DATABASE_ERROR, 'Lỗi cập nhật trạng thái phòng');
        }
    }

    /**
     * Send current room status to socket
     * @param {Object} socket - Socket.io socket instance
     */
    async send_current_room_status(socket) {
        try {
            const rooms = await Room.findAll({
                where: { is_active: true },
                order: [['room_name', 'ASC']]
            });

            const room_statuses = await Promise.all(
                rooms.map(async (room) => {
                    const exam_status = await this.getRoomExamStatus(room.room_id);
                    return {
                        room_id: room.room_id,
                        room_name: room.room_name,
                        exam_status: exam_status
                    };
                })
            );

            socket.emit(this.events.STATUS_UPDATE, {
                success: true,
                room_statuses: room_statuses,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error sending current room status:', error);
            this.emit_error(socket, this.errors.DATABASE_ERROR, 'Lỗi lấy trạng thái phòng hiện tại');
        }
    }

    /**
     * Send specific room status update
     * @param {Object} socket - Socket.io socket instance
     * @param {number} room_id - Room ID to update
     */
    async send_room_status_update(socket, room_id) {
        try {
            const exam_status = await this.getRoomExamStatus(room_id);

            socket.emit(this.events.STATUS_UPDATE, {
                success: true,
                room_id: room_id,
                exam_status: exam_status,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error sending room status update:', error);
            this.emit_error(socket, this.errors.DATABASE_ERROR, 'Lỗi cập nhật trạng thái phòng');
        }
    }

    /**
     * Check and update room exam status (called periodically)
     * @param {number} room_id - Room ID to check
     */
    async check_and_update_room_exam_status(room_id) {
        try {
            const exam_status = await this.getRoomExamStatus(room_id);

            // Broadcast status change to all connected clients
            this.io.to('room_management').emit(this.events.EXAM_STATUS_CHANGE, {
                room_id: room_id,
                status: exam_status.status,
                exam_info: exam_status.current_exam || exam_status.upcoming_exam,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error checking room exam status:', error);
        }
    }

    /**
     * Get room exam status (reuse from controller logic)
     * @param {number} room_id - Room ID to check
     * @returns {Promise<Object>} Exam status information
     */
    async getRoomExamStatus(room_id) {
        try {
            const now = new Date();

            // Check for current ongoing exam
            const current_exam = await Exam.findOne({
                where: {
                    room_id: room_id,
                    exam_date: {
                        [Op.eq]: db.utility.sequelize.fn('DATE', now)
                    },
                    start_time: {
                        [Op.lte]: now.toTimeString().slice(0, 8)
                    },
                    end_time: {
                        [Op.gte]: now.toTimeString().slice(0, 8)
                    },
                    status: {
                        [Op.in]: ['active', 'ongoing']
                    }
                },
                attributes: ['exam_id', 'title', 'start_time', 'end_time', 'exam_date']
            });

            if (current_exam) {
                return {
                    status: 'in_exam',
                    message: 'Đang thi',
                    current_exam: current_exam
                };
            }

            // Check for upcoming exam today
            const upcoming_exam = await Exam.findOne({
                where: {
                    room_id: room_id,
                    exam_date: {
                        [Op.gte]: db.utility.sequelize.fn('DATE', now)
                    },
                    status: {
                        [Op.in]: ['active', 'scheduled']
                    }
                },
                order: [['exam_date', 'ASC'], ['start_time', 'ASC']],
                attributes: ['exam_id', 'title', 'start_time', 'end_time', 'exam_date']
            });

            if (upcoming_exam) {
                return {
                    status: 'scheduled',
                    message: 'Có lịch thi',
                    upcoming_exam: upcoming_exam
                };
            }

            return {
                status: 'available',
                message: 'Sẵn sàng'
            };

        } catch (error) {
            console.error('Error getting room exam status:', error);
            return {
                status: 'unknown',
                message: 'Không xác định'
            };
        }
    }

    /**
     * Emit error to socket
     * @param {Object} socket - Socket.io socket instance
     * @param {string} error_type - Error type constant
     * @param {string} message - Error message
     */
    emit_error(socket, error_type, message) {
        socket.emit(this.events.ERROR, {
            success: false,
            error_type: error_type,
            message: message || this.error_messages[error_type] || 'Lỗi không xác định'
        });
    }
}

/**
 * Factory function to register room handlers
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} io - Socket.io server instance
 */
function register_room_handlers(socket, io_stream) {
    console.log(`🏢 Registering room handlers for socket ${socket.id}`);
    const handler = new RoomHandler(io_stream);

    // Event handlers for CRUD operations
    /**
     * 🧠 CRITICAL: Why we need .bind(handler)
     * 
     * When Socket.io calls our handler (like handle_room_created), JavaScript *loses* 
     * the connection to our RoomHandler instance ('this' becomes undefined).
     * 
     * .bind(handler) FIXES THIS by permanently locking 'this' to our handler instance,
     * so 'this.io' works correctly inside the method.
     * 
     * 🔥 Without .bind():
     *   - this.io → undefined (CRASH!)
     * 
     * ✅ With .bind(handler):
     *   - this.io → Our RoomHandler's io instance (WORKS!)
     * 
     * 📋 Note: We pass socket as second parameter for authorization checks
     */
    socket.on('room_created', (data) => handler.handle_room_created(socket, data));
    socket.on('room_updated', (data) => handler.handle_room_updated(socket, data));
    socket.on('room_deleted', (data) => handler.handle_room_deleted(socket, data));
    
    // Real-time status handlers
    socket.on('join_room_management', (data) => handler.handle_join_room_management(socket, data));
    socket.on('leave_room_management', (data) => handler.handle_leave_room_management(socket, data));
    socket.on('request_room_status_update', (data) => handler.handle_request_room_status_update(socket, data));
    
    // Exam status handlers
    socket.on('room_exam_status_changed', (data) => handler.handle_room_exam_status_changed(socket, data));
}

module.exports = {
    RoomHandler,
    register_room_handlers,
    ROOM_EVENTS,
    ERROR_TYPES
};
