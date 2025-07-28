const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * ExamProctor Model
 * 
 * This model represents the many-to-many relationship between exams and proctors (teachers).
 * It allows multiple teachers to proctor a single exam, and a teacher to proctor multiple exams.
 * 
 * @property {number} exam_proctor_id - Unique identifier for each assignment
 * @property {number} exam_id - Reference to the exam
 * @property {number} proctor_id - Reference to the teacher who proctors the exam
 * @property {string} role - Role of the proctor in this exam (primary, assistant, etc.)
 * @property {string} notes - Optional notes about this proctor assignment
 * 
 * @example
 * // How to assign a proctor to an exam:
 * const assignment = await ExamProctor.create({
 *   exam_id: 15,
 *   proctor_id: 5,
 *   role: 'primary'
 * });
 */
const ExamProctor = sequelize.define('ExamProctor', {
    exam_proctor_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique identifier for each proctor assignment'
    },
    exam_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Reference to the exam'
    },
    proctor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Reference to the teacher who proctors the exam'
    },
    role: {
        type: DataTypes.ENUM('primary', 'assistant', 'substitute', 'observer'),
        allowNull: false,
        defaultValue: 'assistant',
        comment: 'Role of the proctor in this exam'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Optional notes about this proctor assignment'
    }
}, {
    tableName: 'exam_proctors',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    engine: 'InnoDB',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [{
        unique: true,
        fields: ['exam_id', 'proctor_id'],
        name: 'exam_proctor_unique'
    }]
});

module.exports = ExamProctor;