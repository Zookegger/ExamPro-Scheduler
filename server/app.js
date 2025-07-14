const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { testConnection, syncDatabase } = require('./models');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});