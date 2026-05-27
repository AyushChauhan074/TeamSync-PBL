const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const { authMiddleware, adminOnly } = require('./middleware/auth');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL, 
      'https://team-sync-pbl.vercel.app', 
      'http://localhost:3000', 
      'http://localhost:5173'
    ].filter(Boolean),
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
  console.error('❌ CRITICAL ERROR: DATABASE_URL not found. Refusing to start with mock database in production.');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL, 
    'https://team-sync-pbl.vercel.app', 
    'http://localhost:3000', 
    'http://localhost:5173'
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth')(pool);
const userRoutes = require('./routes/users')(pool);
const teamRoutes = require('./routes/teams')(pool);
const projectRoutes = require('./routes/projects')(pool);
const messageRoutes = require('./routes/messages')(pool);
const adminRoutes = require('./routes/admin')(pool);

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', authMiddleware, userRoutes);
app.use('/api/v1/teams', authMiddleware, teamRoutes);
app.use('/api/v1/projects', authMiddleware, projectRoutes);
app.use('/api/v1/messages', authMiddleware, messageRoutes);
app.use('/api/v1/admin', authMiddleware, adminOnly, adminRoutes);

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

  // Admin Maintenance Toggle
  socket.on('triggerMaintenance', (data) => {
    if (data && data.role === 'admin') {
      console.log('Admin triggered maintenance mode.');
      io.emit('maintenanceMode', { active: true, message: 'System entering read-only mode for maintenance.' });
    }
  });

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

// Auto-migrate schema on boot
(async () => {
  try {
    // Add mentor/evaluator to projects
    await pool.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS mentor_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS evaluator_id INTEGER REFERENCES users(id);
    `);

    // Add designation column for faculty
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
    `);

    // Add section column for students
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS section VARCHAR(10);
    `);

    // Backfill designation from bio for existing faculty who have no designation yet
    await pool.query(`
      UPDATE users SET designation = 'Professor' 
      WHERE role = 'faculty' AND designation IS NULL;
    `);

    console.log('Database auto-migration complete.');
  } catch (err) {
    console.error('Database auto-migration failed:', err);
  }
})();

server.listen(PORT, () => {
  console.log(`Server and WebSockets running on port ${PORT}`);
});