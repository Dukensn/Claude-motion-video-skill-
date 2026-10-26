#!/bin/bash
# Cloud sessions (Claude app on phone or web): install everything the video studio needs, so the student
# never configures anything. Runs setup.sh once per container; the result is cached with the container.
set -uo pipefail
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
LOG="${TMPDIR:-/tmp}/video-studio-setup.log"
NPMROOT="$(npm root -g 2>/dev/null || true)"
[ -n "${CLAUDE_ENV_FILE:-}" ] && [ -n "$NPMROOT" ] && echo "export NODE_PATH=\"$NPMROOT\"" >> "$CLAUDE_ENV_FILE"
if bash "$ROOT/skills/animated-video-studio/scripts/setup.sh" > "$LOG" 2>&1; then
  echo "Video studio ready."
else
  # never block the session: Claude reads the log and fixes what is missing
  echo "Video studio setup incomplete — see $LOG (Claude will finish it)."
fi
exit 0
