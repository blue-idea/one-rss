#!/bin/bash
# Worktree Manager - Manage parallel agent worktrees
# Usage: ./worktree-manager.sh <action> [args]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKTREES_DIR="$PROJECT_ROOT/.agent/worktrees"
LOG_DIR="$PROJECT_ROOT/.agent/logs"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

ACTION="$1"

case "$ACTION" in
    list)
        echo ""
        echo "=== Active Worktrees ==="
        cd "$PROJECT_ROOT"
        git worktree list
        echo ""
        echo "=== Local Worktree Directories ==="
        ls -la "$WORKTREES_DIR" 2>/dev/null || echo "No worktrees yet"
        ;;
    
    create)
        TASK="$2"
        BRANCH_NAME="$3"
        if [ -z "$TASK" ] || [ -z "$BRANCH_NAME" ]; then
            echo "Usage: worktree-manager.sh create <task> <branch-name>"
            exit 1
        fi
        WORKTREE_PATH="$WORKTREES_DIR/$BRANCH_NAME"
        mkdir -p "$WORKTREE_PATH"
        cd "$PROJECT_ROOT"
        log "Creating worktree: $BRANCH_NAME"
        git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME" origin/main
        cd "$WORKTREE_PATH"
        pnpm install --silent
        log "Worktree created at $WORKTREE_PATH"
        ;;
    
    remove)
        BRANCH_NAME="$2"
        if [ -z "$BRANCH_NAME" ]; then
            echo "Usage: worktree-manager.sh remove <branch-name>"
            exit 1
        fi
        WORKTREE_PATH="$WORKTREES_DIR/$BRANCH_NAME"
        cd "$PROJECT_ROOT"
        log "Removing worktree: $BRANCH_NAME"
        git worktree remove "$WORKTREE_PATH" --force 2>/dev/null || {
            log "Worktree busy, try: git worktree prune"
        }
        rm -rf "$WORKTREE_PATH"
        log "Worktree removed"
        ;;
    
    prune)
        cd "$PROJECT_ROOT"
        log "Pruning stale worktrees..."
        git worktree prune
        log "Done"
        ;;
    
    status)
        echo ""
        echo "=== Agent TMUX Sessions ==="
        tmux list-sessions 2>/dev/null | grep "agent-" || echo "No agent sessions"
        echo ""
        echo "=== Worktree Status ==="
        cd "$PROJECT_ROOT"
        git worktree list
        ;;
    
    cleanup)
        log "Cleaning up completed worktrees..."
        cd "$PROJECT_ROOT"
        for wt in $(git worktree list --porcelain | grep "^worktree" | awk '{print $2}'); do
            if [ -d "$wt" ]; then
                # Check if branch has been merged or abandoned
                BRANCH=$(basename "$wt")
                if ! git log --oneline -1 "$BRANCH" 2>/dev/null | grep -q .; then
                    log "Removing orphaned: $wt"
                    git worktree remove "$wt" --force 2>/dev/null || true
                fi
            fi
        done
        git worktree prune
        log "Cleanup complete"
        ;;
    
    *)
        echo "Worktree Manager"
        echo "================"
        echo "Usage: $0 <action> [args]"
        echo ""
        echo "Actions:"
        echo "  list              - List all worktrees"
        echo "  create <task> <branch>  - Create new worktree"
        echo "  remove <branch>  - Remove worktree"
        echo "  prune             - Prune stale worktrees"
        echo "  status            - Show all agent status"
        echo "  cleanup           - Clean up completed worktrees"
        ;;
esac
