/**
 * Define model associations for the ExamPro Scheduler
 *
 * This file establishes relationships between database models:
 * - Many-to-many: User (proctors) to Exams through ExamProctor
 * - One-to-many: User to Registrations, Subject to Exams, Room to Exams
 * - Many-to-one: Registration to User, Registration to Exam
 */

const { sequelize, create_temp_connection } = require('../config/database');
const { Op } = require("sequelize");
const User = require("./users");
const Exam = require("./exams");
const Registration = require("./registrations");
const Subject = require("./subjects");
const Room = require("./rooms");
const ExamProctor = require("./examProctors");
const Enrollment = require("./enrollments");
const Class = require("./classes");
const Notification = require("./notifications");

require('dotenv').config(); // Load environment variables from .env file

// =============================================
// Define associations between models
// =============================================

// User associations
User.hasMany(Registration, {
	foreignKey: "student_id",
	as: "exam_registrations",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

User.hasMany(Enrollment, {
    foreignKey: "student_id",
    as: "subject_enrollments",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

// Class-User relationship (essential for exam management)
User.belongsTo(Class, {
    foreignKey: "class_id",
    as: "student_class",
    onDelete: "SET NULL",  // If class is deleted, student remains but loses class reference
    onUpdate: "CASCADE"
});

User.hasMany(Notification, {
    foreignKey: "user_id",
    as: "notifications",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

Notification.belongsTo(User, {
    foreignKey: "user_id",
    as: "recipient",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

Class.hasMany(User, {
    foreignKey: "class_id",
    as: "students",
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
});

// Teacher can be homeroom teacher for a class
Class.belongsTo(User, {
    foreignKey: "teacher_id",
    as: "homeroom_teacher",
    onDelete: "SET NULL",  // If teacher is deleted, class remains
    onUpdate: "CASCADE"
});

// Proctor-Exam - Many-to-Many relationship (simplified constraints)
User.belongsToMany(Exam, {
	through: ExamProctor,
	foreignKey: "proctor_id",
	otherKey: "exam_id",
	as: "proctored_exams",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

Exam.belongsToMany(User, {
	through: ExamProctor,
	foreignKey: "exam_id",
	otherKey: "proctor_id",
	as: "proctors",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

// Exam associations
Exam.belongsTo(Room, { 
    foreignKey: "room_id", 
    as: "room",
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
});

Exam.belongsTo(Subject, { 
    foreignKey: "subject_code", 
    targetKey: "subject_code",
    as: "subject",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE"
});

// Exam-Class relationship (for targeted class exams)
Exam.belongsTo(Class, {
    foreignKey: "class_id",
    as: "target_class",
    onDelete: "SET NULL",  // If class is deleted, exam becomes general
    onUpdate: "CASCADE"
});

Class.hasMany(Exam, {
    foreignKey: "class_id", 
    as: "class_exams",
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
});

Exam.hasMany(Registration, {
    foreignKey: 'exam_id',
    as: 'registrations',
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

// ExamProctor associations for direct queries
ExamProctor.belongsTo(Exam, {
    foreignKey: 'exam_id',
    as: 'exam',
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

ExamProctor.belongsTo(User, {
    foreignKey: 'proctor_id',
    as: 'proctor',
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

// Subject associations
Subject.hasMany(Exam, {
	foreignKey: "subject_code",
	sourceKey: "subject_code",
	as: "exams",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE"
});

Subject.hasMany(Enrollment, {
    foreignKey: "subject_code",
    sourceKey: "subject_code", 
    as: "enrollments",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE"
});

// Registration associations
Registration.belongsTo(User, { 
	foreignKey: "student_id", 
	as: "student",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

Registration.belongsTo(Exam, { 
    foreignKey: "exam_id", 
    as: "exam",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

// Room associations
Room.hasMany(Exam, { 
    foreignKey: "room_id", 
    as: "exams",
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
});

// Enrollment associations
Enrollment.belongsTo(User, {
    foreignKey: "student_id",
    as: "student",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

Enrollment.belongsTo(Subject, {
    foreignKey: "subject_code",
    targetKey: "subject_code",
    as: "subject", 
    onDelete: "RESTRICT",
    onUpdate: "CASCADE"
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
 * NUCLEAR OPTION: This implements a robust sync strategy that prevents
 * "Too many keys" errors by using a cleaner approach to database sync.
 * 
 * @async
 * @param {boolean} force - Whether to drop tables before creating
 * @returns {Promise<void>}
 */
async function syncDatabase() {
	try {
		console.log("🚀 Starting database synchronization...");
		
		// Option 1: Check if we need to force recreate due to index conflicts
		const should_force_recreate = process.env.DB_FORCE_RECREATE === 'true';
		
		if (should_force_recreate) {
			console.log("💣 FORCE RECREATE mode - dropping all tables...");
			await sequelize.drop();
			console.log("🗑️  All tables dropped successfully");
		}
		
		// Use the most conservative sync approach
		await sequelize.sync({ 
			force: false,     // Never force drop unless explicitly requested above
			alter: false,     // CRITICAL: Don't alter existing tables to prevent index duplication
			logging: false    // Reduce noise in logs
		});
		
		console.log("🗃️  Database tables synchronized successfully.");
		console.log("✅ Schema created to match model definitions.");
		
		// Verify critical tables exist
		const table_names = await sequelize.getQueryInterface().showAllTables();
		const required_tables = ['users', 'subjects', 'exams', 'rooms', 'classes'];
		const missing_tables = required_tables.filter(table => 
			!table_names.includes(table)
		);
		
		if (missing_tables.length > 0) {
			console.warn(`⚠️  Missing tables: ${missing_tables.join(', ')}`);
		} else {
			console.log("✅ All required tables present");
		}
		
	} catch (error) {
		console.error(`❌ Error synchronizing database: ${error}`);
		
		// Provide specific guidance for common issues
		if (error.message.includes('Too many keys specified')) {
			console.error("🔥 INDEX OVERFLOW DETECTED!");
			console.error("💡 SOLUTIONS:");
			console.error("   1. Set DB_FORCE_RECREATE=true in your .env file");
			console.error("   2. Or manually drop the database and restart");
			console.error("   3. Command: DROP DATABASE exam_scheduler_db; (then restart server)");
		}
		
		if (error.message.includes('ER_DUP_KEY')) {
			console.error("🔑 DUPLICATE KEY ERROR - Indexes already exist");
			console.error("💡 This is likely safe to ignore if tables are working");
		}
		
		// In development, we can be more aggressive about recovery
		if (process.env.NODE_ENV === 'development' && error.message.includes('Too many keys')) {
			console.error("🛠️  ATTEMPTING AUTOMATIC RECOVERY...");
			try {
				await sequelize.drop();
				console.log("🗑️  Dropped all tables for clean restart");
				await sequelize.sync({ force: false, alter: false });
				console.log("✅ Database recovered successfully");
				return; // Exit successfully
			} catch (recovery_error) {
				console.error("❌ Recovery failed:", recovery_error.message);
			}
		}
		
		// Don't kill the server - let it continue with existing schema
		console.error("⚠️  Continuing with existing database schema...");
	}
}

/**
 * Creates the database if it doesn't exist
 * 
 * This function connects to MySQL without specifying a database,
 * checks if our target database exists, and creates it if needed.
 * 
 * @async
 * @returns {Promise<void>}
 */
async function create_database_if_not_exists() {
    // 1. Create a new Sequelize instance without database name
    // 2. Use a raw query to check/create database
    // 3. Close the temporary connection

	const temp_connection = create_temp_connection();

	try {
		await temp_connection.authenticate();
		console.log(`[SERVER] Connected to MySQL server`);

		const databases = await temp_connection.query(
			'SHOW DATABASES LIKE ?', 
			{
				replacements: [ process.env.DB_NAME ],
				type: temp_connection.QueryTypes.SELECT
			}
		);

		if (databases.length === 0) {
			await temp_connection.query(`CREATE DATABASE ${process.env.DB_NAME}`);
			console.log(`📊 Database ${process.env.DB_NAME} created successfully`);
		} else {
			console.log(`📊 Database ${process.env.DB_NAME} already exists`);
		}

	} catch (error) {
        console.error('❌ Error creating database:', error.message);
        throw error;
	} finally {
		await temp_connection.close();
	}
}

async function create_default_admin_user() {
	const admin_exists = await User.findOne({ where: { user_role: 'admin' }});

	if (!admin_exists) {
		await User.create({
			user_name: 'admin',
			email: 'admin@exampro.local',
			password_hash: 'admin123',
			full_name: 'Default Admin',
			user_role: 'admin',
			is_active: true
		});
		console.log('✅ Default admin account created');
	}
}

/**
 * Nuclear option: Clean reset of database when indexes get messed up
 * 
 * This function drops and recreates the entire database schema.
 * Use this when you get "Too many keys" errors that won't go away.
 * 
 * @async
 * @returns {Promise<void>}
 */
async function nuclear_reset_database() {
	try {
		console.log("💣 NUCLEAR RESET: Dropping entire database...");
		
		// Drop all tables
		await sequelize.drop();
		console.log("🗑️  All tables dropped");
		
		// Recreate tables from scratch
		await sequelize.sync({ force: false });
		console.log("🏗️  Tables recreated from models");
		
		// Recreate default admin
		await create_default_admin_user();
		
		console.log("✅ Nuclear reset completed successfully");
		
	} catch (error) {
		console.error("❌ Nuclear reset failed:", error);
		throw error;
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
	models: {
		User,
		Exam,
		ExamProctor,
		Registration,
		Room,
		Subject,
		Enrollment,
		Class,
		Notification,
	},
	utility: {
		sequelize
	},
	methods: {
		testConnection,
		syncDatabase,
		create_database_if_not_exists,
		create_default_admin_user,
		nuclear_reset_database
	}
};