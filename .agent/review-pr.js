#!/usr/bin/env node
/*
  Automated PR review runner.
  Usage:
    - node .agent/review-pr.js <payload.json>
    - PR_NUMBER=5 node .agent/review-pr.js
  Requires a git remote "origin" pointing to GitHub. Optionally uses GITHUB_TOKEN to post a comment.
*/

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts }).trim();
}

function safeRun(cmd, opts = {}) {
  try { return { ok: true, out: sh(cmd, opts) }; } catch (e) { return { ok: false, out: e.stdout || e.message || '' }; }
}

function parseOrigin() {
  const url = sh('git remote get-url origin');
  if (url.startsWith('git@')) {
    const m = url.match(/git@[^:]+:([^/]+)\/([^\.]+)(\.git)?$/);
    if (!m) throw new Error(`Cannot parse git remote URL: ${url}`);
    return { owner: m[1], repo: m[2] };
  }
  if (url.startsWith('http')) {
    const m = url.match(/https?:\/\/[^/]+\/([^/]+)\/([^\.]+)(\.git)?$/);
    if (!m) throw new Error(`Cannot parse git remote URL: ${url}`);
    return { owner: m[1], repo: m[2] };
  }
  throw new Error(`Unsupported git remote URL: ${url}`);
}

function loadPayloadFromFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to read payload file ${filePath}: ${e.message}`);
  }
}

function extractPrNumber(payload) {
  if (!payload) return null;
  if (payload.number && payload.pull_request) return Number(payload.number);
  if (payload.pull_request && payload.pull_request.number) return Number(payload.pull_request.number);
  return null;
}

function fetchPrRefs(prNumber) {
  const headRef = `pr-${prNumber}`;
  const mergeRef = `pr-${prNumber}-merge`;
  safeRun(`git fetch origin pull/${prNumber}/head:${headRef}`);
  safeRun(`git fetch origin pull/${prNumber}/merge:${mergeRef}`);
  return { headRef, mergeRef };
}

function getBaseAndHead(mergeRef) {
  const parents = sh(`git show -s --format=%P ${mergeRef}`);
  const [base, head] = parents.split(/\s+/);
  return { base, head };
}

function runBuilds() {
  const result = { build: '', typecheck: '', tests: '' };
  // workspace build
  result.build = safeRun('pnpm -w -r build').out;
  // typecheck
  result.typecheck = safeRun('pnpm -w -r typecheck').out;
  // tests (web)
  result.tests = safeRun('pnpm --filter web test:ci').out;
  return result;
}

function summarizeDiff(base, headRef) {
  const files = safeRun(`git diff --name-status ${base}..${headRef}`).out;
  const stat = safeRun(`git diff --stat ${base}..${headRef}`).out;
  return { files, stat };
}

async function maybeComment(owner, repo, prNumber, body) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { posted: false, status: 0 };
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'agent-auto-review'
    },
    body: JSON.stringify({ body })
  });
  return { posted: res.ok, status: res.status };
}

function formatReview({
  prNumber, buildOut, typecheckOut, testsOut, diffFiles, diffStat,
}) {
  // Determine pass/fail flags
  const buildOk = /Compiled successfully|Built successfully|success/i.test(buildOut) && !/ERR|error/i.test(buildOut);
  const typeOk = !/error/i.test(typecheckOut);
  const testsOk = /Test Files\s+\d+ passed|\(\d+\) tests passed|passed \(\d+\)/i.test(testsOut) && !/failed|failures/i.test(testsOut);

  const lines = [];
  lines.push(`PR #${prNumber} automated review`);
  lines.push('');
  lines.push(`- Build: ${buildOk ? 'OK' : 'Check logs'}`);
  lines.push(`- Typecheck: ${typeOk ? 'OK' : 'Check logs'}`);
  lines.push(`- Tests: ${testsOk ? 'OK' : 'Check logs'}`);
  lines.push('');
  lines.push('Changed files:');
  lines.push('');
  lines.push('```
' + diffFiles + '\n```');
  lines.push('');
  lines.push('Diffstat:');
  lines.push('');
  lines.push('```
' + diffStat + '\n```');
  lines.push('');
  lines.push('Notes:');
  lines.push('- Consider adding tests for webhook signature verification and ingest route.');
  lines.push('- Add payload size limits/rate limiting on webhook endpoints.');
  lines.push('- Address ESLint configuration warning or disable Next lint step explicitly.');
  return lines.join('\n');
}

(async () => {
  const { owner, repo } = parseOrigin();
  const payloadPath = process.argv[2];
  let prNumber = process.env.PR_NUMBER ? Number(process.env.PR_NUMBER) : null;
  let action = '';

  if (payloadPath) {
    const fileAbs = path.isAbsolute(payloadPath) ? payloadPath : path.join(process.cwd(), payloadPath);
    const fileData = loadPayloadFromFile(fileAbs);
    const eventName = fileData.event || '';
    if (eventName !== 'pull_request') {
      console.log(`[review] Ignored event ${eventName}`);
      process.exit(0);
    }
    action = fileData.payload?.action || '';
    prNumber = extractPrNumber(fileData.payload);
    if (!['opened', 'synchronize', 'reopened'].includes(action)) {
      console.log(`[review] Ignored PR action ${action}`);
      process.exit(0);
    }
  }

  if (!prNumber || Number.isNaN(prNumber)) {
    console.error('[review] Missing PR number');
    process.exit(1);
  }

  const currentBranch = safeRun('git rev-parse --abbrev-ref HEAD').out;
  const { headRef, mergeRef } = fetchPrRefs(prNumber);
  let base, head;
  try { ({ base, head } = getBaseAndHead(mergeRef)); } catch {
    // Fallback: use origin/image as base if merge ref not available
    base = 'origin/image';
    head = headRef;
  }

  // Summaries before switching to PR branch
  const diff = summarizeDiff(base, headRef);

  // Checkout PR head
  safeRun(`git checkout ${headRef}`);

  const builds = runBuilds();

  // Switch back
  safeRun(`git checkout ${currentBranch}`);

  const reviewText = formatReview({
    prNumber,
    buildOut: builds.build,
    typecheckOut: builds.typecheck,
    testsOut: builds.tests,
    diffFiles: diff.files,
    diffStat: diff.stat,
  });

  console.log('\n' + reviewText + '\n');

  try {
    const res = await maybeComment(owner, repo, prNumber, reviewText);
    if (res.posted) console.log('[review] Comment posted on PR');
  } catch (e) {
    // ignore comment failures
  }
})();
