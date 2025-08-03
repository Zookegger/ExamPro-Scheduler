const { models } = require('../models/index');
const { Class, User, Exam } = models;
const { Op } = require('sequelize');

/**
 * Class Controller for Exam Management
 * 
 * This controller handles class management operations that are essential
 * for organizing students and scheduling exams efficiently.
 */

/**
 * Get all classes with student counts and exam statistics
 * Essential for exam planning and room allocation
 */
const get_all_classes = async (req, res) => {
    try {
        const classes = await Class.findAll({
            include: [
                {
                    model: User,
                    as: 'students',
                    attributes: ['user_id', 'full_name', 'user_name'],
                    where: { user_role: 'student', is_active: true },
                    required: false
                },
                {
                    model: User,
                    as: 'homeroom_teacher',
                    attributes: ['user_id', 'full_name', 'user_name'],
                    required: false
                },
                {
                    model: Exam,
                    as: 'class_exams',
                    attributes: ['exam_id', 'title', 'exam_date', 'status'],
                    required: false
                }
            ],
            order: [['grade_level', 'DESC'], ['class_code', 'ASC']]
        });

        // Add computed fields for exam management
        const classes_with_stats = classes.map(class_record => {
            const class_data = class_record.toJSON();
            return {
                ...class_data,
                student_count: class_data.students ? class_data.students.length : 0,
                upcoming_exams: class_data.class_exams ? 
                    class_data.class_exams.filter(exam => 
                        exam.status === 'published' && new Date(exam.exam_date) >= new Date()
                    ).length : 0,
                available_spots: class_data.max_students - (class_data.students ? class_data.students.length : 0)
            };
        });

        res.json({
            success: true,
            data: classes_with_stats,
            message: 'Classes retrieved successfully for exam management'
        });
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch classes',
            error: error.message
        });
    }
};

/**
 * Get class details with students and exam schedule
 * Used for detailed exam planning for a specific class
 */
const get_class_details = async (req, res) => {
    try {
        const { class_id } = req.params;

        const class_details = await Class.findByPk(class_id, {
            include: [
                {
                    model: User,
                    as: 'students',
                    attributes: ['user_id', 'full_name', 'user_name', 'email'],
                    where: { user_role: 'student', is_active: true },
                    required: false
                },
                {
                    model: User,
                    as: 'homeroom_teacher',
                    attributes: ['user_id', 'full_name', 'user_name', 'email'],
                    required: false
                },
                {
                    model: Exam,
                    as: 'class_exams',
                    include: [
                        {
                            model: models.Subject,
                            as: 'subject',
                            attributes: ['subject_name', 'subject_code']
                        },
                        {
                            model: models.Room,
                            as: 'room',
                            attributes: ['room_name', 'capacity']
                        }
                    ],
                    required: false
                }
            ]
        });

        if (!class_details) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        res.json({
            success: true,
            data: class_details,
            message: 'Class details retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching class details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch class details',
            error: error.message
        });
    }
};

/**
 * Create a new class for exam management
 */
const create_class = async (req, res) => {
    try {
        const { 
            class_code, 
            class_name, 
            academic_year, 
            grade_level, 
            teacher_id, 
            max_students 
        } = req.body;

        // Validate required fields
        if (!class_code || !class_name || !academic_year || !grade_level) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: class_code, class_name, academic_year, grade_level'
            });
        }

        // Check if teacher exists (if provided)
        if (teacher_id) {
            const teacher = await User.findOne({
                where: { 
                    user_id: teacher_id, 
                    user_role: 'teacher', 
                    is_active: true 
                }
            });
            
            if (!teacher) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid teacher ID or teacher not active'
                });
            }
        }

        const new_class = await Class.create({
            class_code,
            class_name,
            academic_year,
            grade_level,
            teacher_id: teacher_id || null,
            max_students: max_students || 35
        });

        res.status(201).json({
            success: true,
            data: new_class,
            message: 'Class created successfully for exam management'
        });
    } catch (error) {
        console.error('Error creating class:', error);
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'Class code already exists for this academic year'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create class',
            error: error.message
        });
    }
};

