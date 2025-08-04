const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const morgan = require('morgan');
const cookie_parser = require('cookie-parser');
const { methods } = require('./models');

// Import WebSocket handlers
const { setup_websocket_handlers } = require('./websocket');
const { set_websocket_io } = require('./controllers/roomController');
const { setupAuthHandlers } = require('./websocket/authorizationHandlers');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * HTTP Server Creation
 * 
 * Creates an HTTP server that can handle both regular HTTP requests and 
 * WebSocket connections. This dual-purpose server allows us to serve
 * our REST API and real-time features from the same port.
 * 
 * @type {http.Server}
 */
const server = http.createServer(app);

/**
 * Socket.io WebSocket Server
 * 
 * Attaches Socket.io to the HTTP server for real-time communication.
 * Configured to accept connections from the React frontend running on port 3000.
 * 
 * Used for real-time features like:
 * - Live exam status updates
 * - Real-time notifications for students and teachers
 * - Connection health monitoring
 * 
 * @type {Server}
 */
const io_stream = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ["GET", "POST"],
        credentials: true
    },
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 Minutes
    }
});

// Import authentication functions
const { authenticateWebsocketUser } = require('./websocket/authorizationHandlers');

/**
 * WebSocket Authentication Middleware
 * 
 * Authenticates WebSocket connections using tokens passed via Socket.io auth option.
 * This middleware runs before the connection is established, providing secure
 * token-based authentication without exposing tokens to client-side storage.
 */
io_stream.use(async (socket, next) => {
    try {
        // Get token from auth option (passed via client socket.io config)
        const token = socket.handshake.auth?.token;
        
        if (token) {
            console.log('🔐 WebSocket authentication token received');
            
            // Authenticate the user and attach to socket
            const is_authenticated = await authenticateWebsocketUser(socket, token);
            
            if (is_authenticated) {
                console.log(`✅ WebSocket pre-authenticated: ${socket.user.user_name} (${socket.user.user_role})`);
                next(); // Allow connection
            } else {
                console.log('❌ WebSocket authentication failed during handshake');
                next(new Error('Authentication failed'));
            }
        } else {
            console.log('🔓 WebSocket connection without token - authentication required later');
            next(); // Allow connection but require auth later
        }
    } catch (error) {
        console.error('❌ WebSocket authentication middleware error:', error);
        next(new Error('Authentication error'));
    }
});

/**
 * Active Connection Tracking
 * 
 * Maintains a Map of all active WebSocket connections for monitoring
 * and debugging purposes. Each connection stores metadata including
 * connection time, ping count, and client information.
 * 
 * @type {Map<string, Object>} Map of socket IDs to connection info
 */
const active_connections = new Map();

/**
 * WebSocket Connection Handler
 * 
 * Manages real-time WebSocket connections from clients. This is where
 * live features like exam monitoring and notifications are handled.
 * 
 * Connection lifecycle:
 * 1. Client connects -> store connection info
 * 2. Handle health pings -> respond with server status  
 * 3. Client disconnects -> cleanup connection data
 */
