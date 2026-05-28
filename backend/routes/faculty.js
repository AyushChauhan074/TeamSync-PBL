const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  
  // GET /api/v1/faculty/assigned-teams
  router.get('/assigned-teams', async (req, res) => {
    try {
      const viewMode = req.query.viewMode || 'mentor';
      const facultyId = req.user.userId;

      if (!['mentor', 'evaluator'].includes(viewMode)) {
        return res.status(400).json({ error: 'Invalid view mode' });
      }

      // Corrected inline transactional subquery parameter matching
      const query = `
        SELECT 
          t.id, 
          t.name, 
          t.project_name, 
          t.github_repo_url, 
          t.mentor_id, 
          t.evaluator_id,
          (SELECT COUNT(*) FROM users u WHERE u.team_id = t.id AND u.role = 'student') AS roster_size
        FROM teams t
        WHERE ${viewMode === 'mentor' ? 't.mentor_id' : 't.evaluator_id'} = $1
        ORDER BY t.created_at DESC;
      `;

      const result = await pool.query(query, [facultyId]);

      res.json({ success: true, teams: result.rows });

    } catch (error) {
      console.error('Faculty assigned-teams error:', error);
      res.status(500).json({ error: 'Failed to fetch assigned teams' });
    }
  });

  return router;
};
