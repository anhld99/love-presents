# CLAUDE.md

Quick orientation for Claude Code sessions in `love-presents`.

## Commands

```bash
npm run build      # tsc -b && vite build (typecheck + bundle)
npm run lint       # eslint .
npm run dev        # Vite dev server (frontend only)
npx vercel dev     # Frontend + local API routes (use when touching /api)
npx tsc -b         # Typecheck only
npx eslint <file>  # Lint single file
```

No test framework is configured. Always run `lint` and `build` before finishing.

## Architecture

React 19 + TypeScript + Vite frontend, Vercel serverless API routes, Supabase backend.

- `src/` — React app: `pages/`, `components/`, `hooks/`, `lib/`, `types/`
- `api/` — Vercel serverless routes + backend helpers (`_session.ts`, `_supabase.ts`, `_giftMapper.ts`)
- `supabase/schema.sql` — DB schema bootstrap
- ESM throughout (`"type": "module"`)

## Auth flow

Google OAuth token → `POST /api/auth/google` → Supabase `auth.getUser(token)` validates → server creates signed HMAC-SHA256 cookie (`lp_session`, 7-day TTL, httpOnly). `requireSessionUser(req, res)` extracts/validates on protected routes.

## Data model

Couple-based: `app_users` → `couple_members` (role: `anh` or `em`) → `couples`. Each couple has `gifts` and `food_options`. Invites via `couple_invites` (token-based, status lifecycle). RLS disabled — API server controls all access.

Roles matter: `anh`/`em` have different permissions checked in API routes.

## API conventions

- `requireSessionUser()` early for auth, then role check before DB calls
- `getSupabaseAdmin()` for all server-side DB access
- Return `{ ok, data }` or `{ error }` JSON; 405 for unsupported methods; 400 for bad input
- DB uses snake_case, frontend uses camelCase — map in `api/_giftMapper.ts`
- In `api/` files, use `.js` extension for relative TS imports

## Code conventions

See `AGENTS.md` for full details. Key points:

- 2-space indent, single quotes, no semicolons, trailing commas
- Strict TypeScript — no `any`, reuse domain types from `src/types/`
- `import type` for type-only imports
- Function declarations for components/hooks
- Async JSX handlers: `onClick={() => { void handleAsync() }}`
- Never commit `.env.local` or secrets; service-role key is server-only

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
