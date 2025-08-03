const { Exam, Registration, Room, User, Subject, ExamProctor } = require('../models/index');
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
                page = 1, limit = 10
            } = req.query;

            // Calculate pagination
            const offset = (page - 1) * limit;

            // Build query
            const query_options = {
                include: [
                    {
                        model: Room,
                        as: 'room',
                        attributes: ['room_id', 'room_name', 'capacity']
                    },
                    {
                        model: Subject,
                        as: 'subject',
                        attributes: ['subject_name']
                    }
                ],
                limit: parseInt(limit),
                offset: offset,
                order: [['exam_date', 'ASC'], ['start_time', 'ASC']],
                where: {}
            };

            // Add filters if provided
            if (status) query_options.where.status = status;
            if (subject_code) query_options.where.subject_code = subject_code;
            if (room_id) query_options.where.room_id = room_id;
            if (proctor_id) query_options.where.proctor_id = proctor_id;
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
            })

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
    }
}

module.exports = exam_controller;