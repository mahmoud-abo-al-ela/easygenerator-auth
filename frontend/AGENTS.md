# AGENTS.md

## Stack

React 19, Vite 8, TypeScript 6, Tailwind CSS 4, react-router-dom 7, react-hook-form 7 + Zod 4 (via `@hookform/resolvers`), Vitest. Package manager is pnpm. Some of these versions are likely newer than what you know, so check the current docs before relying on older APIs.

## Commands

- `pnpm dev`: start the Vite dev server
- `pnpm build`: type-check (`tsc -b`) then build. Type errors fail the build.
- `pnpm lint`: ESLint (typescript-eslint, react-hooks, react-refresh)
- `pnpm test`: Vitest. Single file: `pnpm vitest run src/path/file.test.tsx`; single test: `pnpm vitest run -t "name"`.

## TypeScript rules that bite

`tsconfig.app.json` sets options that reject common patterns:

- `verbatimModuleSyntax`: type-only imports must use `import type { ... }`.
- `erasableSyntaxOnly`: no `enum`, no `namespace`, no constructor parameter properties. Use `as const` objects or union types instead of enums.
- `allowImportingTsExtensions`: local imports keep their extension (`import App from './App.tsx'`), matching the existing code.
- `strict`, `noUnusedLocals` and `noUnusedParameters` are on.

## Styling

Tailwind CSS 4 via the `@tailwindcss/vite` plugin; there is no `tailwind.config.js`. Design tokens live in `src/index.css`: semantic CSS variables on `:root` (redefined for `prefers-color-scheme: dark`) exposed to Tailwind through `@theme inline` as `bg-paper`, `text-ink`, `border-field`, `bg-primary`, `bg-mark` and so on. Use those utilities, never raw hex. `--field` is the 3:1-contrast border for inputs; `--line` is only for decorative lines. Fonts are self-hosted with Fontsource: Bricolage Grotesque (`font-display`, headings) and Atkinson Hyperlegible (body).

## Testing

Vitest runs in jsdom (`vite.config.ts`, setup in `src/test/setup.ts`). Page and routing tests render the real app with `renderApp(path, handlers)` from `src/test/render-app.tsx`, which mocks `fetch` per `"METHOD /api/path"` (unmatched requests throw). `src/lib/validation-contract.test.ts` imports the backend contract and fails if the frontend copy drifts. Mocks are `vi.fn()`, not `jest.fn()`.

## Working with the backend

The API is the NestJS app in `../backend`. In dev, Vite proxies `/api/*` to `API_PROXY_TARGET` (strips `/api`; set it in `.env.local`, see `.env.example`), so requests are same-origin and the cookie needs no CORS. All calls go through `src/lib/api.ts`.

- Auth uses a JWT in an **httpOnly cookie**. Never store tokens in localStorage or JS state, and send every API request with `credentials: 'include'`. The cookie can't be read from JS, so ask the server (`GET /users/me`) whether the user is logged in.
- Zod schemas for forms must match the backend DTO validation rules exactly, especially the password rules. When one side changes, change the other. The frontend copy is `src/lib/validation-contract.ts` (kept identical to `backend/src/common/validation/validation-contract.ts` by a test); schemas are in `src/lib/auth-schemas.ts`, whose `PASSWORD_RULES` also drives the checklist UI.
- Form UX: react-hook-form `mode: 'onTouched'` (validate on blur, then live while fixing). Show the password rules as a live checklist (length, letter, number, special char) in that fixed order, not as one error. Link errors to inputs with `aria-invalid` and `aria-describedby`.
- Server errors: use `applyServerError()` (`src/lib/apply-server-error.ts`). It puts a 400's `errors: { field: string[] }` under the matching inputs and shows anything else (401/409/429/network) as the form-level `FormAlert`.
- Session state comes from `AuthProvider` / `useAuth()`; routes are guarded by `RequireAuth` and `RequireGuest` in `src/auth/route-guards.tsx`.
