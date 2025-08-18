-- Add indexes for frequent queries
-- Submission: user timeline lookups
CREATE INDEX IF NOT EXISTS "Submission_userId_createdAt_idx" ON "Submission" ("userId", "createdAt");

-- XPEvent: user XP timeline
CREATE INDEX IF NOT EXISTS "XPEvent_userId_createdAt_idx" ON "XPEvent" ("userId", "createdAt");


