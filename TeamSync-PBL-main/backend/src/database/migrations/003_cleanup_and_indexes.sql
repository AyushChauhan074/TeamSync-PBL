-- Migration 003: Clean up dead schema + add missing index
-- Safe: only drops unused columns, adds index

-- Remove orphaned column (tokens stored in github_oauth_tokens table, not here)
ALTER TABLE users DROP COLUMN IF EXISTS github_access_token;

-- sessions table: implement it properly by adding a cleanup index
-- (sessions are written by auth middleware in future; table stays)
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Add index on contributions.github_sha for faster dedup checks during sync
CREATE INDEX IF NOT EXISTS idx_contributions_github_sha ON contributions(github_sha);

-- Add index on contributions.contribution_date for timeline queries
CREATE INDEX IF NOT EXISTS idx_contributions_date ON contributions(contribution_date DESC);

-- Add index on projects.status for admin analytics queries
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Add index on teams.team_code for join-by-code lookups
CREATE INDEX IF NOT EXISTS idx_teams_team_code ON teams(team_code);
