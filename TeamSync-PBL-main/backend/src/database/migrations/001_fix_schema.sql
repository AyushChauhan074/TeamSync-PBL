-- Migration 001: Fix fake password hashes + add missing user columns
-- Run: node src/database/migrate.js
-- SAFE: Does NOT drop any existing tables or columns

-- Step 1: Add missing columns to users table (IF NOT EXISTS is safe)
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS semester INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id VARCHAR(50);

-- Step 2: Add missing columns to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS team_code VARCHAR(10) UNIQUE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS invite_enabled BOOLEAN DEFAULT true;

-- Step 3: Add missing columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS faculty_id INTEGER REFERENCES users(id);

-- Step 4: Add missing columns to contributions table
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS github_sha VARCHAR(100);
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP;

-- Step 5: Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- Step 6: Create github_oauth_tokens table
CREATE TABLE IF NOT EXISTS github_oauth_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    token_type VARCHAR(50) DEFAULT 'bearer',
    scope TEXT,
    github_login VARCHAR(100),
    github_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_github_tokens_user_id ON github_oauth_tokens(user_id);

-- Step 7: Create sessions table (for audit/security tracking)
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);

-- Step 8: Create migrations tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
