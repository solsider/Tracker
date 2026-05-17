-- Baseline: create all tables that were applied via prisma db push and never captured in migrations.
-- Every statement uses IF NOT EXISTS / exception guards so it is safe to re-run on any DB state.

-- ─── Missing enum values ────────────────────────────────────────────────────

DO $$ BEGIN
  ALTER TYPE "IssueLinkType" ADD VALUE 'CAUSED_BY';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Missing enums ──────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "ReleaseStatus" AS ENUM ('DRAFT', 'RELEASED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ApiKeyScope" AS ENUM ('READ', 'WRITE', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Missing columns on existing tables ─────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='telegramChatId') THEN
    ALTER TABLE "User" ADD COLUMN "telegramChatId" TEXT;
  END IF;
END $$;

-- Issue.parentId / sprintId were added in phase1 but the FK constraints were not
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='Issue_parentId_fkey') THEN
    ALTER TABLE "Issue" ADD CONSTRAINT "Issue_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Sprint table created below; FK added after
-- (Issue_sprintId_fkey added at end of this file after Sprint is created)

-- ─── Sprint ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Sprint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "status" "SprintStatus" NOT NULL DEFAULT 'PLANNING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "capacity" INTEGER,
    "velocity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Sprint_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='Sprint_projectId_fkey') THEN
    ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Sprint_projectId_idx" ON "Sprint"("projectId");
CREATE INDEX IF NOT EXISTS "Sprint_projectId_status_idx" ON "Sprint"("projectId", "status");

-- Issue → Sprint FK
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='Issue_sprintId_fkey') THEN
    ALTER TABLE "Issue" ADD CONSTRAINT "Issue_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ─── Label ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Label" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='Label_projectId_name_key') THEN
    ALTER TABLE "Label" ADD CONSTRAINT "Label_projectId_name_key" UNIQUE ("projectId", "name");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='Label_projectId_fkey') THEN
    ALTER TABLE "Label" ADD CONSTRAINT "Label_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Label_projectId_idx" ON "Label"("projectId");

-- ─── IssueLabel (many-to-many join) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "IssueLabel" (
    "issueId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    CONSTRAINT "IssueLabel_pkey" PRIMARY KEY ("issueId", "labelId")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='IssueLabel_issueId_fkey') THEN
    ALTER TABLE "IssueLabel" ADD CONSTRAINT "IssueLabel_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='IssueLabel_labelId_fkey') THEN
    ALTER TABLE "IssueLabel" ADD CONSTRAINT "IssueLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IssueLabel_labelId_idx" ON "IssueLabel"("labelId");

-- ─── IssueLink ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "IssueLink" (
    "id" TEXT NOT NULL,
    "type" "IssueLinkType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    CONSTRAINT "IssueLink_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='IssueLink_sourceId_targetId_type_key') THEN
    ALTER TABLE "IssueLink" ADD CONSTRAINT "IssueLink_sourceId_targetId_type_key" UNIQUE ("sourceId", "targetId", "type");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='IssueLink_sourceId_fkey') THEN
    ALTER TABLE "IssueLink" ADD CONSTRAINT "IssueLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='IssueLink_targetId_fkey') THEN
    ALTER TABLE "IssueLink" ADD CONSTRAINT "IssueLink_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IssueLink_sourceId_idx" ON "IssueLink"("sourceId");
CREATE INDEX IF NOT EXISTS "IssueLink_targetId_idx" ON "IssueLink"("targetId");

-- ─── IssueWatcher ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "IssueWatcher" (
    "issueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IssueWatcher_pkey" PRIMARY KEY ("issueId", "userId")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='IssueWatcher_issueId_fkey') THEN
    ALTER TABLE "IssueWatcher" ADD CONSTRAINT "IssueWatcher_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='IssueWatcher_userId_fkey') THEN
    ALTER TABLE "IssueWatcher" ADD CONSTRAINT "IssueWatcher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IssueWatcher_userId_idx" ON "IssueWatcher"("userId");

-- ─── Checklist ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Checklist" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "issueId" TEXT NOT NULL,
    CONSTRAINT "Checklist_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='Checklist_issueId_fkey') THEN
    ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Checklist_issueId_idx" ON "Checklist"("issueId");

-- ─── ChecklistItem ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ChecklistItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "checklistId" TEXT NOT NULL,
    "assigneeId" TEXT,
    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='ChecklistItem_checklistId_fkey') THEN
    ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='ChecklistItem_assigneeId_fkey') THEN
    ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ChecklistItem_checklistId_idx" ON "ChecklistItem"("checklistId");
