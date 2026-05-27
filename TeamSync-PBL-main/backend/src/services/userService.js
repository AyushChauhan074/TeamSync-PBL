const pool = require('../config/db');

async function getUserById(userId) {
  const { rows } = await pool.query(
    `SELECT id, roll_number, name, email, role, branch, year, semester,
            phone, github_username, linkedin_url, bio, skills, interests,
            profile_image_url, designation, is_active, created_at, updated_at
     FROM users WHERE id = $1 AND is_active = true`,
    [userId]
  );
  if (rows.length === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

async function updateProfile(userId, updates) {
  const allowed = ['name', 'email', 'phone', 'github_username', 'linkedin_url',
                   'bio', 'skills', 'interests', 'profile_image_url'];
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(updates[key]);
      idx++;
    }
  }

  if (fields.length === 0) {
    const err = new Error('No valid fields to update');
    err.status = 400;
    throw err;
  }

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} AND is_active = true
     RETURNING id, roll_number, name, email, role, branch, year, semester,
               phone, github_username, linkedin_url, bio, skills, interests,
               profile_image_url, designation, updated_at`,
    values
  );

  if (rows.length === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

async function getUserStats(userId) {
  const [contributions, teams, projects] = await Promise.all([
    pool.query('SELECT COUNT(*) as count FROM contributions WHERE user_id = $1', [userId]),
    pool.query(
      `SELECT COUNT(*) as count FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       WHERE tm.user_id = $1 AND t.status = 'active'`,
      [userId]
    ),
    pool.query(
      `SELECT COUNT(*) as count FROM projects p
       JOIN teams t ON p.team_id = t.id
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = $1 AND p.status = 'completed'`,
      [userId]
    ),
  ]);

  // Contribution score: commits=1pt, PRs=3pt, reviews=2pt, issues=1pt
  const { rows: scoreRows } = await pool.query(
    `SELECT contribution_type, COUNT(*) as count
     FROM contributions WHERE user_id = $1
     GROUP BY contribution_type`,
    [userId]
  );

  let score = 0;
  const weights = { commit: 1, pull_request: 3, review: 2, issue: 1 };
  for (const row of scoreRows) {
    score += (weights[row.contribution_type] || 1) * parseInt(row.count);
  }

  return {
    totalContributions: parseInt(contributions.rows[0].count),
    activeTeams: parseInt(teams.rows[0].count),
    completedProjects: parseInt(projects.rows[0].count),
    contributionScore: score,
  };
}

async function getUserContributions(userId, limit = 20) {
  const { rows } = await pool.query(
    `SELECT c.*, p.title as project_title, p.github_repo_url
     FROM contributions c
     LEFT JOIN projects p ON c.project_id = p.id
     WHERE c.user_id = $1
     ORDER BY c.contribution_date DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

async function getAllUsers(role, search) {
  let query = `
    SELECT id, roll_number, name, email, role, branch, year,
           github_username, skills, is_active, created_at
    FROM users WHERE is_active = true
  `;
  const params = [];
  let idx = 1;

  if (role) {
    query += ` AND role = $${idx}`;
    params.push(role);
    idx++;
  }

  if (search) {
    query += ` AND (name ILIKE $${idx} OR roll_number ILIKE $${idx} OR email ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }

  query += ' ORDER BY name ASC';
  const { rows } = await pool.query(query, params);
  return rows;
}

async function searchUsers(role, search, roll_number) {
  let query = `
    SELECT id, roll_number, name, email, role, branch, year,
           github_username, skills, profile_image_url
    FROM users WHERE is_active = true
  `;
  const params = [];
  let idx = 1;

  if (role) {
    query += ` AND role = $${idx}`;
    params.push(role);
    idx++;
  }

  if (roll_number) {
    query += ` AND roll_number = $${idx}`;
    params.push(roll_number);
    idx++;
  } else if (search) {
    query += ` AND (name ILIKE $${idx} OR roll_number ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }

  query += ' ORDER BY name ASC LIMIT 50';
  const { rows } = await pool.query(query, params);
  return rows;
}

module.exports = { getUserById, updateProfile, getUserStats, getUserContributions, getAllUsers, searchUsers };
