-- First, add the new column
ALTER TABLE "measurements" ADD COLUMN "recorded_date" date;

-- Copy data from timestamp to recorded_date (converting timestamp to date)
UPDATE "measurements" SET "recorded_date" = "timestamp"::date;

-- Make the new column NOT NULL
ALTER TABLE "measurements" ALTER COLUMN "recorded_date" SET NOT NULL;

-- Drop the old timestamp column
ALTER TABLE "measurements" DROP COLUMN "timestamp";
