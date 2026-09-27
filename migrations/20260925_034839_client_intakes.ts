import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_client_intakes_status" AS ENUM('invited', 'submitted', 'reviewed', 'revoked');
  CREATE TYPE "public"."enum_client_intakes_delivery_status" AS ENUM('unsent', 'sent', 'failed');
  CREATE TABLE "client_intakes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lead_id" integer NOT NULL,
  	"active_lead_id" integer,
  	"status" "enum_client_intakes_status" DEFAULT 'invited' NOT NULL,
  	"delivery_status" "enum_client_intakes_delivery_status" DEFAULT 'unsent' NOT NULL,
  	"token_hash" varchar,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"submitted_at" timestamp(3) with time zone,
  	"reviewed_at" timestamp(3) with time zone,
  	"answers" jsonb,
  	"verification_flags" jsonb,
  	"invited_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "client_intakes_id" integer;
  ALTER TABLE "client_intakes" ADD CONSTRAINT "client_intakes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "client_intakes" ADD CONSTRAINT "client_intakes_active_lead_id_leads_id_fk" FOREIGN KEY ("active_lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "client_intakes" ADD CONSTRAINT "client_intakes_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "client_intakes_lead_idx" ON "client_intakes" USING btree ("lead_id");
  CREATE UNIQUE INDEX "client_intakes_active_lead_idx" ON "client_intakes" USING btree ("active_lead_id");
  CREATE UNIQUE INDEX "client_intakes_token_hash_idx" ON "client_intakes" USING btree ("token_hash");
  CREATE INDEX "client_intakes_invited_by_idx" ON "client_intakes" USING btree ("invited_by_id");
  CREATE INDEX "client_intakes_updated_at_idx" ON "client_intakes" USING btree ("updated_at");
  CREATE INDEX "client_intakes_created_at_idx" ON "client_intakes" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_client_intakes_fk" FOREIGN KEY ("client_intakes_id") REFERENCES "public"."client_intakes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_client_intakes_id_idx" ON "payload_locked_documents_rels" USING btree ("client_intakes_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_client_intakes_fk";
   ALTER TABLE "client_intakes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "client_intakes" CASCADE;
  
  DROP INDEX "payload_locked_documents_rels_client_intakes_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "client_intakes_id";
  DROP TYPE "public"."enum_client_intakes_status";
  DROP TYPE "public"."enum_client_intakes_delivery_status";`)
}
