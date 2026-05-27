#!/bin/bash

# ============================================================
#  TeamSync PBL — start.sh
#  Starts: Backend (Node.js) + Frontend (React)
#  Database: Render PostgreSQL (remote, no local setup needed)
#  Usage: chmod +x start.sh && ./start.sh
# ============================================================

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

# ── Colours ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✔]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✘]${NC} $1"; }
info() { echo -e "${CYAN}[→]${NC} $1"; }

# ── Banner ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}║        TeamSync PBL — Project Launcher       ║${NC}"
echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── Cleanup on exit ───────────────────────────────────────────
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  warn "Shutting down..."
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null && log "Backend stopped"
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null && log "Frontend stopped"
  echo -e "${BOLD}${BLUE}Goodbye!${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── 1. Check Node ─────────────────────────────────────────────
info "Checking Node.js..."
if ! command -v node &>/dev/null; then
  err "Node.js not found. Install from https://nodejs.org"
  exit 1
fi
NODE_VER=$(node --version)
log "Node.js $NODE_VER found"

# ── 2. Backend .env ───────────────────────────────────────────
info "Checking backend .env..."
if [ ! -f "$BACKEND/.env" ]; then
  warn "backend/.env not found — creating from .env.example"
  cp "$BACKEND/.env.example" "$BACKEND/.env"
  echo ""
  echo -e "${RED}${BOLD}  ⚠️  ACTION REQUIRED${NC}"
  echo -e "  Open ${BOLD}backend/.env${NC} and fill in:"
  echo -e "  ${YELLOW}  DATABASE_URL${NC}  — your Render PostgreSQL URL"
  echo -e "  ${YELLOW}  JWT_SECRET${NC}    — run: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  echo -e "  ${YELLOW}  ENCRYPTION_KEY${NC}— run: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  echo ""
  read -rp "  Press ENTER after editing backend/.env to continue... "
fi

# Validate required vars
source "$BACKEND/.env" 2>/dev/null || true
if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "postgresql://username:password@hostname.render.com/database_name" ]; then
  err "DATABASE_URL is not set in backend/.env"
  err "Edit backend/.env and set your real Render PostgreSQL URL"
  exit 1
fi
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "REPLACE_WITH_64_CHAR_RANDOM_HEX_STRING" ]; then
  err "JWT_SECRET is not set in backend/.env"
  err "Run: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\" and paste it"
  exit 1
fi
log "backend/.env looks good"

# ── 3. Frontend .env ──────────────────────────────────────────
info "Checking frontend .env..."
if [ ! -f "$FRONTEND/.env" ]; then
  warn "frontend/.env not found — creating with default localhost API URL"
  echo "REACT_APP_API_URL=http://localhost:8000/api/v1" > "$FRONTEND/.env"
fi
log "frontend/.env ready"

# ── 4. Install dependencies ───────────────────────────────────
info "Checking backend dependencies..."
if [ ! -d "$BACKEND/node_modules" ]; then
  warn "Installing backend dependencies..."
  cd "$BACKEND" && npm install --silent
  log "Backend dependencies installed"
else
  log "Backend node_modules already present"
fi

info "Checking frontend dependencies..."
if [ ! -d "$FRONTEND/node_modules" ]; then
  warn "Installing frontend dependencies..."
  cd "$FRONTEND" && npm install --silent
  log "Frontend dependencies installed"
else
  log "Frontend node_modules already present"
fi

# ── 5. Run DB migrations ──────────────────────────────────────
info "Running database migrations..."
cd "$BACKEND"
if node src/database/migrate.js; then
  log "Migrations complete"
else
  err "Migration failed — check your DATABASE_URL and Render DB connectivity"
  exit 1
fi

# ── 6. Fix password hashes (only runs if fake hashes exist) ───
info "Checking password hashes..."
cd "$BACKEND"
if node src/database/seedFix.js; then
  log "Password hashes verified"
else
  warn "seedFix.js had an issue — continuing anyway"
fi

# ── 7. Start Backend ──────────────────────────────────────────
echo ""
# Get PORT from .env file
source "$BACKEND/.env"
BACKEND_PORT=${PORT:-8000}
info "Starting backend on http://localhost:$BACKEND_PORT ..."
cd "$BACKEND"
node server.js &
BACKEND_PID=$!

# Wait for backend to be ready
TRIES=0
until curl -sf http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; do
  sleep 1
  TRIES=$((TRIES + 1))
  if [ $TRIES -ge 20 ]; then
    err "Backend did not start within 20 seconds"
    err "Check backend logs above for errors"
    kill "$BACKEND_PID" 2>/dev/null
    exit 1
  fi
done
log "Backend is up → http://localhost:$BACKEND_PORT"
log "Health check → http://localhost:$BACKEND_PORT/health"
log "API base     → http://localhost:$BACKEND_PORT/api/v1"

# ── 8. Start Frontend ─────────────────────────────────────────
echo ""
# Get PORT from frontend .env file
source "$FRONTEND/.env"
FRONTEND_PORT=${PORT:-3000}
info "Starting frontend on http://localhost:$FRONTEND_PORT ..."
cd "$FRONTEND"
BROWSER=none npm start &
FRONTEND_PID=$!

# Wait for frontend
TRIES=0
until curl -sf http://localhost:$FRONTEND_PORT > /dev/null 2>&1; do
  sleep 2
  TRIES=$((TRIES + 1))
  if [ $TRIES -ge 30 ]; then
    warn "Frontend taking longer than usual — it may still be compiling"
    break
  fi
done

# ── 9. Open Browser ──────────────────────────────────────────
sleep 2
info "Opening browser..."
open http://localhost:$FRONTEND_PORT

# ── 10. Done ──────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║           TeamSync PBL is RUNNING!           ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Frontend${NC}  →  ${CYAN}http://localhost:$FRONTEND_PORT${NC}"
echo -e "  ${BOLD}Backend${NC}   →  ${CYAN}http://localhost:$BACKEND_PORT${NC}"
echo -e "  ${BOLD}Health${NC}    →  ${CYAN}http://localhost:$BACKEND_PORT/health${NC}"
echo -e "  ${BOLD}API${NC}       →  ${CYAN}http://localhost:$BACKEND_PORT/api/v1${NC}"
echo ""
echo -e "  ${BOLD}Default logins:${NC}"
echo -e "  Student  →  roll: ${YELLOW}230111589${NC}  pass: ${YELLOW}230111589${NC}"
echo -e "  Faculty  →  roll: ${YELLOW}234555999${NC}  pass: ${YELLOW}234555999${NC}"
echo -e "  Admin    →  roll: ${YELLOW}ADMIN001${NC}   pass: ${YELLOW}Admin@123${NC}"
echo ""
echo -e "  Press ${BOLD}Ctrl+C${NC} to stop everything"
echo ""

# Keep script alive — wait for both processes
wait $BACKEND_PID $FRONTEND_PID
