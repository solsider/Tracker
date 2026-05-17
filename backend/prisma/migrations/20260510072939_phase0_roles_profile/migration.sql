-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('SYSTEM_ADMIN', 'COMPANY_ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD', 'DEVELOPER', 'QA', 'DESIGNER', 'VIEWER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "language" TEXT DEFAULT 'ru',
ADD COLUMN     "position" TEXT,
ADD COLUMN     "systemRole" "SystemRole" NOT NULL DEFAULT 'DEVELOPER',
ADD COLUMN     "timezone" TEXT DEFAULT 'Europe/Moscow';
