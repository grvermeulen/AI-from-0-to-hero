#!/usr/bin/env -S node --experimental-default-type=module
import { spawn } from 'node:child_process';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

function runCmd(cmd: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  return new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(cmd, args, { env: { ...process.env, ...env }, cwd: process.cwd() });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => resolve({ code: code ?? 0, stdout, stderr }));
  });
}

const server = new Server({
  name: 'mcp-playwright',
  version: '0.1.0',
}, {
  capabilities: {
    tools: {},
  },
});

server.tool('playwright.run', {
  description: 'Run Playwright tests. Optional pattern filters tests, e.g. tests/e2e/auth.spec.ts or a title regex.',
  inputSchema: {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'Spec or title filter (optional)' },
      baseURL: { type: 'string', description: 'Override baseURL (optional)' },
    },
  },
}, async ({ pattern, baseURL }: any) => {
  const args = ['test'];
  if (pattern) args.push(pattern);
  const env = {
    PW_BASE_URL: baseURL || process.env.PW_BASE_URL || 'http://localhost:3000',
    NEXTAUTH_URL: baseURL || process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'devsecret',
  } as NodeJS.ProcessEnv;
  const { code, stdout, stderr } = await runCmd('npx', ['playwright', ...args], env);
  return { content: [{ type: 'text', text: `exit=${code}\n${stdout}\n${stderr}` }] };
});

server.tool('playwright.install', {
  description: 'Install Playwright browsers',
  inputSchema: { type: 'object', properties: {} },
}, async () => {
  const { code, stdout, stderr } = await runCmd('npx', ['playwright', 'install', '--with-deps']);
  return { content: [{ type: 'text', text: `exit=${code}\n${stdout}\n${stderr}` }] };
});

server.tool('playwright.codegen', {
  description: 'Launch Playwright codegen for a URL to record actions',
  inputSchema: {
    type: 'object',
    properties: { url: { type: 'string' } },
    required: ['url'],
  },
}, async ({ url }: any) => {
  const { code, stdout, stderr } = await runCmd('npx', ['playwright', 'codegen', url]);
  return { content: [{ type: 'text', text: `exit=${code}\n${stdout}\n${stderr}` }] };
});

const transport = new StdioServerTransport();
server.connect(transport);