CREATE INDEX IF NOT EXISTS "ChecklistItem_assigneeId_idx" ON "ChecklistItem"("assigneeId");

-- ─── TimeEntry ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "TimeEntry" (
    "id" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "issueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='TimeEntry_issueId_fkey') THEN
    ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='TimeEntry_userId_fkey') THEN
    ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "TimeEntry_issueId_idx" ON "TimeEntry"("issueId");
CREATE INDEX IF NOT EXISTS "TimeEntry_userId_idx" ON "TimeEntry"("userId");
CREATE INDEX IF NOT EXISTS "TimeEntry_date_idx" ON "TimeEntry"("date");
CREATE INDEX IF NOT EXISTS "TimeEntry_issueId_date_idx" ON "TimeEntry"("issueId", "date");

-- ─── ActivityLog ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issueId" TEXT,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='ActivityLog_issueId_fkey') THEN
    ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='ActivityLog_projectId_fkey') THEN
    ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='ActivityLog_userId_fkey') THEN
    ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ActivityLog_issueId_idx" ON "ActivityLog"("issueId");
CREATE INDEX IF NOT EXISTS "ActivityLog_projectId_idx" ON "ActivityLog"("projectId");
CREATE INDEX IF NOT EXISTS "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_issueId_createdAt_idx" ON "ActivityLog"("issueId", "createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_projectId_createdAt_idx" ON "ActivityLog"("projectId", "createdAt");

-- ─── Notification ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "issueId" TEXT,
    "projectId" TEXT,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='Notification_userId_fkey') THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='Notification_actorId_fkey') THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='Notification_issueId_fkey') THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='Notification_projectId_fkey') THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_issueId_idx" ON "Notification"("issueId");
CREATE INDEX IF NOT EXISTS "Notification_actorId_idx" ON "Notification"("actorId");
CREATE INDEX IF NOT EXISTS "Notification_projectId_idx" ON "Notification"("projectId");

-- ─── Attachment ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Attachment" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issueId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='Attachment_issueId_fkey') THEN
    ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='Attachment_uploaderId_fkey') THEN
    ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Attachment_issueId_idx" ON "Attachment"("issueId");
CREATE INDEX IF NOT EXISTS "Attachment_uploaderId_idx" ON "Attachment"("uploaderId");

-- ─── ApiKey ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" "ApiKeyScope"[] NOT NULL DEFAULT ARRAY[]::"ApiKeyScope"[],
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='ApiKey_keyHash_key') THEN
    ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_keyHash_key" UNIQUE ("keyHash");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='ApiKey_userId_fkey') THEN
    ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey"("userId");
CREATE INDEX IF NOT EXISTS "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- ─── Webhook ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Webhook" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "events" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='Webhook_projectId_fkey') THEN
    ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Webhook_projectId_idx" ON "Webhook"("projectId");

-- ─── WebhookDelivery ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "response" TEXT,
    "durationMs" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "succeededAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "webhookId" TEXT NOT NULL,
    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='WebhookDelivery_webhookId_fkey') THEN
    ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "WebhookDelivery_webhookId_idx" ON "WebhookDelivery"("webhookId");
CREATE INDEX IF NOT EXISTS "WebhookDelivery_webhookId_createdAt_idx" ON "WebhookDelivery"("webhookId", "createdAt");

-- ─── GitBranch ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "GitBranch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issueId" TEXT NOT NULL,
    CONSTRAINT "GitBranch_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='GitBranch_issueId_name_key') THEN
    ALTER TABLE "GitBranch" ADD CONSTRAINT "GitBranch_issueId_name_key" UNIQUE ("issueId", "name");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='GitBranch_issueId_fkey') THEN
    ALTER TABLE "GitBranch" ADD CONSTRAINT "GitBranch_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "GitBranch_issueId_idx" ON "GitBranch"("issueId");

-- ─── GitCommit ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "GitCommit" (
    "id" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "url" TEXT,
    "authorName" TEXT,
    "committedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issueId" TEXT NOT NULL,
    CONSTRAINT "GitCommit_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='GitCommit_issueId_sha_key') THEN
    ALTER TABLE "GitCommit" ADD CONSTRAINT "GitCommit_issueId_sha_key" UNIQUE ("issueId", "sha");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='GitCommit_issueId_fkey') THEN
    ALTER TABLE "GitCommit" ADD CONSTRAINT "GitCommit_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "GitCommit_issueId_idx" ON "GitCommit"("issueId");

