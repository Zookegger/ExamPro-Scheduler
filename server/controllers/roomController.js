const db = require('../models');
const { Op } = require('sequelize');
const { notifyAdmins } = require('../services/notificationService');

const RESOURCE_TYPE = 'room';

// Error messages for consistent responses
const ERROR_MESSAGES = {
    PERMISSION_DENIED: 'Bạn không có quyền truy cập tài nguyên này',
    ROOM_NOT_FOUND: 'Không tìm thấy phòng',
    ROOM_IN_USE: 'Không thể xóa phòng đang được sử dụng',
    INVALID_DATA: 'Dữ liệu không hợp lệ'
};

// WebSocket instance for real-time updates
let websocket_io = null;

/**
 * Set WebSocket instance for real-time room updates
 * @param {Object} io - Socket.io instance
 */
function set_websocket_io(io) {
    websocket_io = io;
    console.log('🔌 WebSocket connected to room controller');
}

/**
 * Reusable helper function to notify admins about resource changes
 * @param {string} action - 'created', 'updated', 'deleted'
 * @param {object} resource_data - Room information
 * @param {object} current_user - User who performed the action
 */
async function notifyAdminsAboutRoom(action, resource_data, current_user) {
    try {
        await notifyAdmins(RESOURCE_TYPE, action, resource_data, current_user);
    } catch (error) {
        console.error(`❌ Error notifying admins about subject ${action}:`, error);
    }
}

/**
 * Emit room table update to connected clients
 * @param {string} action - Action performed (create, update, delete)
 * @param {Object} room - Room data
 * @param {Object} admin_info - Admin who performed the action
 */
