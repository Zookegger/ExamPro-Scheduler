// Import necessary libraries
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Registration Model
 * 
 * This model handles student registrations for exams.
 * 
 * @property {number} registration_id - Unique identifier for each registration
 * @property {number} student_id - Reference to the student user
 * @property {number} exam_id - Reference to the exam being registered for
 * @property {string} registration_status - Status of the registration
 * @property {date} registered_at - When the student registered
 * @property {string} attendance_status - Whether student attended the exam
 * 
 * @example
 * // How to create a new registration:
 * const newRegistration = await Registration.create({
 *   student_id: 42,
 *   exam_id: 15,
 *   registration_status: 'pending'
 * });
 */
const Registration = sequelize.define('Registration', {
    registration_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique identifier for each registration'
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Reference to the student user'
    },
    exam_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Reference to the exam being registered for'
    },
    registration_status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Status of the registration'
    },
    registered_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'When the student registered'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Optional notes about the registration'
    },
    attendance_status: {
        type: DataTypes.ENUM('not_recorded', 'present', 'absent', 'late'),
        allowNull: false,
        defaultValue: 'not_recorded',
        comment: 'Whether student attended the exam'
    }
}, {
    tableName: 'registrations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Registration;