/**
 * Update class information
 */
const update_class = async (req, res) => {
    try {
        const { class_id } = req.params;
        const updates = req.body;

        // Validate teacher if updating teacher_id
        if (updates.teacher_id) {
            const teacher = await User.findOne({
                where: { 
                    user_id: updates.teacher_id, 
                    user_role: 'teacher', 
                    is_active: true 
                }
            });
            
            if (!teacher) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid teacher ID or teacher not active'
                });
            }
        }

        const [updated_rows] = await Class.update(updates, {
            where: { class_id }
        });

        if (updated_rows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        const updated_class = await Class.findByPk(class_id);
        
        res.json({
            success: true,
            data: updated_class,
            message: 'Class updated successfully'
        });
    } catch (error) {
        console.error('Error updating class:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update class',
            error: error.message
        });
    }
};

/**
 * Get students in a class (for exam registration purposes)
 */
const get_class_students = async (req, res) => {
    try {
        const { class_id } = req.params;

        const students = await User.findAll({
            where: { 
                class_id, 
                user_role: 'student', 
                is_active: true 
            },
            attributes: ['user_id', 'user_name', 'full_name', 'email'],
            include: [
                {
                    model: models.Enrollment,
                    as: 'subject_enrollments',
                    attributes: ['subject_code', 'status'],
                    required: false
                }
            ],
            order: [['full_name', 'ASC']]
        });

        res.json({
            success: true,
            data: students,
            message: `Students in class retrieved for exam management`
        });
    } catch (error) {
        console.error('Error fetching class students:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch class students',
            error: error.message
        });
    }
};

/**
 * Add student to class
 * Useful for managing class enrollment and exam eligibility
 */
const add_student_to_class = async (req, res) => {
    try {
        const { class_id } = req.params;
        const { student_id } = req.body;

        // Check if user is admin or teacher
        if (req.user.user_role !== 'admin' && req.user.user_role !== 'teacher') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện thao tác này'
            });
        }

        // Validate student exists and is actually a student
        const student = await User.findOne({
            where: { 
                user_id: student_id, 
                user_role: 'student', 
                is_active: true 
            }
        });

        if (!student) {
            return res.status(400).json({
                success: false,
                message: 'Student not found or invalid'
            });
        }

        // Check if class exists and has capacity
        const class_info = await Class.findByPk(class_id);
        if (!class_info) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Check current enrollment
        const current_count = await User.count({
            where: { class_id, user_role: 'student', is_active: true }
        });

        if (current_count >= class_info.max_students) {
            return res.status(400).json({
                success: false,
                message: 'Class has reached maximum capacity'
            });
        }

        // Check if student is already in another class for the same academic year
        const existing_class = await User.findOne({
            where: { user_id: student_id },
            include: [{
                model: Class,
                as: 'student_class',
                where: { 
                    academic_year: class_info.academic_year,
                    is_active: true 
                },
                required: false
            }]
        });

        if (existing_class && existing_class.student_class) {
            return res.status(400).json({
                success: false,
                message: 'Student is already enrolled in another class for this academic year'
            });
        }

        // Add student to class
        await User.update(
            { class_id },
            { where: { user_id: student_id } }
        );

        // Update class student count
        await Class.update(
            { current_students: current_count + 1 },
            { where: { class_id } }
        );

        res.json({
            success: true,
            message: 'Student added to class successfully'
        });

    } catch (error) {
        console.error('Error adding student to class:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add student to class',
            error: error.message
        });
    }
};

/**
 * Remove student from class
 * Useful for managing class transfers and exam eligibility
 */
const remove_student_from_class = async (req, res) => {
    try {
        const { class_id, student_id } = req.params;

        // Check if user is admin or teacher
        if (req.user.user_role !== 'admin' && req.user.user_role !== 'teacher') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện thao tác này'
            });
        }

        // Verify student is in the specified class
        const student = await User.findOne({
            where: { 
                user_id: student_id, 
                class_id, 
                user_role: 'student' 
            }
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found in this class'
            });
        }

        // Remove student from class
        await User.update(
            { class_id: null },
            { where: { user_id: student_id } }
        );

        // Update class student count
        const current_count = await User.count({
            where: { class_id, user_role: 'student', is_active: true }
        });

        await Class.update(
            { current_students: current_count },
            { where: { class_id } }
        );

        res.json({
            success: true,
            message: 'Student removed from class successfully'
        });

    } catch (error) {
        console.error('Error removing student from class:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove student from class',
            error: error.message
        });
    }
};

