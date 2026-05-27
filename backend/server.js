const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const { authMiddleware } = require('./middleware/auth');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Database connection
// If DATABASE_URL is not provided, we create a mock pool to avoid crashing
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  pool.connect((err) => {
    if (err) {
      console.error('DB connection error:', err.message);
    } else {
      console.log('Connected to PostgreSQL Database');
    }
  });
} else {
  console.log('⚠️ DATABASE_URL not found. Using a mock database pool for Phase 1 testing.');
  pool = {
    query: async () => ({ rows: [] }),
    connect: async () => ({ release: () => {} })
  };
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth')(pool);
const userRoutes = require('./routes/users')(pool);
const teamRoutes = require('./routes/teams')(pool);
const projectRoutes = require('./routes/projects')(pool);
const messageRoutes = require('./routes/messages')(pool);

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', authMiddleware, userRoutes);
app.use('/api/v1/teams', authMiddleware, teamRoutes);
app.use('/api/v1/projects', authMiddleware, projectRoutes);
app.use('/api/v1/messages', authMiddleware, messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TeamSync PBL API is running',
    database: process.env.DATABASE_URL ? 'Configured' : 'Mocked'
  });
});

// Global error handler — catches anything missed by route-level try/catch
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`User connected to socket: ${socket.id}`);

  // Join a specific team chat room
  socket.on('joinTeamRoom', (teamId) => {
    socket.join(`team_${teamId}`);
    console.log(`Socket ${socket.id} joined room team_${teamId}`);
  });

  // Handle incoming chat messages
  socket.on('sendMessage', async (data) => {
    try {
      const { teamId, senderId, messageText, senderName } = data;
      
      if (!teamId || !senderId || !messageText) {
        return console.error('Missing data for sendMessage');
      }

      // Save to database
      const result = await pool.query(
        'INSERT INTO team_messages (team_id, sender_id, message_text) VALUES ($1, $2, $3) RETURNING id, created_at',
        [teamId, senderId, messageText]
      );

      const savedMessage = {
        id: result.rows[0].id,
        team_id: teamId,
        sender_id: senderId,
        sender_name: senderName,
        message_text: messageText,
        created_at: result.rows[0].created_at
      };

      // Broadcast to all users in the team room
      io.to(`team_${teamId}`).emit('receiveMessage', savedMessage);
    } catch (error) {
      console.error('Socket sendMessage error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server and WebSockets running on port ${PORT}`);
});