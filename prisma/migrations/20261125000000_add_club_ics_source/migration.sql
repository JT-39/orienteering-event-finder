-- CreateEnum
CREATE TYPE "EventSource" AS ENUM ('BOF', 'CLUB_ICS');

-- AlterTable: bofNumber becomes nullable (club-feed events have none),
-- add icsUid (natural key for club-feed events) and source.
ALTER TABLE "Event" ALTER COLUMN "bofNumber" DROP NOT NULL;
ALTER TABLE "Event" ADD COLUMN "icsUid" TEXT;
ALTER TABLE "Event" ADD COLUMN "source" "EventSource" NOT NULL DEFAULT 'BOF';

-- CreateIndex
CREATE UNIQUE INDEX "Event_icsUid_key" ON "Event"("icsUid");

-- CreateIndex
CREATE INDEX "Event_source_idx" ON "Event"("source");
