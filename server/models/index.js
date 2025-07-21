/**
 * Define model associations for the ExamPro Scheduler
 *
 * This file establishes relationships between database models:
 * - Many-to-many: User (proctors) to Exams through ExamProctor
 * - One-to-many: User to Registrations, Subject to Exams, Room to Exams
 * - Many-to-one: Registration to User, Registration to Exam
 */

const sequelize = require("../config/database");
const { Op } = require("sequelize");
const User = require("./users");
const Exam = require("./exams");
const Registration = require("./registrations");
const Subject = require("./subjects");
const Room = require("./rooms");
const ExamProctor = require("./examProctors");

// =============================================
// Define associations between models
// =============================================

// User associations
User.hasMany(Registration, {
	foreignKey: "student_id",
	as: "exam_registrations",
    onDelete: "CASCADE"
});

// Proctor-Exam - Many-to-Many relationship
User.belongsToMany(Exam, {
	through: ExamProctor,
	foreignKey: "proctor_id",
	otherKey: "exam_id",
	as: "proctored_exams",
});

Exam.belongsToMany(User, {
	through: ExamProctor,
	foreignKey: "exam_id",
	otherKey: "proctor_id",
	as: "proctors",
});

// Exam associations
Exam.belongsTo(Room, { 
    foreignKey: "room_id", 
    as: "room" 
});

Exam.belongsTo(Subject, { 
    foreignKey: "subject_code", 
    targetKey: "subject_code",
    as: "subject"
});

Exam.hasMany(Registration, {
    foreignKey: 'exam_id',
    as: 'registrations'
});

// Subject associations
Subject.hasMany(Exam, {
	foreignKey: "subject_code",
	sourceKey: "subject_code",
	as: "exams",
});

// Registration associations
Registration.belongsTo(User, { 
	foreignKey: "student_id", 
	as: "student"
});

Registration.belongsTo(Exam, { 
    foreignKey: "exam_id", 
    as: "exam"
});

// Room assocations
Room.hasMany(Exam, { 
    foreignKey: "room_id", 
    as: "exams"
});

// =============================================
// Database interactions
// =============================================

/**
 * Tests the database connection
 * 
 * This function attempts to connect to the database and logs the result.
 * It should be called when the server starts to verify database connectivity.
 * 
 * @async
 * @returns {Promise<void>}
 */
async function testConnection() {
	try {
		await sequelize.authenticate();
		console.log("Database connection established successfully");
	} catch (error) {
		console.error(`Unable to connect to the database: ${error}`);
	}
}

/**
 * Synchronizes database models with the database
 * 
 * This creates tables if they don't exist and updates them if they do.
 * Setting force to true would drop and recreate tables (destructive).
 * 
 * @async
 * @param {boolean} force - Whether to drop tables before creating
 * @returns {Promise<void>}
 */
async function syncDatabase() {
	try {
		await sequelize.sync({ force: false });
		console.log("Database synchronized successfully.");
	} catch (error) {
		console.error(`Error synchronizing database: ${error}`);
	}
}

// =============================================
// Add scopes for common queries
// =============================================

// Registration scopes for filtering
Registration.addScope('pending', {
    where: {
        registration_status: 'pending'
	}
});

Registration.addScope('approved', {
    where: {
        registration_status: 'approved'
	}
});

// Exam scopes for filtering
Exam.addScope('upcoming', {
	where: {
		exam_date: {
			[Op.gte]: new Date() // Operation greater or equal to current date
		}
	}
});

// =============================================
// Export models and utilities
// =============================================

module.exports = {
	sequelize,
	User,
	Exam,
	ExamProctor,
	Registration,
	Room,
	Subject,
	testConnection,
	syncDatabase,
};