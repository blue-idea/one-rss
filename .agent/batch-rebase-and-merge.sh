#!/bin/bash
# Batch Rebase and Merge - After all agents complete
# Usage: ./batch-rebase-and-merge.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKTREES_DIR="$PROJECT_ROOT/.agent/worktrees"

echo "=== Step 1: Fetch latest main ==="
cd "$PROJECT_ROOT"
git fetch origin main

echo ""
echo "=== Step 2: Rebase all worktrees to latest main ==="
for wt in "$WORKTREES_DIR"/*/; do
  BRANCH_NAME=$(basename "$wt")
  echo "Rebasing $BRANCH_NAME..."
  cd "$wt"
  git rebase origin/main 2>&1 || {
    echo "  ⚠️  Rebase failed for $BRANCH_NAME, trying with --force..."
    git rebase --abort 2>/dev/null || true
  }
done

echo ""
echo "=== Step 3: Force push all rebased branches ==="
for wt in "$WORKTREES_DIR"/*/; do
  BRANCH_NAME=$(basename "$wt")
  echo "Force pushing $BRANCH_NAME..."
  cd "$wt"
  git push --force-with-lease origin HEAD:refs/heads/agent/$BRANCH_NAME 2>&1 || {
    echo "  ⚠️  Push failed for $BRANCH_NAME"
  }
done

echo ""
echo "=== Step 4: Wait for GitHub to update ==="
sleep 10

echo ""
echo "=== Step 5: Create PRs (skip existing) ==="
for wt in "$WORKTREES_DIR"/*/; do
  BRANCH_NAME=$(basename "$wt")
  PR_BRANCH="agent/$BRANCH_NAME"
  echo "Creating PR for $PR_BRANCH..."
  cd "$PROJECT_ROOT"
  gh pr create --repo blue-idea/one-rss --base main --head "$PR_BRANCH" \
    --title "Agent: $BRANCH_NAME" --body "Agent implementation" 2>&1 || {
    echo "  PR may already exist, skipping..."
  }
  sleep 2
done

echo ""
echo "=== Step 6: Quick sequential merge ==="
for pr in $(gh pr list --repo blue-idea/one-rss --state open --json number --jq '.[].number | @sh' 2>/dev/null); do
  echo "Merging PR #$pr..."
  gh pr merge $pr --admin --squash 2>&1 || {
    echo "  ⚠️  Merge failed for PR #$pr, may need manual review"
  }
  sleep 3
done

echo ""
echo "=== Done ==="
