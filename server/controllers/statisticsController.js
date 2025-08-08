/**
 * Statistics Controller
 * 
 * Handles administrative statistics data for the ExamPro Scheduler dashboard.
 * Provides comprehensive system metrics, enrollment statistics, exam performance data,
 * and real-time activity feeds for administrative oversight.
 * 
 * Vietnamese Educational Context: Supports grades 10-12 statistics, subject-wise analysis,
 * and bilingual data presentation for Vietnamese high school examination management.
 */

const { Op, Sequelize } = require('sequelize');
const db = require('../models');

/**
 * Get comprehensive system statistics
 * 
 * @route GET /api/statistics/system
 * @access Admin
 * @param {Object} req.query - Query filters (period, start_date, end_date)
 * @returns {Object} System-wide statistics including users, exams, utilization
 */
const getSystemStatistics = async (req, res) => {
    try {
        const { period = 'current_semester', start_date, end_date } = req.query;
        
        // Build date filter based on period
        let date_filter = {};
        const current_date = new Date();
        
        switch (period) {
            case 'current_semester':
                // Assuming semester starts in September and February
                const current_month = current_date.getMonth();
                const semester_start = current_month >= 8 ? new Date(current_date.getFullYear(), 8, 1) 
                                                          : new Date(current_date.getFullYear(), 1, 1);
                date_filter = { created_at: { [Op.gte]: semester_start } };
                break;
            case 'current_year':
                date_filter = { created_at: { [Op.gte]: new Date(current_date.getFullYear(), 0, 1) } };
                break;
            case 'last_semester':
                const last_semester_start = current_date.getMonth() >= 8 
                    ? new Date(current_date.getFullYear(), 1, 1) 
                    : new Date(current_date.getFullYear() - 1, 8, 1);
                const last_semester_end = current_date.getMonth() >= 8 
                    ? new Date(current_date.getFullYear(), 7, 31) 
                    : new Date(current_date.getFullYear(), 1, 28);
                date_filter = { 
                    created_at: { 
                        [Op.between]: [last_semester_start, last_semester_end] 
                    } 
                };
                break;
            default:
                if (start_date && end_date) {
                    date_filter = { 
                        created_at: { 
                            [Op.between]: [new Date(start_date), new Date(end_date)] 
                        } 
                    };
                }
        }
        
        // Parallel execution of statistics queries for performance
        const [
            total_users,
            new_users,
            total_exams,
            upcoming_exams,
            completed_exams,
            total_registrations,
            room_count,
            subject_count,
            active_proctors
        ] = await Promise.all([
            db.models.User.count(),
            db.models.User.count({ where: date_filter }),
            db.models.Exam.count(),
            db.models.Exam.count({ 
                where: { 
                    exam_date: { [Op.gte]: current_date },
                    status: { [Op.ne]: 'cancelled' }
                } 
            }),
            db.models.Exam.count({ 
                where: { 
                    exam_date: { [Op.lt]: current_date },
                    status: 'completed'
                } 
            }),
            db.models.Registration.count({ where: date_filter }),
            db.models.Room.count({ where: { is_active: true } }),
            db.models.Subject.count({ where: { is_active: true } }),
            db.models.ExamProctor.count({
                distinct: true,
                col: 'proctor_id',
                include: [{
                    model: db.models.Exam,
                    as: 'exam',
                    where: { 
                        exam_date: { [Op.gte]: current_date },
                        status: { [Op.ne]: 'cancelled' }
                    }
                }]
            })
        ]);
        
        // Calculate system utilization metrics
        const avg_room_utilization = await db.models.Room.findAll({
            attributes: [
                'room_id',
                'room_name',
                'capacity',
                [
                    Sequelize.fn('COUNT', Sequelize.col('exams.exam_id')),
                    'exam_count'
                ]
            ],
            include: [{
                model: db.models.Exam,
                as: 'exams',
                attributes: [],
                where: date_filter.created_at ? {
                    exam_date: date_filter.created_at
                } : {}
            }],
            group: ['Room.room_id'],
            raw: true
        });
        
        const utilization_percentage = avg_room_utilization.length > 0 
            ? (avg_room_utilization.reduce((sum, room) => sum + parseInt(room.exam_count), 0) / avg_room_utilization.length) * 10
            : 0;
        
        const system_stats = {
            total_users,
            new_users_this_period: new_users,
            total_exams,
            upcoming_exams,
            completed_exams,
            total_registrations,
            active_rooms: room_count,
            active_subjects: subject_count,
            active_proctors,
            system_utilization: Math.round(utilization_percentage),
            period_analyzed: period,
            last_updated: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: system_stats,
            message: 'Thống kê hệ thống được tải thành công'
        });
        
    } catch (error) {
        console.error('Error fetching system statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thống kê hệ thống',
            error: error.message
        });
    }
};

