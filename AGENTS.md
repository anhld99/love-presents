# AGENTS.md

Guidance for coding agents working in `love-presents`.

## 1) Project Snapshot
- Stack: React 19 + TypeScript + Vite frontend, Vercel serverless API routes, Supabase backend.
- Package manager: npm (`package-lock.json` is present).
- Module mode: ESM (`"type": "module"` in `package.json`).
- TypeScript: strict mode for app and node configs, plus a separate `tsconfig.api.json` for API code.
- Linting: ESLint flat config with `@eslint/js`, `typescript-eslint`, React Hooks, and React Refresh.
- Testing: no test runner or `test` script is configured today.
- Docs note: `README.md` is still the default Vite template; treat source and config files as canonical.

## 2) Repository Rule Files
Checked for higher-priority agent instructions:
- `.cursor/rules/`: not present
- `.cursorrules`: not present
- `.github/copilot-instructions.md`: not present
If any of these files appear later, follow them before this file.

## 3) Core Commands
Run commands from `/Users/luongduyanh/workspace/love-presents`.

```bash
npm ci
npm run dev
npm run dev:vite
npx vercel dev
npm run lint
npm run build
npm run preview
npm run db:link
npm run db:new -- add_feature_name
npm run db:push
npm run db:reset
npx tsc -b
npx eslint src/pages/LoginPage.tsx
```

- Use `npm ci` by default.
- Use `npm install` only when intentionally changing dependencies or the lockfile.
- `npm run dev` and `npm run dev:vite` start the Vite frontend only.
- Use `npx vercel dev` when changing `/api` routes so frontend and serverless functions run together.
- `npm run lint` runs `eslint .`.
- `npm run build` runs `tsc -b && vite build`.
- `npx tsc -b` typechecks the app/node TS projects without bundling.
- `tsconfig.api.json` exists, but no npm script currently typechecks API routes directly.
- Supabase CLI is installed as a dev dependency and is invoked through `npm run db:*` scripts.
- Run `npm run db:link` once per machine/project before pushing migrations to the hosted Supabase project.

## 4) Test Status and Single-Test Guidance
- No `test` script exists in `package.json`.
- No test runner dependency is installed (Vitest, Jest, Playwright, and Cypress are absent).
- No `*.test.*` or `*.spec.*` files are present in the repo.
- There is currently no supported single-test command.
- Do not claim automated test coverage.
- For every code change, run `npm run lint` and `npm run build`.
- If API behavior changes, smoke-test relevant routes with `npx vercel dev`.
- For schema changes, validate locally with `npm run db:reset` when Docker is available.
- If a test runner is added later, add repo scripts and update this file with the exact single-test command.

## 5) Architecture Map
- `src/`: React app code (`pages`, `components`, `hooks`, `lib`, `types`).
- `api/`: Vercel serverless routes plus shared server helpers.
- `supabase/migrations/`: ordered SQL migrations; this is the source of truth for schema changes.
- `supabase/schema.sql`: initial schema snapshot kept for manual bootstrap/reference.
- `supabase/config.toml`: Supabase CLI local/dev configuration.
- `vercel.json`: local dev command and SPA rewrite behavior.
- `src/index.css`: shared tokens, themes, animations, and responsive rules.

## 6) Code Style and Conventions
Follow nearby code over generic style defaults.

### Formatting
- Use 2-space indentation in TS, TSX, JSON, and CSS.
- Use single quotes in TS/TSX.
- Omit semicolons unless syntax requires them.
- Keep trailing commas in multiline arrays, objects, calls, and import lists.
- No Prettier config is present; preserve the current manual formatting style instead of rewrapping unrelated code.

### Imports
- Group imports in this order:
  1) external packages
  2) relative project imports
- Prefer `import type` for type-only imports; inline `type` specifiers are also acceptable when already used locally.
- Keep CSS side-effect imports near the top of the file.
- In `api/*.ts`, preserve `.js` extensions on relative imports from TS files.
- Prefer shared types from `src/types/*` over route-local duplicates when the model already exists.

### Exports and File Structure
- Frontend pages, hooks, components, and providers usually use named exports.
- `App.tsx` and Vercel route files use default exports.
- Keep small helper functions close to the code that uses them.
- Shared server-only helpers belong in `api/_*.ts`.
- Shared React contexts live in dedicated context files with matching `use*` hooks.

### TypeScript
- Keep code compatible with strict mode; avoid `any`.
- Reuse domain types such as `GiftItem`, `GiftFormData`, `GiftFilters`, `FoodOption`, and `UserRole`.
- Use `Partial<T>` for patch/update payloads where appropriate.
- Use typed row interfaces for Supabase results instead of loose records when the shape is known.
- Narrow caught errors with `instanceof Error` before reading `.message`.
- Use non-null assertions only where runtime guarantees already exist, such as required env vars or the root app element.

