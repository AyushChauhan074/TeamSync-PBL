const express = require('express');
const router = express.Router();
const { logActivity } = require('../utils/logger');

module.exports = (pool) => {

// Get all teams with search functionality
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const currentUserId = req.user?.userId || req.user?.id;
    
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
      WHERE t.status != 'inactive' AND t.created_by != $1
    `;
    
    const params = [currentUserId];
    
    if (search) {
      query += ` AND (t.name ILIKE $2 OR t.description ILIKE $2 OR $2 = ANY(t.required_skills))`;
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
      SELECT t.id, t.name, t.project_name, t.description, t.github_repo_url, t.code, t.created_by as creator_id, u.name AS leader_name, tm.role as user_role,
             COALESCE(member_count.count, 0) as current_members, t.max_members
      FROM teams t
      JOIN users u ON t.created_by = u.id
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
    const { name, projectName, githubRepoUrl, description, maxMembers, requiredSkills } = req.body;
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

    // GitHub URL Regex Validation
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/;
    if (!githubRepoUrl || !githubRegex.test(githubRepoUrl)) {
      return res.status(400).json({ error: 'Please enter a valid GitHub repository URL link.' });
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
      INSERT INTO teams (name, project_name, github_repo_url, description, max_members, required_skills, created_by, code)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await client.query(insertQuery, [
      name.trim(),
      projectName.trim(),
      githubRepoUrl.trim(),
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

    res.status(200).json({ success: true, message: 'Successfully joined the team' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Join team error:', error);
    res.status(500).json({ error: 'Failed to join team' });
  } finally {
    client.release();
  }
});

// Request to join a team
router.post('/request-join/:teamId', async (req, res) => {
  const client = await pool.connect();
  try {
    const studentId = req.user?.userId || req.user?.id;
    const { teamId } = req.params;

    if (!studentId) {
      return res.status(401).json({ error: 'Unauthorized: Missing student ID.' });
    }

    await client.query('BEGIN');

    // Verify team exists and get leader
    const teamRes = await client.query('SELECT * FROM teams WHERE id = $1 FOR UPDATE', [teamId]);
    if (teamRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Team not found.' });
    }
    const team = teamRes.rows[0];

    // Check if student already in the team
    const memberCheck = await client.query('SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2', [teamId, studentId]);
    if (memberCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You are already a member of this team.' });
    }

    // Check active member count
    const memberCountRes = await client.query('SELECT COUNT(*) as count FROM team_members WHERE team_id = $1', [teamId]);
    const currentMembers = parseInt(memberCountRes.rows[0].count);
    if (currentMembers >= team.max_members) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This team is already full.' });
    }

    // Insert pending request
    const insertRes = await client.query(
      `INSERT INTO team_requests (team_id, student_id, status) VALUES ($1, $2, 'pending') RETURNING id`,
      [teamId, studentId]
    );
    const reqId = insertRes.rows[0].id;

    // Telemetry: Send to team leader
    const studentQuery = await client.query('SELECT name FROM users WHERE id = $1', [studentId]);
    const studentName = studentQuery.rows[0]?.name || 'A student';
    
    await logActivity(client, team.created_by, 'request_entry', `${studentName} has requested to join your team ${team.name}|REQ_ID:${reqId}`);

    await client.query('COMMIT');
    res.status(200).json({ success: true, message: 'Join request sent successfully.' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Request join error:', error);
    if (error.code === '23505' && error.constraint === 'team_requests_team_id_student_id_key') {
      return res.status(409).json({ error: 'You have already requested to join this team.' });
    }
    res.status(500).json({ error: 'Failed to request join.' });
  } finally {
    client.release();
  }
});

// Handle join request (Approve/Reject)
router.put('/handle-request/:requestId', async (req, res) => {
  const client = await pool.connect();
  try {
    const leaderId = req.user?.userId || req.user?.id;
    const { requestId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!leaderId) return res.status(401).json({ error: 'Unauthorized' });
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Invalid action.' });

    await client.query('BEGIN');

    // Fetch the request and lock it
    const reqRes = await client.query('SELECT * FROM team_requests WHERE id = $1 FOR UPDATE', [requestId]);
    if (reqRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found.' });
    }
    const teamReq = reqRes.rows[0];

    if (teamReq.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Request already processed.' });
    }

    // Fetch the team to verify ownership
    const teamRes = await client.query('SELECT * FROM teams WHERE id = $1', [teamReq.team_id]);
    const team = teamRes.rows[0];

    if (team.created_by !== leaderId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Only the team creator can manage join requests.' });
    }

    // Fetch student info
    const studentQuery = await client.query('SELECT name FROM users WHERE id = $1', [teamReq.student_id]);
    const studentName = studentQuery.rows[0]?.name || 'Student';

    if (action === 'approve') {
      // Check members cap
      const memberCountRes = await client.query('SELECT COUNT(*) as count FROM team_members WHERE team_id = $1', [team.id]);
      const currentMembers = parseInt(memberCountRes.rows[0].count);
      if (currentMembers >= team.max_members) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cannot approve: team is full.' });
      }

      await client.query('UPDATE team_requests SET status = $1 WHERE id = $2', ['approved', requestId]);
      await client.query(
        'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [team.id, teamReq.student_id, 'member']
      );
      
      await logActivity(client, teamReq.student_id, 'join_squad', `Your request to join team ${team.name} was approved.`);
      await logActivity(client, leaderId, 'approve_request', `You approved ${studentName}'s request to join your team.`);
    } else {
      await client.query('UPDATE team_requests SET status = $1 WHERE id = $2', ['rejected', requestId]);
      await logActivity(client, teamReq.student_id, 'reject_request', `Your request to join team ${team.name} was declined.`);
    }

    await client.query('COMMIT');
    res.status(200).json({ success: true, message: `Request ${action}d successfully.` });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Handle request error:', error);
    res.status(500).json({ error: 'Failed to process request.' });
  } finally {
    client.release();
  }
});

