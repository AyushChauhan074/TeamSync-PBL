const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const { authMiddleware, adminOnly, maintenanceGate } = require('./middleware/auth');
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

  pool.connect((err, client, release) => {
    if (err) {
      console.error('DB connection error:', err.message);
    } else {
      // Auto-migrate schema updates
      client.query(`
        ALTER TABLE teams ADD COLUMN IF NOT EXISTS project_name VARCHAR(150) DEFAULT 'Unknown Project';
        ALTER TABLE teams ADD COLUMN IF NOT EXISTS github_repo_url VARCHAR(255);
        ALTER TABLE teams ADD COLUMN IF NOT EXISTS mentor_id INTEGER REFERENCES users(id);
        ALTER TABLE teams ADD COLUMN IF NOT EXISTS evaluator_id INTEGER REFERENCES users(id);
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
            sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            message_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS phase_meetups (
            id SERIAL PRIMARY KEY,
            team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
            evaluator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            phase_name VARCHAR(50) NOT NULL,
            meetup_timestamp TIMESTAMP NOT NULL,
            is_completed BOOLEAN DEFAULT FALSE,
            UNIQUE(team_id, phase_name)
        );
        CREATE TABLE IF NOT EXISTS individual_student_grades (
            id SERIAL PRIMARY KEY,
            team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
            student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            phase_name VARCHAR(50) NOT NULL CHECK (phase_name IN ('planning', 'development', 'evaluation')),
            score_acquired INT DEFAULT 0 CHECK (score_acquired >= 0 AND score_acquired <= 100),
            evaluator_feedback TEXT,
            graded_by INTEGER REFERENCES users(id),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, phase_name)
        );
        CREATE TABLE IF NOT EXISTS team_requests (
            id SERIAL PRIMARY KEY,
            team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
            student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(team_id, student_id)
        );
      `)
        .then(() => console.log('Auto-migration: verified schema tables and columns'))
        .catch(migrateErr => console.error('Auto-migration error:', migrateErr.message))
        .finally(() => release());
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
const studentRoutes = require('./routes/student')(pool);
const facultyRoutes = require('./routes/faculty')(pool);

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', authMiddleware, maintenanceGate(pool), userRoutes);
app.use('/api/v1/teams', authMiddleware, maintenanceGate(pool), teamRoutes);
app.use('/api/v1/projects', authMiddleware, maintenanceGate(pool), projectRoutes);
app.use('/api/v1/messages', authMiddleware, maintenanceGate(pool), messageRoutes);
app.use('/api/v1/admin', authMiddleware, adminOnly, adminRoutes);
app.use('/api/v1/student', authMiddleware, maintenanceGate(pool), studentRoutes);
app.use('/api/v1/faculty', authMiddleware, maintenanceGate(pool), facultyRoutes);

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

    // Add faculty_id column for polymorphic mapping and backfill
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS faculty_id VARCHAR(50) UNIQUE;
    `);

    await pool.query(`
      UPDATE users SET faculty_id = roll_number 
      WHERE role = 'faculty' AND faculty_id IS NULL;
    `);

    // Create activities table for telemetry logger
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          action_type VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create configurations table for system settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS configurations (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default configuration values (won't overwrite existing)
    await pool.query(`
      INSERT INTO configurations (key, value) VALUES
        ('allow_email_alerts', 'true'),
        ('maintenance_mode', 'false'),
        ('active_term', 'B.Tech Even Semester 2026'),
        ('evaluation_threshold', '3'),
        ('min_team_size', '3'),
        ('max_team_size', '4'),
        ('github_sync_interval', 'daily'),
        ('last_backup_time', '')
      ON CONFLICT (key) DO NOTHING;
    `);

    console.log('Database auto-migration complete.');
  } catch (err) {
    console.error('Database auto-migration failed:', err);
  }
})();

server.listen(PORT, () => {
  console.log(`Server and WebSockets running on port ${PORT}`);
});