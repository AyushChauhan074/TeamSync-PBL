const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  // GET /api/v1/messages/team/:teamId - Get chat history for a team
  router.get('/team/:teamId', async (req, res) => {
    try {
      const { teamId } = req.params;

      // 1. Check if the user is a member of this team
      const memberCheck = await pool.query(
        'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
        [teamId, req.user.userId]
      );

      if (memberCheck.rows.length === 0 && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You are not a member of this team.' });
      }

      // 2. Fetch the last 50 messages, ordered by time
      const result = await pool.query(
        `SELECT m.id, m.message_text, m.created_at, u.name as sender_name, u.id as sender_id 
         FROM team_messages m
         LEFT JOIN users u ON m.sender_id = u.id
         WHERE m.team_id = $1
         ORDER BY m.created_at ASC
         LIMIT 100`,
        [teamId]
      );

      res.json({ messages: result.rows });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  return router;
};
