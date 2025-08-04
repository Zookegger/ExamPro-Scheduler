const { models } = require('../models/index');
const { Exam, Registration, Room, User, Subject, ExamProctor } = models;
const { Op } = require('sequelize');

/**
 * Schedule Controller
 * 
 * Manages scheduling operations including:
 * - Student assignment to exams
 * - Proctor assignment to exams 
 * - Schedule overview and conflict detection
 * - Bulk operations for efficient scheduling
 */
const schedule_controller = {
    /**
     * Get comprehensive schedule overview
     * 
     * @param {Object} req - Request with query parameters
     * @param {Object} res - Response object
     * @returns {Object} JSON response with schedule data
     */
    getScheduleOverview: async (req, res) => {
        try {
            const {
                start_date,
                end_date,
                room_id,
                subject_code,
                include_stats = 'true'
            } = req.query;

            // Build date filter with better logic
            const date_filter = {};
            if (start_date && start_date.trim() !== '') {
                date_filter[Op.gte] = start_date;
            }
            if (end_date && end_date.trim() !== '') {
                date_filter[Op.lte] = end_date;
            }

            // Build where clause
            const where_clause = {};
            if (Object.keys(date_filter).length > 0) {
                where_clause.exam_date = date_filter;
            }
            if (room_id && room_id !== 'all' && room_id.trim() !== '') {
                where_clause.room_id = parseInt(room_id);
            }
            if (subject_code && subject_code !== 'all' && subject_code.trim() !== '') {
                where_clause.subject_code = subject_code;
            }

            console.log('🔍 Schedule filter where clause:', JSON.stringify(where_clause, null, 2));

            // Get exams with associations
            const exams = await Exam.findAll({
                where: where_clause,
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
                ],
                order: [['exam_date', 'ASC'], ['start_time', 'ASC']]
            });

            // Get registration and proctor counts for each exam
            const schedule_data = await Promise.all(exams.map(async (exam) => {
                const exam_data = exam.get({ plain: true });
                
                // Get student registration count
                const registration_count = await Registration.count({
                    where: { 
                        exam_id: exam.exam_id,
                        registration_status: ['pending', 'approved']
                    }
                });

                // Get proctor count
                const proctor_count = await ExamProctor.count({
                    where: { exam_id: exam.exam_id }
                });

                // Calculate capacity utilization
                const capacity_percentage = exam_data.max_students > 0 
                    ? Math.round((registration_count / exam_data.max_students) * 100) 
                    : 0;

                return {
                    ...exam_data,
                    registration_count,
                    proctor_count,
                    capacity_percentage,
                    is_fully_booked: registration_count >= exam_data.max_students,
                    needs_proctors: proctor_count === 0,
                    formatted_date: new Date(exam_data.exam_date).toLocaleDateString('vi-VN')
                };
            }));

            // Calculate statistics if requested
            let statistics = {};
            if (include_stats === 'true') {
                statistics = await calculateScheduleStatistics(where_clause);
            }

            res.json({
                success: true,
                count: schedule_data.length,
                data: schedule_data,
                statistics: include_stats === 'true' ? statistics : undefined
            });

        } catch (error) {
            console.error('Error getting schedule overview:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể lấy thông tin lịch thi',
                error: error.message
            });
        }
    },

    /**
     * Get unassigned students and proctors
     * 
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Object} JSON response with unassigned data
     */
    getUnassignedData: async (req, res) => {
        try {
            console.log('📊 Getting unassigned data...');
            
            // Get all published exams
            const published_exams = await Exam.findAll({
                where: { 
                    status: ['published', 'in_progress'],
                    exam_date: { [Op.gte]: new Date().toISOString().split('T')[0] }
                },
                attributes: ['exam_id']
            });

            console.log('📚 Published exams found:', published_exams.length);
            const exam_ids = published_exams.map(exam => exam.exam_id);

            // Handle case when no published exams exist
            if (exam_ids.length === 0) {
                console.log('⚠️ No published exams found, getting all students and teachers');
                
                const all_students = await User.findAll({
                    where: { user_role: 'student' },
                    attributes: ['user_id', 'full_name', 'email'],
                    order: [['full_name', 'ASC']]
                });

                const all_teachers = await User.findAll({
                    where: { user_role: 'teacher' },
                    attributes: ['user_id', 'full_name', 'email'],
                    order: [['full_name', 'ASC']]
                });

                return res.json({
                    success: true,
                    data: {
                        unregistered_students: all_students.map(student => ({
                            student_id: student.user_id,
                            full_name: student.full_name,
                            email: student.email
                        })),
                        unassigned_proctors: all_teachers.map(proctor => ({
                            proctor_id: proctor.user_id,
                            full_name: proctor.full_name,
                            email: proctor.email
                        }))
                    }
                });
            }

            // Get students who haven't registered for any published exam
            const registered_student_ids = await Registration.findAll({
                where: { 
                    exam_id: { [Op.in]: exam_ids },
                    registration_status: ['pending', 'approved']
                },
                attributes: ['student_id'],
                raw: true
            }).then(registrations => registrations.map(r => r.student_id));

            console.log('👥 Registered student IDs:', registered_student_ids);

            const unregistered_students = await User.findAll({
                where: {
                    user_role: 'student',
                    user_id: { [Op.notIn]: registered_student_ids.length > 0 ? registered_student_ids : [0] }
                },
                attributes: ['user_id', 'full_name', 'email'],
                order: [['full_name', 'ASC']]
            });

            console.log('📝 Unregistered students found:', unregistered_students.length);

            // Get teachers who haven't been assigned as proctors
            const assigned_proctor_ids = await ExamProctor.findAll({
                where: { exam_id: { [Op.in]: exam_ids } },
                attributes: ['proctor_id'],
                raw: true
            }).then(proctors => proctors.map(p => p.proctor_id));

            console.log('👨‍🏫 Assigned proctor IDs:', assigned_proctor_ids);

            const unassigned_proctors = await User.findAll({
                where: {
                    user_role: 'teacher',
                    user_id: { [Op.notIn]: assigned_proctor_ids.length > 0 ? assigned_proctor_ids : [0] }
                },
                attributes: ['user_id', 'full_name', 'email'],
                order: [['full_name', 'ASC']]
            });

            console.log('👔 Unassigned proctors found:', unassigned_proctors.length);

            res.json({
                success: true,
                data: {
                    unregistered_students: unregistered_students.map(student => ({
                        student_id: student.user_id,
                        full_name: student.full_name,
                        email: student.email
                    })),
                    unassigned_proctors: unassigned_proctors.map(proctor => ({
                        proctor_id: proctor.user_id,
                        full_name: proctor.full_name,
                        email: proctor.email
                    }))
                }
            });

        } catch (error) {
            console.error('Error getting unassigned data:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể lấy danh sách chưa phân công',
                error: error.message
            });
        }
    },

    /**
     * Assign students to an exam
     * 
     * @param {Object} req - Request with exam_id and student_ids
     * @param {Object} res - Response object
     * @returns {Object} JSON response with assignment results
     */
    assignStudentsToExam: async (req, res) => {
        try {
            const { exam_id, student_ids, registration_status = 'approved' } = req.body;

            if (!exam_id || !student_ids || !Array.isArray(student_ids)) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin kỳ thi hoặc danh sách học sinh'
                });
            }

            // Check if exam exists and has capacity
            const exam = await Exam.findByPk(exam_id);
            if (!exam) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy kỳ thi'
                });
            }

            // Check current registration count
            const current_registrations = await Registration.count({
                where: { 
                    exam_id,
                    registration_status: ['pending', 'approved']
                }
            });

            const available_slots = exam.max_students - current_registrations;
            if (student_ids.length > available_slots) {
                return res.status(409).json({
                    success: false,
                    message: `Chỉ còn ${available_slots} chỗ trống, không thể đăng ký ${student_ids.length} học sinh`
                });
            }

            // Check for existing registrations
            const existing_registrations = await Registration.findAll({
                where: {
                    exam_id,
                    student_id: { [Op.in]: student_ids }
                },
                raw: true
            });

            const already_registered = existing_registrations.map(r => r.student_id);
            const new_student_ids = student_ids.filter(id => !already_registered.includes(id));

            // Create new registrations
            const registrations_to_create = new_student_ids.map(student_id => ({
                exam_id,
                student_id,
                registration_status,
                notes: 'Được phân công bởi quản trị viên'
            }));

            const created_registrations = await Registration.bulkCreate(registrations_to_create);

            res.json({
                success: true,
                message: `Đã phân công ${created_registrations.length} học sinh thành công`,
                data: {
                    created_count: created_registrations.length,
                    already_registered_count: already_registered.length,
                    total_requested: student_ids.length
                }
            });

        } catch (error) {
            console.error('Error assigning students to exam:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể phân công học sinh',
                error: error.message
            });
        }
    },

    /**
     * Assign proctors to an exam
     * 
     * @param {Object} req - Request with exam_id and proctor_assignments
     * @param {Object} res - Response object
     * @returns {Object} JSON response with assignment results
     */
    assignProctorsToExam: async (req, res) => {
        try {
            const { exam_id, proctor_assignments } = req.body;

            if (!exam_id || !proctor_assignments || !Array.isArray(proctor_assignments)) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin kỳ thi hoặc danh sách giám thị'
                });
            }

            // Check if exam exists
            const exam = await Exam.findByPk(exam_id);
            if (!exam) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy kỳ thi'
                });
            }

            // Check for conflicting assignments
            const conflicts = await checkProctorConflicts(proctor_assignments, exam);
            if (conflicts.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Một số giám thị đã có lịch thi trùng thời gian',
                    conflicts
                });
            }

            // Check for existing assignments
            const existing_assignments = await ExamProctor.findAll({
                where: {
                    exam_id,
                    proctor_id: { [Op.in]: proctor_assignments.map(p => p.proctor_id) }
                },
                raw: true
            });

            const already_assigned = existing_assignments.map(a => a.proctor_id);
            const new_assignments = proctor_assignments.filter(p => !already_assigned.includes(p.proctor_id));

            // Create new assignments
            const assignments_to_create = new_assignments.map(assignment => ({
                exam_id,
                proctor_id: assignment.proctor_id,
                role: assignment.role || 'assistant',
                notes: assignment.notes || 'Được phân công bởi quản trị viên'
            }));

            const created_assignments = await ExamProctor.bulkCreate(assignments_to_create);

            res.json({
                success: true,
                message: `Đã phân công ${created_assignments.length} giám thị thành công`,
                data: {
                    created_count: created_assignments.length,
                    already_assigned_count: already_assigned.length,
                    total_requested: proctor_assignments.length
                }
            });

        } catch (error) {
            console.error('Error assigning proctors to exam:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể phân công giám thị',
                error: error.message
            });
        }
    },

    /**
     * Remove student from exam
     * 
     * @param {Object} req - Request with exam_id and student_id
     * @param {Object} res - Response object
     * @returns {Object} JSON response confirming removal
     */
    removeStudentFromExam: async (req, res) => {
        try {
            const { exam_id, student_id } = req.params;

            const registration = await Registration.findOne({
                where: { exam_id, student_id }
            });

            if (!registration) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đăng ký thi'
                });
            }

            await registration.destroy();

            res.json({
                success: true,
                message: 'Đã hủy đăng ký thi thành công'
            });

        } catch (error) {
            console.error('Error removing student from exam:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể hủy đăng ký thi',
                error: error.message
            });
        }
    },

    /**
     * Remove proctor from exam
     * 
     * @param {Object} req - Request with exam_id and proctor_id
     * @param {Object} res - Response object
     * @returns {Object} JSON response confirming removal
     */
    removeProctorFromExam: async (req, res) => {
        try {
            const { exam_id, proctor_id } = req.params;

            const assignment = await ExamProctor.findOne({
                where: { exam_id, proctor_id }
            });

            if (!assignment) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy phân công giám thị'
                });
            }

            await assignment.destroy();

            res.json({
                success: true,
                message: 'Đã hủy phân công giám thị thành công'
            });

        } catch (error) {
            console.error('Error removing proctor from exam:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể hủy phân công giám thị',
                error: error.message
            });
        }
    }
};

