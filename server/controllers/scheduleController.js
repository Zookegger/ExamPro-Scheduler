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
     * Get comprehensive schedule conflicts and warnings
     * 
     * @param {Object} req - Request with query parameters
     * @param {Object} res - Response object
     * @returns {Object} JSON response with conflict analysis
     */
    getScheduleConflicts: async (req, res) => {
        try {
            const {
                start_date,
                end_date,
                severity = 'all' // 'critical', 'warning', 'info', 'all'
            } = req.query;

            // Build date filter
            const date_filter = {};
            if (start_date && start_date.trim() !== '') {
                date_filter[Op.gte] = start_date;
            }
            if (end_date && end_date.trim() !== '') {
                date_filter[Op.lte] = end_date;
            }

            const where_clause = {};
            if (Object.keys(date_filter).length > 0) {
                where_clause.exam_date = date_filter;
            }

            console.log('🔍 Analyzing schedule conflicts with filter:', JSON.stringify(where_clause, null, 2));

            // Get all exams in the specified period
            const exams = await Exam.findAll({
                where: where_clause,
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
                order: [['exam_date', 'ASC'], ['start_time', 'ASC']]
            });

            // Analyze different types of conflicts
            const room_conflicts = await analyzeRoomConflicts(exams);
            const proctor_conflicts = await analyzeProctorConflicts(exams);
            const capacity_warnings = await analyzeCapacityIssues(exams);
            const time_optimization = await analyzeTimeOptimization(exams);
            const resource_efficiency = await analyzeResourceEfficiency(exams);

            // Categorize by severity
            const conflicts = {
                critical: [],
                warning: [],
                info: []
            };

            // Room conflicts (critical)
            room_conflicts.forEach(conflict => {
                conflicts.critical.push({
                    type: 'room_conflict',
                    severity: 'critical',
                    title: `Xung đột phòng thi: ${conflict.room_name}`,
                    description: `${conflict.conflicting_exams.length} kỳ thi cùng thời gian`,
                    details: conflict,
                    icon: 'bi-exclamation-triangle-fill',
                    color: 'danger'
                });
            });

            // Proctor conflicts (critical)
            proctor_conflicts.forEach(conflict => {
                conflicts.critical.push({
                    type: 'proctor_conflict',
                    severity: 'critical',
                    title: `Xung đột giám thị: ${conflict.proctor_name}`,
                    description: `Được phân công ${conflict.conflicting_exams.length} kỳ thi cùng lúc`,
                    details: conflict,
                    icon: 'bi-person-exclamation',
                    color: 'danger'
                });
            });

            // Capacity issues (warning)
            capacity_warnings.forEach(warning => {
                conflicts.warning.push({
                    type: 'capacity_issue',
                    severity: 'warning',
                    title: warning.type === 'overcapacity' ? 'Vượt quá sức chứa phòng' : 'Thiếu giám thị',
                    description: warning.message,
                    details: warning,
                    icon: warning.type === 'overcapacity' ? 'bi-people-fill' : 'bi-person-badge',
                    color: 'warning'
                });
            });

            // Time optimization suggestions (info)
            time_optimization.forEach(suggestion => {
                conflicts.info.push({
                    type: 'time_optimization',
                    severity: 'info',
                    title: 'Tối ưu hóa thời gian',
                    description: suggestion.message,
                    details: suggestion,
                    icon: 'bi-clock-history',
                    color: 'info'
                });
            });

            // Resource efficiency suggestions (info)
            resource_efficiency.forEach(suggestion => {
                conflicts.info.push({
                    type: 'resource_efficiency',
                    severity: 'info',
                    title: 'Tối ưu hóa tài nguyên',
                    description: suggestion.message,
                    details: suggestion,
                    icon: 'bi-diagram-3',
                    color: 'info'
                });
            });

            // Filter by severity if specified
            let filtered_conflicts = [];
            if (severity === 'all') {
                filtered_conflicts = [
                    ...conflicts.critical,
                    ...conflicts.warning,
                    ...conflicts.info
                ];
            } else {
                filtered_conflicts = conflicts[severity] || [];
            }

            // Calculate summary statistics
            const summary = {
                total_conflicts: conflicts.critical.length + conflicts.warning.length + conflicts.info.length,
                critical_count: conflicts.critical.length,
                warning_count: conflicts.warning.length,
                info_count: conflicts.info.length,
                exams_analyzed: exams.length
            };

            res.json({
                success: true,
                data: filtered_conflicts,
                summary,
                conflicts_by_severity: {
                    critical: conflicts.critical.length,
                    warning: conflicts.warning.length,
                    info: conflicts.info.length
                }
            });

        } catch (error) {
            console.error('Error analyzing schedule conflicts:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể phân tích xung đột lịch thi',
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
    },

    /**
     * Get exams where the current teacher is assigned as a proctor
     * 
     * @param {Object} req - Request with user authentication and query parameters
     * @param {Object} res - Response object
     * @returns {Object} JSON response with teacher's proctor exams
     */
    getTeacherProctorExams: async (req, res) => {
        try {
            const teacher_id = req.user.user_id;
            const {
                status,
                start_date,
                end_date
            } = req.query;

            console.log(`🔍 Getting proctor exams for teacher ${teacher_id}`);

            // Build date filter
            const date_filter = {};
            if (start_date && start_date.trim() !== '') {
                date_filter[Op.gte] = start_date;
            }
            if (end_date && end_date.trim() !== '') {
                date_filter[Op.lte] = end_date;
            }

            // Build where clause for exams
            const exam_where_clause = {};
            if (Object.keys(date_filter).length > 0) {
                exam_where_clause.exam_date = date_filter;
            }
            if (status && status !== 'all') {
                exam_where_clause.status = status;
            }

            // Get exams where this teacher is a proctor
            const proctor_exams = await Exam.findAll({
                where: exam_where_clause,
                include: [
                    {
                        model: ExamProctor,
                        as: 'exam_proctors',
                        where: { proctor_id: teacher_id },
                        attributes: ['role', 'notes', 'created_at'],
                        required: true
                    },
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

            // Transform data to match frontend expectations
            const transformed_exams = await Promise.all(proctor_exams.map(async (exam) => {
                const exam_data = exam.get({ plain: true });
                
                // Get registration count
                const registration_count = await Registration.count({
                    where: { 
                        exam_id: exam.exam_id,
                        registration_status: ['pending', 'approved']
                    }
                });

        // Get all proctors for this exam (to show other proctors)
        const all_proctors = await ExamProctor.findAll({
            where: { exam_id: exam.exam_id },
            include: [
                {
                    model: User,
                    as: 'proctor',
                    attributes: ['user_id', 'full_name', 'user_name']
                }
            ]
        });                // Determine exam status based on date
                const today = new Date().toISOString().split('T')[0];
                const exam_date = exam_data.exam_date;
                let calculated_status = 'upcoming';
                if (exam_date < today) {
                    calculated_status = 'completed';
                } else if (exam_date === today) {
                    calculated_status = 'today';
                }

                // Get current user's proctor role
                const current_proctor = exam_data.exam_proctors[0];
                
        // Get other proctors (excluding current user)
        const other_proctors = all_proctors
            .filter(p => p.proctor_id !== teacher_id)
            .map(p => p.proctor.full_name);

        // Find subject teacher (assuming the exam creator or main teacher)
        const subject_teacher = all_proctors.find(p => p.role === 'main')?.proctor?.full_name || 'Chưa xác định';                return {
                    exam_id: exam_data.exam_id,
                    title: exam_data.title,
                    subject_code: exam_data.subject_code,
                    subject_name: exam_data.subject?.subject_name || 'N/A',
                    exam_date: exam_data.exam_date,
                    start_time: exam_data.start_time,
                    end_time: exam_data.end_time,
                    duration_minutes: exam_data.duration_minutes,
                    room_name: exam_data.room?.room_name || 'N/A',
                    room_capacity: exam_data.room?.capacity || exam_data.max_students,
                    registered_students: registration_count,
                    proctor_role: current_proctor.role === 'main' ? 'main_proctor' : 'assistant_proctor',
                    status: calculated_status,
                    subject_teacher,
                    other_proctors,
                    exam_method: exam_data.method || 'offline',
                    description: exam_data.description || '',
                    max_students: exam_data.max_students
                };
            }));

            res.json({
                success: true,
                count: transformed_exams.length,
                data: transformed_exams
            });

        } catch (error) {
            console.error('Error getting teacher proctor exams:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách thi giám thị',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
                    as: 'exam_proctors',
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

/**
 * Helper function to check for proctor conflicts
 * 
 * @param {number} user_id - User ID to check
 * @param {string} exam_date - Date of exam
 * @param {string} start_time - Start time of exam
 * @param {string} end_time - End time of exam
 * @param {number} exclude_exam_id - Exam ID to exclude from conflict check
 * @returns {Array} Array of conflicting exams
 */
async function check_proctor_conflicts(user_id, exam_date, start_time, end_time, exclude_exam_id = null) {
    try {
        // Find overlapping exams where user is a proctor
        const where_clause = {
            exam_date: exam_date,
            [Op.or]: [
                {
                    [Op.and]: [
                        { start_time: { [Op.lte]: start_time } },
                        { end_time: { [Op.gt]: start_time } }
                    ]
                },
                {
                    [Op.and]: [
                        { start_time: { [Op.lt]: end_time } },
                        { end_time: { [Op.gte]: end_time } }
                    ]
                },
                {
                    [Op.and]: [
                        { start_time: { [Op.gte]: start_time } },
                        { end_time: { [Op.lte]: end_time } }
                    ]
                }
            ]
        };

        if (exclude_exam_id) {
            where_clause.exam_id = { [Op.ne]: exclude_exam_id };
        }

        const conflicts = await Exam.findAll({
            where: where_clause,
            include: [
                {
                    model: ExamProctor,
                    as: 'exam_proctors',
                    where: { proctor_id: user_id },
                    required: true
                }
            ]
        });

        return conflicts;
    } catch (error) {
        console.error('Error checking proctor conflicts:', error);
        return [];
    }
}

/**
 * Schedule Conflict Analysis Helper Functions
 */

/**
 * Analyze room conflicts - same room at overlapping times
 */
async function analyzeRoomConflicts(exams) {
    const conflicts = [];
    const room_schedule = {};

    // Group exams by room and date
    exams.forEach(exam => {
        if (!exam.room_id) return; // Skip online exams

        const key = `${exam.room_id}_${exam.exam_date}`;
        if (!room_schedule[key]) {
            room_schedule[key] = {
                room_id: exam.room_id,
                room_name: exam.room?.room_name || 'Unknown Room',
                date: exam.exam_date,
                exams: []
            };
        }
        room_schedule[key].exams.push(exam);
    });

    // Check for time overlaps within each room/date combination
    Object.values(room_schedule).forEach(schedule => {
        const sorted_exams = schedule.exams.sort((a, b) => a.start_time.localeCompare(b.start_time));
        
        for (let i = 0; i < sorted_exams.length - 1; i++) {
            const current_exam = sorted_exams[i];
            const next_exam = sorted_exams[i + 1];
            
            // Check if current exam ends after next exam starts
            if (current_exam.end_time > next_exam.start_time) {
                conflicts.push({
                    room_id: schedule.room_id,
                    room_name: schedule.room_name,
                    date: schedule.date,
                    conflicting_exams: [
                        {
                            exam_id: current_exam.exam_id,
                            title: current_exam.title,
                            start_time: current_exam.start_time,
                            end_time: current_exam.end_time,
                            subject: current_exam.subject?.subject_name
                        },
                        {
                            exam_id: next_exam.exam_id,
                            title: next_exam.title,
                            start_time: next_exam.start_time,
                            end_time: next_exam.end_time,
                            subject: next_exam.subject?.subject_name
                        }
                    ]
                });
            }
        }
    });

    return conflicts;
}

/**
 * Analyze proctor conflicts - same proctor assigned to overlapping exams
 */
async function analyzeProctorConflicts(exams) {
    const conflicts = [];
    const exam_ids = exams.map(e => e.exam_id);
    
    if (exam_ids.length === 0) return conflicts;

    // Get all proctor assignments for these exams
    const proctor_assignments = await ExamProctor.findAll({
        where: { exam_id: { [Op.in]: exam_ids } },
        include: [{
            model: User,
            as: 'proctor',
            attributes: ['full_name']
        }]
    });

    // Group by proctor and date
    const proctor_schedule = {};
    
    for (const assignment of proctor_assignments) {
        const exam = exams.find(e => e.exam_id === assignment.exam_id);
        if (!exam) continue;

        const key = `${assignment.proctor_id}_${exam.exam_date}`;
        if (!proctor_schedule[key]) {
            proctor_schedule[key] = {
                proctor_id: assignment.proctor_id,
                proctor_name: assignment.proctor?.full_name || 'Unknown Proctor',
                date: exam.exam_date,
                assignments: []
            };
        }
        
        proctor_schedule[key].assignments.push({
            exam_id: exam.exam_id,
            title: exam.title,
            start_time: exam.start_time,
            end_time: exam.end_time,
            role: assignment.role,
            room_name: exam.room?.room_name
        });
    }

    // Check for time overlaps within each proctor/date combination
    Object.values(proctor_schedule).forEach(schedule => {
        const sorted_assignments = schedule.assignments.sort((a, b) => a.start_time.localeCompare(b.start_time));
        
        for (let i = 0; i < sorted_assignments.length - 1; i++) {
            const current = sorted_assignments[i];
            const next = sorted_assignments[i + 1];
            
            // Check if assignments overlap
            if (current.end_time > next.start_time) {
                conflicts.push({
                    proctor_id: schedule.proctor_id,
                    proctor_name: schedule.proctor_name,
                    date: schedule.date,
                    conflicting_exams: [current, next]
                });
            }
        }
    });

    return conflicts;
}

/**
 * Analyze capacity issues - overcapacity or insufficient proctoring
 */
async function analyzeCapacityIssues(exams) {
    const warnings = [];

    for (const exam of exams) {
        // Check registration vs capacity
        const registration_count = await Registration.count({
            where: { 
                exam_id: exam.exam_id,
                registration_status: ['pending', 'approved']
            }
        });

        // Room overcapacity
        if (exam.room && registration_count > exam.room.capacity) {
            warnings.push({
                type: 'overcapacity',
                exam_id: exam.exam_id,
                exam_title: exam.title,
                room_name: exam.room.room_name,
                registered: registration_count,
                capacity: exam.room.capacity,
                overflow: registration_count - exam.room.capacity,
                message: `${exam.title}: ${registration_count} học sinh đăng ký nhưng phòng chỉ chứa ${exam.room.capacity}`
            });
        }

        // Insufficient proctors (should have at least 1 proctor per 30 students)
        const proctor_count = await ExamProctor.count({
            where: { exam_id: exam.exam_id }
        });

        const recommended_proctors = Math.ceil(registration_count / 30);
        if (proctor_count < recommended_proctors && registration_count > 0) {
            warnings.push({
                type: 'insufficient_proctors',
                exam_id: exam.exam_id,
                exam_title: exam.title,
                current_proctors: proctor_count,
                recommended_proctors: recommended_proctors,
                students: registration_count,
                message: `${exam.title}: Cần ${recommended_proctors} giám thị cho ${registration_count} học sinh (hiện có ${proctor_count})`
            });
        }
    }

    return warnings;
}

/**
 * Analyze time optimization opportunities
 */
async function analyzeTimeOptimization(exams) {
    const suggestions = [];
    
    // Group exams by date
    const daily_schedule = {};
    exams.forEach(exam => {
        if (!daily_schedule[exam.exam_date]) {
            daily_schedule[exam.exam_date] = [];
        }
        daily_schedule[exam.exam_date].push(exam);
    });

    Object.entries(daily_schedule).forEach(([date, day_exams]) => {
        // Check for large gaps between exams
        const sorted_exams = day_exams.sort((a, b) => a.start_time.localeCompare(b.start_time));
        
        for (let i = 0; i < sorted_exams.length - 1; i++) {
            const current = sorted_exams[i];
            const next = sorted_exams[i + 1];
            
            // Calculate gap in minutes
            const current_end = new Date(`2000-01-01 ${current.end_time}`);
            const next_start = new Date(`2000-01-01 ${next.start_time}`);
            const gap_minutes = (next_start - current_end) / (1000 * 60);
            
            // Suggest consolidation if gap is too large (>2 hours)
            if (gap_minutes > 120) {
                suggestions.push({
                    type: 'large_gap',
                    date,
                    gap_hours: Math.round(gap_minutes / 60 * 10) / 10,
                    exams: [
                        { title: current.title, end_time: current.end_time },
                        { title: next.title, start_time: next.start_time }
                    ],
                    message: `Khoảng trống ${Math.round(gap_minutes / 60 * 10) / 10}h giữa "${current.title}" và "${next.title}" vào ${date}`
                });
            }
        }
    });

    return suggestions;
}

/**
 * Analyze resource efficiency opportunities
 */
async function analyzeResourceEfficiency(exams) {
    const suggestions = [];
    
    // Check for underutilized rooms
    const room_utilization = {};
    
    exams.forEach(exam => {
        if (!exam.room_id) return;
        
        if (!room_utilization[exam.room_id]) {
            room_utilization[exam.room_id] = {
                room_name: exam.room?.room_name,
                capacity: exam.room?.capacity,
                total_registrations: 0,
                exam_count: 0
            };
        }
        
        // We'd need to fetch registration counts, but for efficiency, we'll estimate
        room_utilization[exam.room_id].exam_count++;
        room_utilization[exam.room_id].total_registrations += exam.max_students || 0;
    });

    Object.values(room_utilization).forEach(room => {
        if (room.capacity && room.total_registrations > 0) {
            const utilization_rate = room.total_registrations / (room.capacity * room.exam_count);
            
            if (utilization_rate < 0.5) { // Less than 50% utilization
                suggestions.push({
                    type: 'low_utilization',
                    room_name: room.room_name,
                    capacity: room.capacity,
                    utilization_rate: Math.round(utilization_rate * 100),
                    message: `Phòng ${room.room_name} chỉ sử dụng ${Math.round(utilization_rate * 100)}% công suất`
                });
            }
        }
    });

    return suggestions;
}

module.exports = schedule_controller;
