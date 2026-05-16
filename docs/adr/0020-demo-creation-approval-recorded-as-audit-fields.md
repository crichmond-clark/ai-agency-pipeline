# Demo creation approval is recorded as audit fields

Demo Creation Approval is stored on the Lead as `demo_creation_approved_at` and `demo_creation_approved_by` rather than as a Pipeline Status value. This preserves who approved demo generation and when, while keeping Pipeline Status focused on production state such as profile generation, demo readiness, QA, review, approval, and rejection.