/**
 * Helper function to calculate schedule statistics
 * 
 * @param {Object} where_clause - Where clause for filtering exams
 * @returns {Object} Statistics object
 */
async function calculateScheduleStatistics(where_clause) {
    try {
        const total_exams = await Exam.count({ where: where_clause });
        
        const exams_with_students = await Exam.count({
            where: where_clause,
            include: [{
                model: Registration,
                as: 'registrations',
                where: { registration_status: ['pending', 'approved'] },
                required: true
            }]
        });

        const exams_with_proctors = await Exam.count({
            where: where_clause,
            include: [{
                model: ExamProctor,
                as: 'proctors',
                required: true
            }]
        });

        const total_students_registered = await Registration.count({
            include: [{
                model: Exam,
                as: 'exam',
                where: where_clause,
                required: true
            }],
            where: { registration_status: ['pending', 'approved'] }
        });

        const total_proctors_assigned = await ExamProctor.count({
            include: [{
                model: Exam,
                as: 'exam',
                where: where_clause,
                required: true
            }]
        });

        return {
            total_exams,
            exams_with_students,
            exams_with_proctors,
            exams_needing_students: total_exams - exams_with_students,
            exams_needing_proctors: total_exams - exams_with_proctors,
            total_students_registered,
            total_proctors_assigned,
            completion_percentage: total_exams > 0 ? Math.round(((exams_with_students + exams_with_proctors) / (total_exams * 2)) * 100) : 0
        };
    } catch (error) {
        console.error('Error calculating statistics:', error);
        return {};
    }
}

