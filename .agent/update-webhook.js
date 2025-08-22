#!/usr/bin/env node
/*
  Auto-update GitHub webhook URL to the current ngrok public URL.
  Requirements:
    - ngrok running locally (API at http://127.0.0.1:4040)
    - GITHUB_TOKEN (repo scope) exported in your shell

  Usage:
    node .agent/update-webhook.js
*/

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

async function getNgrokPublicUrl() {
  // Allow overriding the base URL directly (e.g., Cloudflare Tunnel or manual ngrok URL)
  const override = process.env.WEBHOOK_BASE_URL || process.env.WEBHOOK_PUBLIC_BASE_URL || 'https://informed-partly-piranha.ngrok-free.app';
  if (override) return override.replace(/\/$/, '');

  const api = process.env.NGROK_API_URL || 'http://127.0.0.1:4040/api/tunnels';
  const res = await fetch(api);
  if (!res.ok) throw new Error(`Unable to reach tunnel API at ${api}`);
  const data = await res.json();
  const tunnels = Array.isArray(data.tunnels) ? data.tunnels : [];
  const https = tunnels.find(t => t.public_url && t.public_url.startsWith('https://')) || tunnels[0];
  if (!https) throw new Error('No tunnels found in API response. Start ngrok first, or set WEBHOOK_BASE_URL.');
  return https.public_url;
}

async function ghListHooks(token, owner, repo) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks`, {
    headers: { 'Accept': 'application/vnd.github+json', 'Authorization': `Bearer ${token}`, 'User-Agent': 'webhook-updater' },
  });
  if (!res.ok) throw new Error(`GitHub hooks list failed: ${res.status}`);
  return res.json();
}

async function ghPatchHook(token, owner, repo, id, url) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks/${id}`, {
    method: 'PATCH',
    headers: { 'Accept': 'application/vnd.github+json', 'Authorization': `Bearer ${token}`, 'User-Agent': 'webhook-updater' },
    body: JSON.stringify({ config: { url, content_type: 'json' }, active: true })
  });
  if (!res.ok) throw new Error(`GitHub hook update failed: ${res.status}`);
  return res.json();
}

async function ghCreateHook(token, owner, repo, url, secret) {
  const body = { name: 'web', active: true, config: { url, content_type: 'json' } };
  if (secret) body.config.secret = secret;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks`, {
    method: 'POST',
    headers: { 'Accept': 'application/vnd.github+json', 'Authorization': `Bearer ${token}`, 'User-Agent': 'webhook-updater' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`GitHub hook create failed: ${res.status}`);
  return res.json();
}

(async () => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN is required (repo scope). export GITHUB_TOKEN=...');
    process.exit(1);
  }
  const { owner, repo } = parseOrigin();
  const base = await getNgrokPublicUrl();
  const newUrl = `${base.replace(/\/$/, '')}/api/github/webhook`;

  const hooks = await ghListHooks(token, owner, repo);
  const existing = hooks.find(h => h?.config?.url && /\/api\/github\/webhook$/.test(h.config.url));
  if (existing) {
    await ghPatchHook(token, owner, repo, existing.id, newUrl);
    console.log(`Updated hook #${existing.id} to ${newUrl}`);
  } else {
    const secret = process.env.GITHUB_WEBHOOK_SECRET || '';
    const created = await ghCreateHook(token, owner, repo, newUrl, secret);
    console.log(`Created hook #${created.id} at ${newUrl}`);
  }
})().catch(err => {
  console.error('[update-webhook] error:', err.message);
  process.exit(1);
});


