#!/bin/bash
# Agent Cluster System - Main Agent Launcher
# Usage: ./run-agent.sh <task> <model> <priority>
# Example: ./run-agent.sh "Implement login feature" gpt-5.4 high

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKTREES_DIR="$PROJECT_ROOT/.agent/worktrees"
LOG_DIR="$PROJECT_DIR/.agent/logs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Parse arguments
TASK="$1"
MODEL="${2:-gpt-5.4}"
PRIORITY="${3:-normal}"

if [ -z "$TASK" ]; then
    error "Usage: run-agent.sh <task> <model> <priority>"
fi

# Create unique branch name
BRANCH_NAME="agent/$(echo "$TASK" | tr ' ' '-' | tr -cd 'a-zA-Z0-9-' | head -c 50)-$(date +%s)"

log "Starting agent task: $TASK"
log "Model: $MODEL, Priority: $PRIORITY"
log "Branch: $BRANCH_NAME"

# Create worktree
WORKTREE_PATH="$WORKTREES_DIR/$(basename "$BRANCH_NAME")"
mkdir -p "$WORKTREE_PATH"

log "Creating worktree at $WORKTREE_PATH..."

cd "$PROJECT_ROOT"
git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME" origin/main 2>/dev/null || {
    log "Worktree exists, using existing one"
    cd "$WORKTREE_PATH"
    git pull origin main --quiet
}

# Install dependencies in worktree
cd "$WORKTREE_PATH"
if [ ! -d "node_modules" ]; then
    log "Installing dependencies..."
    pnpm install --silent
fi

# Create tmux session name
SESSION_NAME="agent-$(echo "$BRANCH_NAME" | tr '/' '-' | tr -cd 'a-zA-Z0-9-' | head -c 20)"

# Build agent command based on model
case "$MODEL" in
    gpt-5.4|gpt-5.3-codex)
        AGENT_CMD="codex exec --full-auto \"$TASK\""
        ;;
    claude-*)
        AGENT_CMD="claude --permission-mode bypassPermissions --print \"$TASK\""
        ;;
    gemini-*)
        export https_proxy=http://127.0.0.1:7897 http_proxy=http://127.0.0.1:7897 all_proxy=socks5://127.0.0.1:7897
        AGENT_CMD="gemini \"$TASK\""
        ;;
    *)
        AGENT_CMD="codex exec --full-auto \"$TASK\""
        ;;
esac

log "Starting tmux session: $SESSION_NAME"
log "Command: $AGENT_CMD"

# Start tmux session with agent
tmux new-session -d -s "$SESSION_NAME" -c "$WORKTREE_PATH" "$AGENT_CMD" 2>&1 | tee "$LOG_DIR/${SESSION_NAME}.log"

success "Agent started in tmux session: $SESSION_NAME"
success "Worktree: $WORKTREE_PATH"
success "Branch: $BRANCH_NAME"
success "Monitor with: tmux attach -t $SESSION_NAME"