function emit_room_table_update(action, room, admin_info = null) {
    if (websocket_io) {
        console.log(`📡 Emitting room_table_update - action: ${action}, room: ${room.room_name}`);
        websocket_io.to('room_management').emit('room_table_update', {
            action: action,
            room: room.data,
            admin_info: admin_info,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Emit room exam status change to connected clients
 * @param {number} room_id - Room ID
 * @param {Object} status_info - Status information
 */
function emit_room_exam_status_change(room_id, status_info) {
    if (websocket_io) {
        console.log(`📊 Emitting room exam status change for room ${room_id}: ${status_info.status}`);
        websocket_io.to('room_management').emit('room_exam_status_change', {
            room_id: room_id,
            status: status_info.status,
            exam_info: status_info.current_exam || status_info.upcoming_exam,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Room Controller
 * 
 * Handles CRUD operations for exam rooms/classrooms in the system.
 * All operations require admin authentication via middleware.
 * 
 * @fileoverview Room management controller for ExamPro Scheduler
 */

/**
 * Get current exam status for a room
 * 
 * Determines if a room is currently being used for an exam based on
 * exam schedule and status. Returns detailed exam information if active.
 * 
 * @async
 * @function getRoomExamStatus
 * @param {number} room_id - ID of the room to check
 * @returns {Promise<Object>} Room exam status information
 * @returns {string} returns.status - 'available', 'in_exam', 'scheduled'
 * @returns {Object} [returns.current_exam] - Current exam details if active
 * @returns {Array} [returns.upcoming_exams] - Upcoming exams in the next 24 hours
 * 
 * @example
 * const status = await getRoomExamStatus(1);
 * // Returns:
 * {
 *   status: 'in_exam',
 *   current_exam: {
 *     exam_id: 123,
 *     title: 'Kỳ thi Toán học',
 *     start_time: '09:00:00',
 *     end_time: '11:00:00',
 *     subject_code: 'MATH101'
 *   },
 *   upcoming_exams: []
 * }
 */
async function getRoomExamStatus(room_id) {
    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        const current_time = now.toTimeString().split(' ')[0]; // HH:MM:SS format
        
        // Check for currently active exam (in_progress status)
        const current_exam = await db.models.Exam.findOne({
            where: {
                room_id: room_id,
                status: 'in_progress',
                exam_date: today
            },
            attributes: ['exam_id', 'title', 'subject_code', 'start_time', 'end_time', 'status']
        });
        
        if (current_exam) {
            return {
                status: 'in_exam',
                current_exam: current_exam,
                status_text: 'Đang thi',
                status_class: 'bg-warning text-dark'
            };
        }
        
        // Check for published exams happening right now (by time)
        const ongoing_exam = await db.models.Exam.findOne({
            where: {
                room_id: room_id,
                status: 'published',
                exam_date: today,
                start_time: { [Op.lte]: current_time },
                end_time: { [Op.gte]: current_time }
            },
            attributes: ['exam_id', 'title', 'subject_code', 'start_time', 'end_time', 'status']
        });
        
        if (ongoing_exam) {
            return {
                status: 'in_exam',
                current_exam: ongoing_exam,
                status_text: 'Đang thi',
                status_class: 'bg-warning text-dark'
            };
        }
        
        // Check for upcoming exams in the next 24 hours
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrow_date = tomorrow.toISOString().split('T')[0];
        
        const upcoming_exams = await db.models.Exam.findAll({
            where: {
                room_id: room_id,
                status: { [Op.in]: ['published', 'in_progress'] },
                [Op.or]: [
                    {
                        exam_date: today,
                        start_time: { [Op.gt]: current_time }
                    },
                    {
                        exam_date: tomorrow_date
                    }
                ]
            },
            order: [['exam_date', 'ASC'], ['start_time', 'ASC']],
            limit: 3,
            attributes: ['exam_id', 'title', 'subject_code', 'exam_date', 'start_time', 'end_time']
        });
        
        if (upcoming_exams.length > 0) {
            return {
                status: 'scheduled',
                upcoming_exams: upcoming_exams,
                status_text: 'Có lịch thi',
                status_class: 'bg-info text-dark'
            };
        }
        
        // Room is available
        return {
            status: 'available',
            status_text: 'Sẵn sàng',
            status_class: 'bg-success'
        };
        
    } catch (error) {
        console.error('❌ Error getting room exam status:', error);
        return {
            status: 'unknown',
            status_text: 'Không xác định',
            status_class: 'bg-secondary'
        };
    }
}

/**
 * Get all rooms with optional filtering
 * 
 * Retrieves all exam rooms from the database with support for filtering
 * by building, status, capacity, and computer availability.
 * 
 * @async
 * @function getAllRooms
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters for filtering
 * @param {string} [req.query.building] - Filter by building name
 * @param {string} [req.query.is_active] - Filter by active status ('true'/'false')
 * @param {string} [req.query.min_capacity] - Filter by minimum capacity
 * @param {string} [req.query.has_computers] - Filter by computer availability ('true'/'false')
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with room list
 * 
 * @example
 * // GET /api/rooms/get-all-rooms?building=Tòa nhà A&is_active=true
 * {
 *   "success": true,
 *   "rooms": [
 *     {
 *       "room_id": 1,
 *       "room_name": "Phòng A1",
 *       "building": "Tòa nhà A",
 *       "floor": 1,
 *       "capacity": 40,
 *       "has_computers": true,
 *       "features": "Máy chiếu, Điều hòa, Wifi",
 *       "is_active": true,
 *       "created_at": "2024-01-01T00:00:00Z",
 *       "updated_at": "2024-01-01T00:00:00Z"
 *     }
 *   ],
 *   "message": "Rooms retrieved successfully"
 * }
 */
async function getAllRooms(req, res) {
    try {
        console.log('📋 Getting all rooms with filters:', req.query);
        
        // Build filter conditions from query parameters
        const where_conditions = {};
        
        if (req.query.building) {
            where_conditions.building = req.query.building;
        }
        
        if (req.query.is_active !== undefined) {
            where_conditions.is_active = req.query.is_active === 'true';
        }
        
        if (req.query.min_capacity) {
            where_conditions.capacity = {
                [Op.gte]: parseInt(req.query.min_capacity)
            };
        }
        
        if (req.query.has_computers !== undefined) {
            where_conditions.has_computers = req.query.has_computers === 'true';
        }
        
        const rooms = await db.models.Room.findAll({
            where: where_conditions,
            order: [['building', 'ASC'], ['floor', 'ASC'], ['room_name', 'ASC']],
            attributes: {
                exclude: [] // Include all fields
            }
        });
        
        // Add exam status to each room
        const rooms_with_status = await Promise.all(
            rooms.map(async (room) => {
                const exam_status = await getRoomExamStatus(room.room_id);
                return {
                    ...room.toJSON(),
                    exam_status: exam_status
                };
            })
        );
        
        console.log(`✅ Found ${rooms.length} rooms with exam status`);
        
        res.json({
            success: true,
            rooms: rooms_with_status,
            message: 'Rooms retrieved successfully'
        });
        
    } catch (error) {
        console.error('❌ Error getting rooms:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách phòng',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

/**
 * Create a new room
 * 
 * Creates a new exam room in the database. Validates required fields
 * and ensures room names are unique within the same building.
 * 
 * @async
 * @function createRoom
 * @param {Object} req - Express request object
 * @param {Object} req.body - Room data
 * @param {string} req.body.room_name - Room name/number (required)
 * @param {string} [req.body.building] - Building name
 * @param {number} [req.body.floor=1] - Floor number
 * @param {number} req.body.capacity - Maximum capacity (required)
 * @param {boolean} [req.body.has_computers=false] - Computer availability
 * @param {string} [req.body.features] - Room features description
 * @param {boolean} [req.body.is_active=true] - Room status
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with created room
 * 
 * @example
 * // POST /api/rooms/create-room
 * // Request body:
 * {
 *   "room_name": "Phòng A1",
 *   "building": "Tòa nhà A", 
 *   "floor": 1,
 *   "capacity": 40,
 *   "has_computers": true,
 *   "features": "Máy chiếu, Điều hòa, Wifi"
 * }
 * 
 * // Response:
 * {
 *   "success": true,
 *   "room": { ...created room data... },
 *   "message": "Phòng đã được tạo thành công"
 * }
 */
async function createRoom(req, res, next) {
    const transaction = await db.utility.sequelize.transaction();
    
    try {
        console.log('🏗️ Creating new room:', req.body);
        
        const {
            room_name,
            building,
            floor = 1,
            capacity,
            has_computers = false,
            features,
            is_active = true
        } = req.body;
        
        // Validate required fields
        if (!room_name || !capacity) {
            return res.status(400).json({
                success: false,
                message: 'Tên phòng và sức chứa là bắt buộc'
            });
        }
        
        // Validate capacity is positive
        if (capacity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Sức chứa phải lớn hơn 0'
            });
        }
        
        // Check for duplicate room name in the same building
        if (building) {
            const existing_room = await db.models.Room.findOne({
                where: {
                    room_name: room_name,
                    building: building
                }
            });
            
            if (existing_room) {
                return res.status(409).json({
                    success: false,
                    message: `Phòng "${room_name}" đã tồn tại trong ${building}`
                });
            }
        }
        
        // Create the room
        const new_room = await db.models.Room.create({
            room_name,
            building,
            floor,
            capacity: parseInt(capacity),
            has_computers,
            features,
            is_active
        }, { transaction });
        
        await transaction.commit();
        
        await notifyAdminsAboutRoom('created', new_room, req.user);
        
        console.log('✅ Room created successfully:', new_room.room_id);
        
        // Emit real-time update to connected clients via WebSocket handlers
        if (websocket_io) {
            websocket_io.to('room_management').emit('room_table_update', {
                action: 'create',
                room: new_room,
                admin_info: req.user,
                timestamp: new Date().toISOString()
            });
        }
        
        res.status(201).json({
            success: true,
            room: new_room,
            message: 'Phòng đã được tạo thành công'
        });
        
    } catch (error) {
        await transaction.rollback();
        console.error('❌ Error creating room:', error);
        
        // Handle Sequelize validation errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu phòng không hợp lệ',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Validation failed'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo phòng mới',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
        
        next(error);
    }
}

/**
 * Update an existing room
 * 
 * Updates room information. Allows partial updates and validates
 * that room names remain unique within buildings.
 * 
 * @async
 * @function updateRoom
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.room_id - ID of room to update
 * @param {Object} req.body - Updated room data (partial)
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with updated room
 * 
 * @example
 * // PUT /api/rooms/update-room/1
 * // Request body:
 * {
 *   "capacity": 45,
 *   "features": "Máy chiếu, Điều hòa, Wifi, Bảng thông minh"
 * }
 * 
 * // Response:
 * {
 *   "success": true,
 *   "room": { ...updated room data... },
 *   "message": "Phòng đã được cập nhật thành công"
 * }
 */
async function updateRoom(req, res, next) {
    try {
        const { room_id } = req.params;
        console.log('✏️ Updating room:', room_id, 'with data:', req.body);
        
        // Find the room to update
        const room = await db.models.Room.findByPk(room_id);
        
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng'
            });
        }
        
        const {
            room_name,
            building,
            floor,
            capacity,
            has_computers,
            features,
            is_active
        } = req.body;
        
        // Validate capacity if provided
        if (capacity !== undefined && capacity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Sức chứa phải lớn hơn 0'
            });
        }
        
        // Check for duplicate room name in building (if name or building is being changed)
        if ((room_name && room_name !== room.room_name) || 
            (building && building !== room.building)) {
            
            const final_room_name = room_name || room.room_name;
            const final_building = building || room.building;
            
            if (final_building) {
                const existing_room = await db.models.Room.findOne({
                    where: {
                        room_name: final_room_name,
                        building: final_building,
                        room_id: { [Op.ne]: room_id } // Exclude current room
                    }
                });
                
                if (existing_room) {
                    return res.status(409).json({
                        success: false,
                        message: `Phòng "${final_room_name}" đã tồn tại trong ${final_building}`
                    });
                }
            }
        }
        
        // Update the room
        const updated_room = await room.update({
            ...(room_name !== undefined && { room_name }),
            ...(building !== undefined && { building }),
            ...(floor !== undefined && { floor }),
            ...(capacity !== undefined && { capacity: parseInt(capacity) }),
            ...(has_computers !== undefined && { has_computers }),
            ...(features !== undefined && { features }),
            ...(is_active !== undefined && { is_active })
        });
        
        console.log('✅ Room updated successfully:', room_id);
        
        await notifyAdminsAboutRoom('updated', updated_room, req.user);
        
        // Emit real-time update to connected clients via WebSocket handlers
        if (websocket_io) {
            websocket_io.to('room_management').emit('room_table_update', {
                action: 'update',
                room: updated_room,
                admin_info: req.user,
                timestamp: new Date().toISOString()
            });
        }
        
        // Check and emit exam status change if needed
        const exam_status = await getRoomExamStatus(room_id);
        emit_room_exam_status_change(room_id, exam_status);
        
        res.json({
            success: true,
            room: updated_room,
            message: 'Phòng đã được cập nhật thành công'
        });
        
    } catch (error) {
        console.error('❌ Error updating room:', error);
        
        // Handle Sequelize validation errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu phòng không hợp lệ',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Validation failed'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật phòng',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });

        next(error);
    }
}

/**
 * Delete a room
 * 
 * Removes a room from the database. Performs safety checks to ensure
 * the room is not currently assigned to any active exams.
 * 
 * @async
 * @function deleteRoom
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.room_id - ID of room to delete
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with deletion result
 * 
 * @example
 * // DELETE /api/rooms/delete-room/5
 * // Response:
 * {
 *   "success": true,
 *   "message": "Phòng đã được xóa thành công"
 * }
 */
async function deleteRoom(req, res, next) {
    const transaction = await db.utility.sequelize.transaction();

    try {
        if (req.user.user_role !== 'admin') {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: ERROR_MESSAGES.PERMISSION_DENIED
            });
        }

        const { room_id } = req.params;
        console.log('🗑️ Deleting room:', room_id);
        
        // Find the room to delete
        const room = await db.models.Room.findByPk(room_id);
        
        if (!room) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng'
            });
        }
        
        // Safety check for active exams using this room
        const exam_status = await getRoomExamStatus(room_id);
        
        if (exam_status.status === 'in_exam') {
            await transaction.rollback();

            return res.status(400).json({
                success: false,
                message: `Không thể xóa phòng đang thi. Kỳ thi "${exam_status.current_exam.title}" đang diễn ra.`
            });
        }
        
        // Additional check for any future scheduled exams
        const future_exams = await db.models.Exam.findAll({
            where: {
                room_id: room_id,
                status: { [Op.in]: ['published', 'in_progress'] },
                [Op.or]: [
                    {
                        exam_date: { [Op.gte]: new Date().toISOString().split('T')[0] }
                    }
                ]
            },
            limit: 1
        });
        
        if (future_exams.length > 0) {
            await transaction.rollback();

            return res.status(400).json({
                success: false,
                message: 'Không thể xóa phòng có lịch thi trong tương lai. Vui lòng hủy hoặc chuyển các kỳ thi trước.'
            });
        }
        
        // Store room data before deletion for WebSocket emission
        const deleted_room_data = { ...room.dataValues };
        const room_name = room.room_name;

        // Delete the room
        await room.destroy({ transaction });
        await transaction.commit();
        
        await notifyAdminsAboutRoom('deleted', deleted_room_data.room_name, req.user);
        
        console.log('✅ Room deleted successfully:', room_name, ' - ', room_id);
        
        // Emit real-time update to connected clients via WebSocket handlers
        if (websocket_io) {
            websocket_io.to('room_management').emit('room_table_update', {
                action: 'delete',
                room: deleted_room_data,
                admin_info: req.user,
                timestamp: new Date().toISOString()
            });
        }
        
        res.json({
            success: true,
            message: 'Phòng đã được xóa thành công',
            data: {
                deleted_room_id: room_id,
                deleted_room_name: room_name
            }
        });
        
    } catch (error) {
        await transaction.rollback();
        console.error('❌ Error deleting room:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa phòng',
            error: error.message
        });
        next(error);        
    }
}

module.exports = {
    getAllRooms,
    getRoomExamStatus,
    createRoom,
    updateRoom,
    deleteRoom,
    set_websocket_io,
    emit_room_table_update,
    emit_room_exam_status_change
};
