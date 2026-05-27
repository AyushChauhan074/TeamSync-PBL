const express = require('express');
const router = express.Router();

module.exports = (pool) => {

// Get all projects for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT p.*, t.name as team_name
      FROM projects p
      JOIN teams t ON p.team_id = t.id
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = $1
      ORDER BY p.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    res.json({ projects: result.rows });
    
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project details
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const query = `
      SELECT p.*, t.name as team_name,
             COALESCE(c.contribution_count, 0) as total_contributions
      FROM projects p
      JOIN teams t ON p.team_id = t.id
      LEFT JOIN (
        SELECT project_id, COUNT(*) as contribution_count
        FROM contributions
        GROUP BY project_id
      ) c ON p.id = c.project_id
      WHERE p.id = $1
    `;
    
    const result = await pool.query(query, [projectId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ project: result.rows[0] });
    
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const { title, description, teamId, githubRepoUrl, dueDate } = req.body;
    
    // Input validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Project title is required.' });
    }
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required.' });
    }
    
    const insertQuery = `
      INSERT INTO projects (title, description, team_id, github_repo_url, due_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      title.trim(),
      description || '',
      teamId,
      githubRepoUrl || null,
      dueDate || null
    ]);
    
    res.status(201).json({ 
      success: true, 
      project: result.rows[0] 
    });
    
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project progress
router.patch('/:projectId/progress', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { progress, status } = req.body;
    
    const updateQuery = `
      UPDATE projects 
      SET progress = $1, status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [progress, status, projectId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ 
      success: true, 
      project: result.rows[0] 
    });
    
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

return router;
};