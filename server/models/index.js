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

Exam.hasMany(Registration, {
    foreignKey: 'exam_id',
    as: 'registrations',
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
 * Using alter: true for development to modify existing tables safely.
 * 
 * @async
 * @param {boolean} force - Whether to drop tables before creating
 * @returns {Promise<void>}
 */
async function syncDatabase() {
	try {
		// Use alter: true for development - modifies existing tables without dropping them
		// This avoids the "too many keys" error by working with existing schema
		await sequelize.sync({ 
			alter: process.env.NODE_ENV === 'development',
			force: false // Never force drop in production
		});
		console.log("🗃️  Database tables synchronized successfully.");
		console.log("✅ Schema updated to match model definitions.");
	} catch (error) {
		console.error(`❌ Error synchronizing database: ${error}`);
		
		// If sync fails due to key limit, try without altering
		if (error.message.includes('Too many keys specified')) {
			console.log("🔧 Retrying sync without schema alterations...");
			try {
				await sequelize.sync({ force: false, alter: false });
				console.log("✅ Database sync completed without schema changes.");
			} catch (retryError) {
				console.error(`❌ Retry failed: ${retryError}`);
			}
		}
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
	},
	utility: {
		sequelize
	},
	methods: {
		testConnection,
		syncDatabase,
		create_database_if_not_exists,
		create_default_admin_user
	}
};