# AI Agency Pipeline Agent Instructions

## Working in this repository

## Before work

- Read `CONTEXT.md`, `docs/ai-demo-pipeline-plan.md`, and relevant accepted decisions in `docs/adr/` before domain or architecture changes. For a narrowly scoped task, read only the relevant sections/files; do not load every document by default.
- Inspect the current branch and worktree before changing files. Preserve unrelated changes; never reset, clean, stash, or overwrite user work.
- Check current project code and tests before proposing replacements. Prefer the smallest complete change that fits existing patterns.
- Treat the user's current product specification as direction, and reconcile it with implemented behavior and accepted ADRs. Flag a genuine conflict before changing an accepted architectural decision.

## Branches and commits

- Do implementation on a dedicated feature branch, not `main`. Name branches `feature/<feature-name>` using a short descriptive kebab-case feature name; continue an existing task branch only when the user or task explicitly directs it.
- Keep work in small, reviewable, atomic commits. Each commit should represent one coherent logic unit and include the tests or documentation necessary for that unit. Separate unrelated changes; do not split code from its directly related tests.
- Validate each logic unit before committing. Review the staged diff and stage only files belonging to that unit.
- Do not commit unless the user has authorized commits for the task. When authorized, make the atomic commits without asking again for each one.
- Do not push, deploy, rewrite shared history, or merge unless explicitly requested.

## Implementation

- Preserve existing safety gates and accepted architecture decisions unless the user approves a change.
- Keep `CONTEXT.md` domain-focused. Record accepted architecture changes in `docs/adr/` and update the relevant roadmap when scope or decisions change.
- Do not assume external plan-sync locations are available. Update them only when accessible and requested by project workflow; report unavailable syncs rather than blocking repository work.
- Make the smallest complete change. Avoid unrelated refactors, speculative abstractions, and new dependencies without a demonstrated need.
- Validate external and AI-generated input at boundaries. Preserve provenance for business facts and do not treat inferred information as verified.
- Update or add durable tests for behavior changes, and update relevant user/developer documentation. Do not pin incidental implementation details.

## Review and verification

- For non-trivial implementation, use a subagent to review the completed diff before declaring it ready. Give the reviewer the relevant requirements and ask for concrete correctness, regression, security, and maintainability findings. Resolve findings or state why a finding is not applicable.
- Delegate bounded independent work only when it materially helps. Keep shared edits under one owner; do not use subagents as a substitute for understanding or testing the change.
- Use additional security review for public endpoints, authentication/access control, personal data, email delivery, AI/provider integrations, or other external boundaries.
- Run checks that exercise the changed behavior, plus relevant project checks when warranted. For UI changes, inspect the actual rendered behavior. Report only checks that were run and their observed results.
- Do not declare completion with known failing checks or unfinished required work. State concrete blockers when a prerequisite is unavailable.
