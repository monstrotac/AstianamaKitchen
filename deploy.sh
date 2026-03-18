#!/usr/bin/env bash
# =============================================================================
# deploy.sh — The Gardeners  ·  Skinscore server deployment
# Target:  /uinderal/swtor/astianama
# API:     port 3501   (prod)
# Usage:   bash deploy.sh [--skip-migrate] [--skip-seed]
# =============================================================================

set -euo pipefail

DEPLOY_DIR="/UinderalDeployment/AstianamaKitchen"
PM2_APP="gardeners-api"
LOG_DIR="$DEPLOY_DIR/logs"

# ── Flags ────────────────────────────────────────────────────────────────────
SKIP_MIGRATE=false
SKIP_SEED=false
SKIP_PULL=false
for arg in "$@"; do
  case $arg in
    --skip-migrate) SKIP_MIGRATE=true ;;
    --skip-seed)    SKIP_SEED=true    ;;
    --skip-pull)    SKIP_PULL=true    ;;
  esac
done

# ── Helpers ──────────────────────────────────────────────────────────────────
step() { echo ""; echo "▶  $*"; }
ok()   { echo "   ✓  $*"; }

# ── Preflight ────────────────────────────────────────────────────────────────
step "Preflight checks"

if ! command -v node &>/dev/null; then
  echo "✗  node not found — install Node.js 18+ first"; exit 1
fi
if ! command -v npm &>/dev/null; then
  echo "✗  npm not found"; exit 1
fi
if ! command -v pm2 &>/dev/null; then
  echo "✗  pm2 not found — run: npm install -g pm2"; exit 1
fi

ok "node $(node -v)   npm $(npm -v)   pm2 $(pm2 -v)"

# ── Pull latest code ──────────────────────────────────────────────────────────
if [ "$SKIP_PULL" = false ]; then
  step "Pulling latest code"
  cd "$DEPLOY_DIR"
  git pull origin master
  ok "Code up to date"
else
  echo "   (git pull skipped via --skip-pull)"
  cd "$DEPLOY_DIR"
fi

# ── Create log directory ──────────────────────────────────────────────────────
mkdir -p "$LOG_DIR"

# ── Backend dependencies ──────────────────────────────────────────────────────
step "Installing backend dependencies"
cd "$DEPLOY_DIR/backend"
npm install --omit=dev
ok "Backend node_modules ready"

# ── Database migrations ───────────────────────────────────────────────────────
if [ "$SKIP_MIGRATE" = false ]; then
  step "Running database migrations"
  NODE_ENV=production npm run migrate
  ok "Migrations applied"
else
  echo "   (skipped via --skip-migrate)"
fi

# ── Seed (first deploy only) ──────────────────────────────────────────────────
if [ "$SKIP_SEED" = false ]; then
  step "Running seed (safe — skips if already seeded)"
  NODE_ENV=production npm run seed
  ok "Seed complete"
else
  echo "   (skipped via --skip-seed)"
fi

# ── Frontend build ────────────────────────────────────────────────────────────
step "Building frontend"
cd "$DEPLOY_DIR/frontend"
npm install
npm run build
ok "Frontend built → frontend/dist/"

# ── Start / reload API via PM2 ────────────────────────────────────────────────
step "Starting API with PM2"
cd "$DEPLOY_DIR/backend"

if pm2 describe "$PM2_APP" &>/dev/null; then
  pm2 reload "$PM2_APP" --update-env
  ok "PM2 process reloaded (zero-downtime)"
else
  pm2 start pm2.config.js
  ok "PM2 process started"
fi

pm2 save
ok "PM2 state saved"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════"
echo "  Deployment complete"
echo "  API running on port 3501"
echo "  Static frontend served from backend"
echo "  Logs: $LOG_DIR"
echo "══════════════════════════════════════════════"
echo ""
echo "  Useful commands:"
echo "  pm2 logs $PM2_APP          — tail logs"
echo "  pm2 status                 — process status"
echo "  pm2 restart $PM2_APP       — hard restart"
echo ""
