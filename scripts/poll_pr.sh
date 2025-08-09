#!/usr/bin/env bash
set -euo pipefail

OWNER="grvermeulen"
REPO="AI-from-0-to-hero"
PR_NUMBER="1"
LOG_FILE="scripts/pr_poll.log"

MAX_CYCLES="${1:-}" # optional: number of cycles, default infinite
CYCLE=0

echo "[poll_pr] Starting PR poller for $OWNER/$REPO PR #$PR_NUMBER" | tee -a "$LOG_FILE"

while true; do
  CYCLE=$((CYCLE+1))
  echo "\n===== $(date -u +"%Y-%m-%dT%H:%M:%SZ") | cycle #$CYCLE =====" | tee -a "$LOG_FILE"

  echo "[poll_pr] Fetching PR overview..." | tee -a "$LOG_FILE"
  PR_JSON=$(gh pr view "$PR_NUMBER" -R "$OWNER/$REPO" \
    --json number,title,state,mergeable,isDraft,reviewDecision,headRefName,baseRefName,headRefOid,url)
  echo "$PR_JSON" | jq '{number,title,state,mergeable,isDraft,reviewDecision,headRefName,baseRefName,url}' \
    2>&1 | tee -a "$LOG_FILE" || true

  HEAD_SHA=$(echo "$PR_JSON" | jq -r .headRefOid)
  echo "[poll_pr] Head SHA: $HEAD_SHA" | tee -a "$LOG_FILE"

  echo "[poll_pr] Fetching checks (summary)..." | tee -a "$LOG_FILE"
  gh pr checks "$PR_NUMBER" -R "$OWNER/$REPO" 2>&1 | tee -a "$LOG_FILE" || true

  echo "[poll_pr] Fetching check runs for head commit..." | tee -a "$LOG_FILE"
  CHECK_RUNS=$(gh api "/repos/$OWNER/$REPO/commits/$HEAD_SHA/check-runs" \
    --jq '{total_count: .total_count, runs: (.check_runs | map({name: .name, status: .status, conclusion: .conclusion, url: .html_url}))}')
  echo "$CHECK_RUNS" | tee -a "$LOG_FILE"
  FAIL_COUNT=$(echo "$CHECK_RUNS" | jq '[.runs[] | select(.conclusion=="failure" or .conclusion=="cancelled" or .conclusion=="timed_out")] | length')
  if [[ "$FAIL_COUNT" -gt 0 ]]; then
    echo "[poll_pr][ALERT] Detected failing checks ($FAIL_COUNT). See above for details." | tee -a "$LOG_FILE"
  else
    echo "[poll_pr] No failing checks detected." | tee -a "$LOG_FILE"
  fi

  echo "[poll_pr] Fetching latest reviews..." | tee -a "$LOG_FILE"
  gh api "/repos/$OWNER/$REPO/pulls/$PR_NUMBER/reviews" \
    --jq 'map({state: .state, user: .user.login, submitted_at: .submitted_at, body: .body}) | .[-5:]' \
    2>&1 | tee -a "$LOG_FILE" || true

  echo "[poll_pr] Fetching latest issue comments..." | tee -a "$LOG_FILE"
  gh api "/repos/$OWNER/$REPO/issues/$PR_NUMBER/comments" \
    --jq 'map({user: .user.login, created_at: .created_at, body: .body}) | .[-5:]' \
    2>&1 | tee -a "$LOG_FILE" || true

  if [[ -n "$MAX_CYCLES" && "$CYCLE" -ge "$MAX_CYCLES" ]]; then
    echo "[poll_pr] Reached max cycles ($MAX_CYCLES). Exiting." | tee -a "$LOG_FILE"
    exit 0
  fi

  echo "[poll_pr] Sleeping 30s..." | tee -a "$LOG_FILE"
  sleep 30
done


