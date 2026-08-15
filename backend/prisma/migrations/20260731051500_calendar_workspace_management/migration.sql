ALTER TABLE "calendars"
ADD COLUMN "emoji" TEXT NOT NULL DEFAULT '⭐',
ADD COLUMN "description" TEXT,
ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

UPDATE "calendars"
SET "color" = 'sky'
WHERE "color" IS NULL OR "color" = '#3b82f6';

ALTER TABLE "calendars"
ALTER COLUMN "color" SET DEFAULT 'sky';

CREATE UNIQUE INDEX "calendars_userId_name_key" ON "calendars"("userId", "name");
