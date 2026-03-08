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
