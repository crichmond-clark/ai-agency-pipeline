import * as migration_20260913_203012_pipeline_send_operations from './20260913_203012_pipeline_send_operations';
import * as migration_20260925_031629_website_enquiry_intake from './20260925_031629_website_enquiry_intake';
import * as migration_20260925_034839_client_intakes from './20260925_034839_client_intakes';
import * as migration_20260925_040350_client_intake_review_assets from './20260925_040350_client_intake_review_assets';

export const migrations = [
  {
    up: migration_20260913_203012_pipeline_send_operations.up,
    down: migration_20260913_203012_pipeline_send_operations.down,
    name: '20260913_203012_pipeline_send_operations',
  },
  {
    up: migration_20260925_031629_website_enquiry_intake.up,
    down: migration_20260925_031629_website_enquiry_intake.down,
    name: '20260925_031629_website_enquiry_intake',
  },
  {
    up: migration_20260925_034839_client_intakes.up,
    down: migration_20260925_034839_client_intakes.down,
    name: '20260925_034839_client_intakes',
  },
  {
    up: migration_20260925_040350_client_intake_review_assets.up,
    down: migration_20260925_040350_client_intake_review_assets.down,
    name: '20260925_040350_client_intake_review_assets'
  },
];