/**
 * Get enrollment statistics by grade and subject
 * 
 * @route GET /api/statistics/enrollment
 * @access Admin
 * @param {Object} req.query - Query filters (period, grade_level)
 * @returns {Object} Enrollment statistics breakdown
 */
const getEnrollmentStatistics = async (req, res) => {
    try {
        const { period = 'current_semester', grade_level } = req.query;
        
        // Build filter conditions
        let where_conditions = {};
        if (grade_level) {
            where_conditions.grade_level = grade_level;
        }
        
        // Get enrollment by grade level through Class relationship
        const enrollment_by_grade = await db.models.Class.findAll({
            attributes: [
                'grade_level',
                [Sequelize.fn('COUNT', Sequelize.col('students.user_id')), 'student_count']
            ],
            include: [{
                model: db.models.User,
                as: 'students',
                attributes: [],
                where: {
                    user_role: 'student',
                    is_active: true
                }
            }],
            where: where_conditions,
            group: ['grade_level'],
            raw: true
        });
        
        // Get enrollment by subject for current semester
        const enrollment_by_subject = await db.models.Subject.findAll({
            attributes: [
                'subject_code',
                'subject_name',
                [Sequelize.fn('COUNT', Sequelize.col('enrollments.enrollment_id')), 'enrollment_count']
            ],
            include: [{
                model: db.models.Enrollment,
                as: 'enrollments',
                attributes: [],
                where: {
                    status: 'enrolled'
                }
            }],
            group: ['Subject.subject_code'],
            order: [[Sequelize.fn('COUNT', Sequelize.col('enrollments.enrollment_id')), 'DESC']],
            raw: true
        });
        
        // Calculate enrollment trends
        const current_date = new Date();
        const last_month = new Date(current_date.getFullYear(), current_date.getMonth() - 1, 1);
        
        const [current_month_enrollments, last_month_enrollments] = await Promise.all([
            db.models.Enrollment.count({
                where: {
                    created_at: {
                        [Op.gte]: new Date(current_date.getFullYear(), current_date.getMonth(), 1)
                    }
                }
            }),
            db.models.Enrollment.count({
                where: {
                    created_at: {
                        [Op.between]: [last_month, new Date(current_date.getFullYear(), current_date.getMonth(), 0)]
                    }
                }
            })
        ]);
        
        const enrollment_trend = last_month_enrollments > 0 
            ? ((current_month_enrollments - last_month_enrollments) / last_month_enrollments) * 100
            : 0;
        
        const enrollment_stats = {
            by_grade: enrollment_by_grade.map(grade => ({
                grade_level: grade.grade_level,
                student_count: parseInt(grade.student_count),
                grade_display: `Lớp ${grade.grade_level}`
            })),
            by_subject: enrollment_by_subject.map(subject => ({
                subject_code: subject.subject_code,
                subject_name: subject.subject_name,
                enrollment_count: parseInt(subject.enrollment_count)
            })).slice(0, 10), // Top 10 subjects
            trends: {
                current_month: current_month_enrollments,
                last_month: last_month_enrollments,
                percentage_change: Math.round(enrollment_trend * 100) / 100
            },
            total_enrollments: enrollment_by_grade.reduce((sum, grade) => sum + parseInt(grade.student_count), 0),
            period_analyzed: period
        };
        
        res.json({
            success: true,
            data: enrollment_stats,
            message: 'Thống kê đăng ký được tải thành công'
        });
        
    } catch (error) {
        console.error('Error fetching enrollment statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thống kê đăng ký',
            error: error.message
        });
    }
};

/**
 * Get exam statistics including performance and scheduling data
 * 
 * @route GET /api/statistics/exams
 * @access Admin
 * @param {Object} req.query - Query filters (period, subject_code, status)
 * @returns {Object} Comprehensive exam statistics
 */
