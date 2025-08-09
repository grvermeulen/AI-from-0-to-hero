#!/usr/bin/env node
/*
  Lightweight GitHub Issues poller for agent tasks.
  Requires: Node >= 18 (global fetch), GITHUB_TOKEN (if repo is private or to avoid low rate limits).
  Env:
    - GITHUB_TOKEN: a PAT with repo read access
    - AGENT_LABELS: comma-separated labels to filter (default: "agent:assistant,status:ready")
    - AGENT_POLL_INTERVAL: ms between polls (default: 60000)
*/

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function parseOrigin() {
  const url = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
  // Handle https and ssh formats
  if (url.startsWith('git@')) {
    // git@github.com:owner/repo.git
    const m = url.match(/git@[^:]+:([^/]+)\/([^\.]+)(\.git)?$/);
    if (!m) throw new Error(`Cannot parse git remote URL: ${url}`);
    return { owner: m[1], repo: m[2] };
  } else if (url.startsWith('http')) {
    const m = url.match(/https?:\/\/[^/]+\/([^/]+)\/([^\.]+)(\.git)?$/);
    if (!m) throw new Error(`Cannot parse git remote URL: ${url}`);
    return { owner: m[1], repo: m[2] };
  }
  throw new Error(`Unsupported git remote URL: ${url}`);
}

async function githubRequest(token, pathname, params = {}) {
  const url = new URL(`https://api.github.com${pathname}`);
  if (params.query) {
    for (const [k, v] of Object.entries(params.query)) {
      if (v !== undefined && v !== null && `${v}`.length > 0) url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github+json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      'User-Agent': 'agent-poller'
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }
  return res.json();
}

function loadState(stateFile) {
  try {
    const raw = fs.readFileSync(stateFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { lastSeenUpdatedAt: null, seenIds: [] };
  }
}

function saveState(stateFile, state) {
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

function formatIssue(issue) {
  const labels = (issue.labels || []).map(l => typeof l === 'string' ? l : l.name).join(', ');
  return `#${issue.number} [${labels}] ${issue.title}\n${issue.html_url}`;
}

async function poll() {
  const { owner, repo } = parseOrigin();
  const token = process.env.GITHUB_TOKEN || '';
  const labels = (process.env.AGENT_LABELS || 'agent:assistant,status:ready').split(',').map(s => s.trim()).filter(Boolean);
  const intervalMs = Number(process.env.AGENT_POLL_INTERVAL || 60000);
  const stateFile = path.join(process.cwd(), '.agent', 'state.json');
  let state = loadState(stateFile);

  async function tick(isFirst = false) {
    try {
      const issues = await githubRequest(token, `/repos/${owner}/${repo}/issues`, {
        query: {
          state: 'open',
          labels: labels.join(','),
          per_page: '50',
          sort: 'updated',
          direction: 'desc'
        }
      });
      if (!Array.isArray(issues)) return;

      const fresh = [];
      for (const issue of issues) {
        // Exclude PRs; GitHub returns PRs in issues endpoint with pull_request field
        if (issue.pull_request) continue;
        const updatedAt = issue.updated_at;
        const isNewByTime = !state.lastSeenUpdatedAt || new Date(updatedAt) > new Date(state.lastSeenUpdatedAt);
        const isNewById = !state.seenIds.includes(issue.id);
        if (isFirst) {
          // On first run, just list current tasks once, but do not alert as new
          fresh.push(issue);
        } else if (isNewByTime || isNewById) {
          fresh.push(issue);
        }
      }

      if (fresh.length > 0) {
        const header = isFirst ? '[agent] Current open tasks:' : '[agent] New/updated tasks:';
        console.log(`\n${header}`);
        for (const issue of fresh) {
          console.log(formatIssue(issue));
        }
      }

      // Update state to the most recent updated time and seen ids (cap to last 200)
      const mostRecent = issues[0]?.updated_at || state.lastSeenUpdatedAt;
      state.lastSeenUpdatedAt = mostRecent;
      const ids = new Set([...(state.seenIds || []), ...issues.map(i => i.id)]);
      state.seenIds = Array.from(ids).slice(-200);
      saveState(stateFile, state);
    } catch (err) {
      console.error('[agent] poll error:', err.message);
    }
  }

  await tick(true);
  setInterval(() => { tick(false); }, intervalMs);
}

poll();
