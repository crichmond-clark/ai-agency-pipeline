import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_leads_website_status" AS ENUM('no_site', 'social_only', 'third_party_platform', 'broken', 'live', 'unknown');
  CREATE TYPE "public"."enum_leads_pipeline_status" AS ENUM('new', 'profile_ready', 'demo_content_ready', 'demo_ready', 'qa_failed', 'needs_review', 'approved', 'rejected');
  CREATE TYPE "public"."enum_leads_sales_status" AS ENUM('not_contacted', 'contacted', 'replied', 'call_booked', 'won', 'lost');
  CREATE TYPE "public"."enum_demo_sites_template" AS ENUM('home_services');
  CREATE TYPE "public"."enum_outreach_messages_status" AS ENUM('draft', 'reviewed', 'sending', 'sent');
  CREATE TYPE "public"."enum_outreach_send_operations_purpose" AS ENUM('initial_outreach');
  CREATE TYPE "public"."enum_outreach_send_operations_state" AS ENUM('reserved', 'dispatching', 'unknown', 'failed', 'sent', 'canceled');
  CREATE TYPE "public"."enum_contact_attempts_channel" AS ENUM('email', 'phone');
  CREATE TYPE "public"."enum_workflow_runs_operation" AS ENUM('csv_import', 'profile_generation', 'demo_content_generation', 'demo_site_creation', 'screenshot_capture', 'qa_check', 'outreach_generation', 'outreach_send');
  CREATE TYPE "public"."enum_workflow_runs_status" AS ENUM('started', 'succeeded', 'failed');
  CREATE TYPE "public"."enum_ai_settings_default_provider" AS ENUM('deterministic', 'opencode-go', 'zai', 'openrouter', 'openai', 'openai-compatible');
  CREATE TYPE "public"."enum_ai_settings_per_operation_defaults_profile_provider" AS ENUM('deterministic', 'opencode-go', 'zai', 'openrouter', 'openai', 'openai-compatible');
  CREATE TYPE "public"."enum_ai_settings_per_operation_defaults_demo_content_provider" AS ENUM('deterministic', 'opencode-go', 'zai', 'openrouter', 'openai', 'openai-compatible');
  CREATE TYPE "public"."enum_ai_settings_per_operation_defaults_qa_provider" AS ENUM('deterministic', 'opencode-go', 'zai', 'openrouter', 'openai', 'openai-compatible');
  CREATE TYPE "public"."enum_ai_settings_per_operation_defaults_outreach_provider" AS ENUM('deterministic', 'opencode-go', 'zai', 'openrouter', 'openai', 'openai-compatible');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"business_name" varchar NOT NULL,
  	"normalized_business_name" varchar,
  	"city" varchar,
  	"address" varchar,
  	"phone" varchar,
  	"email" varchar,
  	"website_url" varchar,
  	"google_place_id" varchar,
  	"lead_source" varchar DEFAULT 'business-finder-csv',
  	"source_imported_at" timestamp(3) with time zone,
  	"source_payload" jsonb,
  	"website_status" "enum_leads_website_status" DEFAULT 'unknown' NOT NULL,
  	"pipeline_status" "enum_leads_pipeline_status" DEFAULT 'new' NOT NULL,
  	"sales_status" "enum_leads_sales_status" DEFAULT 'not_contacted' NOT NULL,
  	"demo_creation_approved_at" timestamp(3) with time zone,
  	"demo_creation_approved_by_id" integer,
  	"source_revision" numeric DEFAULT 1,
  	"workflow_revision" numeric DEFAULT 1,
  	"approved_demo_site_id" integer,
  	"approved_demo_revision" numeric,
  	"approved_at" timestamp(3) with time zone,
  	"approved_by_id" integer,
  	"do_not_contact_at" timestamp(3) with time zone,
  	"do_not_contact_reason" varchar,
  	"last_contacted_at" timestamp(3) with time zone,
  	"is_sample_lead" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "business_profiles_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE "business_profiles_verified_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"fact" varchar NOT NULL,
  	"source" varchar
  );
  
  CREATE TABLE "business_profiles_assumptions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"assumption" varchar NOT NULL
  );
  
  CREATE TABLE "business_profiles_missing_information" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "business_profiles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lead_id" integer NOT NULL,
  	"industry" varchar NOT NULL,
  	"confidence" numeric,
  	"raw_profile" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "demo_sites" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lead_id" integer NOT NULL,
  	"business_profile_id" integer,
  	"template" "enum_demo_sites_template" DEFAULT 'home_services' NOT NULL,
  	"slug" varchar NOT NULL,
  	"content" jsonb NOT NULL,
  	"content_revision" numeric DEFAULT 1,
  	"template_version" varchar DEFAULT 'home_services.v1',
  	"desktop_screenshot_id" integer,
  	"mobile_screenshot_id" integer,
  	"qa_report" jsonb,
  	"is_public" boolean DEFAULT false,
  	"expires_at" timestamp(3) with time zone,
  	"removed_at" timestamp(3) with time zone,
  	"removal_reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "outreach_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lead_id" integer NOT NULL,
  	"demo_site_id" integer,
  	"subject" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"safety_notes" varchar,
  	"status" "enum_outreach_messages_status" DEFAULT 'draft' NOT NULL,
  	"reviewed_at" timestamp(3) with time zone,
  	"sent_at" timestamp(3) with time zone,
  	"content_revision" numeric DEFAULT 1,
  	"reviewed_fingerprint" varchar,
  	"send_idempotency_key" varchar,
  	"send_claimed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "outreach_send_operations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lead_id" integer NOT NULL,
  	"outreach_message_id" integer NOT NULL,
  	"purpose" "enum_outreach_send_operations_purpose" DEFAULT 'initial_outreach' NOT NULL,
  	"active_slot_key" varchar,
  	"state" "enum_outreach_send_operations_state" DEFAULT 'reserved' NOT NULL,
  	"idempotency_key" varchar NOT NULL,
  	"snapshot" jsonb NOT NULL,
  	"first_dispatched_at" timestamp(3) with time zone,
  	"last_attempt_at" timestamp(3) with time zone,
  	"provider_message_id" varchar,
  	"error_category" varchar,
  	"error_message" varchar,
  	"reconciled_at" timestamp(3) with time zone,
  	"reconciled_by_id" integer,
  	"reconciliation_evidence" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contact_attempts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lead_id" integer NOT NULL,
  	"outreach_message_id" integer,
  	"channel" "enum_contact_attempts_channel" DEFAULT 'email' NOT NULL,
  	"sent_at" timestamp(3) with time zone NOT NULL,
  	"provider" varchar,
  	"provider_message_id" varchar,
  	"summary" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "workflow_runs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"operation" "enum_workflow_runs_operation" NOT NULL,
  	"status" "enum_workflow_runs_status" NOT NULL,
  	"lead_id" integer,
  	"demo_site_id" integer,
  	"outreach_message_id" integer,
  	"started_at" timestamp(3) with time zone NOT NULL,
  	"finished_at" timestamp(3) with time zone,
  	"summary" varchar,
  	"error" varchar,
  	"metadata" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"leads_id" integer,
  	"business_profiles_id" integer,
  	"demo_sites_id" integer,
  	"outreach_messages_id" integer,
  	"outreach_send_operations_id" integer,
  	"contact_attempts_id" integer,
  	"workflow_runs_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ai_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"default_provider" "enum_ai_settings_default_provider" DEFAULT 'deterministic' NOT NULL,
  	"default_model" varchar,
  	"per_operation_defaults_profile_provider" "enum_ai_settings_per_operation_defaults_profile_provider",
  	"per_operation_defaults_profile_model" varchar,
  	"per_operation_defaults_demo_content_provider" "enum_ai_settings_per_operation_defaults_demo_content_provider",
  	"per_operation_defaults_demo_content_model" varchar,
  	"per_operation_defaults_qa_provider" "enum_ai_settings_per_operation_defaults_qa_provider",
  	"per_operation_defaults_qa_model" varchar,
  	"per_operation_defaults_outreach_provider" "enum_ai_settings_per_operation_defaults_outreach_provider",
  	"per_operation_defaults_outreach_model" varchar,
  	"openai_compatible_base_url_label" varchar,
  	"provider_model_cache" jsonb,
  	"provider_model_cache_refreshed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_demo_creation_approved_by_id_users_id_fk" FOREIGN KEY ("demo_creation_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_approved_demo_site_id_demo_sites_id_fk" FOREIGN KEY ("approved_demo_site_id") REFERENCES "public"."demo_sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "business_profiles_services" ADD CONSTRAINT "business_profiles_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."business_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "business_profiles_verified_facts" ADD CONSTRAINT "business_profiles_verified_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."business_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "business_profiles_assumptions" ADD CONSTRAINT "business_profiles_assumptions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."business_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "business_profiles_missing_information" ADD CONSTRAINT "business_profiles_missing_information_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."business_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "demo_sites" ADD CONSTRAINT "demo_sites_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "demo_sites" ADD CONSTRAINT "demo_sites_business_profile_id_business_profiles_id_fk" FOREIGN KEY ("business_profile_id") REFERENCES "public"."business_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "demo_sites" ADD CONSTRAINT "demo_sites_desktop_screenshot_id_media_id_fk" FOREIGN KEY ("desktop_screenshot_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "demo_sites" ADD CONSTRAINT "demo_sites_mobile_screenshot_id_media_id_fk" FOREIGN KEY ("mobile_screenshot_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "outreach_messages" ADD CONSTRAINT "outreach_messages_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "outreach_messages" ADD CONSTRAINT "outreach_messages_demo_site_id_demo_sites_id_fk" FOREIGN KEY ("demo_site_id") REFERENCES "public"."demo_sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "outreach_send_operations" ADD CONSTRAINT "outreach_send_operations_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "outreach_send_operations" ADD CONSTRAINT "outreach_send_operations_outreach_message_id_outreach_messages_id_fk" FOREIGN KEY ("outreach_message_id") REFERENCES "public"."outreach_messages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "outreach_send_operations" ADD CONSTRAINT "outreach_send_operations_reconciled_by_id_users_id_fk" FOREIGN KEY ("reconciled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contact_attempts" ADD CONSTRAINT "contact_attempts_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contact_attempts" ADD CONSTRAINT "contact_attempts_outreach_message_id_outreach_messages_id_fk" FOREIGN KEY ("outreach_message_id") REFERENCES "public"."outreach_messages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_demo_site_id_demo_sites_id_fk" FOREIGN KEY ("demo_site_id") REFERENCES "public"."demo_sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_outreach_message_id_outreach_messages_id_fk" FOREIGN KEY ("outreach_message_id") REFERENCES "public"."outreach_messages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_business_profiles_fk" FOREIGN KEY ("business_profiles_id") REFERENCES "public"."business_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_demo_sites_fk" FOREIGN KEY ("demo_sites_id") REFERENCES "public"."demo_sites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_outreach_messages_fk" FOREIGN KEY ("outreach_messages_id") REFERENCES "public"."outreach_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_outreach_send_operations_fk" FOREIGN KEY ("outreach_send_operations_id") REFERENCES "public"."outreach_send_operations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_attempts_fk" FOREIGN KEY ("contact_attempts_id") REFERENCES "public"."contact_attempts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workflow_runs_fk" FOREIGN KEY ("workflow_runs_id") REFERENCES "public"."workflow_runs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "leads_google_place_id_idx" ON "leads" USING btree ("google_place_id");
  CREATE INDEX "leads_demo_creation_approved_by_idx" ON "leads" USING btree ("demo_creation_approved_by_id");
  CREATE INDEX "leads_approved_demo_site_idx" ON "leads" USING btree ("approved_demo_site_id");
  CREATE INDEX "leads_approved_by_idx" ON "leads" USING btree ("approved_by_id");
  CREATE INDEX "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");
  CREATE INDEX "business_profiles_services_order_idx" ON "business_profiles_services" USING btree ("_order");
  CREATE INDEX "business_profiles_services_parent_id_idx" ON "business_profiles_services" USING btree ("_parent_id");
  CREATE INDEX "business_profiles_verified_facts_order_idx" ON "business_profiles_verified_facts" USING btree ("_order");
  CREATE INDEX "business_profiles_verified_facts_parent_id_idx" ON "business_profiles_verified_facts" USING btree ("_parent_id");
  CREATE INDEX "business_profiles_assumptions_order_idx" ON "business_profiles_assumptions" USING btree ("_order");
  CREATE INDEX "business_profiles_assumptions_parent_id_idx" ON "business_profiles_assumptions" USING btree ("_parent_id");
  CREATE INDEX "business_profiles_missing_information_order_idx" ON "business_profiles_missing_information" USING btree ("_order");
  CREATE INDEX "business_profiles_missing_information_parent_id_idx" ON "business_profiles_missing_information" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "business_profiles_lead_idx" ON "business_profiles" USING btree ("lead_id");
  CREATE INDEX "business_profiles_updated_at_idx" ON "business_profiles" USING btree ("updated_at");
  CREATE INDEX "business_profiles_created_at_idx" ON "business_profiles" USING btree ("created_at");
  CREATE INDEX "demo_sites_lead_idx" ON "demo_sites" USING btree ("lead_id");
  CREATE INDEX "demo_sites_business_profile_idx" ON "demo_sites" USING btree ("business_profile_id");
  CREATE UNIQUE INDEX "demo_sites_slug_idx" ON "demo_sites" USING btree ("slug");
  CREATE INDEX "demo_sites_desktop_screenshot_idx" ON "demo_sites" USING btree ("desktop_screenshot_id");
  CREATE INDEX "demo_sites_mobile_screenshot_idx" ON "demo_sites" USING btree ("mobile_screenshot_id");
  CREATE INDEX "demo_sites_updated_at_idx" ON "demo_sites" USING btree ("updated_at");
  CREATE INDEX "demo_sites_created_at_idx" ON "demo_sites" USING btree ("created_at");
  CREATE INDEX "outreach_messages_lead_idx" ON "outreach_messages" USING btree ("lead_id");
  CREATE INDEX "outreach_messages_demo_site_idx" ON "outreach_messages" USING btree ("demo_site_id");
  CREATE INDEX "outreach_messages_updated_at_idx" ON "outreach_messages" USING btree ("updated_at");
  CREATE INDEX "outreach_messages_created_at_idx" ON "outreach_messages" USING btree ("created_at");
  CREATE INDEX "outreach_send_operations_lead_idx" ON "outreach_send_operations" USING btree ("lead_id");
  CREATE INDEX "outreach_send_operations_outreach_message_idx" ON "outreach_send_operations" USING btree ("outreach_message_id");
  CREATE UNIQUE INDEX "outreach_send_operations_active_slot_key_idx" ON "outreach_send_operations" USING btree ("active_slot_key");
  CREATE UNIQUE INDEX "outreach_send_operations_idempotency_key_idx" ON "outreach_send_operations" USING btree ("idempotency_key");
  CREATE INDEX "outreach_send_operations_reconciled_by_idx" ON "outreach_send_operations" USING btree ("reconciled_by_id");
  CREATE INDEX "outreach_send_operations_updated_at_idx" ON "outreach_send_operations" USING btree ("updated_at");
  CREATE INDEX "outreach_send_operations_created_at_idx" ON "outreach_send_operations" USING btree ("created_at");
  CREATE INDEX "contact_attempts_lead_idx" ON "contact_attempts" USING btree ("lead_id");
  CREATE INDEX "contact_attempts_outreach_message_idx" ON "contact_attempts" USING btree ("outreach_message_id");
  CREATE INDEX "contact_attempts_updated_at_idx" ON "contact_attempts" USING btree ("updated_at");
  CREATE INDEX "contact_attempts_created_at_idx" ON "contact_attempts" USING btree ("created_at");
  CREATE INDEX "workflow_runs_lead_idx" ON "workflow_runs" USING btree ("lead_id");
  CREATE INDEX "workflow_runs_demo_site_idx" ON "workflow_runs" USING btree ("demo_site_id");
  CREATE INDEX "workflow_runs_outreach_message_idx" ON "workflow_runs" USING btree ("outreach_message_id");
  CREATE INDEX "workflow_runs_updated_at_idx" ON "workflow_runs" USING btree ("updated_at");
  CREATE INDEX "workflow_runs_created_at_idx" ON "workflow_runs" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");
  CREATE INDEX "payload_locked_documents_rels_business_profiles_id_idx" ON "payload_locked_documents_rels" USING btree ("business_profiles_id");
  CREATE INDEX "payload_locked_documents_rels_demo_sites_id_idx" ON "payload_locked_documents_rels" USING btree ("demo_sites_id");
  CREATE INDEX "payload_locked_documents_rels_outreach_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("outreach_messages_id");
  CREATE INDEX "payload_locked_documents_rels_outreach_send_operations_i_idx" ON "payload_locked_documents_rels" USING btree ("outreach_send_operations_id");
  CREATE INDEX "payload_locked_documents_rels_contact_attempts_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_attempts_id");
  CREATE INDEX "payload_locked_documents_rels_workflow_runs_id_idx" ON "payload_locked_documents_rels" USING btree ("workflow_runs_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "leads" CASCADE;
  DROP TABLE "business_profiles_services" CASCADE;
  DROP TABLE "business_profiles_verified_facts" CASCADE;
  DROP TABLE "business_profiles_assumptions" CASCADE;
  DROP TABLE "business_profiles_missing_information" CASCADE;
  DROP TABLE "business_profiles" CASCADE;
  DROP TABLE "demo_sites" CASCADE;
  DROP TABLE "outreach_messages" CASCADE;
  DROP TABLE "outreach_send_operations" CASCADE;
  DROP TABLE "contact_attempts" CASCADE;
  DROP TABLE "workflow_runs" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "ai_settings" CASCADE;
  DROP TYPE "public"."enum_leads_website_status";
  DROP TYPE "public"."enum_leads_pipeline_status";
  DROP TYPE "public"."enum_leads_sales_status";
  DROP TYPE "public"."enum_demo_sites_template";
  DROP TYPE "public"."enum_outreach_messages_status";
  DROP TYPE "public"."enum_outreach_send_operations_purpose";
  DROP TYPE "public"."enum_outreach_send_operations_state";
  DROP TYPE "public"."enum_contact_attempts_channel";
  DROP TYPE "public"."enum_workflow_runs_operation";
  DROP TYPE "public"."enum_workflow_runs_status";
  DROP TYPE "public"."enum_ai_settings_default_provider";
  DROP TYPE "public"."enum_ai_settings_per_operation_defaults_profile_provider";
  DROP TYPE "public"."enum_ai_settings_per_operation_defaults_demo_content_provider";
  DROP TYPE "public"."enum_ai_settings_per_operation_defaults_qa_provider";
  DROP TYPE "public"."enum_ai_settings_per_operation_defaults_outreach_provider";`)
}
