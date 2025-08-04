const { models } = require('../models/index');
const { Exam, Registration, Room, User, Subject, ExamProctor } = models;
const { Op } = require('sequelize');

/**  
 * Exam Controller
 *
 * Manages all operations related to exams including:
 * - Creating, reading, updating and deleting exams
 * - Managing exam status transitions
 * - Retrieving exams with filters
 */
const exam_controller = {
    /**
     * Get all exams with optional filtering
     * 
     * @param {Object} req - Request with query parameters
     * @param {Object} res - Response object
     * @returns {Object} JSON response with exams
     */
    getAllExams: async (req, res) => {
        try {
            // Extract query parameters
            const {
                status, subject_code, upcoming, room_id, proctor_id,
                page = 1, limit = 50
            } = req.query;

            // Calculate pagination
            const offset = (page - 1) * limit;

            // Build query
            const query_options = {
                include: [
                    {
                        model: Room,
                        as: 'room',
                        attributes: ['room_id', 'room_name', 'capacity'],
                        required: false
                    },
                    {
                        model: Subject,
                        as: 'subject',
                        attributes: ['subject_name'],
                        required: false
                    }
                ],
                limit: parseInt(limit),
                offset: offset,
                order: [['exam_date', 'ASC'], ['start_time', 'ASC']],
                where: {}
            };

            // Add filters if provided
            if (status && status !== 'all') query_options.where.status = status;
            if (subject_code && subject_code !== 'all') query_options.where.subject_code = subject_code;
            if (room_id && room_id !== 'all') query_options.where.room_id = room_id;
            if (proctor_id && proctor_id !== 'all') query_options.where.proctor_id = proctor_id;
            if (upcoming === 'true') query_options.where.exam_date = { [Op.gte]: new Date().toISOString().split('T')[0] };
            
            // Get total count for pagination
            const total_count = await Exam.count({
                where: query_options.where
            });

            // Execute main query
            const exams = await Exam.findAll(query_options);

            const formatted_exams = exams.map(exam => {
                const plain_exam = exam.get({ plain: true });

                // Format date for easier frontend handling
                plain_exam.formatted_date = new Date(plain_exam.exam_date).toLocaleDateString('vi-VN');

                return plain_exam;
            });

            res.json({
                success: true,
                count: exams.length,
                total: total_count,
                page: parseInt(page),
                total_pages: Math.ceil(total_count / limit),
                data: formatted_exams
            });
        } catch (error) {
            console.error('Error getting exams: ', error);
            res.status(500).json({
                success: false,
                message: 'Không thể lấy danh sách kỳ thi',
                error: error.message
            });
        }
    },

    /**
     * Create a new exam
     * 
     * @param {Object} req - Request with exam data in body
     * @param {Object} res - Response object
     * @returns {Object} JSON response with created exam
     */
    createExam: async (req, res) => {
        try {
            const {
                title,
                subject_code,
                description,
                exam_date,
                start_time,
                end_time,
                duration_minutes,
                max_students,
                room_id,
                method,
                status,
                grade_level,
                class_id
            } = req.body;

            // Validation
            if (!title || !subject_code || !exam_date || !start_time || !end_time || !duration_minutes || !method) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc'
                });
            }

            // Check if room is available if room_id is provided and not empty
            if (room_id && room_id.toString().trim() !== '') {
                const room_availability = await checkRoomAvailability(room_id, exam_date, start_time, end_time);
                if (!room_availability.available) {
                    return res.status(409).json({
                        success: false,
                        message: `Phòng ${room_availability.room_name} đã được sử dụng trong thời gian này`
                    });
                }
            }

            // Create the exam
            const new_exam = await Exam.create({
                title,
                subject_code,
                description,
                exam_date,
                start_time,
                end_time,
                duration_minutes: parseInt(duration_minutes),
                max_students: parseInt(max_students) || 20,
                room_id: (room_id && room_id.toString().trim() !== '') ? room_id : null,
                method,
                status: status || 'draft',
                grade_level: grade_level || null,
                class_id: class_id || null
            });

            // Fetch the created exam with associations
            const created_exam = await Exam.findByPk(new_exam.exam_id, {
                include: [
                    {
                        model: Room,
                        as: 'room',
                        attributes: ['room_id', 'room_name', 'capacity'],
                        required: false
                    },
                    {
                        model: Subject,
                        as: 'subject',
                        attributes: ['subject_name'],
                        required: false
                    }
                ]
            });

            res.status(201).json({
                success: true,
                message: 'Tạo kỳ thi thành công',
                data: created_exam
            });

        } catch (error) {
            console.error('Error creating exam:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể tạo kỳ thi',
                error: error.message
            });
        }
    },

    /**
     * Update an existing exam
     * 
     * @param {Object} req - Request with exam_id in params and update data in body
     * @param {Object} res - Response object
     * @returns {Object} JSON response with updated exam
     */
    updateExam: async (req, res) => {
        try {
            const { exam_id } = req.params;
            const {
                title,
                subject_code,
                description,
                exam_date,
                start_time,
                end_time,
                duration_minutes,
                max_students,
                room_id,
                method,
                status,
                grade_level,
                class_id
            } = req.body;

            // Check if exam exists
            const exam = await Exam.findByPk(exam_id);
            if (!exam) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy kỳ thi'
                });
            }

            // Check if room is available if room_id is being changed and not empty
            if (room_id && room_id.toString().trim() !== '' && room_id !== exam.room_id) {
                const room_availability = await checkRoomAvailability(room_id, exam_date || exam.exam_date, start_time || exam.start_time, end_time || exam.end_time, exam_id);
                if (!room_availability.available) {
                    return res.status(409).json({
                        success: false,
                        message: `Phòng ${room_availability.room_name} đã được sử dụng trong thời gian này`
                    });
                }
            }

            // Update the exam
            await exam.update({
                title: title || exam.title,
                subject_code: subject_code || exam.subject_code,
                description: description !== undefined ? description : exam.description,
                exam_date: exam_date || exam.exam_date,
                start_time: start_time || exam.start_time,
                end_time: end_time || exam.end_time,
                duration_minutes: duration_minutes ? parseInt(duration_minutes) : exam.duration_minutes,
                max_students: max_students ? parseInt(max_students) : exam.max_students,
                room_id: room_id !== undefined ? ((room_id && room_id.toString().trim() !== '') ? room_id : null) : exam.room_id,
                method: method || exam.method,
                status: status || exam.status,
                grade_level: grade_level !== undefined ? grade_level : exam.grade_level,
                class_id: class_id !== undefined ? class_id : exam.class_id
            });

            // Fetch the updated exam with associations
            const updated_exam = await Exam.findByPk(exam_id, {
                include: [
                    {
                        model: Room,
                        as: 'room',
                        attributes: ['room_id', 'room_name', 'capacity'],
                        required: false
                    },
                    {
                        model: Subject,
                        as: 'subject',
                        attributes: ['subject_name'],
                        required: false
                    }
                ]
            });

            res.json({
                success: true,
                message: 'Cập nhật kỳ thi thành công',
                data: updated_exam
            });

        } catch (error) {
            console.error('Error updating exam:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể cập nhật kỳ thi',
                error: error.message
            });
        }
    },

    /**
     * Delete an exam
     * 
     * @param {Object} req - Request with exam_id in params
     * @param {Object} res - Response object
     * @returns {Object} JSON response confirming deletion
     */
    deleteExam: async (req, res) => {
        try {
            const { exam_id } = req.params;

            // Check if exam exists
            const exam = await Exam.findByPk(exam_id);
            if (!exam) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy kỳ thi'
                });
            }

            // Check if exam has registrations
            const registration_count = await Registration.count({
                where: { exam_id }
            });

            if (registration_count > 0) {
                return res.status(409).json({
                    success: false,
                    message: `Không thể xóa kỳ thi đã có ${registration_count} học sinh đăng ký`
                });
            }

            // Delete the exam
            await exam.destroy();

            res.json({
                success: true,
                message: 'Xóa kỳ thi thành công'
            });

        } catch (error) {
            console.error('Error deleting exam:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể xóa kỳ thi',
                error: error.message
            });
        }
    },

    /**
     * Get a single exam by ID
     * 
     * @param {Object} req - Request with exam_id in params
     * @param {Object} res - Response object
     * @returns {Object} JSON response with exam details
     */
    getExamById: async (req, res) => {
        try {
            const { exam_id } = req.params;

            const exam = await Exam.findByPk(exam_id, {
                include: [
                    {
                        model: Room,
                        as: 'room',
                        attributes: ['room_id', 'room_name', 'capacity', 'building'],
                        required: false
                    },
                    {
                        model: Subject,
                        as: 'subject',
                        attributes: ['subject_name'],
                        required: false
                    }
                ]
            });

            if (!exam) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy kỳ thi'
                });
            }

            // Get registration count
            const registration_count = await Registration.count({
                where: { exam_id }
            });

            const exam_data = exam.get({ plain: true });
            exam_data.registration_count = registration_count;
            exam_data.formatted_date = new Date(exam_data.exam_date).toLocaleDateString('vi-VN');

            res.json({
                success: true,
                data: exam_data
            });

        } catch (error) {
            console.error('Error getting exam:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể lấy thông tin kỳ thi',
                error: error.message
            });
        }
    }
};

