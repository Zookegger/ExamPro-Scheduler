// Import necessary libraries
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Subject Model
 * 
 * This model represents academic subjects in the system.
 * 
 * @property {number} subject_id - Unique identifier for the subject
 * @property {string} subject_code - Unique code for the subject (e.g., "MATH101")
 * @property {string} subject_name - Name of the subject in Vietnamese
 * @property {string} english_name - Optional English name of the subject
 * @property {string} department - Department that teaches this subject
 * @property {number} credit_hours - Number of credit hours for this subject
 * 
 * @example
 * // How to create a new subject:
 * const newSubject = await Subject.create({
 *   subject_code: 'MATH101',
 *   subject_name: 'Toán học đại cương',
 *   english_name: 'General Mathematics',
 *   department: 'Khoa Toán',
 *   credit_hours: 3
 * });
 */

const Subject = sequelize.define('Subject', {
    subject_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique identifier for each subject'
    },
    subject_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        comment: 'Unique code for the subject (e.g., "MATH101")'
    },
    subject_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        comment: 'Name of the subject'
    },
    department: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment:'Department that teaches this subject'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Description of the subject'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the subject is currently active'
    }
}, {
    tableName: 'subjects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Subject;