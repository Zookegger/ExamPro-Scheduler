const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { testConnection, syncDatabase } = require('./models');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Creates an HTTP server that can handle both regular HTTP and WebSocket connections
const server = http.createServer(app);

// Attaches Socket.io to that HTTP server
const io_stream = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Add connection tracking
const active_connections = new Map();

// Socket.io connection handling
io_stream.on('connection', (socket) => {
    const client_ip = socket.handshake.address;
    const connection_info = {
        id: socket.id,
        connected_at: new Date(),
        client_ip: client_ip,
        ping_count: 0,
        user_agent: socket.handshake.headers['user-agent']
    };

    active_connections.set(socket.id, connection_info);

    console.log(`🔌 NEW CONNECTION: ${socket.id} from ${client_ip}`);
    console.log(`📊 Total connections: ${active_connections.size}`);

    // Handle health check pings from client
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

    // Handle client disconnection
    socket.on('disconnect', (reason) => {
        const conn = active_connections.get(socket.id);
        if (conn) {
            console.log(`[DISCONNECTED] ${socket.id} after ${conn.ping_count} pings - Reason: ${reason}`);
        }

        active_connections.delete(socket.id);
        console.log(`📊 Remaining connections: ${active_connections.size}`);
    });
})

// Test database connection and sync
async function initDatabase() {
    await testConnection();
    await syncDatabase();
}

initDatabase();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Exam Scheduler API is running!' });
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'ExamPro Scheduler API'
    });
});

// Debug connection endpoint
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
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('WebSocket server ready for connections');
});