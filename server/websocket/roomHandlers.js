/**
 * Room Management WebSocket Handlers - Real-time room updates
 * 
 * Handles real-time updates for room management including:
 * - Room CRUD    a    async handle_room_deleted(socket, data) {
        try {
            // Verify admin permission
            if (!requireAdminPermission(socket)) {
                return;
            }andle_room_updated(socket, data) {
        try {
            // Verify admin permission
            if (!requireAdminPermission(socket)) {
                return;
            }tions notifications
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
const { Room, Exam, User } = models;
const { requireAdminPermission } = require('./authorizationHandlers');

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
     * Register all room-related WebSocket event handlers
     * @param {Object} socket - Socket.io socket instance
     */
    register_room_handlers(socket) {
        console.log(`🏢 Registering room WebSocket handlers for socket ${socket.id}`);

        // Admin-only handlers
        socket.on('room_created', (data) => this.handle_room_created(socket, data));
        socket.on('room_updated', (data) => this.handle_room_updated(socket, data));
        socket.on('room_deleted', (data) => this.handle_room_deleted(socket, data));
        
        // Real-time status handlers
        socket.on('join_room_management', (data) => this.handle_join_room_management(socket, data));
        socket.on('leave_room_management', (data) => this.handle_leave_room_management(socket, data));
        socket.on('request_room_status_update', (data) => this.handle_request_room_status_update(socket, data));
        
        // Exam status handlers
        socket.on('room_exam_status_changed', (data) => this.handle_room_exam_status_changed(socket, data));
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
        try {
            // Verify admin permission
            if (!requireAdminPermission(socket)) {
                return;
            }

            const { room } = data;
            
            console.log(`🏢 Room created: ${room.room_name} by ${socket.user?.full_name}`);

            // Broadcast to all room management participants
            socket.to('room_management').emit(this.events.TABLE_UPDATE, {
                action: 'create',
                room: room,
                admin_info: socket.user
            });

            // Send notification to the creator
            socket.emit(this.events.NOTIFICATION, {
                success: true,
                type: 'success',
                message: `Phòng "${room.room_name}" đã được tạo thành công`
            });

        } catch (error) {
            console.error('Error handling room creation:', error);
            this.emit_error(socket, this.errors.DATABASE_ERROR, 'Lỗi xử lý tạo phòng');
        }
    }

    /**
     * Handle room update notification
     * @param {Object} socket - Socket.io socket instance
     * @param {Object} data - Updated room data
     */
    async handle_room_updated(socket, data) {
        try {
            // Verify admin permission
            if (!requireAdminPermission(socket)) {
                return;
            }

            const { room } = data;
            
            console.log(`🏢 Room updated: ${room.room_name} by ${socket.user?.full_name}`);

            // Broadcast to all room management participants
            socket.to('room_management').emit(this.events.TABLE_UPDATE, {
                action: 'update',
                room: room,
                admin_info: socket.user
            });

            // Send notification to the updater
            socket.emit(this.events.NOTIFICATION, {
                success: true,
                type: 'success',
                message: `Phòng "${room.room_name}" đã được cập nhật thành công`
            });

            // Check if exam status needs to be updated
            await this.check_and_update_room_exam_status(room.room_id);

        } catch (error) {
            console.error('Error handling room update:', error);
            this.emit_error(socket, this.errors.DATABASE_ERROR, 'Lỗi xử lý cập nhật phòng');
        }
    }

    /**
     * Handle room deletion notification
     * @param {Object} socket - Socket.io socket instance
     * @param {Object} data - Deleted room data
     */
    async handle_room_deleted(socket, data) {
        try {
            // Verify admin permission
            if (!requireAdminPermission(socket)) {
                return;
            }

            const { room } = data;
            
            console.log(`🏢 Room deleted: ${room.room_name} by ${socket.user?.full_name}`);

            // Broadcast to all room management participants
            socket.to('room_management').emit(this.events.TABLE_UPDATE, {
                action: 'delete',
                room: room,
                admin_info: socket.user
            });

            // Send notification to the deleter
            socket.emit(this.events.NOTIFICATION, {
                success: true,
                type: 'warning',
                message: `Phòng "${room.room_name}" đã được xóa thành công`
            });

        } catch (error) {
            console.error('Error handling room deletion:', error);
            this.emit_error(socket, this.errors.DATABASE_ERROR, 'Lỗi xử lý xóa phòng');
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
                    const exam_status = await this.get_room_exam_status(room.room_id);
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
            const exam_status = await this.get_room_exam_status(room_id);

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
            const exam_status = await this.get_room_exam_status(room_id);

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
    async get_room_exam_status(room_id) {
        try {
            const now = new Date();

            // Check for current ongoing exam
            const current_exam = await Exam.findOne({
                where: {
                    room_id: room_id,
                    exam_date: {
                        [sequelize.Sequelize.Op.eq]: sequelize.Sequelize.fn('DATE', now)
                    },
                    start_time: {
                        [sequelize.Sequelize.Op.lte]: now.toTimeString().slice(0, 8)
                    },
                    end_time: {
                        [sequelize.Sequelize.Op.gte]: now.toTimeString().slice(0, 8)
                    },
                    status: {
                        [sequelize.Sequelize.Op.in]: ['active', 'ongoing']
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
                        [sequelize.Sequelize.Op.gte]: sequelize.Sequelize.fn('DATE', now)
                    },
                    status: {
                        [sequelize.Sequelize.Op.in]: ['active', 'scheduled']
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
function register_room_handlers(socket, io) {
    const room_handler = new RoomHandler(io);
    room_handler.register_room_handlers(socket);
}

module.exports = {
    RoomHandler,
    register_room_handlers,
    ROOM_EVENTS,
    ERROR_TYPES
};
