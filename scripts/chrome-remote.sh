#!/usr/bin/env bash
set -euo pipefail

PORT=${1:-9222}
PROFILE_DIR="$(pwd)/.agent/chrome-profile"
mkdir -p "$PROFILE_DIR"

echo "Launching Google Chrome with remote debugging on port $PORT..."

open -na "Google Chrome" --args \
  --remote-debugging-port=$PORT \
  --user-data-dir="$PROFILE_DIR" \
  --disable-extensions \
  --no-first-run \
  --no-default-browser-check \
  --disable-popup-blocking \
  --auto-open-devtools-for-tabs || true

echo "If Chrome is already running with remote debugging, this step can be ignored."


