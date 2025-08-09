#!/usr/bin/env node
/* Create common labels for agent workflow using GitHub API */
const { execSync } = require('child_process');

function parseOrigin() {
  const url = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
  if (url.startsWith('git@')) {
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

async function createLabel(token, owner, repo, label) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/labels`, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'agent-label-seeder'
    },
    body: JSON.stringify(label)
  });
  if (res.status === 422) {
    // already exists; PATCH to ensure color/desc
    const urlName = encodeURIComponent(label.name);
    const patch = await fetch(`https://api.github.com/repos/${owner}/${repo}/labels/${urlName}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'agent-label-seeder'
      },
      body: JSON.stringify(label)
    });
    if (!patch.ok) {
      const t = await patch.text();
      throw new Error(`Failed to update label ${label.name}: ${patch.status} ${t}`);
    }
    return;
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to create label ${label.name}: ${res.status} ${t}`);
  }
}

(async () => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN is required');
    process.exit(1);
  }
  const { owner, repo } = parseOrigin();
  const labels = [
    { name: 'agent:assistant', color: '5319e7', description: 'Tasks for coding agent' },
    { name: 'status:ready', color: '0e8a16', description: 'Ready to pick up' },
    { name: 'status:in-progress', color: '1d76db', description: 'Being worked on' },
    { name: 'status:blocked', color: 'b60205', description: 'Blocked' },
    { name: 'status:done', color: '0e8a16', description: 'Completed' },
    { name: 'priority:P1', color: 'b60205', description: 'Urgent' },
    { name: 'priority:P2', color: 'fbca04', description: 'Normal' },
    { name: 'priority:P3', color: 'c5def5', description: 'Low' }
  ];
  for (const label of labels) {
    try {
      await createLabel(token, owner, repo, label);
      console.log(`ok ${label.name}`);
    } catch (e) {
      console.error(`fail ${label.name}:`, e.message);
    }
  }
})();
