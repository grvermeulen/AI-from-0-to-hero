#!/usr/bin/env node
/*
  Executor that applies code changes in response to PR comment commands.
  Currently supported:
    /apply:force-dynamic <pages...>

  Env required:
    - GITHUB_TOKEN
    - OWNER, REPO, PR_NUMBER

  Usage (invoked by act-on-comment):
    node .agent/executor.js force-dynamic login signup
*/

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

function sh(cmd) { return execSync(cmd, { stdio: 'pipe', encoding: 'utf8' }).trim(); }
function trySh(cmd) { try { return { ok: true, out: sh(cmd) }; } catch (e) { return { ok: false, out: (e.stdout||'') + (e.stderr||'') }; } }

const token = process.env.GITHUB_TOKEN;
const OWNER = process.env.OWNER;
const REPO = process.env.REPO;
const PR_NUMBER = process.env.PR_NUMBER;
if (!token || !OWNER || !REPO || !PR_NUMBER) {
  console.error('[executor] missing env: GITHUB_TOKEN/OWNER/REPO/PR_NUMBER');
  process.exit(2);
}

const cmd = process.argv[2];
const targets = process.argv.slice(3);
if (!cmd) { console.error('[executor] missing command'); process.exit(2); }

async function gh(pathname, init) {
  const res = await fetch(`https://api.github.com${pathname}`, {
    ...init,
    headers: { 'Accept': 'application/vnd.github+json', 'Authorization': `Bearer ${token}`, 'User-Agent': 'executor' },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  return res.json();
}

async function getPrInfo() {
  return gh(`/repos/${OWNER}/${REPO}/pulls/${PR_NUMBER}`);
}

function ensureBranchFromPr(pr) {
  const prHeadFetch = trySh(`git fetch origin pull/${PR_NUMBER}/head:pr-${PR_NUMBER}`);
  if (!prHeadFetch.ok) throw new Error('failed to fetch PR head');
  const baseBranch = pr.base.ref;
  const workBranch = `bot/apply-${cmd}-${Date.now()}-pr${PR_NUMBER}`;
  sh(`git checkout -B ${workBranch} pr-${PR_NUMBER}`);
  return { workBranch, baseBranch };
}

function fileForPage(page) {
  return path.join(process.cwd(), 'apps/web/src/app/(public)', page, 'page.tsx');
}

function applyForceDynamic(pages) {
  const changed = [];
  for (const p of pages) {
    const fp = fileForPage(p);
    if (!fs.existsSync(fp)) continue;
    const src = fs.readFileSync(fp, 'utf8');
    if (/export\s+const\s+dynamic\s*=/.test(src)) continue;
    // Insert after first import block or at top
    let out = src;
    const importEnd = out.indexOf('\n', out.lastIndexOf('import'));
    if (importEnd !== -1) {
      out = out.slice(0, importEnd + 1) + 'export const dynamic = "force-dynamic"\n' + out.slice(importEnd + 1);
    } else {
      out = 'export const dynamic = "force-dynamic"\n' + out;
    }
    fs.writeFileSync(fp, out);
    changed.push(fp);
  }
  return changed;
}

(async () => {
  const pr = await getPrInfo();
  const { workBranch, baseBranch } = ensureBranchFromPr(pr);

  let changedFiles = [];
  if (cmd === 'force-dynamic') {
    const pages = targets.length ? targets : ['login', 'signup'];
    changedFiles = applyForceDynamic(pages);
  } else {
    throw new Error(`Unsupported command ${cmd}`);
  }

  if (changedFiles.length === 0) {
    console.log('[executor] no changes needed');
    process.exit(0);
  }

  sh('git add -A');
  sh(`git commit -m "bot(apply): ${cmd} ${targets.join(' ')} for PR #${PR_NUMBER}"`);

  // Validate
  const typeRes = trySh('pnpm -w -r typecheck');
  const testRes = trySh('pnpm --filter web test:ci');

  const pushRes = trySh(`git push -u origin ${workBranch}`);

  // Open PR targeting PR base
  let newPrUrl = '';
  try {
    const created = await gh(`/repos/${OWNER}/${REPO}/pulls`, {
      method: 'POST',
      body: JSON.stringify({ title: `Apply ${cmd} for #${PR_NUMBER}`, head: workBranch, base: baseBranch, body: `Automated apply of ${cmd} for #${PR_NUMBER}.` })
    });
    newPrUrl = created.html_url || '';
  } catch {}

  const summary = {
    changedFiles,
    typecheckOk: typeRes.ok,
    testsOk: testRes.ok,
    pushOk: pushRes.ok,
    branch: workBranch,
    pr: newPrUrl,
  };
  console.log(JSON.stringify(summary));
  process.exit(0);
})().catch((e) => { console.error('[executor] error:', e.message); process.exit(1); });


