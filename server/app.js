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

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const morgan = require('morgan');
const { testConnection, syncDatabase } = require('./models');
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
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
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
        user_agent: socket.handshake.headers['user-agent']
    };
    
    // Store connection for tracking
    active_connections.set(socket.id, connection_info);

    console.log(`🔌 NEW CONNECTION: ${socket.id} from ${client_ip}`);
    console.log(`📊 Total connections: ${active_connections.size}`);

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
            console.log(`[DISCONNECTED] ${socket.id} after ${conn.ping_count} pings - Reason: ${reason}`);
        }

        active_connections.delete(socket.id);
        console.log(`📊 Remaining connections: ${active_connections.size}`);
    });
})

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
    await testConnection();
    await syncDatabase();
}

// Initialize database on server start
initDatabase();

/**
 * Middleware Configuration
 * 
 * Sets up essential middleware for security, logging, and request parsing.
 * Configured for development and production environments.
 */
// Security middleware - adds security headers
app.use(helmet());

// CORS middleware - allows requests from React frontend
app.use(cors());

// HTTP request logging for debugging
app.use(morgan("combined"));

// Request body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'public')));

// Handle React routing - serve index.html for non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'))
    }
});

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
        server_uptime: process.uptime()
    });
})

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
});