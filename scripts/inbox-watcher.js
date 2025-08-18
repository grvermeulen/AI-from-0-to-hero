#!/usr/bin/env node
/*
  Lightweight inbox watcher for apps/web/.agent/inbox
  - Detects new webhook payload files written by /api/agent/ingest
  - Prints concise summaries for PR-related comments and reviews
  - Moves processed files to apps/web/.agent/processed
*/

const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.join(process.cwd(), 'apps', 'web');
const inboxDir = path.join(appRoot, '.agent', 'inbox');
const processedDir = path.join(appRoot, '.agent', 'processed');

fs.mkdirSync(inboxDir, { recursive: true });
fs.mkdirSync(processedDir, { recursive: true });

function listJsonFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(dir, f));
}

function moveToProcessed(filePath) {
  const dest = path.join(processedDir, path.basename(filePath));
  try {
    fs.renameSync(filePath, dest);
  } catch (err) {
    // Fallback to copy+unlink on cross-device edge cases
    try {
      fs.copyFileSync(filePath, dest);
      fs.unlinkSync(filePath);
    } catch (_) {}
  }
}

function summarize(eventName, payload) {
  try {
    const triggerPoller = (num) => {
      if (!num) return;
      const { spawn } = require('node:child_process');
      const child = spawn('bash', ['scripts/poll_pr.sh'], {
        env: { ...process.env, PR_NUMBER: String(num) },
        stdio: 'inherit',
      });
      child.on('error', (e) => console.error('[inbox] poller error:', e.message));
    };

    if (eventName === 'issue_comment') {
      const prNumber = payload.issue && payload.issue.number;
      const author = payload.comment && payload.comment.user && payload.comment.user.login;
      const body = payload.comment && payload.comment.body;
      if (prNumber && body) {
        console.log(`[inbox] PR #${prNumber} comment by @${author || 'unknown'}: ${body.replace(/\s+/g, ' ').slice(0, 200)}`);
        triggerPoller(prNumber);
      }
      return;
    }
    if (eventName === 'pull_request_review_comment') {
      const prNumber = payload.pull_request && payload.pull_request.number;
      const author = payload.comment && payload.comment.user && payload.comment.user.login;
      const body = payload.comment && payload.comment.body;
      if (prNumber && body) {
        console.log(`[inbox] PR #${prNumber} review comment by @${author || 'unknown'}: ${body.replace(/\s+/g, ' ').slice(0, 200)}`);
        triggerPoller(prNumber);
      }
      return;
    }
    if (eventName === 'pull_request_review') {
      const prNumber = payload.pull_request && payload.pull_request.number;
      const state = payload.review && payload.review.state;
      const author = payload.review && payload.review.user && payload.review.user.login;
      console.log(`[inbox] PR #${prNumber} review ${state || ''} by @${author || 'unknown'}`);
      triggerPoller(prNumber);
      return;
    }
    if (eventName === 'workflow_run') {
      const name = payload.workflow && payload.workflow.name;
      const conclusion = payload.workflow_run && payload.workflow_run.conclusion;
      console.log(`[inbox] workflow_run: ${name || 'unknown'} → ${conclusion || 'n/a'}`);
      return;
    }
    // Generic summary
    console.log(`[inbox] ${eventName}`);
  } catch (err) {
    console.log(`[inbox] summarize error: ${String(err)}`);
  }
}

function processFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    const eventName = data && data.event ? data.event : 'unknown';
    summarize(eventName, data.payload || {});
  } catch (err) {
    console.error(`[inbox] failed to process ${path.basename(filePath)}:`, err.message);
  } finally {
    moveToProcessed(filePath);
  }
}

console.log(`[inbox] Watching ${inboxDir}`);

// Initial drain
for (const f of listJsonFiles(inboxDir)) {
  processFile(f);
}

// Poll every 3 seconds for new files (more stable than fs.watch on some systems)
setInterval(() => {
  try {
    const files = listJsonFiles(inboxDir);
    for (const f of files) processFile(f);
  } catch (_) {}
}, 3000);


