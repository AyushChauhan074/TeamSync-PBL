const pool = require('../config/db');

// Explicit column list used everywhere — avoids SELECT t.* GROUP BY crash on PostgreSQL
const TEAM_COLUMNS = `
  t.id, t.name, t.description, t.max_members, t.status,
  t.required_skills, t.team_code, t.invite_enabled,
  t.created_by, t.created_at, t.updated_at
`;

function generateTeamCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function createTeam({ name, description, max_members, required_skills }, createdBy) {
  let team_code;
  let attempts = 0;

  while (attempts < 10) {
    team_code = generateTeamCode();
    const { rows } = await pool.query('SELECT id FROM teams WHERE team_code = $1', [team_code]);
    if (rows.length === 0) break;
    attempts++;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO teams (name, description, max_members, required_skills, created_by, team_code, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'forming')
       RETURNING ${TEAM_COLUMNS}`,
      [name, description, max_members || 6, required_skills || [], createdBy, team_code]
    );

    const team = rows[0];

    await client.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
      [team.id, createdBy, 'leader']
    );

    await client.query('COMMIT');
    return team;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function joinTeamByCode(team_code, userId) {
  const { rows: teamRows } = await pool.query(
    `SELECT ${TEAM_COLUMNS} FROM teams t WHERE t.team_code = $1 AND t.status != $2`,
    [team_code.toUpperCase(), 'inactive']
  );

  if (teamRows.length === 0) {
    const err = new Error('Invalid team code or team is no longer active');
    err.status = 404;
    throw err;
  }

  const team = teamRows[0];

  const { rows: memberCheck } = await pool.query(
    'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
    [team.id, userId]
  );
  if (memberCheck.length > 0) {
    const err = new Error('You are already a member of this team');
    err.status = 409;
    throw err;
  }

  const { rows: countRows } = await pool.query(
    'SELECT COUNT(*) as count FROM team_members WHERE team_id = $1',
    [team.id]
  );
  if (parseInt(countRows[0].count) >= team.max_members) {
    const err = new Error('Team is full');
    err.status = 400;
    throw err;
  }

  await pool.query(
    'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
    [team.id, userId, 'member']
  );

  return getTeamById(team.id);
}

// FIX 6: Entire leaveTeam wrapped in a single DB transaction — atomic
async function leaveTeam(teamId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2 FOR UPDATE',
      [teamId, userId]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      const err = new Error('You are not a member of this team');
      err.status = 404;
      throw err;
    }

    if (rows[0].role === 'leader') {
      const { rows: members } = await client.query(
        'SELECT user_id FROM team_members WHERE team_id = $1 AND user_id != $2 ORDER BY joined_at ASC FOR UPDATE',
        [teamId, userId]
      );

      if (members.length > 0) {
        await client.query(
          'UPDATE team_members SET role = $1 WHERE team_id = $2 AND user_id = $3',
          ['leader', teamId, members[0].user_id]
        );
      } else {
        await client.query(
          "UPDATE teams SET status = 'inactive' WHERE id = $1",
          [teamId]
        );
      }
    }

    await client.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getTeamById(teamId) {
  const { rows } = await pool.query(
    `SELECT ${TEAM_COLUMNS},
            u.name as creator_name,
            COUNT(tm.user_id) as member_count
     FROM teams t
     LEFT JOIN users u ON t.created_by = u.id
     LEFT JOIN team_members tm ON t.id = tm.team_id
     WHERE t.id = $1
     GROUP BY t.id, t.name, t.description, t.max_members, t.status,
              t.required_skills, t.team_code, t.invite_enabled,
              t.created_by, t.created_at, t.updated_at, u.name`,
    [teamId]
  );

  if (rows.length === 0) {
    const err = new Error('Team not found');
    err.status = 404;
    throw err;
  }

  const team = rows[0];

  const { rows: members } = await pool.query(
    `SELECT u.id, u.name, u.roll_number, u.email, u.github_username,
            u.skills, u.profile_image_url, tm.role, tm.joined_at
     FROM team_members tm
     JOIN users u ON tm.user_id = u.id
     WHERE tm.team_id = $1
     ORDER BY tm.role DESC, tm.joined_at ASC`,
    [teamId]
  );

  return { ...team, members };
}

async function getMyTeams(userId) {
  const { rows } = await pool.query(
    `SELECT ${TEAM_COLUMNS},
            tm.role as user_role,
            u.name as creator_name,
            COUNT(tm2.user_id) as member_count
     FROM teams t
     JOIN team_members tm ON t.id = tm.team_id AND tm.user_id = $1
     LEFT JOIN users u ON t.created_by = u.id
     LEFT JOIN team_members tm2 ON t.id = tm2.team_id
     WHERE t.status != 'inactive'
     GROUP BY t.id, t.name, t.description, t.max_members, t.status,
              t.required_skills, t.team_code, t.invite_enabled,
              t.created_by, t.created_at, t.updated_at,
              tm.role, u.name
     ORDER BY t.created_at DESC`,
    [userId]
  );
  return rows;
}

async function getAllTeams(search) {
  const params = [];
  let whereClause = "WHERE t.status != 'inactive'";

  if (search) {
    params.push(`%${search}%`);
    whereClause += ` AND (t.name ILIKE $1 OR t.description ILIKE $1)`;
  }

  const { rows } = await pool.query(
    `SELECT ${TEAM_COLUMNS},
            u.name as creator_name,
            COUNT(tm.user_id) as member_count
     FROM teams t
     LEFT JOIN users u ON t.created_by = u.id
     LEFT JOIN team_members tm ON t.id = tm.team_id
     ${whereClause}
     GROUP BY t.id, t.name, t.description, t.max_members, t.status,
              t.required_skills, t.team_code, t.invite_enabled,
              t.created_by, t.created_at, t.updated_at, u.name
     ORDER BY t.created_at DESC`,
    params
  );
  return rows;
}

module.exports = { createTeam, joinTeamByCode, leaveTeam, getTeamById, getMyTeams, getAllTeams };
