const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

module.exports = (pool) => {

  // GET /api/v1/student/connections
  router.get('/connections', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;

      // Inner join tracking unique users who share historical or active project team IDs
      const query = `
        SELECT DISTINCT u.id, u.name, u.profile_image_url, u.roll_number, u.branch, u.is_active
        FROM users u
        JOIN team_members tm1 ON u.id = tm1.user_id
        JOIN team_members tm2 ON tm1.team_id = tm2.team_id
        WHERE tm2.user_id = $1 AND u.id != $1
        LIMIT 5;
      `;
      
      const result = await pool.query(query, [userId]);
      res.json({ connections: result.rows });
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      res.status(500).json({ error: 'Failed to fetch connections' });
    }
  });

  // GET /api/v1/student/recent-activity
  router.get('/recent-activity', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;

      const query = `
        SELECT id, action_type, description, created_at
        FROM activities
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 5;
      `;

      const result = await pool.query(query, [userId]);
      res.json({ activities: result.rows });
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
  });

  return router;
};