io_stream.on('connection', (socket) => {
    // Extract client information
    const client_ip = socket.handshake.address;
    const connection_info = {
        id: socket.id,
        connected_at: new Date(),
        client_ip: client_ip,
        ping_count: 0,
        user_agent: socket.handshake.headers['user-agent'],
        authenticated: !!socket.user // Track if pre-authenticated
    };
    
    // Store connection for tracking
    active_connections.set(socket.id, connection_info);

    const auth_status = socket.user ? `✅ Pre-authenticated: ${socket.user.user_name} (${socket.user.user_role})` : '🔓 Awaiting authentication';
    console.log(`🔌 NEW CONNECTION: ${socket.id} from ${client_ip} - ${auth_status}`);
    console.log(`📊 Total connections: ${active_connections.size}`);

    // Set up WebSocket handlers for this connection
    setup_websocket_handlers(socket, io_stream);
    setupAuthHandlers(socket);

    /**
     * Health Ping Handler
     * 
     * Responds to health check pings from clients to verify connection
     * status. This helps the frontend display connection indicators.
     * 
     * @event health_ping - Client sends ping request
     * @emits health_pong - Server responds with status info
     */
    socket.on('health_ping', () => {
        const conn = active_connections.get(socket.id);
        if (conn) {
            conn.ping_count++;
            console.log(`Ping #${conn.ping_count} from ${socket.id}`);
        }

        socket.emit('health_pong', {
            timestamp: new Date().toISOString(),
            server_status: `healthy`,
            connection_id: socket.id
        });
    });

    /**
     * Disconnect Handler
     * 
     * Cleans up connection data when a client disconnects.
     * Logs disconnect reason for debugging purposes.
     * 
     * @event disconnect - Client disconnects from server
     * @param {string} reason - Reason for disconnection
     */
    socket.on('disconnect', (reason) => {
        const conn = active_connections.get(socket.id);
        if (conn) {
            const duration_minutes = Math.round((new Date() - conn.connected_at) / 60000);
            console.log(`[DISCONNECTED] ${socket.id} after ${conn.ping_count} pings (${duration_minutes}min) - Reason: ${reason}`);
        }

        active_connections.delete(socket.id);
        console.log(`📊 Remaining connections: ${active_connections.size}`);
    });

    /**
     * Handle connection errors
     */
    socket.on('error', (error) => {
        console.error(`[SOCKET ERROR] ${socket.id}: ${error}`);
        active_connections.delete(socket.id);
    });
})

/**
 * Periodic cleanup of stale connections
 * Removes connections that are no longer valid
 */
setInterval(() => {
    const stale_connections = [];
    
    for (const [socket_id, conn_info] of active_connections.entries()) {
        // Check if socket still exists in io_stream
        const socket = io_stream.sockets.sockets.get(socket_id);
        if (!socket || !socket.connected) {
            stale_connections.push(socket_id);
        }
    }
    
    if (stale_connections.length > 0) {
        console.log(`🧹 Cleaning up ${stale_connections.length} stale connections`);
        stale_connections.forEach(socket_id => {
            active_connections.delete(socket_id);
        });
        console.log(`📊 Active connections after cleanup: ${active_connections.size}`);
    }
}, 30000); // Run cleanup every 30 seconds

/**
 * Database Initialization
 * 
 * Establishes connection to MySQL database and synchronizes models.
 * This runs automatically when the server starts to ensure database
 * connectivity before accepting requests.
 * 
 * @async
 * @function initDatabase
 * @throws {Error} If database connection or sync fails
 */
async function initDatabase() {
    try {
        await methods.create_database_if_not_exists();
        await methods.testConnection();
        await methods.syncDatabase();
        await methods.create_default_admin_user();
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1); // Exit if DB connection fails
    }
}

/**
 * Middleware Configuration
 * 
 * Sets up essential middleware for security, logging, and request parsing.
 * Configured for development and production environments.
 */
// Security middleware - adds security headers
app.use(helmet());
app.use(cookie_parser());
// CORS middleware - allows requests from React frontend
app.use(cors(
    {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        optionsSuccessStatus: 200, // This option handles the HTTP status code returned for OPTIONS preflight request
    }
));

// HTTP request logging for debugging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Request body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Root Endpoint
 * 
 * Basic endpoint to verify the API server is running.
 * Returns a simple message confirming server status.
 * 
 * @route GET /
 * @access Public
 * @returns {Object} JSON with welcome message
 */
app.get('/', (req, res) => {
    res.json({ message: 'Exam Scheduler API is running!' });
});

