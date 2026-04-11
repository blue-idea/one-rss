#!/bin/bash
# Agent Selector - Choose best agent based on task type
# Usage: ./agent-selector.sh <task_description>

TASK="$1"

if [ -z "$TASK" ]; then
    echo "Usage: agent-selector.sh <task_description>"
    exit 1
fi

# Lowercase for matching
TASK_LC=$(echo "$TASK" | tr '[:upper:]' '[:lower:]')

# Scoring system
CODEX_SCORE=0
CLAUDE_SCORE=0
GEMINI_SCORE=0

# Codex strengths: backend, complex bugs, multi-file refactor
echo "$TASK_LC" | grep -qE "(backend|api|server|database|bug|fix|refactor|logic|algorithm)" && {
    ((CODEX_SCORE+=3))
    ((CLAUDE_SCORE+=1))
}

# Claude strengths: frontend, UI, react, components, styling
echo "$TASK_LC" | grep -qE "(frontend|ui|component|react|expo|styles|layout|button|page|screen)" && {
    ((CLAUDE_SCORE+=3))
    ((CODEX_SCORE+=1))
}

# Gemini: design, creative, documentation
echo "$TASK_LC" | grep -qE "(design|doc|readme|comment|creative|aesthetic)" && {
    ((GEMINI_SCORE+=3))
}

# Specific feature matching
case "$TASK_LC" in
    *login*|*auth*|*register*)
        AGENT="claude" && WEIGHT=3
        ;;
    *rss*|*feed*|*subscribe*)
        AGENT="codex" && WEIGHT=3
        ;;
    *test*|*e2e*|*playwright*)
        AGENT="codex" && WEIGHT=2
        ;;
    *offline*|*cache*)
        AGENT="codex" && WEIGHT=2
        ;;
    *read*|*article*|*content*)
        AGENT="claude" && WEIGHT=2
        ;;
    *profile*|*settings*|*member*)
        AGENT="claude" && WEIGHT=2
        ;;
    *deploy*|*ci*|*github*)
        AGENT="codex" && WEIGHT=2
        ;;
    *)
        # Default: use scores
        if [ $CODEX_SCORE -ge $CLAUDE_SCORE ] && [ $CODEX_SCORE -ge $GEMINI_SCORE ]; then
            AGENT="codex"
        elif [ $CLAUDE_SCORE -ge $CODEX_SCORE ] && [ $CLAUDE_SCORE -ge $GEMINI_SCORE ]; then
            AGENT="claude"
        else
            AGENT="gemini"
        fi
        ;;
esac

# Output agent recommendation
echo "$AGENT"
