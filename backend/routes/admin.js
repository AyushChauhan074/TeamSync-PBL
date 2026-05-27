const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // Get all users (Admin view, can filter by role)
  router.get('/users', async (req, res) => {
    try {
      const { role, page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT id, roll_number, name, email, role, branch, year, is_active FROM users';
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
               p.title as project, p.progress
        FROM teams t
        LEFT JOIN projects p ON t.id = p.team_id
        ORDER BY t.created_at DESC
      `;
      const result = await pool.query(query);
      res.json({ teams: result.rows });
    } catch (error) {
      console.error('Admin get teams error:', error);
      res.status(500).json({ error: 'Failed to fetch teams' });
    }
  });

  return router;
};
