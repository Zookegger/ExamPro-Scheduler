const { ENUM } = require('sequelize');
const db = require('../models');

/**
 * Schedule Management WebSocket Handlers
 * 
 * Handles real-time updates for student assignments, proctor assignments,
 * and live statistics for the schedule management system.
 */

/**
 * Get students who haven't registered for any exams
 * @returns {Promise<Array>} Array of unregistered students
 */
async function get_unregistered_students(exam_id) {
    // TODO: Replace with actual query
    const unregistered_students = await db.models.User.findAll({
        where: {
            user_role: 'student',
            user_id: {
                [db.Sequelize.Op.notIn]: db.Sequelize.literal(
                    `(SELECT student_id FROM registrations WHERE exam_id == ${exam_id})`
                )
            },
        }
    });
    
    return unregistered_students;
}

const get_mock_unassigned_proctors = () => [
    { proctor_id: 1, full_name: "GV. Phạm Văn D", email: "phamvand@example.com" },
    { proctor_id: 2, full_name: "GV. Lê Thị E", email: "lethie@example.com" }
];

/**
 * Register schedule-related WebSocket event handlers
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} io_stream - Socket.io server instance for broadcasting
 */
function register_schedule_handlers(socket, io_stream) {
    console.log('📅 Registering schedule handlers for socket ${socket.id}');

    // Handle request for live statistics
    socket.on('request_live_stats', () => {
        console.log(`📊 Client ${socket.id} requested live stats`);
        const stats_data = {
            unregistered_students: get_mock_unassigned_students(),
            unassigned_proctors: get_mock_unassigned_proctors(),
            timestamp: new Date().toISOString()
        };

        socket.emit('student_assignment_update', stats_data);
    });

    
    // TODO: Add more schedule handlers here
    socket.on('assign_student_to_exam', handle_student_assignment);
    socket.on('assign_proctor_to_exam', handle_proctor_assignment);

};

/**
 * Handle student assignment to exam
 * @param {Object} data - Assignment data from client
 * @param {number} data.student_id - ID of student to assign
 * @param {number} data.exam_id - ID of exam to assign to
 */
async function handle_student_assignment(data) {
    console.log(`👨‍🎓 Processing student assignment:`, data);
    
    try {
        // Step 1: Get exam details to find subject_code
        const exam = await db.models.Exam.findByPk(data.exam_id);
        if (!exam) {
            socket.emit('assignment_error', {
                success: false,
                message: 'Kỳ thi không tồn tại',
                error_type: 'exam_not_found'
            });
            return;
        }

        // Step 2: Check if student is enrolled in the subject 
        const enrollment = await db.models.Enrollment.findOne({
            where: {
                student_id: data.student_id,
                subject_code: exam.subject_code,
                status: 'enrolled'
            }
        });

        if (!enrollment) {
            socket.emit('assignment_error', {
                success: false,
                message: `Học sinh chưa đăng ký môn học ${exam.subject_code}`,
                error_type: 'not_enrolled_in_subject',
                student_id: data.student_id,
                subject_code: exam.subject_code
            });
            return;
        }

        // Step 3: Check for existing registration
        const existing_registration = await db.models.Registration.findOne({
            where: {
                student_id: data.student_id,
                exam_id: data.exam_id
            }
        });

        if (existing_registration) {
            console.log(`⚠️ Student ${data.student_id} already registered for exam ${data.exam_id}`);
            socket.emit('assignment_error', {
                success: false,
                message: 'Học sinh đã được đăng ký cho kỳ thi này',
                error_type: 'duplicate_registration',
                student_id: data.student_id,
                exam_id: data.exam_id
            });
            return;
        }

        // Step 4: Create registration
        await db.models.Registration.create({
            student_id: data.student_id,
            exam_id: data.exam_id,
            registration_status: 'approved'
        });

        // Step 5: Get updated stats and broadcast
        const updated_stats = {
            unregistered_students: await get_unregistered_students(data.exam_id),
            unassigned_proctors: get_mock_unassigned_proctors(),
            timestamp: new Date().toISOString()
        };

        io_stream.emit('student_assignment_update', updated_stats);
        
        // Step 6: Send success notification
        io_stream.emit('assignment_notification', {
            type: 'student_assigned',
            message: 'Học sinh đã được phân công thành công',
            student_id: data.student_id,
            exam_id: data.exam_id,
            subject_code: exam.subject_code,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Database error in student assignment:', error);
        socket.emit('assignment_error', {
            success: false,
            message: 'Lỗi hệ thống khi phân công học sinh',
            error_type: 'database_error'
        });
    }
};

module.exports = {
    register_schedule_handlers
};