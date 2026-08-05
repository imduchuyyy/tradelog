-- AlterTable
-- Additive and nullable: existing rows keep NULL ("not recorded"), so this is
-- safe to apply to production without a backfill or downtime.
ALTER TABLE "Trade" ADD COLUMN     "direction" TEXT;
