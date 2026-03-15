#!/usr/bin/env bash
# Setup local git hooks for ActBound AI
# Usage: bash scripts/setup-hooks.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}!${NC} $1"; }
fail()  { echo -e "${RED}✗${NC} $1"; exit 1; }

echo "Setting up ActBound AI local git hooks..."
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || fail "node is not installed. Install Node.js 22+ from https://nodejs.org/"
command -v pnpm >/dev/null 2>&1 || fail "pnpm is not installed. Run: corepack enable && corepack prepare"
command -v pre-commit >/dev/null 2>&1 || fail "pre-commit is not installed. Run: pip install pre-commit (or brew install pre-commit)"

NODE_MAJOR=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$NODE_MAJOR" -lt 22 ]; then
  warn "Node.js $(node -v) detected. Node 22+ is recommended."
fi

info "Prerequisites OK"

# Install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing pnpm dependencies..."
  pnpm install
fi
info "Dependencies installed"

# Install hooks
pre-commit install
pre-commit install --hook-type pre-push
info "Git hooks installed (pre-commit + pre-push)"

# Verify
echo ""
echo "Running hooks against all files to verify..."
echo ""
if pre-commit run --all-files; then
  echo ""
  info "All hooks passed. Setup complete."
else
  echo ""
  warn "Some hooks reported issues. Fix them before your next commit."
  warn "See docs/security/local-hooks.md for remediation steps."
fi
