const express = require('express');
const router = express.Router();

module.exports = (pool) => {

// Get all users (public info)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT id, roll_number, name, branch, year, github_username, bio, skills, interests 
      FROM users 
      WHERE is_active = true 
      ORDER BY id 
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password_hash, ...userData } = result.rows[0];
    res.json({ user: userData });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
router.patch('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone, githubUsername, bio, skills, interests } = req.body;
    
    const updateQuery = `
      UPDATE users 
      SET name = $1, email = $2, phone = $3, github_username = $4, 
          bio = $5, skills = $6, interests = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND is_active = true
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [
      name, email, phone, githubUsername, bio, skills, interests, userId
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password_hash, ...userData } = result.rows[0];
    res.json({ 
      success: true, 
      user: userData 
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get user contributions
router.get('/:userId/contributions', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT c.*, p.title as project_title
      FROM contributions c
      JOIN projects p ON c.project_id = p.id
      WHERE c.user_id = $1
      ORDER BY c.contribution_date DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query, [userId]);
    res.json({ contributions: result.rows });
    
  } catch (error) {
    console.error('Get contributions error:', error);
    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
});

// Get user stats
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get total contributions
    const contributionsQuery = 'SELECT COUNT(*) as count FROM contributions WHERE user_id = $1';
    const contributionsResult = await pool.query(contributionsQuery, [userId]);
    
    // Get active teams count
    const teamsQuery = `
      SELECT COUNT(*) as count 
      FROM team_members tm 
      JOIN teams t ON tm.team_id = t.id 
      WHERE tm.user_id = $1 AND t.status = 'active'
    `;
    const teamsResult = await pool.query(teamsQuery, [userId]);
    
    // Get completed projects count
    const projectsQuery = `
      SELECT COUNT(*) as count 
      FROM projects p 
      JOIN teams t ON p.team_id = t.id 
      JOIN team_members tm ON t.id = tm.team_id 
      WHERE tm.user_id = $1 AND p.status = 'completed'
    `;
    const projectsResult = await pool.query(projectsQuery, [userId]);
    
    res.json({
      totalContributions: parseInt(contributionsResult.rows[0].count),
      activeTeams: parseInt(teamsResult.rows[0].count),
      completedProjects: parseInt(projectsResult.rows[0].count),
      teamRating: 4.8 // Mock rating for now
    });
    
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

return router;
};