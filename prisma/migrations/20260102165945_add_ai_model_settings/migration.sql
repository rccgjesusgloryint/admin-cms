-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "selectedModel" TEXT,
ADD COLUMN     "autoSelectModel" BOOLEAN NOT NULL DEFAULT true;

