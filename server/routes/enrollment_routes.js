const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticate_jwt } = require('../middleware/auth');

/**
 * Enrollment Management Routes
 * 
 * This file contains routes for enrollment-related operations
 * such as enrolling students in subjects, viewing enrollments, etc.
 */

/**
 * Get all enrollments for a student
 * @route GET /api/enrollments/student/:student_id
 * @access Admin, Teacher, or the student themselves
 */
router.get('/student/:student_id', authenticate_jwt, async (req, res, next) => {
    try {
        const { student_id } = req.params;
        
        // Permission check: admin, teacher, or self
        if (req.user.user_role !== 'admin' && 
            req.user.user_role !== 'teacher' && 
            req.user.user_id !== parseInt(student_id)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập thông tin này'
            });
        }

        const enrollments = await db.models.Enrollment.findAll({
            where: { student_id },
            include: [{
                model: db.models.Subject,
                as: 'subject',
                attributes: ['subject_name', 'department', 'credit']
            }],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            enrollments,
            count: enrollments.length
        });

    } catch (error) {
        next(error);
    }
});

/**
 * Enroll a student in a subject
 * @route POST /api/enrollments/enroll
 * @access Admin only
 */
router.post('/enroll', authenticate_jwt, async (req, res, next) => {
    const transaction = await utility.sequelize.transaction();
    
    try {
        if (req.user.user_role !== 'admin') {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: 'Chỉ quản trị viên mới có thể đăng ký môn học cho học sinh'
            });
        }

        const { student_id, subject_code, semester } = req.body;

        // Validate required fields
        if (!student_id || !subject_code || !semester) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin: student_id, subject_code, semester'
            });
        }

        // Check if student exists
        const student = await db.models.User.findOne({
            where: { user_id: student_id, user_role: 'student' },
            transaction
        });

        if (!student) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy học sinh'
            });
        }

        // Check if subject exists
        const subject = await db.models.Subject.findOne({
            where: { subject_code },
            transaction
        });

        if (!subject) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy môn học'
            });
        }

        // Check for existing enrollment
        const existing_enrollment = await db.models.Enrollment.findOne({
            where: { student_id, subject_code, semester },
            transaction
        });

        if (existing_enrollment) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Học sinh đã đăng ký môn học này trong kỳ học này'
            });
        }

        // Create enrollment
        const enrollment = await db.models.Enrollment.create({
            student_id,
            subject_code,
            semester,
            status: 'enrolled'
        }, { transaction });

        await transaction.commit();
        console.log(`✅ Student ${student.full_name} enrolled in ${subject.subject_name} successfully with transaction`);

        res.status(201).json({
            success: true,
            message: 'Đăng ký môn học thành công',
            enrollment
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Enrollment creation failed, transaction rolled back:', error);
        next(error);
    }
});

/**
 * Get students eligible for an exam (enrolled in the subject)
 * @route GET /api/enrollments/eligible/:exam_id
 * @access Admin, Teacher
 */
router.get('/eligible/:exam_id', authenticate_jwt, async (req, res, next) => {
    try {
        if (req.user.user_role !== 'admin' && req.user.user_role !== 'teacher') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập thông tin này'
            });
        }

        const { exam_id } = req.params;

        // Get exam details
        const exam = await db.models.Exam.findByPk(exam_id);
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy kỳ thi'
            });
        }

        // Get students enrolled in the subject
        const eligible_students = await db.models.User.findAll({
            where: { user_role: 'student' },
            include: [{
                model: db.models.Enrollment,
                as: 'subject_enrollments',
                where: {
                    subject_code: exam.subject_code,
                    status: 'enrolled'
                },
                required: true
            }],
            attributes: ['user_id', 'full_name', 'email']
        });

        res.json({
            success: true,
            eligible_students,
            exam_subject: exam.subject_code,
            count: eligible_students.length
        });

    } catch (error) {
        next(error);
    }
});

/**
 * Error Handler Middleware for Enrollment Routes
 */
router.use((error, req, res, next) => {
    console.error('❌ Enrollment route error:', error);
    
    if (res.headersSent) {
        return next(error);
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            success: false,
            message: 'Học sinh đã đăng ký môn học này'
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống quản lý đăng ký',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
});

module.exports = router;
