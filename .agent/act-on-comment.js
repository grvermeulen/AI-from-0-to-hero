#!/usr/bin/env node
/*
  React to PR comments delivered via webhook inbox.
  Supported commands in comment body:
    - /review               → run automated review on the PR and post results
    - /labels: a,b,c        → add labels to the PR

  Usage:
    node .agent/act-on-comment.js <payload.json>

  Requires: GITHUB_TOKEN (repo scope) to post comments and modify labels.
*/

const { spawnSync } = require('child_process');
const fs = require('fs');

function fail(msg) { console.error('[act-on-comment]', msg); process.exit(1); }

const token = process.env.GITHUB_TOKEN;
if (!token) fail('GITHUB_TOKEN is required');

const file = process.argv[2];
if (!file) fail('payload file arg required');

let raw, payload;
try { raw = fs.readFileSync(file, 'utf8'); payload = JSON.parse(raw); } catch (e) { fail('cannot read payload: ' + e.message); }

const event = payload.event;
if (event !== 'issue_comment') process.exit(0);
if (payload.payload?.action !== 'created') process.exit(0);

const body = (payload.payload?.comment?.body || '').trim();
const issue = payload.payload?.issue;
if (!issue || !issue.number || !issue.pull_request) process.exit(0); // only act on PR comments
const prNumber = issue.number;
const repoFull = payload.payload?.repository?.full_name;
if (!repoFull) fail('missing repo full_name');
const [owner, repo] = repoFull.split('/');

async function github(path, init) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'act-on-comment',
      ...(init && init.headers ? init.headers : {}),
    },
  });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${text}`);
  return json ?? text;
}

async function comment(msg) {
  return github(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body: msg }),
  });
}

async function addLabels(labels) {
  return github(`/repos/${owner}/${repo}/issues/${prNumber}/labels`, {
    method: 'POST',
    body: JSON.stringify({ labels }),
  });
}

(async () => {
  const lower = body.toLowerCase();
  if (lower.startsWith('/review')) {
    await comment('Starting automated review…');
    // run review locally and rely on reviewer to post its own comment (if token set there)
    const res = spawnSync('node', ['.agent/review-pr.js'], {
      env: { ...process.env, PR_NUMBER: String(prNumber) },
      stdio: 'pipe',
      encoding: 'utf8',
    });
    const out = (res.stdout || '').slice(-4000); // avoid huge logs
    const code = res.status ?? 0;
    await comment(code === 0 ? `Automated review completed:\n\n\n${'```'}\n${out}\n${'```'}` : `Automated review encountered an error. Exit ${code}`);
    process.exit(0);
  }

  const labelsMatch = lower.match(/^\s*\/labels:\s*([^\n]+)/);
  if (labelsMatch) {
    const labels = labelsMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    if (labels.length > 0) {
      try {
        await addLabels(labels);
        await comment(`Added labels: ${labels.join(', ')}`);
      } catch (e) {
        await comment(`Failed to add labels: ${e.message}`);
      }
    }
    process.exit(0);
  }

  // Unknown command → ignore
  process.exit(0);
})();


