// Import necessary libraries
const { DataTypes } = require('sequelize'); // Sequelize provides types for our database columns
const { sequelize } = require('../config/database'); // Our database connection
const bcrypt = require('bcryptjs'); // Library for password hashing (security)
const BCRYPT_SALT_LENGTH = 12; // How strong the password encryption will be

// Create User Table - This defines what information we store about each user
/**
 * User Model
 * 
 * This file creates a "User" table in our database with columns for each piece
 * of information we want to store about our users.
 * 
 * @property {number} user_id - The unique ID number for each user
 * @property {string} user_name - The user's unique username for login
 * @property {string} full_name - The user's full name
 * @property {string} email - The user's email address (must be valid format)
 * @property {string} password_hash - The user's password (stored securely as a hash)
 * @property {string} user_role - What type of user: 'student', 'teacher', or 'admin'
 * @property {number} class_id - Reference to student's class (essential for exam scheduling)
 * @property {boolean} is_active - Whether the user account is active (true) or disabled (false)
 * 
 * @example
 * // How to create a new student user for exam management:
 * const newStudent = await User.create({
 *   user_name: 'student001',
 *   full_name: 'Nguyen Van A',
 *   email: 'nguyenvana@example.com',
 *   password_hash: 'plainTextPassword', // Don't worry, this will be encrypted automatically
 *   user_role: 'student',
 *   class_id: 15 // Reference to the student's class for exam scheduling
 * });
 * 
 * // How to create a teacher (no class_id needed):
 * const newTeacher = await User.create({
 *   user_name: 'teacher001',
 *   full_name: 'Tran Thi B',
 *   email: 'tranthib@example.com',
 *   password_hash: 'plainTextPassword',
 *   user_role: 'teacher'
 *   // class_id is null for teachers - they can manage multiple classes
 * });
 */
const User = sequelize.define('User', {
    // Each object here defines a column in our database table
    user_id: {
        type: DataTypes.INTEGER, // This column stores whole numbers
        primaryKey: true, // This marks the column as the main identifier
        autoIncrement: true // This makes the ID increase automatically for each new user
    },
    user_name: {
        type: DataTypes.STRING(75),
        allowNull: false,
        unique: true,
    },
    full_name: {
        type: DataTypes.STRING(50), // Text, limited to 50 characters
        allowNull: false // This field cannot be empty
    },
    email: {
        type: DataTypes.STRING(75), // Text, limited to 75 characters
        allowNull: false, // This field cannot be empty
        unique: true, // Each email must be unique (no duplicates allowed)
        validate: {
            isEmail: true // Checks that the text is in email format (user@example.com)
        }
    },
    password_hash: {
        type: DataTypes.STRING(255), // Text, with room for the encrypted password
        allowNull: false // This field cannot be empty
    },
    user_role: {
        type: DataTypes.ENUM('student', 'teacher', 'admin'), // Only these three values are allowed
        allowNull: false, // This field cannot be empty
        defaultValue: 'student' // If no role is specified, 'student' is used
    },
    class_id: {
        type: DataTypes.INTEGER, // Reference to the class (for students only)
        allowNull: true, // Teachers and admins don't need a class
        comment: 'Reference to student class - essential for exam scheduling and management'
    },
    is_active: {
        type: DataTypes.BOOLEAN, // True or false values only
        defaultValue: true // New accounts are active by default
    }
}, {
    tableName: 'users', // The actual name of the table in the database
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    engine: 'InnoDB',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    hooks: {
        // This runs automatically before a new user is saved
        beforeCreate: async (user) => {
            user.password_hash = await user.hashPassword(user.password_hash);
        },
        // This runs automatically before a user info is updated
        beforeUpdate: async (user) => {
            if (user.changed('password_hash')) {
                user.password_hash = await user.hashPassword(user.password_hash);
            }
        }
    }
});

// Add a method to check if a password is correct
// This lets us verify a user's password during login
/**
 * Check password
 *  @param {string} password - User input password
*/
User.prototype.checkPassword = async function(password) {
    // bcrypt.compare safely checks if the provided password matches the stored hash
    return await bcrypt.compare(password, this.password_hash);
}

/**
 * Hash a password using bcryptjs
 * @param {string} plain_password
 * @returns {Promise<string>}
 */
User.prototype.hashPassword = async function(plain_password) {
    // This converts the plain text password to a secure encrypted version
    return await bcrypt.hash(plain_password, BCRYPT_SALT_LENGTH);
}

// Make the User model available to other files in our application
module.exports = User;