/**
 * Health Check Endpoint
 * 
 * Provides system status information for monitoring and debugging.
 * This endpoint can be used to verify that the API server is running.
 * 
 * @route GET /api/health
 * @access Public
 * @returns {Object} JSON object with server status and timestamp
 * 
 * @example
 * // GET /api/health
 * // Response:
 * {
 *   "status": "OK",
 *   "message": "Hệ thống đang hoạt động bình thường", 
 *   "timestamp": "2025-07-21T10:30:00.000Z",
 *   "version": "1.0.0"
 * }
 */
app.get('/api/health', (req, res) => {
    res.json({ 
        service: 'ExamPro Scheduler API',
        message: 'Hệ thống đang hoạt động bình thường',
        version: process.env.API_VERSION || '1.0.0',
        timestamp: new Date().toISOString(),
        status: 'OK', 
    });
});

/**
 * Debug Connections Endpoint
 * 
 * Development endpoint for monitoring active WebSocket connections.
 * Provides detailed information about connected clients including
 * connection duration, ping counts, and client metadata.
 * 
 * Useful for:
 * - Debugging connection issues
 * - Monitoring real-time feature usage
 * - Performance analysis
 * 
 * @route GET /api/debug/connections
 * @access Public (should be protected in production)
 * @returns {Object} JSON with connection statistics and details
 * 
 * @example
 * // GET /api/debug/connections
 * // Response:
 * {
 *   "total_connections": 2,
 *   "connections": [
 *     {
 *       "id": "abc123",
 *       "connected_at": "2025-07-21T10:00:00.000Z",
 *       "ping_count": 15,
 *       "client_ip": "127.0.0.1",
 *       "duration_minutes": 5
 *     }
 *   ],
 *   "server_uptime": 3600
 * }
 */
app.get('/api/debug/connections', (req, res) => {
    const connections = Array.from(active_connections.values()).map(conn => ({
        id: conn.id,
        connected_at: conn.connected_at,
        ping_count: conn.ping_count,
        client_ip: conn.client_ip,
        duration_minutes: Math.round((new Date() - conn.connected_at) / 6000)
    }));

    res.json({
        total_connections: connections.length,
        connections: connections,
        server_uptime: Math.floor(process.uptime())
    });
})

/**
 * Test Timestamp Endpoint
 * 
 * Development endpoint for testing database timestamp functionality.
 * Creates a test subject record and returns it to verify that
 * Sequelize automatic timestamps are working correctly.
 * 
 * @route POST /api/test/timestamp
 * @access Public (development only)
 * @returns {Object} JSON with created test subject including timestamps
 */
app.post('/api/test/timestamp', async (req, res) => {
    try {
        const { models } = require('./models');
        
        //  a test subject
        const testSubject = await models.Subject.create({
            subject_code: `TEST_${Date.now()}`,
            subject_name: 'Test Subject for Timestamp',
            department: 'Test Department',
            description: 'This is a test subject to verify timestamp functionality'
        });

        res.json({
            success: true,
            message: 'Test subject created successfully',
            data: testSubject,
            timestamp_info: {
                created_at: testSubject.created_at,
                updated_at: testSubject.updated_at,
                are_timestamps_valid: !!(testSubject.created_at && testSubject.updated_at)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error testing timestamp functionality',
            error: error.message
        });
    }
});

//============ IMPORTING ROUTES ============//
const api_routes = require('./routes');

app.use('/api', api_routes);

// Initialize database on server start
initDatabase();

/**
 * Start Server
 * 
 * Starts the HTTP server with WebSocket support on the specified port.
 * Logs startup information for debugging and monitoring.
 * 
 * @param {number} PORT - Port number from environment or default 5000
 */
server.listen(PORT, () => {    
    console.log(`[SERVER MESSAGE] 🚀 Server is running on port ${PORT}`);
    console.log('[SERVER MESSAGE] 🔌 WebSocket server ready for connections');
    console.log('[SERVER MESSAGE] 📊 Health check available at /api/health');
    console.log('[SERVER MESSAGE] 🐛 Debug endpoint available at /api/debug/connections');
    
    // Initialize WebSocket in room controller
    set_websocket_io(io_stream);
});