const express = require('express');
const router = express.Router();
const { logActivity } = require('../utils/logger');

module.exports = (pool) => {

// Get all teams with search functionality
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = `
      SELECT t.*, u.name as creator_name,
             COALESCE(tm.member_count, 0) as current_members
      FROM teams t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN (
        SELECT team_id, COUNT(*) as member_count
        FROM team_members
        GROUP BY team_id
      ) tm ON t.id = tm.team_id
      WHERE t.status != 'inactive'
    `;
    
    const params = [];
    
    if (search) {
      query += ` AND (t.name ILIKE $1 OR t.description ILIKE $1 OR $1 = ANY(t.required_skills))`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY t.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json({ teams: result.rows });
    
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get user's teams
router.get('/my-teams/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT t.*, tm.role as user_role,
             COALESCE(member_count.count, 0) as current_members
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN (
        SELECT team_id, COUNT(*) as count
        FROM team_members
        GROUP BY team_id
      ) member_count ON t.id = member_count.team_id
      WHERE tm.user_id = $1 AND t.status != 'inactive'
      ORDER BY t.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    res.json({ teams: result.rows });
    
  } catch (error) {
    console.error('Get user teams error:', error);
    res.status(500).json({ error: 'Failed to fetch user teams' });
  }
});

// Create new team
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, projectName, description, maxMembers, requiredSkills } = req.body;
    const createdBy = req.user?.userId || req.user?.id;
    
    // Input validation
    if (!createdBy) {
      return res.status(401).json({ error: 'Unauthorized: Creator ID is missing from session.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Team name is required.' });
    }
    if (!projectName || !projectName.trim()) {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    // Global Admin Constraint Enforcement (Max 10 per system rules)
    const membersCap = parseInt(maxMembers) || 4;
    if (membersCap > 10) {
      return res.status(400).json({ error: 'Max members cannot exceed global administrative limit of 10.' });
    }
    
    // Generate a unique 6-character uppercase alphanumeric team code
    const crypto = require('crypto');
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO teams (name, project_name, description, max_members, required_skills, created_by, code)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await client.query(insertQuery, [
      name.trim(),
      projectName.trim(),
      description || '',
      membersCap,
      requiredSkills || [],
      createdBy,
      code
    ]);
    
    // Add creator as team leader
    const teamId = result.rows[0].id;
    await client.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
      [teamId, createdBy, 'leader']
    );
    
    // Log the activity securely
    await logActivity(client, createdBy, 'create_group', `You created team ${result.rows[0].name} for project ${projectName.trim()}`);

    await client.query('COMMIT');

    res.status(201).json({ 
      success: true, 
      team: result.rows[0] 
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create team error:', error);
    // Handle unique name constraint gracefully
    if (error.code === '23505' && error.constraint === 'teams_name_key') {
       return res.status(409).json({ error: 'Team name already exists.' });
    }
    res.status(500).json({ error: 'Failed to create team due to database error' });
  } finally {
    client.release();
  }
});

// Join team by code (wrapped in transaction to prevent race condition)
router.post('/:code/join', async (req, res) => {
  const client = await pool.connect();
  try {
    const { code } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      client.release();
      return res.status(400).json({ error: 'User ID is required.' });
    }

    await client.query('BEGIN');
    
    // Lock the team row to prevent concurrent joins
    const teamResult = await client.query(
      'SELECT * FROM teams WHERE code = $1 FOR UPDATE', [code]
    );
    
    if (teamResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Team not found or invalid code' });
    }
    
    const teamId = teamResult.rows[0].id;
    
    // Check current member count
    const memberCountResult = await client.query(
      'SELECT COUNT(*) as count FROM team_members WHERE team_id = $1', [teamId]
    );
    const currentMembers = parseInt(memberCountResult.rows[0].count);
    
    if (currentMembers >= teamResult.rows[0].max_members) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Team is full' });
    }
    
    // Add user to team
    await client.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
      [teamId, userId, 'member']
    );
    
    await client.query('COMMIT');
    
    // Log the activity
    await logActivity(pool, userId, 'join_squad', `You joined team ${teamResult.rows[0].name}`);

    res.json({ success: true, message: 'Successfully joined team' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Already a member of this team' });
    }
    console.error('Join team error:', error);
    res.status(500).json({ error: 'Failed to join team' });
  } finally {
    client.release();
  }
});

return router;
};