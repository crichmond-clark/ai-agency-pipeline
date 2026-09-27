import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_leads_enquiry_need" AS ENUM('new_website', 'replace_existing', 'ecommerce', 'content_website', 'not_sure');
  CREATE TYPE "public"."enum_leads_enquiry_goal" AS ENUM('more_enquiries', 'more_calls', 'sell_online', 'credibility', 'replace_outdated', 'other');
  CREATE TYPE "public"."enum_leads_qualification_status" AS ENUM('unreviewed', 'qualified', 'not_fit');
  ALTER TYPE "public"."enum_workflow_runs_operation" ADD VALUE 'website_enquiry_ingestion' BEFORE 'profile_generation';
  ALTER TYPE "public"."enum_workflow_runs_operation" ADD VALUE 'client_intake_invitation' BEFORE 'profile_generation';
  ALTER TYPE "public"."enum_workflow_runs_operation" ADD VALUE 'client_intake_submission' BEFORE 'profile_generation';
  ALTER TYPE "public"."enum_workflow_runs_operation" ADD VALUE 'client_intake_review' BEFORE 'profile_generation';
  ALTER TABLE "leads" ADD COLUMN "website_submission_id" numeric;
  ALTER TABLE "leads" ADD COLUMN "website_submission_hash" varchar;
  ALTER TABLE "leads" ADD COLUMN "enquiry_contact_name" varchar;
  ALTER TABLE "leads" ADD COLUMN "enquiry_subject" varchar;
  ALTER TABLE "leads" ADD COLUMN "enquiry_message" varchar;
  ALTER TABLE "leads" ADD COLUMN "enquiry_need" "enum_leads_enquiry_need";
  ALTER TABLE "leads" ADD COLUMN "enquiry_goal" "enum_leads_enquiry_goal";
  ALTER TABLE "leads" ADD COLUMN "qualification_status" "enum_leads_qualification_status" DEFAULT 'unreviewed' NOT NULL;
  ALTER TABLE "workflow_runs" ADD COLUMN "idempotency_key" varchar;
  CREATE UNIQUE INDEX "workflow_runs_idempotency_key_idx" ON "workflow_runs" USING btree ("idempotency_key");
  CREATE UNIQUE INDEX "leads_website_submission_id_idx" ON "leads" USING btree ("website_submission_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workflow_runs" ALTER COLUMN "operation" SET DATA TYPE text;
  DROP TYPE "public"."enum_workflow_runs_operation";
  CREATE TYPE "public"."enum_workflow_runs_operation" AS ENUM('csv_import', 'profile_generation', 'demo_content_generation', 'demo_site_creation', 'screenshot_capture', 'qa_check', 'outreach_generation', 'outreach_send');
  ALTER TABLE "workflow_runs" ALTER COLUMN "operation" SET DATA TYPE "public"."enum_workflow_runs_operation" USING "operation"::"public"."enum_workflow_runs_operation";
  DROP INDEX "workflow_runs_idempotency_key_idx";
  ALTER TABLE "workflow_runs" DROP COLUMN "idempotency_key";
  DROP INDEX "leads_website_submission_id_idx";
  ALTER TABLE "leads" DROP COLUMN "website_submission_id";
  ALTER TABLE "leads" DROP COLUMN "website_submission_hash";
  ALTER TABLE "leads" DROP COLUMN "enquiry_contact_name";
  ALTER TABLE "leads" DROP COLUMN "enquiry_subject";
  ALTER TABLE "leads" DROP COLUMN "enquiry_message";
  ALTER TABLE "leads" DROP COLUMN "enquiry_need";
  ALTER TABLE "leads" DROP COLUMN "enquiry_goal";
  ALTER TABLE "leads" DROP COLUMN "qualification_status";
  DROP TYPE "public"."enum_leads_enquiry_need";
  DROP TYPE "public"."enum_leads_enquiry_goal";
  DROP TYPE "public"."enum_leads_qualification_status";`)
}
