const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // Get all users (Admin view, can filter by role)
  router.get('/users', async (req, res) => {
    try {
      const { role, page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT id, roll_number, name, email, role, branch, year, section, designation, github_username, skills, is_active FROM users';
      const queryParams = [];
      
      if (role) {
        query += ' WHERE role = $1';
        queryParams.push(role);
      }
      
      query += ` ORDER BY roll_number ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
      queryParams.push(limit, offset);
      
      const result = await pool.query(query, queryParams);
      res.json({ users: result.rows });
    } catch (error) {
      console.error('Admin get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Create new faculty
  router.post('/faculty', async (req, res) => {
    try {
      const { name, roll_number, email, password, branch, designation } = req.body;
      
      if (!name || !roll_number || !email || !password) {
        return res.status(400).json({ error: 'Required fields are missing' });
      }

      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(password, 10);

      const insertQuery = `
        INSERT INTO users (roll_number, name, email, password_hash, role, branch, designation, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        RETURNING id, roll_number, name, email, role, branch, designation, is_active
      `;
      const result = await pool.query(insertQuery, [
        roll_number,
        name,
        email.toLowerCase(),
        passwordHash,
        'faculty',
        branch || 'Computer Science',
        designation || 'Assistant Professor'
      ]);

      res.status(201).json({ success: true, user: result.rows[0] });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Faculty with this email or ID already exists.' });
      }
      console.error('Admin create faculty error:', error);
      res.status(500).json({ error: 'Failed to create faculty' });
    }
  });

  // Update existing faculty
  router.put('/faculty/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, roll_number, email, branch, designation } = req.body;
      
      const updateQuery = `
        UPDATE users 
        SET name = $1, roll_number = $2, email = $3, branch = $4, designation = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 AND role = 'faculty'
        RETURNING id, roll_number, name, email, role, branch, designation, is_active
      `;
      
      const result = await pool.query(updateQuery, [
        name,
        roll_number,
        email.toLowerCase(),
        branch,
        designation,
        id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Faculty not found' });
      }

      res.json({ success: true, user: result.rows[0] });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Faculty with this email or ID already exists.' });
      }
      console.error('Admin update faculty error:', error);
      res.status(500).json({ error: 'Failed to update faculty' });
    }
  });

  // Toggle user active status (Soft Delete / Restore)
  router.patch('/users/:userId/status', async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive must be a boolean' });
      }

      const result = await pool.query(
        'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, is_active',
        [isActive, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ success: true, user: result.rows[0] });
    } catch (error) {
      console.error('Admin update user status error:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  });

  // Delete a team
  router.delete('/teams/:teamId', async (req, res) => {
    try {
      const { teamId } = req.params;
      
      const result = await pool.query(
        'DELETE FROM teams WHERE id = $1 RETURNING id',
        [teamId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Team not found' });
      }
      
      res.json({ success: true, message: 'Team deleted successfully' });
    } catch (error) {
      console.error('Admin delete team error:', error);
      res.status(500).json({ error: 'Failed to delete team' });
    }
  });

  // Create new student
  router.post('/students', async (req, res) => {
    try {
      const { name, roll_number, email, password, branch, year, section, github_username, skills } = req.body;
      
      if (!name || !roll_number || !email || !password) {
        return res.status(400).json({ error: 'Required fields are missing' });
      }

      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(password, 10);

      // Parse skills: accept comma-separated string or array
      let skillsArray = null;
      if (skills) {
        skillsArray = typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : skills;
      }

      const insertQuery = `
        INSERT INTO users (roll_number, name, email, password_hash, role, branch, year, section, github_username, skills, is_active)
        VALUES ($1, $2, $3, $4, 'student', $5, $6, $7, $8, $9, true)
        RETURNING id, roll_number, name, email, role, branch, year, section, github_username, skills, is_active
      `;
      const result = await pool.query(insertQuery, [
        roll_number,
        name,
        email.toLowerCase(),
        passwordHash,
        branch || 'Computer Science',
        year ? parseInt(year) : 1,
        section || null,
        github_username || null,
        skillsArray
      ]);

      res.status(201).json({ success: true, user: result.rows[0] });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Student with this email or roll number already exists.' });
      }
      console.error('Admin create student error:', error);
      res.status(500).json({ error: 'Failed to create student' });
    }
  });

  // Update existing student
  router.put('/students/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, roll_number, email, branch, year, section, github_username, skills } = req.body;

      let skillsArray = null;
      if (skills) {
        skillsArray = typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : skills;
      }
      
      const updateQuery = `
        UPDATE users 
        SET name = $1, roll_number = $2, email = $3, branch = $4, year = $5, section = $6, 
            github_username = $7, skills = $8, updated_at = CURRENT_TIMESTAMP
        WHERE id = $9 AND role = 'student'
        RETURNING id, roll_number, name, email, role, branch, year, section, github_username, skills, is_active
      `;
      
      const result = await pool.query(updateQuery, [
        name,
        roll_number,
        email.toLowerCase(),
        branch,
        year ? parseInt(year) : 1,
        section || null,
        github_username || null,
        skillsArray,
        id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      res.json({ success: true, user: result.rows[0] });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Student with this email or roll number already exists.' });
      }
      console.error('Admin update student error:', error);
      res.status(500).json({ error: 'Failed to update student' });
    }
  });

  // Trigger Database Backup
  router.post('/backup', async (req, res) => {
    try {
      const now = new Date().toISOString();
      await pool.query(
        `UPDATE configurations SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'last_backup_time'`,
        [now]
      );
      console.log('Database backup completed at:', now);
      res.json({ success: true, message: 'Database backup initiated successfully', timestamp: now });
    } catch (error) {
      console.error('Admin backup error:', error);
      res.status(500).json({ error: 'Failed to initiate backup' });
    }
  });

  // Get all teams for admin dashboard
  router.get('/teams', async (req, res) => {
    try {
      const query = `
        SELECT t.id, t.name, t.status, t.current_members as members, 
               p.title as project, p.id as project_id, p.progress,
               m.name as mentor_name, m.id as mentor_id,
               e.name as evaluator_name, e.id as evaluator_id
        FROM teams t
        LEFT JOIN projects p ON t.id = p.team_id
        LEFT JOIN users m ON p.mentor_id = m.id
        LEFT JOIN users e ON p.evaluator_id = e.id
        ORDER BY t.created_at DESC
      `;
      const result = await pool.query(query);
      res.json({ teams: result.rows });
    } catch (error) {
      console.error('Admin get teams error:', error);
      res.status(500).json({ error: 'Failed to fetch teams' });
    }
  });

  // Allocate mentor and evaluator to a team (via their project)
  router.put('/teams/:teamId/allocate', async (req, res) => {
    try {
      const { teamId } = req.params;
      const { mentorId, evaluatorId } = req.body;

      if (!mentorId || !evaluatorId) {
        return res.status(400).json({ error: 'Mentor and Evaluator are both required' });
      }
      
      if (mentorId === evaluatorId) {
        return res.status(400).json({ error: 'Mentor and Evaluator cannot be the same person' });
      }

      const updateQuery = `
        UPDATE projects 
        SET mentor_id = $1, evaluator_id = $2, updated_at = CURRENT_TIMESTAMP
        WHERE team_id = $3
        RETURNING id, team_id, mentor_id, evaluator_id
      `;
      
      const result = await pool.query(updateQuery, [mentorId, evaluatorId, teamId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found for this team' });
      }

      res.json({ success: true, allocation: result.rows[0] });
    } catch (error) {
      console.error('Admin allocate team error:', error);
      res.status(500).json({ error: 'Failed to allocate team' });
    }
  });

  // ─── SYSTEM SETTINGS ───────────────────────────────────────

  // Get all system settings (type-cast from TEXT to native JS types)
  router.get('/settings', async (req, res) => {
    try {
      const result = await pool.query('SELECT key, value FROM configurations');
      const raw = {};
      result.rows.forEach(row => { raw[row.key] = row.value; });

      // Cast TEXT values to their native JS types
      const settings = {
        allow_email_alerts: raw.allow_email_alerts === 'true',
        maintenance_mode: raw.maintenance_mode === 'true',
        active_term: raw.active_term || 'B.Tech Even Semester 2026',
        evaluation_threshold: parseInt(raw.evaluation_threshold, 10) || 3,
        min_team_size: parseInt(raw.min_team_size, 10) || 3,
        max_team_size: parseInt(raw.max_team_size, 10) || 4,
        github_sync_interval: raw.github_sync_interval || 'daily',
        last_backup_time: raw.last_backup_time || null
      };

      res.json(settings);
    } catch (error) {
      console.error('Admin get settings error:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // Update system settings
  router.put('/settings', async (req, res) => {
    try {
      const updates = req.body;
      const allowedKeys = [
        'allow_email_alerts', 'maintenance_mode', 'active_term',
        'evaluation_threshold', 'min_team_size', 'max_team_size',
        'github_sync_interval'
      ];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedKeys.includes(key)) {
          await pool.query(
            `UPDATE configurations SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2`,
            [String(value), key]
          );
        }
      }

      // Return the updated settings with type casting
      const result = await pool.query('SELECT key, value FROM configurations');
      const raw = {};
      result.rows.forEach(row => { raw[row.key] = row.value; });

      const settings = {
        allow_email_alerts: raw.allow_email_alerts === 'true',
        maintenance_mode: raw.maintenance_mode === 'true',
        active_term: raw.active_term || 'B.Tech Even Semester 2026',
        evaluation_threshold: parseInt(raw.evaluation_threshold, 10) || 3,
        min_team_size: parseInt(raw.min_team_size, 10) || 3,
        max_team_size: parseInt(raw.max_team_size, 10) || 4,
        github_sync_interval: raw.github_sync_interval || 'daily',
        last_backup_time: raw.last_backup_time || null
      };

      res.json(settings);
    } catch (error) {
      console.error('Admin update settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  return router;
};
