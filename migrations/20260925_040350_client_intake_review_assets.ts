import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "client_intakes" ALTER COLUMN "invited_by_id" SET NOT NULL;
  ALTER TABLE "client_intakes" ADD COLUMN "assets" jsonb;
  ALTER TABLE "client_intakes" ADD COLUMN "accepted_facts" jsonb;
  ALTER TABLE "client_intakes" ADD COLUMN "review_decisions" jsonb;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "client_intakes" ALTER COLUMN "invited_by_id" DROP NOT NULL;
  ALTER TABLE "client_intakes" DROP COLUMN "assets";
  ALTER TABLE "client_intakes" DROP COLUMN "accepted_facts";
  ALTER TABLE "client_intakes" DROP COLUMN "review_decisions";`)
}
