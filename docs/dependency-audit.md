# Dependency remediation — 13 September 2026

Updated the locked application stack to Payload 3.89.0 and Next 16.3.5, with matching Next tooling, React 19.2.8, sharp 0.35.4, and Vitest 4.1.11. Next 15.5 is outside Payload 3.89.0's declared peer range, so staying on that line was not a compatible remediation. Resolved peers without `--force` or `--legacy-peer-deps`.

The initial review audit reported 3 critical, 13 high, 16 moderate, and 1 low affected-package entries. After compatible updates and a non-breaking DOMPurify audit fix: **0 critical, 0 high, 5 moderate**. Counts include transitive propagation and are not separate application exploits.

The remaining chain is `@payloadcms/db-postgres -> drizzle-kit -> @esbuild-kit/esm-loader -> @esbuild-kit/core-utils -> esbuild`. npm provides no compatible fix. The advisory concerns the old esbuild development server accepting cross-origin requests: [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99).

Disposition: retain the upstream migration tooling dependency and do not expose an esbuild development server. The application runs Next, while the migration tool uses esbuild as a transformer. Do not force-replace esbuild across incompatible APIs; recheck when Payload updates this chain. This is a documented moderate tooling risk, not an accepted high/critical deployment vulnerability.

Re-run `npm audit` at release time; this report is dated evidence, not a permanent assurance. Never use `npm audit fix --force` without reviewing the resulting compatibility changes.
