#!/usr/bin/env node
/*
  Simple inbox watcher that triggers agent actions when webhook events arrive.
  - Watches .agent/inbox for new JSON files written by /api/agent/ingest
  - On issues/issue_comment/pull_request events, triggers the poller once (debounced)
*/

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const inboxDir = path.join(process.cwd(), '.agent', 'inbox')
fs.mkdirSync(inboxDir, { recursive: true })

let lastTriggeredAt = 0
let runningPoller = false

function triggerPoller(reason) {
  const now = Date.now()
  if (now - lastTriggeredAt < 5000) {
    return // debounce to avoid storms
  }
  if (runningPoller) return
  lastTriggeredAt = now
  runningPoller = true
  console.log(`[agent-watch] Triggering poller due to: ${reason}`)
  const child = spawn('node', ['.agent/poller.js'], { stdio: 'inherit' })
  child.on('exit', (code) => {
    runningPoller = false
    console.log(`[agent-watch] Poller exited with code ${code}`)
  })
}

function handleFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const { event, payload } = JSON.parse(raw)
    if (['issues', 'issue_comment', 'pull_request'].includes(event)) {
      triggerPoller(event)
      if (event === 'pull_request' && ['opened','synchronize','reopened'].includes(payload?.action)) {
        // Fire a one-off automated review
        const child = spawn('node', ['.agent/review-pr.js', path.resolve(filePath)], { stdio: 'inherit' })
        child.on('exit', (code) => {
          console.log(`[agent-watch] review runner exited ${code}`)
        })
      }
      if (event === 'issue_comment' && payload?.action === 'created') {
        // React to PR comment commands
        const child = spawn('node', ['.agent/act-on-comment.js', path.resolve(filePath)], { stdio: 'inherit' })
        child.on('exit', (code) => {
          console.log(`[agent-watch] act-on-comment exited ${code}`)
        })
      }
    }
  } catch (err) {
    console.error('[agent-watch] Failed processing', filePath, err.message)
  }
}

console.log(`[agent-watch] Watching ${inboxDir} for new events...`)

// Process any existing files at startup
for (const name of fs.readdirSync(inboxDir)) {
  if (name.endsWith('.json')) handleFile(path.join(inboxDir, name))
}

fs.watch(inboxDir, { persistent: true }, (eventType, filename) => {
  if (!filename || !filename.endsWith('.json')) return
  const full = path.join(inboxDir, filename)
  // Wait briefly to ensure writer is done
  setTimeout(() => {
    if (fs.existsSync(full)) handleFile(full)
  }, 200)
})


