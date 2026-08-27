#!/usr/bin/env bash
# Push Panxcz License Server project to GitHub, then ready for Vercel import.
# Usage: bash push-github.sh [project-dir] [repo-name]
# Example: bash push-github.sh ./panxcz-server panxcz-license-server
#
# Behavior:
# 1. Checks if `gh` is installed and user is logged in
# 2. If not logged in → runs `gh auth login` (interactive)
# 3. Creates private or public repo (default public for easy Vercel)
# 4. git init + add + commit + push
# 5. Prints the GitHub URL + next step for Vercel one-click deploy

set -e

PROJECT_DIR="${1:-.}"
REPO_NAME="${2:-panxcz-license-server}"
VISIBILITY="${3:-public}"   # public | private

cd "$PROJECT_DIR"

echo "==> Panxcz → GitHub push helper"
echo "    Project : $(pwd)"
echo "    Repo    : $REPO_NAME ($VISIBILITY)"
echo ""

# 1. Check gh CLI
if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: GitHub CLI (gh) is not installed."
  echo "Install it first:"
  echo "  macOS  : brew install gh"
  echo "  Linux  : https://github.com/cli/cli#installation"
  echo "  Windows: winget install GitHub.cli"
  exit 1
fi

# 2. Check login status
if ! gh auth status >/dev/null 2>&1; then
  echo "You are NOT logged in to GitHub."
  echo "Starting interactive login now..."
  echo "(Choose GitHub.com → HTTPS → Login with browser recommended)"
  echo ""
  gh auth login
  echo ""
  if ! gh auth status >/dev/null 2>&1; then
    echo "Login failed or cancelled. Aborting."
    exit 1
  fi
  echo "Login successful."
else
  echo "Already logged in to GitHub:"
  gh auth status 2>&1 | head -5
fi

echo ""

# 3. Ensure git repo
if [ ! -d .git ]; then
  echo "Initializing git repository..."
  git init -b main
fi

# Basic .gitignore if missing
if [ ! -f .gitignore ]; then
  cat > .gitignore << 'GI'
node_modules/
.next/
data/*.db
data/*.db-*
.env
.env.local
.env*.local
*.log
.DS_Store
GI
  echo "  + Created .gitignore"
fi

# Stage & commit
git add -A
if git diff --cached --quiet; then
  echo "Nothing new to commit (working tree clean)."
else
  git commit -m "Initial Panxcz License Server — ready for Vercel"
fi

# 4. Create repo + push
echo ""
echo "Creating GitHub repository: $REPO_NAME ($VISIBILITY)..."

# Check if remote already exists
if git remote get-url origin >/dev/null 2>&1; then
  echo "Remote 'origin' already set. Pushing..."
  git push -u origin main
else
  # Create and push in one go
  if [ "$VISIBILITY" = "private" ]; then
    gh repo create "$REPO_NAME" --private --source=. --remote=origin --push
  else
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
  fi
fi

REPO_URL=$(gh repo view --json url -q .url 2>/dev/null || git remote get-url origin)
echo ""
echo "=============================================="
echo "  SUCCESS — Repo is live on GitHub"
echo "  $REPO_URL"
echo "=============================================="
echo ""
echo "Next (fastest hosting):"
echo "  1. Open https://vercel.com/new"
echo "  2. Import the repository above"
echo "  3. Add env vars (see references/vercel.md)"
echo "  4. Deploy — done in ~1 minute"
echo ""
echo "Or CLI:"
echo "  npx vercel --prod"
echo ""
