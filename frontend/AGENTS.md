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
- `noUnusedLocals` / `noUnusedParameters` are on. `strict` is **not** set.

## Styling

Tailwind CSS 4 is wired through the `@tailwindcss/vite` plugin and `@import "tailwindcss"` in `src/index.css`. There is no `tailwind.config.js`; theme customization goes in CSS with `@theme`. `App.css` and the `:root` variables in `index.css` are leftovers from the Vite template.

## Testing

jsdom, `@testing-library/react`, `@testing-library/user-event` and `@testing-library/jest-dom` are installed, but Vitest is not configured for them yet. Before writing component tests, add `test: { environment: 'jsdom', setupFiles: [...] }` to `vite.config.ts` and a setup file that imports `@testing-library/jest-dom/vitest`. Mocks are `vi.fn()`, not `jest.fn()`.

## Working with the backend

The API is the NestJS app in `../backend` (default port 3000).

- Auth uses a JWT in an **httpOnly cookie**. Never store tokens in localStorage or JS state, and send every API request with `credentials: 'include'`. The cookie can't be read from JS, so ask the server (`GET /users/me`) whether the user is logged in.
- Zod schemas for forms must match the backend DTO validation rules exactly, especially the password rules. When one side changes, change the other. Reuse the exact messages and rule regexes from `backend/src/common/validation/validation-contract.ts` (`VALIDATION_MESSAGES`, `AUTH_MESSAGES`, `HAS_LETTER`, `HAS_NUMBER`, `HAS_SPECIAL_CHAR`).
- Form UX: react-hook-form `mode: 'onTouched'` (validate on blur, then live while fixing). Show the password rules as a live checklist (length, letter, number, special char) in that fixed order, not as one error. Link errors to inputs with `aria-invalid` and `aria-describedby`.
- Server errors: a 400 has `errors: { field: string[] }`; map each onto its field with `setError`. For 401/409/429, show `message` as a form-level alert. The server's password message order isn't guaranteed, so don't rely on it.
- No dev proxy or API base URL is configured yet. Prefer a Vite `server.proxy` for `/api`-style paths so the cookie stays same-origin in development.
