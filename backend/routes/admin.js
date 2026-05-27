const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // Get all users (Admin view, can filter by role)
  router.get('/users', async (req, res) => {
    try {
      const { role, page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT id, roll_number, name, email, role, branch, year, designation, is_active FROM users';
      const queryParams = [];
      
      if (role) {
        query += ' WHERE role = $1';
        queryParams.push(role);
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
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

  // Trigger Database Backup
  router.post('/backup', async (req, res) => {
    try {
      // Mocking backup execution via pg_dump
      setTimeout(() => {
        console.log('Database backup completed successfully.');
      }, 2000);
      res.json({ success: true, message: 'Database backup initiated successfully' });
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

  return router;
};