### Naming
- Components, pages, and providers: PascalCase.
- Hooks: `useSomething`.
- Utility functions and local variables: camelCase.
- Constants: UPPER_SNAKE_CASE or descriptive `*_KEY` names.
- Server helper filenames may use a leading underscore (`_session.ts`, `_giftMapper.ts`).
- Boolean names should read clearly: `authenticated`, `hasCouple`, `canReadList`, `isGifted`.

### React and Frontend Patterns
- Prefer function declarations for components and hooks.
- Keep page-local state local; lift state only when multiple pages or deep trees need it.
- Use context providers for cross-page state (`GiftsProvider`, `ToastProvider`).
- Memoize callbacks passed through context or deep props when stability matters.
- For async JSX handlers, use a `void` wrapper pattern when needed.
- Trim and validate form input before submitting when the rule is straightforward on the client.
- Keep user-facing copy consistent with the current Vietnamese tone of the product.

### API Route Patterns
- Use `requireSessionUser(req, res)` early for protected endpoints.
- Validate method, params, query values, and body fields before DB work.
- Enforce couple membership and role checks before privileged actions.
- Return JSON consistently; error payloads should be `{ error: string }`.
- Use `400` for invalid input, `401` for unauthenticated requests, `403` for forbidden actions, `404` for missing records, `405` for unsupported methods, and `409` for state conflicts when applicable.
- Keep reusable auth, pagination, mapping, and DB logic in helper modules instead of duplicating it in route handlers.
- Use `getSupabaseAdmin()` for server-side Supabase access and never expose service-role usage to the browser.

### Data and Mapping
- Frontend models stay camelCase (`budgetRange`, `sampleUrl`, `createdAt`).
- Database rows and Supabase payloads stay snake_case (`budget_range`, `sample_url`, `created_at`).
- Keep transformations in mapper helpers such as `api/_giftMapper.ts`.
- Use `normalizeEmail()` and related shared helpers instead of hand-rolling identifier normalization.
- For paginated endpoints, reuse `parsePagination()` and `toPaginationMeta()`.

### Error Handling and UX
- API clients and helpers should throw `Error` with user-readable messages.
- In UI async flows, use `try/catch/finally` around loading state transitions.
- Show toast, alert, or inline error feedback instead of failing silently.
- Rethrow after surfacing an error when the caller still depends on rejection.
- Use dedicated error classes like `ApiError` when route logic needs status-aware failures.

### CSS and UI
- Shared app styling lives primarily in `src/index.css`.
- Use kebab-case class names.
- Prefer existing CSS custom properties and theme tokens over ad hoc colors.
- Preserve the current theme system, animations, and `prefers-reduced-motion` behavior.
- Preserve responsive behavior at the existing `880px` and `640px` breakpoints.

### Security and Environment
- Never commit `.env*` files or secrets.
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-only in `api/_supabase.ts`.
- Browser-exposed env vars must use the `VITE_` prefix.
- Preserve session cookie behavior in `api/_session.ts` (`httpOnly`, `sameSite`, `secure`, TTL).
- `SESSION_SECRET` is required for signed session validation.

### Database Migration Workflow
- Do not edit the hosted database manually through the Supabase SQL editor unless recovering from an incident.
- Create every schema change as a new file in `supabase/migrations/` via `npm run db:new -- migration_name`.
- Apply migrations to the linked remote project with `npm run db:push`.
- Rebuild a local database from migrations with `npm run db:reset`.
- Treat `supabase/migrations/` as the canonical history; keep `supabase/schema.sql` as reference only.
- If remote schema drifts, use `npm run db:pull` carefully and review the generated SQL before committing it.

## 7) Agent Workflow Checklist
- Read nearby files before editing and match local patterns.
- When touching `/api`, verify both route behavior and frontend assumptions.
- Before finishing, run `npm run lint` and `npm run build`.
- If API behavior changed, smoke-test with `npx vercel dev`.
- Update this file when commands, tooling, architecture, or conventions change.

<!-- gitnexus:start -->
## 8) GitNexus
- Repository index: `love-presents`.
- Before editing a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and warn the user if risk is HIGH or CRITICAL.
- Use `gitnexus_context({name: "symbolName"})` for callers/callees and `gitnexus_query({query: "concept"})` to discover relevant execution flows.
- Use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` before renaming symbols; do not rely on blind find/replace for refactors.
- Run `gitnexus_detect_changes()` before committing or after large refactors to confirm the affected scope.
- If the index is stale, run `npx gitnexus analyze`.
- Helpful CLI commands: `npx gitnexus status`, `npx gitnexus analyze`, `npx gitnexus wiki`.
<!-- gitnexus:end -->