-- ─── GitPullRequest ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "GitPullRequest" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'open',
    "authorName" TEXT,
    "mergedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "issueId" TEXT NOT NULL,
    CONSTRAINT "GitPullRequest_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='GitPullRequest_issueId_url_key') THEN
    ALTER TABLE "GitPullRequest" ADD CONSTRAINT "GitPullRequest_issueId_url_key" UNIQUE ("issueId", "url");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='GitPullRequest_issueId_fkey') THEN
    ALTER TABLE "GitPullRequest" ADD CONSTRAINT "GitPullRequest_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "GitPullRequest_issueId_idx" ON "GitPullRequest"("issueId");

-- ─── Release ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Release" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "status" "ReleaseStatus" NOT NULL DEFAULT 'DRAFT',
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='Release_projectId_version_key') THEN
    ALTER TABLE "Release" ADD CONSTRAINT "Release_projectId_version_key" UNIQUE ("projectId", "version");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='Release_projectId_fkey') THEN
    ALTER TABLE "Release" ADD CONSTRAINT "Release_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Release_projectId_idx" ON "Release"("projectId");

-- ─── ReleaseIssue (many-to-many join) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ReleaseIssue" (
    "releaseId" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    CONSTRAINT "ReleaseIssue_pkey" PRIMARY KEY ("releaseId", "issueId")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='ReleaseIssue_releaseId_fkey') THEN
    ALTER TABLE "ReleaseIssue" ADD CONSTRAINT "ReleaseIssue_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='ReleaseIssue_issueId_fkey') THEN
    ALTER TABLE "ReleaseIssue" ADD CONSTRAINT "ReleaseIssue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ReleaseIssue_issueId_idx" ON "ReleaseIssue"("issueId");

-- ─── UserNotificationPreferences ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "UserNotificationPreferences" (
    "id" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailDigest" TEXT NOT NULL DEFAULT 'none',
    "notifyAssigned" BOOLEAN NOT NULL DEFAULT true,
    "notifyMentioned" BOOLEAN NOT NULL DEFAULT true,
    "notifyComments" BOOLEAN NOT NULL DEFAULT false,
    "notifySprints" BOOLEAN NOT NULL DEFAULT true,
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserNotificationPreferences_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='UserNotificationPreferences_userId_key') THEN
    ALTER TABLE "UserNotificationPreferences" ADD CONSTRAINT "UserNotificationPreferences_userId_key" UNIQUE ("userId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name='UserNotificationPreferences_userId_fkey') THEN
    ALTER TABLE "UserNotificationPreferences" ADD CONSTRAINT "UserNotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ─── Missing indexes on existing tables ──────────────────────────────────────

CREATE INDEX IF NOT EXISTS "ProjectMember_userId_idx" ON "ProjectMember"("userId");
CREATE INDEX IF NOT EXISTS "GroupMember_userId_idx" ON "GroupMember"("userId");
CREATE INDEX IF NOT EXISTS "Column_projectId_idx" ON "Column"("projectId");
CREATE INDEX IF NOT EXISTS "Comment_issueId_idx" ON "Comment"("issueId");
CREATE INDEX IF NOT EXISTS "Comment_authorId_idx" ON "Comment"("authorId");
CREATE INDEX IF NOT EXISTS "Issue_parentId_idx" ON "Issue"("parentId");
CREATE INDEX IF NOT EXISTS "Issue_sprintId_idx" ON "Issue"("sprintId");
CREATE INDEX IF NOT EXISTS "Issue_reporterId_idx" ON "Issue"("reporterId");
CREATE INDEX IF NOT EXISTS "Issue_assigneeId_idx" ON "Issue"("assigneeId");
CREATE INDEX IF NOT EXISTS "Issue_columnId_idx" ON "Issue"("columnId");
CREATE INDEX IF NOT EXISTS "Issue_deletedAt_idx" ON "Issue"("deletedAt");
CREATE INDEX IF NOT EXISTS "Issue_projectId_type_idx" ON "Issue"("projectId", "type");
CREATE INDEX IF NOT EXISTS "Issue_projectId_priority_idx" ON "Issue"("projectId", "priority");
CREATE INDEX IF NOT EXISTS "Issue_projectId_deletedAt_idx" ON "Issue"("projectId", "deletedAt");
