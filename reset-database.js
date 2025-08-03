#!/usr/bin/env node

/**
 * Database Reset Script
 * 
 * Use this script when you're tired of "Too many keys" errors.
 * It will completely reset your database with a clean schema.
 * 
 * Usage:
 *   node reset-database.js
 * 
 * Or add to package.json:
 *   "reset-db": "node reset-database.js"
 */

require('dotenv').config();
const { methods } = require('./server/models');

async function main() {
    console.log('🔥 Database Reset Script');
    console.log('=======================');
    
    try {
        // Nuclear reset - drops everything and recreates
        await methods.nuclear_reset_database();
        
        console.log('');
        console.log('✅ Database reset completed successfully!');
        console.log('🚀 You can now restart your server without index errors.');
        
    } catch (error) {
        console.error('❌ Reset failed:', error.message);
        console.error('');
        console.error('💡 Manual steps:');
        console.error('   1. Connect to MySQL: mysql -u root -p');
        console.error('   2. Drop database: DROP DATABASE exam_scheduler_db;');
        console.error('   3. Restart your server');
        
        process.exit(1);
    }
    
    process.exit(0);
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
    process.exit(1);
});

main();
