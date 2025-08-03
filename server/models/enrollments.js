const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Enrollment Model
 * 
 * This model represents student enrollments in subjects/courses.
 * Critical for validating that students can only register for exams
 * in subjects they are actually enrolled in.
 * 
 * @property {number} enrollment_id - Unique identifier for each enrollment
 * @property {number} student_id - Reference to student (User with role=student)
 * @property {string} subject_code - Subject the student is enrolled in
 * @property {string} semester - Academic semester (e.g., "2024-1")
 * @property {string} status - Enrollment status (enrolled, dropped, completed)
 * 
 * @example
 * // How to create a new enrollment:
 * const newEnrollment = await Enrollment.create({
 *   student_id: 42,
 *   subject_code: 'MATH101',
 *   semester: '2024-1',
 *   status: 'enrolled'
 * });
 */
const Enrollment = sequelize.define('Enrollment', {
    enrollment_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique identifier for each enrollment'
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Reference to student (User with role=student)'
    },
    subject_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Subject the student is enrolled in'
    },
    semester: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: 'Academic semester (e.g., "2024-1")'
    },
    status: {
        type: DataTypes.ENUM('enrolled', 'dropped', 'completed'),
        allowNull: false,
        defaultValue: 'enrolled',
        comment: 'Enrollment status'
    }
}, {
    tableName: 'enrollments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    engine: 'InnoDB',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [{
        unique: true,
        fields: ['student_id', 'subject_code', 'semester'],
        name: 'unique_student_subject_semester'
    }]
});

module.exports = Enrollment;