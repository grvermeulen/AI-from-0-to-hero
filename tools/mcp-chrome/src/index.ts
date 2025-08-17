#!/usr/bin/env node
import CDP from 'chrome-remote-interface';
import { Command } from 'commander';

const program = new Command();
program
  .option('-H, --host <host>', 'CDP host', 'localhost')
  .option('-p, --port <port>', 'CDP port', '9222')
  .option('-t, --target <target>', 'target filter substring', '')
  .parse(process.argv);

const opts = program.opts<{ host: string; port: string; target: string }>();

async function run() {
  const tabs = await CDP.List({ host: opts.host, port: opts.port });
  const target = tabs.find((t) => t.type === 'page' && t.url.includes(opts.target)) ?? tabs.find((t) => t.type === 'page');
  if (!target) throw new Error('No page target found');
  const client = await CDP({ host: opts.host, port: opts.port, target });
  const { Network, Page } = client;
  await Promise.all([Network.enable({}), Page.enable()]);
  Network.requestWillBeSent((e) => {
    console.log(JSON.stringify({ kind: 'request', url: e.request.url, method: e.request.method, ts: Date.now() }));
  });
  Network.responseReceived((e) => {
    console.log(JSON.stringify({ kind: 'response', url: e.response.url, status: e.response.status, ts: Date.now() }));
  });
  Network.loadingFailed((e) => {
    console.log(JSON.stringify({ kind: 'error', errorText: e.errorText, canceled: e.canceled, ts: Date.now() }));
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});


