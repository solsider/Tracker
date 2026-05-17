-- Production Hardening: Add missing FK indexes for query performance

-- Project: ownerId, groupId
CREATE INDEX IF NOT EXISTS "Project_ownerId_idx" ON "Project"("ownerId");
CREATE INDEX IF NOT EXISTS "Project_groupId_idx" ON "Project"("groupId");

-- Issue: reporterId
CREATE INDEX IF NOT EXISTS "Issue_reporterId_idx" ON "Issue"("reporterId");

-- Comment: authorId
CREATE INDEX IF NOT EXISTS "Comment_authorId_idx" ON "Comment"("authorId");

-- Notification: actorId, projectId
CREATE INDEX IF NOT EXISTS "Notification_actorId_idx" ON "Notification"("actorId");
CREATE INDEX IF NOT EXISTS "Notification_projectId_idx" ON "Notification"("projectId");
