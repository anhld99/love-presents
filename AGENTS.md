# AGENTS.md

Guidance for coding agents working in `love-presents`.

## 1) Project snapshot
- Stack: React 19 + TypeScript + Vite frontend, Vercel serverless API routes, Supabase backend.
- Package manager: npm (`package-lock.json` present).
- Runtime/module mode: ESM (`"type": "module"` in `package.json`).
- TypeScript: strict mode for app and node configs.
- Linting: ESLint flat config (`eslint.config.js`) with TS + React Hooks + React Refresh.
- Testing: no test framework configured yet.

## 2) Repository rule files
Checked for extra agent instructions:
- `.cursor/rules/`: not found
- `.cursorrules`: not found
- `.github/copilot-instructions.md`: not found
If these files are added later, treat them as higher-priority repository rules.

## 3) Setup and local development commands
Run from repository root: `/Users/luongduyanh/workspace/love-presents`.

### Install
```bash
npm ci
```
Fallback (if lockfile updates are intentional):
```bash
npm install
```

### Development
Frontend only (Vite):
```bash
npm run dev
```
Equivalent direct script:
```bash
npm run dev:vite
```
Frontend + local API routes (recommended when touching `/api`):
```bash
npx vercel dev
```

### Build/lint/preview
```bash
npm run build      # tsc -b && vite build
npm run lint       # eslint .
npm run preview    # vite preview
```

### Targeted checks
Lint a single file:
```bash
npx eslint src/pages/LoginPage.tsx
```
Typecheck only:
```bash
npx tsc -b
```

## 4) Testing status and single-test guidance
Current status:
- No `test` script exists in `package.json`.
- No test dependencies detected (Vitest/Jest/Playwright/Cypress absent).
- No `*.test.*` or `*.spec.*` files detected in source.

What agents should do now:
- Do not claim automated test coverage.
- For every code change, run `npm run lint` and `npm run build`.
- If API behavior changed, smoke-test with `npx vercel dev`.

Single-test command guidance:
- Not available today (no test runner).
- If a runner is added later, add/maintain commands in `package.json` and update this section.
- Example future pattern (only if Vitest is introduced):
```bash
npx vitest run src/path/to/file.test.ts -t "test name"
```

## 5) Architecture map
- `src/`: React frontend (`pages`, `components`, `hooks`, `lib`, `types`).
- `api/`: Vercel serverless routes and backend helpers.
- `supabase/schema.sql`: database schema bootstrap.
- `vercel.json`: local dev/rewrite behavior for Vercel runtime.

## 6) Code style and conventions
Follow existing code over generic style defaults.

### Formatting
- Use 2-space indentation.
- Use single quotes.
- Avoid semicolons unless syntax requires them.
- Keep trailing commas in multiline literals.

### Imports
- Group imports in this order:
  1) external packages
  2) relative project imports
- Prefer `import type` for type-only imports.
- In `api/*`, preserve `.js` extension in relative imports from TS files.
  - Example: `import { requireAuth } from '../_session.js'`.

### TypeScript
- Keep strict typing; avoid `any`.
- Reuse existing domain types (`GiftItem`, `GiftFormData`, `GiftFilters`, `UserRole`).
- Use `Partial<T>` for patch/update payloads when appropriate.
- Narrow unknown errors with `instanceof Error` before reading `.message`.
- Keep DB mapping responsibilities in mapper helpers, not UI components.

### Naming
- Components/pages/providers: PascalCase.
- Hooks: `use*` camelCase.
- Utility/context files: existing kebab/camel style (`gifts-context`, `_giftMapper`).
- Constants: UPPER_SNAKE_CASE.
- Booleans should read clearly (`isGifted`, `canReadList`, `authenticated`).

### React patterns
- Prefer function declarations for components/hooks.
- Keep state local unless shared by multiple pages.
- Shared cross-page state should go through context providers.
- For async event handlers in JSX, use `void` wrapper pattern:
  - `onClick={() => { void handleToggle() }}`

### Error handling and UX
- API client helpers throw `Error` with user-facing messages.
- In page/component async handlers: `try/catch/finally` around loading states.
- On failures, show toast/alert messages and rethrow when parent flow depends on rejection.
- Avoid silent failures; always provide a safe fallback message.

### API route conventions
- Use `requireAuth(req, res)` early for protected routes.
- Resolve role via session and enforce authorization (`owner` vs `em`) before DB calls.
- Validate params/body early; return `400` for invalid input.
- Return JSON consistently (`{ error: string }` for failures).
- Return `405` for unsupported methods.
- Use `getSupabaseAdmin()` for all server-side DB access.

### Data and mapping
- API/database layer uses snake_case fields.
- Frontend app model stays camelCase (`budgetRange`, `desireLevel`, `sampleUrl`).
- Keep transformations in `api/_giftMapper.ts`.

### Security and environment
- Never commit `.env.local` or secrets.
- Service-role key is server-only (`api/_supabase.ts`), never expose in browser code.
- Preserve session cookie flags (`httpOnly`, `sameSite`, `secure`) in `api/_session.ts`.
- `SESSION_SECRET` is required for signed cookie validation.

### CSS/UI conventions
- Shared styles live in `src/index.css`.
- Keep class names kebab-case and feature-oriented.
- Preserve responsive behavior at current breakpoints (`880px`, `640px`).

## 7) Agent workflow checklist
Before coding:
- Read nearby files and match local patterns.
- Check if change is frontend-only or also touches `/api`.
Before finishing:
- Run `npm run lint`.
- Run `npm run build`.
- If `/api` changed, smoke-test with `npx vercel dev`.
- Update this `AGENTS.md` when commands/conventions/tooling change.

## 8) Known gaps
- No automated tests currently; README is still template text, so source/config is canonical.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **love-presents** (295 symbols, 671 relationships, 22 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/love-presents/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/love-presents/context` | Codebase overview, check index freshness |
| `gitnexus://repo/love-presents/clusters` | All functional areas |
| `gitnexus://repo/love-presents/processes` | All execution flows |
| `gitnexus://repo/love-presents/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## CLI

- Re-index: `npx gitnexus analyze`
- Check freshness: `npx gitnexus status`
- Generate docs: `npx gitnexus wiki`

<!-- gitnexus:end -->