/**
 * Get class exam schedule
 * Provides a focused view of upcoming exams for a specific class
 */
const get_class_exam_schedule = async (req, res) => {
    try {
        const { class_id } = req.params;
        const { start_date, end_date } = req.query;

        let date_filter = {};
        if (start_date && end_date) {
            date_filter = {
                exam_date: {
                    [Op.between]: [new Date(start_date), new Date(end_date)]
                }
            };
        } else {
            // Default to upcoming exams (next 30 days)
            const today = new Date();
            const future_date = new Date();
            future_date.setDate(today.getDate() + 30);
            
            date_filter = {
                exam_date: {
                    [Op.between]: [today, future_date]
                }
            };
        }

        const exams = await Exam.findAll({
            where: {
                class_id,
                status: 'published',
                ...date_filter
            },
            include: [
                {
                    model: models.Subject,
                    as: 'subject',
                    attributes: ['subject_name', 'subject_code']
                },
                {
                    model: models.Room,
                    as: 'room',
                    attributes: ['room_name', 'building', 'capacity']
                },
                {
                    model: User,
                    as: 'proctors',
                    attributes: ['full_name', 'user_name'],
                    through: { attributes: [] }
                }
            ],
            order: [['exam_date', 'ASC'], ['start_time', 'ASC']]
        });

        res.json({
            success: true,
            data: exams,
            message: 'Class exam schedule retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching class exam schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch class exam schedule',
            error: error.message
        });
    }
};

/**
 * Get system-wide class statistics
 * Useful for admin dashboards and system overview
 */
const get_class_statistics = async (req, res) => {
    try {
        const { academic_year } = req.query;

        // Check admin permission
        if (req.user.user_role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập thống kê này'
            });
        }

        let where_clause = { is_active: true };
        if (academic_year) {
            where_clause.academic_year = academic_year;
        }

        // Get basic class counts
        const total_classes = await Class.count({ where: where_clause });
        
        const classes_by_grade = await Class.findAll({
            where: where_clause,
            attributes: [
                'grade_level',
                [models.sequelize.fn('COUNT', models.sequelize.col('class_id')), 'class_count'],
                [models.sequelize.fn('SUM', models.sequelize.col('current_students')), 'total_students'],
                [models.sequelize.fn('AVG', models.sequelize.col('current_students')), 'avg_students_per_class']
            ],
            group: ['grade_level'],
            order: [['grade_level', 'DESC']]
        });

        // Get classes without homeroom teachers
        const classes_without_teachers = await Class.count({
            where: {
                ...where_clause,
                teacher_id: null
            }
        });

        // Get total students across all classes
        const total_students = await User.count({
            where: { user_role: 'student', is_active: true },
            include: [{
                model: Class,
                as: 'student_class',
                where: where_clause,
                required: true
            }]
        });

        // Get classes that are full (at capacity)
        const full_classes = await Class.count({
            where: {
                ...where_clause,
                [Op.and]: [
                    models.sequelize.where(
                        models.sequelize.col('current_students'),
                        '>=',
                        models.sequelize.col('max_students')
                    )
                ]
            }
        });

        res.json({
            success: true,
            data: {
                overview: {
                    total_classes,
                    total_students,
                    classes_without_teachers,
                    full_classes,
                    average_class_size: total_students / total_classes || 0
                },
                by_grade_level: classes_by_grade,
                academic_year: academic_year || 'All years'
            },
            message: 'Class statistics retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching class statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch class statistics',
            error: error.message
        });
    }
};

module.exports = {
    get_all_classes,
    get_class_details,
    create_class,
    update_class,
    get_class_students,
    add_student_to_class,
    remove_student_from_class,
    get_class_exam_schedule,
    get_class_statistics
};