/**
 * Helper function to check proctor scheduling conflicts
 * 
 * @param {Array} proctor_assignments - Array of proctor assignments
 * @param {Object} exam - Exam object
 * @returns {Array} Array of conflicts
 */
async function checkProctorConflicts(proctor_assignments, exam) {
    try {
        const conflicts = [];
        
        for (const assignment of proctor_assignments) {
            const conflicting_exams = await Exam.findAll({
                where: {
                    exam_date: exam.exam_date,
                    exam_id: { [Op.ne]: exam.exam_id },
                    [Op.or]: [
                        {
                            start_time: {
                                [Op.between]: [exam.start_time, exam.end_time]
                            }
                        },
                        {
                            end_time: {
                                [Op.between]: [exam.start_time, exam.end_time]
                            }
                        },
                        {
                            [Op.and]: [
                                { start_time: { [Op.lte]: exam.start_time } },
                                { end_time: { [Op.gte]: exam.end_time } }
                            ]
                        }
                    ]
                },
                include: [{
                    model: ExamProctor,
                    as: 'proctors',
                    where: { proctor_id: assignment.proctor_id },
                    required: true
                }]
            });

            if (conflicting_exams.length > 0) {
                const proctor = await User.findByPk(assignment.proctor_id);
                conflicts.push({
                    proctor_id: assignment.proctor_id,
                    proctor_name: proctor ? proctor.full_name : 'Unknown',
                    conflicting_exams: conflicting_exams.map(e => ({
                        exam_id: e.exam_id,
                        title: e.title,
                        start_time: e.start_time,
                        end_time: e.end_time
                    }))
                });
            }
        }

        return conflicts;
    } catch (error) {
        console.error('Error checking proctor conflicts:', error);
        return [];
    }
}

module.exports = schedule_controller;
