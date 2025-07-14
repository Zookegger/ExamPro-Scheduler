// Import necessary libraries
const { Sequelize } = require('sequelize');

require('dotenv').config(); // Load environment variables from .env file

/**
 * Database Connection Setup
 * 
 * This file creates a connection to our MariaDB database using Sequelize,
 * which is a tool that helps us work with databases in JavaScript.
 * 
 * We're using environment variables (stored in a .env file) to keep
 * sensitive information like passwords secure.
 */

// Create a new database connection
const sequelize = new Sequelize(
    process.env.DB_NAME,         // The name of our database
    process.env.DB_USER,         // Username to connect to the database
    process.env.DB_PASSWORD,     // Password for the database user
    {
        // Configuration options
        host: process.env.DB_HOST,   // Where the database is located (like an address)
        port: process.env.DB_PORT,   // Which port to connect on (like a specific entrance)
        dialect: `mysql`,          // The type of database we're using
        
        // Only show SQL commands in the console during development
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        
        // Connection pool settings (manages multiple connections for better performance)
        pool: {
            max: 5,             // Maximum number of connections to create
            min: 0,             // Minimum number of connections to keep open
            acquire: 30000,     // Maximum time (in ms) to get a connection
            idle: 10000,        // Maximum time (in ms) a connection can be unused
        },
        
        // Default settings for all database models
        define: {
            underscored: true,          // Use snake_case for column names (e.g., user_name instead of userName)
            timestamps: true,           // Automatically add created_at and updated_at fields
            created_at: 'created_at',   // Custom name for the creation timestamp
            updated_at: 'updated_at'    // Custom name for the update timestamp
        }
    }
)

// Make this connection available to other files in our project
module.exports = sequelize;
