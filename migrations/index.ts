import * as migration_20260913_203012_pipeline_send_operations from './20260913_203012_pipeline_send_operations';

export const migrations = [
  {
    up: migration_20260913_203012_pipeline_send_operations.up,
    down: migration_20260913_203012_pipeline_send_operations.down,
    name: '20260913_203012_pipeline_send_operations'
  },
];
