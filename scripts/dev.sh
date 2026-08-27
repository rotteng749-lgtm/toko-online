#!/usr/bin/env bash
# Quick local start — install if needed, then next dev
# Usage: bash scripts/dev.sh [project-dir]

set -e
DIR="${1:-.}"
cd "$DIR"

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install --no-audit --no-fund
fi

# Ensure data dir
mkdir -p data

echo ""
echo "  Local server starting..."
echo "  → http://127.0.0.1:3000"
echo "  → Admin: http://127.0.0.1:3000/admin"
echo "  → API:   http://127.0.0.1:3000/api/connect"
echo ""
echo "  Press Ctrl+C to stop"
echo ""

npm run dev
