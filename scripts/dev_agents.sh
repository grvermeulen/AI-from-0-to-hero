#!/usr/bin/env bash
set -euo pipefail

pnpm --filter web dev &
WEB_PID=$!

pnpm agent:watch &
WATCH_PID=$!

cleanup() {
  kill "$WEB_PID" "$WATCH_PID" 2>/dev/null || true
}

trap cleanup INT TERM

# If web process exits, stop watcher and exit
wait "$WEB_PID"
kill "$WATCH_PID" 2>/dev/null || true
wait "$WATCH_PID" 2>/dev/null || true


