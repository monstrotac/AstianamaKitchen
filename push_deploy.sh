#!/usr/bin/env bash
# =============================================================================
# push_deploy.sh  —  Local deployment launcher for AstianamaKitchen
# Run this from your machine to push changes and boot the server.
#
# Usage:
#   bash push_deploy.sh                      # full deploy
#   bash push_deploy.sh --skip-migrate       # skip DB migrations
#   bash push_deploy.sh --skip-seed          # skip DB seed
#   bash push_deploy.sh --skip-push          # don't git push (server already up to date)
# =============================================================================

set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────────
SERVER_USER="ubuntu"
SERVER_HOST="ec2-3-147-206-43.us-east-2.compute.amazonaws.com"
REMOTE_DIR="/UinderalDeployment/AstianamaKitchen"
REPO_URL="https://github.com/monstrotac/AstianamaKitchen.git"

# PEM key lives one directory above this script (UinderalDevelopment/euclid.pem)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PEM="$SCRIPT_DIR/../euclid.pem"

SSH_OPTS="-i \"$PEM\" -o StrictHostKeyChecking=accept-new"

# ── Flags ────────────────────────────────────────────────────────────────────
SKIP_PUSH=false
REMOTE_FLAGS=""
for arg in "$@"; do
  case $arg in
    --skip-push)    SKIP_PUSH=true ;;
    --skip-migrate) REMOTE_FLAGS="$REMOTE_FLAGS --skip-migrate" ;;
    --skip-seed)    REMOTE_FLAGS="$REMOTE_FLAGS --skip-seed" ;;
  esac
done

# ── Helpers ──────────────────────────────────────────────────────────────────
step() { echo ""; echo "▶  $*"; }
ok()   { echo "   ✓  $*"; }
ssh_exec() { ssh -i "$PEM" -o StrictHostKeyChecking=accept-new "$SERVER_USER@$SERVER_HOST" "$@"; }

# ── Validate PEM ─────────────────────────────────────────────────────────────
step "Checking PEM key"
if [ ! -f "$PEM" ]; then
  echo "✗  PEM key not found at: $PEM"
  echo "   Expected: $(dirname "$SCRIPT_DIR")/euclid.pem"
  exit 1
fi
ok "PEM found: $PEM"

# ── Git push ──────────────────────────────────────────────────────────────────
if [ "$SKIP_PUSH" = false ]; then
  step "Pushing to GitHub"
  cd "$SCRIPT_DIR"

  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "   ⚠  You have uncommitted changes. Commit them first or they won't be deployed."
    read -r -p "   Continue anyway? [y/N] " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || exit 0
  fi

  git push origin master
  ok "Pushed to origin/master"
else
  echo "   (git push skipped via --skip-push)"
fi

# ── Bootstrap or pull on server ───────────────────────────────────────────────
step "Connecting to $SERVER_USER@$SERVER_HOST"

ssh_exec bash <<REMOTE
set -euo pipefail

if [ ! -d "$REMOTE_DIR/.git" ]; then
  echo "   First deploy — cloning repository..."
  sudo mkdir -p "$REMOTE_DIR"
  sudo chown \$USER:\$USER "$REMOTE_DIR"
  git clone "$REPO_URL" "$REMOTE_DIR"
  echo "   ✓  Cloned into $REMOTE_DIR"
else
  echo "   Repository exists, pulling latest..."
  cd "$REMOTE_DIR"
  git pull origin master
  echo "   ✓  Up to date"
fi
REMOTE

# ── Run remote deploy.sh ──────────────────────────────────────────────────────
step "Running deploy.sh on server"
ssh_exec "cd '$REMOTE_DIR' && bash deploy.sh --skip-pull $REMOTE_FLAGS"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════"
echo "  Deployed to $SERVER_HOST"
echo "  Remote path: $REMOTE_DIR"
echo "  To tail logs:  ssh -i euclid.pem $SERVER_USER@$SERVER_HOST"
echo "                 pm2 logs gardeners-api"
echo "══════════════════════════════════════════════════════"
echo ""
