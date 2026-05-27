const axios = require('axios');
const crypto = require('crypto');
const pool = require('../config/db');

const GITHUB_API = 'https://api.github.com';

// ─── Token Encryption (FIX 10) ───────────────────────────────────────────────
// Tokens are encrypted at rest using AES-256-GCM
// Key derived from ENCRYPTION_KEY env var (32 bytes hex = 64 chars)
const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    // Derive from JWT_SECRET if no dedicated key — still better than plaintext
    return crypto.createHash('sha256').update(process.env.JWT_SECRET).digest();
  }
  return Buffer.from(key, 'hex');
}

function encryptToken(plaintext) {
  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: iv:authTag:encrypted (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptToken(ciphertext) {
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) return ciphertext; // Legacy plaintext fallback
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

// ─── OAuth Flow ───────────────────────────────────────────────────────────────

function getOAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: 'read:user user:email repo',
    // Use a random state for CSRF protection
    state: crypto.randomBytes(16).toString('hex'),
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

async function exchangeCodeForToken(code) {
  const response = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GITHUB_CALLBACK_URL,
    },
    { headers: { Accept: 'application/json' } }
  );

  if (response.data.error) {
    const err = new Error(response.data.error_description || 'GitHub OAuth failed');
    err.status = 400;
    throw err;
  }

  return response.data.access_token;
}

