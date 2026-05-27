require('dotenv').config();
const request = require('supertest');
const app = require('../server');
const pool = require('../src/config/db');

let accessToken;
let refreshToken;
let teamId;

const testUser = {
  roll_number: 'TEST001',
  name: 'Test User',
  email: 'test.user.001@gehu.ac.in',
  password: 'TestPass@123',
  role: 'student',
};

const testUser2 = {
  roll_number: 'TEST002',
  name: 'Test User Two',
  email: 'test.user.002@gehu.ac.in',
  password: 'TestPass@123',
  role: 'student',
};

afterAll(async () => {
  await pool.query('DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE roll_number IN ($1,$2))', [testUser.roll_number, testUser2.roll_number]);
  await pool.query('DELETE FROM users WHERE roll_number IN ($1,$2)', [testUser.roll_number, testUser2.roll_number]);
  await pool.end();
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
describe('Auth API', () => {
  test('POST /register — creates user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.user.roll_number).toBe(testUser.roll_number);
  });

  test('POST /register — rejects duplicate', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser);
    expect(res.status).toBe(409);
  });

  test('POST /login — returns access + refresh tokens', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      rollNumber: testUser.roll_number,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  test('POST /login — rejects wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      rollNumber: testUser.roll_number,
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  test('GET /me — returns user with valid token', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.roll_number).toBe(testUser.roll_number);
  });

  test('GET /me — rejects without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  // FIX 3: Token rotation test
  test('POST /refresh — returns NEW access AND refresh token (rotation)', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({ refresh_token: refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    // New refresh token must be different from old one
    expect(res.body.refreshToken).not.toBe(refreshToken);
    // Update tokens for subsequent tests
    accessToken = res.body.accessToken;
    const oldRefreshToken = refreshToken;
    refreshToken = res.body.refreshToken;

    // Old refresh token must now be rejected (revoked)
    const retryRes = await request(app).post('/api/v1/auth/refresh').send({ refresh_token: oldRefreshToken });
    expect(retryRes.status).toBe(401);
  });

  test('POST /logout — revokes token', async () => {
    const res = await request(app).post('/api/v1/auth/logout').send({ refresh_token: refreshToken });
    expect(res.status).toBe(200);

    // Refresh token must be rejected after logout
    const retryRes = await request(app).post('/api/v1/auth/refresh').send({ refresh_token: refreshToken });
    expect(retryRes.status).toBe(401);
  });
});

// ─── Teams ────────────────────────────────────────────────────────────────────
describe('Teams API', () => {
  beforeAll(async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      rollNumber: testUser.roll_number,
      password: testUser.password,
    });
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  test('POST /teams — creates team with 6-char code', async () => {
    const res = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Test Team Alpha', description: 'Test', max_members: 4 });
    expect(res.status).toBe(201);
    expect(res.body.team.team_code).toHaveLength(6);
    expect(res.body.team.name).toBe('Test Team Alpha');
    teamId = res.body.team.id;
  });

  test('GET /teams — returns array (no GROUP BY crash with multiple teams)', async () => {
    // Create a second team to ensure GROUP BY works with multiple rows
    await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Test Team Beta', max_members: 3 });

    const res = await request(app)
      .get('/api/v1/teams')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.teams)).toBe(true);
    expect(res.body.teams.length).toBeGreaterThanOrEqual(2);
    // Verify explicit columns are returned (not t.*)
    const team = res.body.teams[0];
    expect(team.id).toBeDefined();
    expect(team.name).toBeDefined();
    expect(team.team_code).toBeDefined();
    expect(team.member_count).toBeDefined();
  });

  test('GET /teams/my — returns teams for current user', async () => {
    const res = await request(app)
      .get('/api/v1/teams/my')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.teams)).toBe(true);
    expect(res.body.teams.length).toBeGreaterThanOrEqual(1);
  });

  test('POST /teams/join — rejects already-member', async () => {
    // Get team code
    const teamRes = await request(app)
      .get(`/api/v1/teams/${teamId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    const code = teamRes.body.team.team_code;

    const res = await request(app)
      .post('/api/v1/teams/join')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ team_code: code });
    expect(res.status).toBe(409); // Already a member
  });

  test('DELETE /teams/:id/leave — leaves team (atomic)', async () => {
    const res = await request(app)
      .delete(`/api/v1/teams/${teamId}/leave`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });
});

// ─── Authorization ────────────────────────────────────────────────────────────
describe('Authorization checks', () => {
  let user2Token;
  let projectId;

  beforeAll(async () => {
    // Register second user
    await request(app).post('/api/v1/auth/register').send(testUser2);
    const res = await request(app).post('/api/v1/auth/login').send({
      rollNumber: testUser2.roll_number,
      password: testUser2.password,
    });
    user2Token = res.body.accessToken;

    // Re-login user1
    const res1 = await request(app).post('/api/v1/auth/login').send({
      rollNumber: testUser.roll_number,
      password: testUser.password,
    });
    accessToken = res1.body.accessToken;

    // Create a team and project as user1
    const teamRes = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Auth Test Team', max_members: 4 });
    teamId = teamRes.body.team.id;

    const projRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Auth Test Project', team_id: teamId });
    projectId = projRes.body.project.id;
  });

  test('PATCH /projects/:id/repo — rejects user not in team (FIX 5)', async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/repo`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ github_repo_url: 'https://github.com/hacker/repo' });
    expect(res.status).toBe(403);
  });

  test('PATCH /projects/:id/repo — allows user in team', async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/repo`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ github_repo_url: 'https://github.com/owner/repo' });
    expect(res.status).toBe(200);
    expect(res.body.project.github_repo_url).toBe('https://github.com/owner/repo');
  });

  test('GET /users — rejects student (admin/faculty only)', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });
});

// ─── Health ───────────────────────────────────────────────────────────────────
describe('Health Check', () => {
  test('GET /health — returns OK with DB connected', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.database).toBe('connected');
  });
});
