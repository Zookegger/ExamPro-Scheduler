const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Class Model
 * 
 * This model represents academic classes/grades for exam management.
 * Essential for organizing students and scheduling exams efficiently.
 * 
 * @property {number} class_id - Unique identifier for the class
 * @property {string} class_code - Unique code for the class (e.g., "12A1", "11B2")
 * @property {string} class_name - Full name of the class
 * @property {string} academic_year - Academic year (e.g., "2024-2025")
 * @property {number} grade_level - Grade level (10, 11, 12 for high school)
 * @property {number} teacher_id - Reference to homeroom teacher
 * @property {number} max_students - Maximum number of students in class
 * @property {number} current_students - Current number of enrolled students
 * @property {boolean} is_active - Whether the class is currently active
 * 
 * @example
 * // How to create a new class for exam management:
 * const newClass = await Class.create({
 *   class_code: '12A1',
 *   class_name: 'Lớp 12A1 - Khối Tự Nhiên',
 *   academic_year: '2024-2025',
 *   grade_level: 12,
 *   teacher_id: 5,
 *   max_students: 35
 * });
 */
const Class = sequelize.define('Class', {
    class_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique identifier for each class'
    },
    class_code: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: 'Class code (e.g., "12A1", "11B2") - reused each academic year'
    },
    class_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Full name of the class'
    },
    academic_year: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: 'Academic year (e.g., "2024-2025")'
    },
    grade_level: {
        type: DataTypes.TINYINT,
        allowNull: false,
        validate: {
            min: 10,
            max: 12
        },
        comment: 'Grade level (10, 11, 12 for high school)'
    },
    teacher_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Reference to homeroom teacher (User with role=teacher)'
    },
    max_students: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 35,
        comment: 'Maximum number of students in class'
    },
    current_students: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Current number of enrolled students'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the class is currently active'
    }
}, {
    tableName: 'classes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    engine: 'InnoDB',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [{
        unique: true,
        fields: ['class_code', 'academic_year'],
        name: 'unique_class_code_year'
    }]
});

module.exports = Class;
