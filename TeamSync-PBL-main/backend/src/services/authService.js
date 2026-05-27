const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken() {
  return uuidv4();
}

async function register({ roll_number, name, email, password, role, branch, year, phone }) {
  // Check duplicates
  const existing = await pool.query(
    'SELECT id FROM users WHERE roll_number = $1 OR email = $2',
    [roll_number.toUpperCase(), email.toLowerCase()]
  );
  if (existing.rows.length > 0) {
    const err = new Error('Roll number or email already registered');
    err.status = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const { rows } = await pool.query(
    `INSERT INTO users (roll_number, name, email, password_hash, role, branch, year, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, roll_number, name, email, role, branch, year, created_at`,
    [roll_number.toUpperCase(), name, email.toLowerCase(), password_hash, role || 'student', branch, year, phone]
  );

  return rows[0];
}

async function login(rollNumber, password) {
  const { rows } = await pool.query(
    `SELECT id, roll_number, name, email, password_hash, role, branch, year,
            semester, phone, github_username, linkedin_url, bio, skills,
            interests, profile_image_url, designation, is_active
     FROM users WHERE roll_number = $1`,
    [rollNumber.toUpperCase()]
  );

  if (rows.length === 0) {
    const err = new Error('Invalid roll number or password');
    err.status = 401;
    throw err;
  }

  const user = rows[0];

  if (!user.is_active) {
    const err = new Error('Account is deactivated. Contact admin.');
    err.status = 403;
    throw err;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    const err = new Error('Invalid roll number or password');
    err.status = 401;
    throw err;
  }

  const tokenPayload = { userId: user.id, rollNumber: user.roll_number, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken();

  // Store refresh token
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, refreshToken, expiresAt]
  );

  const { password_hash, ...userData } = user;
  return { user: userData, accessToken, refreshToken };
}

async function refreshAccessToken(oldRefreshToken) {
  const { rows } = await pool.query(
    `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked,
            u.roll_number, u.role, u.is_active
     FROM refresh_tokens rt
     JOIN users u ON rt.user_id = u.id
     WHERE rt.token = $1`,
    [oldRefreshToken]
  );

  if (rows.length === 0) {
    const err = new Error('Invalid refresh token');
    err.status = 401;
    throw err;
  }

  const record = rows[0];

  if (record.revoked || new Date(record.expires_at) < new Date()) {
    // If already revoked, revoke ALL tokens for this user (token theft detection)
    if (record.revoked) {
      await pool.query(
        'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1',
        [record.user_id]
      );
    }
    const err = new Error('Refresh token expired or revoked');
    err.status = 401;
    throw err;
  }

  if (!record.is_active) {
    const err = new Error('Account deactivated');
    err.status = 403;
    throw err;
  }

  // FIX: Rotate — revoke old token, issue new one atomically
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Revoke old token
    await client.query(
      'UPDATE refresh_tokens SET revoked = true WHERE id = $1',
      [record.id]
    );

    // Issue new refresh token
    const newRefreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await client.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [record.user_id, newRefreshToken, expiresAt]
    );

    await client.query('COMMIT');

    const accessToken = generateAccessToken({
      userId: record.user_id,
      rollNumber: record.roll_number,
      role: record.role,
    });

    return { accessToken, refreshToken: newRefreshToken };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function logout(refreshToken) {
  await pool.query(
    'UPDATE refresh_tokens SET revoked = true WHERE token = $1',
    [refreshToken]
  );
}

async function revokeAllUserTokens(userId) {
  await pool.query(
    'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1',
    [userId]
  );
}

module.exports = { register, login, refreshAccessToken, logout, revokeAllUserTokens };