// Get team members for workspace modal
router.get('/:teamId/members', async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user?.userId || req.user?.id;

    // Security Validation Guard
    const memberCheck = await pool.query(
      'SELECT team_id, role FROM users WHERE id = $1', 
      [userId]
    );

    const userTeamId = memberCheck.rows[0]?.team_id;
    const userRole = memberCheck.rows[0]?.role;

    if (userTeamId !== parseInt(teamId) && userRole !== 'admin' && userRole !== 'faculty') {
      return res.status(403).json({ error: "Access Denied: You are not a member of this workspace team region." });
    }

    const query = `
      SELECT id, name, roll_number, email, github_username, profile_image_url
      FROM users
      WHERE team_id = $1
      ORDER BY name ASC
    `;
    
    const result = await pool.query(query, [teamId]);
    res.json({ members: result.rows });
    
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// Get team messages for workspace modal
router.get('/:teamId/messages', async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user?.userId || req.user?.id;

    // Security Validation Guard
    const memberCheck = await pool.query(
      'SELECT team_id, role FROM users WHERE id = $1', 
      [userId]
    );

    const userTeamId = memberCheck.rows[0]?.team_id;
    const userRole = memberCheck.rows[0]?.role;

    if (userTeamId !== parseInt(teamId) && userRole !== 'admin' && userRole !== 'faculty') {
      return res.status(403).json({ error: "Access Denied: You are not a member of this workspace team region." });
    }

    const query = `
      SELECT m.id, m.message_text, m.created_at, u.id as sender_id, u.name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.team_id = $1
      ORDER BY m.created_at ASC
    `;
    
    const result = await pool.query(query, [teamId]);
    res.json({ messages: result.rows });
    
  } catch (error) {
    console.error('Get team messages error:', error);
    res.status(500).json({ error: 'Failed to fetch team messages' });
  }
});

return router;
};