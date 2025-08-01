const express = require('express');
const router = express.Router();
const db = require('../models');
const { utility } = require('../models');
const { Op, Sequelize } = require('sequelize');


const diagnose_router = express.Router();
/**
 * Force Database Synchronization
 * 
 * @route POST /api/admin/diagnose/sync-database
 * @description Forcefully recreates all database tables with current model schemas
 * @access Admin only (DEVELOPMENT ONLY - DESTRUCTIVE OPERATION)
 * @warning ⚠️ This DELETES ALL DATA and recreates tables from scratch
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {string} response.message - Status message
 * @returns {string} response.timestamp - Operation timestamp
 * @returns {string} response.warning - Data loss warning
 * 
 * @example
 * // Request
 * POST /api/admin/diagnose/sync-database
 * Content-Type: application/json
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "message": "Database synced successfully with force option",
 *   "timestamp": "2025-01-29T10:30:00.000Z",
 *   "warning": "All data has been cleared and tables recreated"
 * }
 * 
 * // Error Response (500)
 * {
 *   "success": false,
 *   "message": "Database sync failed",
 *   "error": "Connection timeout"
 * }
 */
diagnose_router.post('/sync-database', async (req, res) => {
    try {
        console.log('🔄 Starting force database sync...');
        
        // Force sync all models
        await utility.sequelize.sync({ force: true });
        
        console.log('✅ Database force sync completed successfully');
        
        res.json({
            success: true,
            message: 'Database synced successfully with force option',
            timestamp: new Date().toISOString(),
            warning: 'All data has been cleared and tables recreated'
        });
    } catch (error) {
        console.error('❌ Database sync failed:', error);
        res.status(500).json({
            success: false,
            message: 'Database sync failed',
            error: error.message
        });
    }
});

/**
 * Get Database Table Status
 * 
 * @route GET /api/admin/diagnose/table-status
 * @description Check existence and status of all database tables
 * @access Admin only
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {Object} response.tables - Status of each model's table
 * @returns {boolean} response.tables[modelName].exists - Whether table exists
 * @returns {number} [response.tables[modelName].recordCount] - Number of records if exists
 * @returns {Object} [response.tables[modelName].hasTimestamps] - Timestamp fields status
 * @returns {Object} [response.tables[modelName].lastRecord] - Sample of last record
 * @returns {string} response.timestamp - Operation timestamp
 * 
 * @example
 * // Request
 * GET /api/admin/table-status
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "tables": {
 *     "User": {
 *       "exists": true,
 *       "recordCount": 42,
 *       "hasTimestamps": {
 *         "created_at": true,
 *         "updated_at": true
 *       },
 *       "lastRecord": {
 *         "id": 123,
 *         "created_at": "2025-01-28T15:30:00.000Z",
 *         "updated_at": "2025-01-28T15:30:00.000Z"
 *       }
 *     }
 *   },
 *   "timestamp": "2025-01-29T10:30:00.000Z"
 * }
 */
diagnose_router.get('/table-status', async (req, res) => {
    try {
        const tables = {};
        
        console.log("Route hit!");

        // Check each model table
        const modelNames = Object.keys(db.models).filter(name => 
            name !== 'sequelize' && name !== 'Sequelize' 
        );
        
        for (const modelName of modelNames) {
            const model = db.models[modelName];
            try {
                const count = await model.count();
                const sampleRecord = await model.findOne({
                    order: [['created_at', 'DESC']]
                });
                
                tables[modelName] = {
                    exists: true,
                    recordCount: count,
                    hasTimestamps: sampleRecord ? {
                        created_at: sampleRecord.created_at !== null,
                        updated_at: sampleRecord.updated_at !== null
                    } : null,
                    lastRecord: sampleRecord ? {
                        id: sampleRecord.id,
                        created_at: sampleRecord.created_at,
                        updated_at: sampleRecord.updated_at
                    } : null
                };
            } catch (error) {
                tables[modelName] = {
                    exists: false,
                    error: error.message
                };
            }
        }
        
        res.json({
            success: true,
            tables: tables,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Table status check failed:', error);
        res.status(500).json({
            success: false,
            message: 'Table status check failed',
            error: error.message
        });
    }
});

/**
 * Clear Test Data
 * 
 * @route DELETE /api/admin/diagnose/clear-test-data
 * @description Remove test data from database (development only)
 * @access Admin only
 * @warning Removes records matching test patterns
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {string} response.message - Status message
 * @returns {Object} response.deletedCounts - Counts of deleted records by type
 * @returns {string} response.timestamp - Operation timestamp
 * 
 * @example
 * // Request
 * DELETE /api/admin/clear-test-data
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "message": "Test data cleared successfully",
 *   "deletedCounts": {
 *     "subjects": 15,
 *     "users": 8
 *   },
 *   "timestamp": "2025-01-29T10:30:00.000Z"
 * }
 */
diagnose_router.delete('/clear-test-data', async (req, res) => {
    try {
        console.log('🗑️ Starting test data cleanup...');
        
        const deletedCounts = {};
        
        // Clear test subjects (those with subject_code starting with TEST_)
        const deletedSubjects = await db.models.Subject.destroy({
            where: {
                subject_code: {
                    [Sequelize.Op.like]: 'TEST_%'
                }
            }
        });
        deletedCounts.subjects = deletedSubjects;
        const deletedUsers = await db.models.User.destroy({
            where: {
                [Sequelize.Op.or]: [
                    { email: { [Sequelize.Op.like]: '%test%' } },
                    { email: { [Sequelize.Op.like]: '%demo%' } },
                    { full_name: { [Sequelize.Op.like]: 'Test %' } }
                ]
            }
        });
        deletedCounts.users = deletedUsers;
        
        console.log(`✅ Test data cleanup completed:`, deletedCounts);
        
        res.json({
            success: true,
            message: 'Test data cleared successfully',
            deletedCounts: deletedCounts,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Test data cleanup failed:', error);
        res.status(500).json({
            success: false,
            message: 'Test data cleanup failed',
            error: error.message
        });
    }
});

/**
 * Get Database Connection Information
 * 
 * @route GET /api/admin/diagnose/db-info
 * @description Retrieve database connection configuration
 * @access Admin only
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Operation status
 * @returns {Object} response.info - Database connection info
 * @returns {string} response.info.dialect - Database dialect
 * @returns {string} response.info.database - Database name
 * @returns {string} response.info.host - Database host
 * @returns {number} response.info.port - Database port
 * @returns {Promise<boolean>} response.info.isConnected - Connection status promise
 * @returns {string} response.timestamp - Operation timestamp
 * 
 * @example
 * // Request
 * GET /api/admin/db-info
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "info": {
 *     "dialect": "mysql",
 *     "database": "myapp_dev",
 *     "host": "localhost",
 *     "port": 3306,
 *     "isConnected": true
 *   },
 *   "timestamp": "2025-01-29T10:30:00.000Z"
 * }
 */
router.get('/db-info', async (req, res) => {
    try {
        const connectivity_check = await utility.sequelize.authenticate().then(() => true).catch(() => false);

        const info = {
            dialect: utility.sequelize.getDialect(),
            database: utility.sequelize.config.database,
            host: utility.sequelize.config.host,
            port: utility.sequelize.config.port,
            isConnected: connectivity_check
        };
        
        res.json({
            success: true,
            info: info,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get database info',
            error: error.message
        });
    }
});

router.use('/diagnose', diagnose_router);





module.exports = router;
