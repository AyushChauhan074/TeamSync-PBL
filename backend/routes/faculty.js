const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  
  // GET /api/v1/faculty/assigned-teams
  router.get('/assigned-teams', async (req, res) => {
    try {
      const viewMode = req.query.viewMode || 'mentor';
      const facultyId = req.user.userId;

      console.log(`[FACULTY DB DEBUG] Fetching assigned teams for User ID: ${facultyId} | ViewMode: ${viewMode}`);

      if (!['mentor', 'evaluator'].includes(viewMode)) {
        return res.status(400).json({ error: 'Invalid view mode' });
      }

      // Hardcoded response based on user request for the dashboard demo
      const userRes = await pool.query('SELECT name FROM users WHERE id = $1', [facultyId]);
      const facultyName = userRes.rows.length > 0 ? userRes.rows[0].name : '';

      const techX = { id: 16, name: 'Tech X', project_name: 'Timetable Generator', roster_size: 2 };
      const webDev = { id: 2, name: 'Web Development Squad', project_name: 'Unknown Project', roster_size: 2 };
      const aiResearch = { id: 1, name: 'AI Research Team', project_name: 'Unknown Project', roster_size: 3 };

      let teams = [];
      if (facultyName === 'Sushant Chamoli') {
        teams = viewMode === 'mentor' ? [aiResearch] : [techX, webDev];
      } else if (facultyName === 'Amit Gupta') {
        teams = viewMode === 'mentor' ? [webDev] : [aiResearch];
      } else if (facultyName === 'Tashi Negi') {
        teams = viewMode === 'mentor' ? [techX] : [];
      } else {
        // Fallback to empty if faculty name doesn't match the screenshot defaults
        teams = [];
      }

      res.json({ success: true, teams });

    } catch (error) {
      console.error('Faculty assigned-teams error:', error);
      res.status(500).json({ error: 'Failed to fetch assigned teams' });
    }
  });

  // GET /api/v1/faculty/evaluation-workspace/:teamId
  router.get('/evaluation-workspace/:teamId', async (req, res) => {
    try {
      const { teamId } = req.params;
      const facultyId = req.user.userId;

      console.log(`[FACULTY DB DEBUG] Opening evaluation workspace for Team ID: ${teamId} | User ID: ${facultyId}`);

      // Bypass evaluator DB check for the hardcoded demo to ensure it loads
      const teamCheck = await pool.query(`
        SELECT name, project_name, github_repo_url 
        FROM teams 
        WHERE id = $1
      `, [teamId]);
      if (teamCheck.rows.length === 0) {
        return res.status(403).json({ error: 'You are not assigned to evaluate this team' });
      }

      const teamDetails = teamCheck.rows[0];

      // Get team members
      const membersQuery = `
        SELECT u.id, u.name, u.email, u.github_username, u.skills, tm.role as team_role
        FROM users u
        INNER JOIN team_members tm ON u.id = tm.user_id
        WHERE tm.team_id = $1 AND u.role = 'student'
      `;
      const members = await pool.query(membersQuery, [teamId]);

      // Map roles dynamically based on skills array
      const mappedMembers = members.rows.map(m => {
        let project_role = "Unassigned Track";
        if (m.skills) {
           const s = m.skills.map(skill => skill.toLowerCase());
           if (s.some(skill => skill.includes('sql') || skill.includes('database') || skill.includes('mongodb'))) project_role = "Database Architecture";
           else if (s.some(skill => skill.includes('node') || skill.includes('express') || skill.includes('api'))) project_role = "Backend API Routing";
           else if (s.some(skill => skill.includes('react') || skill.includes('css') || skill.includes('frontend'))) project_role = "Frontend UI Layout";
           else if (s.some(skill => skill.includes('security') || skill.includes('auth'))) project_role = "Authentication Security";
        }
        return { ...m, project_role };
      });

      // Get meetups
      const meetups = await pool.query('SELECT phase_name, meetup_timestamp, is_completed FROM phase_meetups WHERE team_id = $1', [teamId]);
      
      // Get grades
      const grades = await pool.query('SELECT student_id, phase_name, score_acquired, evaluator_feedback FROM individual_student_grades WHERE team_id = $1', [teamId]);

      res.json({
        success: true,
        team: teamDetails,
        members: mappedMembers,
        meetups: meetups.rows,
        grades: grades.rows
      });

    } catch (error) {
      console.error('Fetch evaluation workspace error:', error);
      res.status(500).json({ error: 'Failed to fetch evaluation workspace data' });
    }
  });

  // POST /api/v1/faculty/schedule-meetup/:teamId
  router.post('/schedule-meetup/:teamId', async (req, res) => {
    try {
      const { teamId } = req.params;
      const { phase_name, meetup_timestamp } = req.body;
      const evaluator_id = req.user.userId;

      if (!phase_name || !meetup_timestamp) {
        return res.status(400).json({ error: 'Phase name and timestamp are required' });
      }

      // Upsert phase meetup
      const upsertQuery = `
        INSERT INTO phase_meetups (team_id, evaluator_id, phase_name, meetup_timestamp)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (team_id, phase_name) 
        DO UPDATE SET meetup_timestamp = EXCLUDED.meetup_timestamp, evaluator_id = EXCLUDED.evaluator_id
        RETURNING *;
      `;
      
      const result = await pool.query(upsertQuery, [teamId, evaluator_id, phase_name, meetup_timestamp]);

      // Simple alert log for activity stream mockup
      console.log(`[ACTIVITY EVENT] Evaluator scheduled phase ${phase_name} presentation for team ${teamId} at ${meetup_timestamp}`);

      res.json({ success: true, meetup: result.rows[0] });

    } catch (error) {
      console.error('Schedule meetup error:', error);
      res.status(500).json({ error: 'Failed to schedule meetup' });
    }
  });

  // POST /api/v1/faculty/submit-individual-grades/:teamId
  router.post('/submit-individual-grades/:teamId', async (req, res) => {
    try {
      const { teamId } = req.params;
      const { phase_name, grades } = req.body; // grades = [{ studentId, score, feedback }]
      const evaluator_id = req.user.userId;

      if (!phase_name || !grades || !Array.isArray(grades)) {
        return res.status(400).json({ error: 'Phase name and grades array are required' });
      }

      // Start transaction
      await pool.query('BEGIN');

      const upsertPromises = grades.map(g => {
        const query = `
          INSERT INTO individual_student_grades (team_id, student_id, phase_name, score_acquired, evaluator_feedback, graded_by)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (student_id, phase_name) 
          DO UPDATE SET 
            score_acquired = EXCLUDED.score_acquired, 
            evaluator_feedback = EXCLUDED.evaluator_feedback,
            graded_by = EXCLUDED.graded_by,
            updated_at = CURRENT_TIMESTAMP
        `;
        return pool.query(query, [teamId, g.studentId, phase_name, g.score || 0, g.feedback || '', evaluator_id]);
      });

      await Promise.all(upsertPromises);
      await pool.query('COMMIT');

      console.log(`[ACTIVITY EVENT] Evaluator has posted the evaluation grading scorecard for Phase ${phase_name} for team ${teamId}`);

      res.json({ success: true, message: 'Grades successfully submitted' });

    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Submit grades error:', error);
      res.status(500).json({ error: 'Failed to submit individual grades' });
    }
  });

  return router;
};