/**
 * Helper function to check room availability
 * 
 * @param {number} room_id - Room ID to check
 * @param {string} exam_date - Date of the exam
 * @param {string} start_time - Start time
 * @param {string} end_time - End time
 * @param {number} exclude_exam_id - Exam ID to exclude from conflict check
 * @returns {Object} Availability status and room info
 */
async function checkRoomAvailability(room_id, exam_date, start_time, end_time, exclude_exam_id = null) {
    try {
        // Get room info
        const room = await Room.findByPk(room_id);
        if (!room) {
            return { available: false, room_name: 'Unknown Room' };
        }

        // Check for conflicting exams
        const where_clause = {
            room_id,
            exam_date,
            [Op.or]: [
                {
                    start_time: {
                        [Op.between]: [start_time, end_time]
                    }
                },
                {
                    end_time: {
                        [Op.between]: [start_time, end_time]
                    }
                },
                {
                    [Op.and]: [
                        { start_time: { [Op.lte]: start_time } },
                        { end_time: { [Op.gte]: end_time } }
                    ]
                }
            ]
        };

        // Exclude current exam if updating
        if (exclude_exam_id) {
            where_clause.exam_id = { [Op.ne]: exclude_exam_id };
        }

        const conflicting_exam = await Exam.findOne({
            where: where_clause
        });

        return {
            available: !conflicting_exam,
            room_name: room.room_name,
            conflicting_exam: conflicting_exam ? conflicting_exam.title : null
        };

    } catch (error) {
        console.error('Error checking room availability:', error);
        return { available: false, room_name: 'Error checking availability' };
    }
}

module.exports = exam_controller;