#!/bin/bash
# Agent Monitor - Check agent status and report
# Run via cron every 10 minutes
# */10 * * * * /path/to/monitor-agents.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKTREES_DIR="$PROJECT_ROOT/.agent/worktrees"
LOG_DIR="$PROJECT_ROOT/.agent/logs"
MAX_RETRIES=3

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

check_session() {
    local SESSION="$1"
    local BRANCH="$2"
    
    if tmux has-session -t "$SESSION" 2>/dev/null; then
        log "${GREEN}ACTIVE${NC}: $SESSION ($BRANCH)"
        return 0
    else
        log "${RED}DEAD${NC}: $SESSION ($BRANCH)"
        return 1
    fi
}

notify() {
    local MSG="$1"
    # Can integrate with telegram, discord, etc.
    log "NOTIFY: $MSG"
    # openclaw system event --text "$MSG" --mode now 2>/dev/null || true
}

# Main check
log "=== Agent Monitor Run ==="

ACTIVE=0
DEAD=0
PENDING_PR=()

# Check all agent tmux sessions
for session in $(tmux list-sessions 2>/dev/null | grep "agent-" | cut -d: -f1); do
    if check_session "$session" "unknown"; then
        ((ACTIVE++))
    else
        ((DEAD++))
        # Check if this agent created a PR
        WORKTREE_PATH=$(tmux display-message -t "$session" -p '#{pane_current_path}' 2>/dev/null || echo "")
        if [ -n "$WORKTREE_PATH" ] && [ -d "$WORKTREE_PATH" ]; then
            cd "$WORKTREE_PATH"
            PR_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
            if [ -n "$PR_BRANCH" ]; then
                # Check for PR
                PR_EXISTS=$(gh pr list --head "$PR_BRANCH" --json number --jq 'length' 2>/dev/null || echo "0")
                if [ "$PR_EXISTS" -gt 0 ]; then
                    PENDING_PR+=("$PR_BRANCH")
                    log "PR exists for: $PR_BRANCH"
                fi
            fi
        fi
    fi
done

log "Summary: $ACTIVE active, $DEAD dead"

# Check for worktrees without PRs
if [ -d "$WORKTREES_DIR" ]; then
    for wt in "$WORKTREES_DIR"/*; do
        [ -d "$wt" ] || continue
        cd "$wt"
        BRANCH=$(git branch --show-current 2>/dev/null || basename "$wt")
        
        # Check if branch has commits
        if git log --oneline -1 2>/dev/null | grep -q .; then
            PR_COUNT=$(gh pr list --head "$BRANCH" --json number --jq 'length' 2>/dev/null || echo "0")
            if [ "$PR_COUNT" -eq 0 ]; then
                log "${YELLOW}PENDING PR${NC}: $BRANCH has commits but no PR"
            fi
        fi
    done
fi

# Summary notification
if [ $DEAD -gt 0 ]; then
    notify "Agent Update: $ACTIVE active, $DEAD finished"
fi

# Check disk usage
DISK_USAGE=$(df "$PROJECT_ROOT" | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt 90 ]; then
    log "${RED}WARNING${NC}: Disk usage at ${DISK_USAGE}%"
fi

log "=== Monitor Run Complete ==="