async function getGithubUser(accessToken) {
  const { data } = await axios.get(`${GITHUB_API}/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  return data;
}

// ─── Connect GitHub to user account ──────────────────────────────────────────

async function connectGithubAccount(userId, code) {
  const plainAccessToken = await exchangeCodeForToken(code);
  const githubUser = await getGithubUser(plainAccessToken);

  // Encrypt before storing (FIX 10)
  const encryptedToken = encryptToken(plainAccessToken);

  await pool.query(
    `INSERT INTO github_oauth_tokens (user_id, access_token, github_login, github_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE
     SET access_token = $2, github_login = $3, github_id = $4, updated_at = NOW()`,
    [userId, encryptedToken, githubUser.login, String(githubUser.id)]
  );

  await pool.query(
    'UPDATE users SET github_username = $1, github_id = $2, updated_at = NOW() WHERE id = $3',
    [githubUser.login, String(githubUser.id), userId]
  );

  return { github_login: githubUser.login, github_id: githubUser.id };
}

// ─── Contribution Sync (FIX 11 — optimized, no per-commit API call) ──────────

async function syncProjectContributions(projectId) {
  const { rows: projectRows } = await pool.query(
    `SELECT p.id, p.github_repo_url, t.id as team_id
     FROM projects p
     JOIN teams t ON p.team_id = t.id
     WHERE p.id = $1 AND p.github_repo_url IS NOT NULL`,
    [projectId]
  );

  if (projectRows.length === 0) {
    const err = new Error('Project not found or no GitHub repo linked');
    err.status = 404;
    throw err;
  }

  const project = projectRows[0];
  const match = project.github_repo_url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/);
  if (!match) {
    const err = new Error('Invalid GitHub repo URL');
    err.status = 400;
    throw err;
  }

  const [, owner, repo] = match;

  const { rows: members } = await pool.query(
    `SELECT u.id as user_id, u.github_username, gt.access_token
     FROM team_members tm
     JOIN users u ON tm.user_id = u.id
     LEFT JOIN github_oauth_tokens gt ON u.id = gt.user_id
     WHERE tm.team_id = $1 AND u.github_username IS NOT NULL`,
    [project.team_id]
  );

  if (members.length === 0) return { synced: 0, message: 'No team members have GitHub connected' };

  // Decrypt stored token for API use
  const encryptedToken = members.find(m => m.access_token)?.access_token;
  const token = encryptedToken ? decryptToken(encryptedToken) : null;

  const headers = {
    Accept: 'application/vnd.github.v3+json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const usernameMap = {};
  for (const m of members) {
    if (m.github_username) usernameMap[m.github_username.toLowerCase()] = m.user_id;
  }

  let totalSynced = 0;
  const errors = [];

  // ── Sync Commits (FIX 11: use /stats/contributors for bulk line stats) ──
  try {
    // Fetch commits list — no per-commit detail call needed for basic tracking
    // We use the commit list endpoint which includes author login
    // Line stats are fetched only for NEW commits in a single batch via /stats/contributors
    const { data: commits } = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=100`,
      { headers }
    );

    // Get all existing SHAs for this project in one query (avoid N+1)
    const { rows: existingShas } = await pool.query(
      `SELECT github_sha FROM contributions WHERE project_id = $1 AND contribution_type = 'commit'`,
      [projectId]
    );
    const knownShas = new Set(existingShas.map(r => r.github_sha));

    const newCommits = commits.filter(c => {
      const login = c.author?.login?.toLowerCase();
      return usernameMap[login] && !knownShas.has(c.sha);
    });

    if (newCommits.length > 0) {
      // Fetch contributor stats once (bulk) instead of per-commit
      // GitHub returns weekly addition/deletion stats per contributor
      let statsMap = {};
      try {
        const { data: statsData } = await axios.get(
          `${GITHUB_API}/repos/${owner}/${repo}/stats/contributors`,
          { headers }
        );
        // statsData is array of { author: { login }, weeks: [{ a, d, c }] }
        if (Array.isArray(statsData)) {
          for (const contributor of statsData) {
            const login = contributor.author?.login?.toLowerCase();
            if (!login) continue;
            const totalAdditions = contributor.weeks.reduce((sum, w) => sum + w.a, 0);
            const totalDeletions = contributor.weeks.reduce((sum, w) => sum + w.d, 0);
            const totalCommits = contributor.weeks.reduce((sum, w) => sum + w.c, 0);
            statsMap[login] = { totalAdditions, totalDeletions, totalCommits };
          }
        }
      } catch (_) {
        // Stats endpoint returns 202 while computing — not a hard failure
      }

      // Insert new commits — use per-contributor average for line stats
      for (const commit of newCommits) {
        const githubLogin = commit.author?.login?.toLowerCase();
        const userId = usernameMap[githubLogin];

        const contributorStats = statsMap[githubLogin];
        const avgAdditions = contributorStats && contributorStats.totalCommits > 0
          ? Math.round(contributorStats.totalAdditions / contributorStats.totalCommits)
          : 0;
        const avgDeletions = contributorStats && contributorStats.totalCommits > 0
          ? Math.round(contributorStats.totalDeletions / contributorStats.totalCommits)
          : 0;

        await pool.query(
          `INSERT INTO contributions
           (user_id, project_id, contribution_type, title, github_url, additions, deletions, github_sha, contribution_date, synced_at)
           VALUES ($1, $2, 'commit', $3, $4, $5, $6, $7, $8, NOW())`,
          [
            userId, projectId,
            commit.commit.message.substring(0, 255),
            commit.html_url,
            avgAdditions, avgDeletions,
            commit.sha,
            new Date(commit.commit.author.date),
          ]
        );
        totalSynced++;
      }
    }
  } catch (err) {
    if (err.response?.status === 403) {
      errors.push('GitHub API rate limit reached. Try again later.');
    } else if (err.response?.status === 404) {
      errors.push('Repository not found or is private without a connected token.');
    } else {
      errors.push(`Commit sync error: ${err.message}`);
    }
  }

  // ── Sync Pull Requests ──
  try {
    const { data: prs } = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/pulls?state=all&per_page=100`,
      { headers }
    );

    const { rows: existingPrShas } = await pool.query(
      `SELECT github_sha FROM contributions WHERE project_id = $1 AND contribution_type = 'pull_request'`,
      [projectId]
    );
    const knownPrShas = new Set(existingPrShas.map(r => r.github_sha));

    for (const pr of prs) {
      const githubLogin = pr.user?.login?.toLowerCase();
      const userId = usernameMap[githubLogin];
      if (!userId) continue;

      const sha = `pr_${pr.number}`;
      if (knownPrShas.has(sha)) continue;

      await pool.query(
        `INSERT INTO contributions
         (user_id, project_id, contribution_type, title, description, github_url, github_sha, contribution_date, synced_at)
         VALUES ($1, $2, 'pull_request', $3, $4, $5, $6, $7, NOW())`,
        [
          userId, projectId,
          pr.title.substring(0, 255),
          (pr.body || '').substring(0, 500),
          pr.html_url, sha,
          new Date(pr.created_at),
        ]
      );
      totalSynced++;
    }
  } catch (err) {
    if (err.response?.status === 403) {
      errors.push('GitHub API rate limit reached during PR sync.');
    } else {
      errors.push(`PR sync error: ${err.message}`);
    }
  }

  // ── Sync Issues ──
  try {
    const { data: issues } = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/issues?state=all&per_page=100`,
      { headers }
    );

    const { rows: existingIssueShas } = await pool.query(
      `SELECT github_sha FROM contributions WHERE project_id = $1 AND contribution_type = 'issue'`,
      [projectId]
    );
    const knownIssueShas = new Set(existingIssueShas.map(r => r.github_sha));

    for (const issue of issues) {
      if (issue.pull_request) continue;
      const githubLogin = issue.user?.login?.toLowerCase();
      const userId = usernameMap[githubLogin];
      if (!userId) continue;

      const sha = `issue_${issue.number}`;
      if (knownIssueShas.has(sha)) continue;

      await pool.query(
        `INSERT INTO contributions
         (user_id, project_id, contribution_type, title, description, github_url, github_sha, contribution_date, synced_at)
         VALUES ($1, $2, 'issue', $3, $4, $5, $6, $7, NOW())`,
        [
          userId, projectId,
          issue.title.substring(0, 255),
          (issue.body || '').substring(0, 500),
          issue.html_url, sha,
          new Date(issue.created_at),
        ]
      );
      totalSynced++;
    }
  } catch (err) {
    if (err.response?.status === 403) {
      errors.push('GitHub API rate limit reached during issue sync.');
    } else {
      errors.push(`Issue sync error: ${err.message}`);
    }
  }

  await pool.query('UPDATE projects SET updated_at = NOW() WHERE id = $1', [projectId]);

  return {
    synced: totalSynced,
    repo: `${owner}/${repo}`,
    ...(errors.length > 0 && { warnings: errors }),
  };
}

