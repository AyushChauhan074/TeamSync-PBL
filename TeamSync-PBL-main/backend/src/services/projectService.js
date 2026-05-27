const pool = require('../config/db');

async function createProject({ title, description, team_id, github_repo_url, due_date }, createdBy) {
  // Verify team exists
  const { rows: teamRows } = await pool.query(
    'SELECT id FROM teams WHERE id = $1 AND status != $2',
    [team_id, 'inactive']
  );
  if (teamRows.length === 0) {
    const err = new Error('Team not found');
    err.status = 404;
    throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO projects (title, description, team_id, github_repo_url, due_date, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [title, description, team_id, github_repo_url || null, due_date || null, createdBy]
  );
  return rows[0];
}

async function getProjectById(projectId) {
  const { rows } = await pool.query(
    `SELECT p.*, t.name as team_name, t.team_code,
            u.name as created_by_name,
            COUNT(c.id) as total_contributions
     FROM projects p
     LEFT JOIN teams t ON p.team_id = t.id
     LEFT JOIN users u ON p.created_by = u.id
     LEFT JOIN contributions c ON p.id = c.project_id
     WHERE p.id = $1
     GROUP BY p.id, t.name, t.team_code, u.name`,
    [projectId]
  );

  if (rows.length === 0) {
    const err = new Error('Project not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

async function getUserProjects(userId) {
  const { rows } = await pool.query(
    `SELECT p.*, t.name as team_name,
            COUNT(c.id) as total_contributions
     FROM projects p
     JOIN teams t ON p.team_id = t.id
     JOIN team_members tm ON t.id = tm.team_id
     LEFT JOIN contributions c ON p.id = c.project_id
     WHERE tm.user_id = $1
     GROUP BY p.id, t.name
     ORDER BY p.created_at DESC`,
    [userId]
  );
  return rows;
}

async function updateProgress(projectId, { progress, status }, userId) {
  // Verify user is in the project's team
  const { rows: access } = await pool.query(
    `SELECT p.id FROM projects p
     JOIN team_members tm ON p.team_id = tm.team_id
     WHERE p.id = $1 AND tm.user_id = $2`,
    [projectId, userId]
  );

  if (access.length === 0) {
    const err = new Error('Access denied or project not found');
    err.status = 403;
    throw err;
  }

  const { rows } = await pool.query(
    `UPDATE projects SET progress = $1, status = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [progress, status, projectId]
  );
  return rows[0];
}

async function updateGithubRepo(projectId, github_repo_url, userId) {
  // Verify user belongs to the project's team
  const { rows: access } = await pool.query(
    `SELECT p.id FROM projects p
     JOIN team_members tm ON p.team_id = tm.team_id
     WHERE p.id = $1 AND tm.user_id = $2`,
    [projectId, userId]
  );

  if (access.length === 0) {
    const err = new Error('Access denied or project not found');
    err.status = 403;
    throw err;
  }

  const { rows } = await pool.query(
    `UPDATE projects SET github_repo_url = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [github_repo_url, projectId]
  );
  if (rows.length === 0) {
    const err = new Error('Project not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

async function getAllProjects() {
  const { rows } = await pool.query(
    `SELECT p.*, t.name as team_name,
            COUNT(c.id) as total_contributions
     FROM projects p
     LEFT JOIN teams t ON p.team_id = t.id
     LEFT JOIN contributions c ON p.id = c.project_id
     GROUP BY p.id, t.name
     ORDER BY p.created_at DESC`
  );
  return rows;
}

module.exports = {
  createProject, getProjectById, getUserProjects,
  updateProgress, updateGithubRepo, getAllProjects,
};