const getExamStatistics = async (req, res) => {
    try {
        const { period = 'current_semester', subject_code, status } = req.query;
        
        let where_conditions = {};
        if (subject_code) {
            where_conditions.subject_id = subject_code;
        }
        if (status) {
            where_conditions.status = status;
        }
        
        // Get exam distribution by status
        const exam_by_status = await db.models.Exam.findAll({
            attributes: [
                'status',
                [Sequelize.fn('COUNT', Sequelize.col('exam_id')), 'exam_count']
            ],
            where: where_conditions,
            group: ['status'],
            raw: true
        });
        
        // Get exam performance by subject
        const exam_by_subject = await db.models.Exam.findAll({
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('Exam.exam_id')), 'exam_count'],
                [
                    Sequelize.fn('COUNT', 
                        Sequelize.literal("CASE WHEN registrations.attendance_status = 'present' THEN 1 END")
                    ), 
                    'present_count'
                ],
                [Sequelize.fn('COUNT', Sequelize.col('registrations.registration_id')), 'total_registrations']
            ],
            include: [
                {
                    model: db.models.Subject,
                    as: 'subject',
                    attributes: ['subject_code', 'subject_name']
                },
                {
                    model: db.models.Registration,
                    as: 'registrations',
                    attributes: []
                }
            ],
            where: where_conditions,
            group: ['subject.subject_code'],
            order: [[Sequelize.fn('COUNT', Sequelize.col('Exam.exam_id')), 'DESC']],
            raw: true
        });
        
        // Get room utilization for exams
        const room_utilization = await db.models.Room.findAll({
            attributes: [
                'room_id',
                'room_name',
                'capacity',
                [Sequelize.fn('COUNT', Sequelize.col('exams.exam_id')), 'exam_count'],
                [Sequelize.fn('AVG', Sequelize.col('exams.max_students')), 'avg_occupancy']
            ],
            include: [{
                model: db.models.Exam,
                as: 'exams',
                attributes: [],
                where: where_conditions
            }],
            group: ['Room.room_id'],
            order: [[Sequelize.fn('COUNT', Sequelize.col('exams.exam_id')), 'DESC']],
            raw: true
        });
        
        // Calculate exam trends
        const current_date = new Date();
        const [this_month_exams, last_month_exams] = await Promise.all([
            db.models.Exam.count({
                where: {
                    exam_date: {
                        [Op.gte]: new Date(current_date.getFullYear(), current_date.getMonth(), 1)
                    },
                    ...where_conditions
                }
            }),
            db.models.Exam.count({
                where: {
                    exam_date: {
                        [Op.between]: [
                            new Date(current_date.getFullYear(), current_date.getMonth() - 1, 1),
                            new Date(current_date.getFullYear(), current_date.getMonth(), 0)
                        ]
                    },
                    ...where_conditions
                }
            })
        ]);
        
        const exam_trend = last_month_exams > 0 
            ? ((this_month_exams - last_month_exams) / last_month_exams) * 100
            : 0;
        
        const exam_stats = {
            by_status: exam_by_status.map(status => ({
                status: status.status,
                count: parseInt(status.exam_count),
                status_display: {
                    'scheduled': 'Đã lên lịch',
                    'in_progress': 'Đang diễn ra',
                    'completed': 'Hoàn thành',
                    'cancelled': 'Đã hủy'
                }[status.status] || status.status
            })),
            by_subject: exam_by_subject.map(subject => ({
                subject_code: subject['subject.subject_code'],
                subject_name: subject['subject.subject_name'],
                exam_count: parseInt(subject.exam_count),
                avg_attendance: subject.total_registrations > 0 
                    ? Math.round((parseInt(subject.present_count) / parseInt(subject.total_registrations)) * 100)
                    : 0
            })).slice(0, 10),
            room_utilization: room_utilization.map(room => ({
                room_name: room.room_name,
                capacity: room.capacity,
                exam_count: parseInt(room.exam_count),
                avg_occupancy: parseFloat(room.avg_occupancy) || 0,
                utilization_rate: room.capacity > 0 ? Math.round((parseFloat(room.avg_occupancy) / room.capacity) * 100) : 0
            })).slice(0, 5),
            trends: {
                this_month: this_month_exams,
                last_month: last_month_exams,
                percentage_change: Math.round(exam_trend * 100) / 100
            },
            total_exams: exam_by_status.reduce((sum, status) => sum + parseInt(status.exam_count), 0),
            period_analyzed: period
        };
        
        res.json({
            success: true,
            data: exam_stats,
            message: 'Thống kê kỳ thi được tải thành công'
        });
        
    } catch (error) {
        console.error('Error fetching exam statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thống kê kỳ thi',
            error: error.message
        });
    }
};

