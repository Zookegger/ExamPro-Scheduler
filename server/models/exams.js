const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Exam Model
 * 
 * This model represents exam sessions in the system.
 * 
 * @property {number} exam_id - Unique identifier for the exam
 * @property {string} title - Name of the exam session
 * @property {string} subject_code - Code of the subject being tested
 * @property {string} description - Optional description of the exam
 * @property {date} exam_date - Date when the exam takes place
 * @property {time} start_time - When the exam starts
 * @property {time} end_time - When the exam ends
 * @property {number} duration_minutes - Length of the exam in minutes
 * @property {number} max_students - Maximum number of students allowed
 * @property {string} status - Current status (draft, published, completed, cancelled)
 * 
 * @example
 * // How to create a new exam:
 * const newExam = await Exam.create({
 *   title: 'Kỳ thi Toán học giữa kỳ',
 *   subject_code: 'MATH101',
 *   exam_date: '2024-08-15',
 *   start_time: '09:00:00',
 *   end_time: '11:00:00',
 *   duration_minutes: 120,
 *   max_students: 30,
 *   status: 'published',
 * });
 */

const Exam = sequelize.define('Exam', {
    exam_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique identifier for each exam'
    },
    title: {
        type: DataTypes.STRING(199),
        allowNull: false,
        comment: 'Name of the exam session'
    },
    subject_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Code of the subject being tested'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Optional description fo the exam'
    },
    exam_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: 'Date of exam'
    },
    start_time: {
        type: DataTypes.TIME,
        allowNull: false,
        comment: 'When the exam starts'
    },
    end_time: {
        type: DataTypes.TIME,
        allowNull: false,
        comment: 'When the exam ends'
    },
    duration_minutes: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        comment: 'Lenght of the exam in minutes'
    },
    max_students: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 20,
        comment: 'Maximum number of students allowed'
    },
    room_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Reference to the room where exam takes place'
    },
    class_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Reference to specific class taking the exam (for targeted scheduling)'
    },
    grade_level: {
        type: DataTypes.TINYINT,
        allowNull: true,
        validate: {
            min: 10,
            max: 12
        },
        comment: 'Grade level for the exam (10, 11, 12) - helps with scheduling'
    },
    method: {
        type: DataTypes.ENUM('essay', 'multiple_choices'),
        allowNull: false,
        comment: 'Method of examination'
    },
    status: {
        type: DataTypes.ENUM('draft', 'published', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
        comment: 'Current status of the exam'
    }
}, {
    tableName: 'exams',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    engine: 'InnoDB',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
});

module.exports = Exam;