async function getContributionSummary(projectId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.roll_number, u.github_username,
            COUNT(c.id) as total_contributions,
            SUM(CASE WHEN c.contribution_type = 'commit' THEN 1 ELSE 0 END) as commits,
            SUM(CASE WHEN c.contribution_type = 'pull_request' THEN 1 ELSE 0 END) as pull_requests,
            SUM(CASE WHEN c.contribution_type = 'issue' THEN 1 ELSE 0 END) as issues,
            SUM(COALESCE(c.additions, 0)) as total_additions,
            SUM(COALESCE(c.deletions, 0)) as total_deletions,
            SUM(
              CASE c.contribution_type
                WHEN 'commit' THEN 1
                WHEN 'pull_request' THEN 3
                WHEN 'issue' THEN 1
                WHEN 'review' THEN 2
                ELSE 1
              END
            ) as contribution_score
     FROM team_members tm
     JOIN users u ON tm.user_id = u.id
     JOIN teams t ON tm.team_id = t.id
     JOIN projects p ON p.team_id = t.id
     LEFT JOIN contributions c ON c.user_id = u.id AND c.project_id = p.id
     WHERE p.id = $1
     GROUP BY u.id, u.name, u.roll_number, u.github_username
     ORDER BY contribution_score DESC NULLS LAST`,
    [projectId]
  );
  return rows;
}

module.exports = {
  getOAuthUrl,
  connectGithubAccount,
  syncProjectContributions,
  getContributionSummary,
};