/**
 * Get recent system activity for admin dashboard
 * 
 * @route GET /api/statistics/recent-activity
 * @access Admin
 * @param {Object} req.query - Query filters (limit, type)
 * @returns {Object} Recent activity feed
 */
const getRecentActivity = async (req, res) => {
    try {
        const { limit = 10, type } = req.query;
        
        // Get recent activities from various sources
        const recent_activities = [];
        
        // Recent user registrations
        const recent_users = await db.models.User.findAll({
            attributes: ['user_id', 'full_name', 'user_role', 'created_at'],
            order: [['created_at', 'DESC']],
            limit: Math.floor(parseInt(limit) / 3),
            raw: true
        });
        
        recent_users.forEach(user => {
            recent_activities.push({
                id: `user_${user.user_id}`,
                type: 'user_registration',
                title: 'Người dùng mới đăng ký',
                description: `${user.full_name} (${user.user_role}) đã đăng ký tài khoản`,
                timestamp: user.created_at,
                icon: 'user-plus',
                color: 'success'
            });
        });
        
        // Recent exam schedules
        const recent_exams = await db.models.Exam.findAll({
            attributes: ['exam_id', 'exam_date', 'start_time', 'created_at'],
            include: [{
                model: db.models.Subject,
                as: 'subject',
                attributes: ['subject_name']
            }],
            order: [['created_at', 'DESC']],
            limit: Math.floor(parseInt(limit) / 3),
            raw: true
        });
        
        recent_exams.forEach(exam => {
            recent_activities.push({
                id: `exam_${exam.exam_id}`,
                type: 'exam_scheduled',
                title: 'Kỳ thi mới được lên lịch',
                description: `${exam['subject.subject_name']} - ${new Date(exam.exam_date).toLocaleDateString('vi-VN')} ${exam.start_time}`,
                timestamp: exam.created_at,
                icon: 'calendar-plus',
                color: 'primary'
            });
        });
        
        // Recent registrations
        const recent_registrations = await db.models.Registration.findAll({
            attributes: ['registration_id', 'created_at'],
            include: [
                {
                    model: db.models.User,
                    as: 'student',
                    attributes: ['full_name']
                },
                {
                    model: db.models.Exam,
                    as: 'exam',
                    include: [{
                        model: db.models.Subject,
                        as: 'subject',
                        attributes: ['subject_name']
                    }]
                }
            ],
            order: [['created_at', 'DESC']],
            limit: Math.floor(parseInt(limit) / 3),
            raw: true
        });
        
        recent_registrations.forEach(reg => {
            recent_activities.push({
                id: `registration_${reg.registration_id}`,
                type: 'exam_registration',
                title: 'Đăng ký thi mới',
                description: `${reg['student.full_name']} đăng ký thi ${reg['exam.subject.subject_name']}`,
                timestamp: reg.created_at,
                icon: 'file-text',
                color: 'info'
            });
        });
        
        // Sort all activities by timestamp and limit
        const sorted_activities = recent_activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, parseInt(limit))
            .map(activity => ({
                ...activity,
                relative_time: getRelativeTime(activity.timestamp)
            }));
        
        res.json({
            success: true,
            data: {
                activities: sorted_activities,
                total_count: sorted_activities.length,
                last_updated: new Date().toISOString()
            },
            message: 'Hoạt động gần đây được tải thành công'
        });
        
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải hoạt động gần đây',
            error: error.message
        });
    }
};

/**
 * Helper function to get relative time display
 * 
 * @param {Date} timestamp - The timestamp to convert
 * @returns {string} Relative time string in Vietnamese
 */
const getRelativeTime = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diff = Math.floor((now - past) / 1000); // seconds
    
    if (diff < 60) return 'vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
    return past.toLocaleDateString('vi-VN');
};

module.exports = {
    getSystemStatistics,
    getEnrollmentStatistics,
    getExamStatistics,
    getRecentActivity
};
