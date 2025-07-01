-- Add password column with a default value first
ALTER TABLE "users" ADD COLUMN "password" varchar(255);

-- Update existing users with a temporary password hash
UPDATE "users" SET "password" = '$2b$10$dummyhashfortesting' WHERE "password" IS NULL;

-- Now make the column NOT NULL
ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL;
