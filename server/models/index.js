const sequelize = require('../config/database');
const User = require('../models/User');

// Test database connection
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully');
    } catch (error) {
        console.error(`Unable to connect to the database: ${error}`);
    }
}

// Sync database
async function syncDatabase() {
    try {
        await sequelize.sync({ force: false });
        console.log('Database synchronized successfully.');
    } catch (error) {
        console.error(`Error synchronizing database: ${error}`);
    }
}

module.exports = {
    sequelize,
    User,
    testConnection,
    syncDatabase
};