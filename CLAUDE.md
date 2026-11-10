# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Two independent pnpm projects (no workspace root, no root package.json). Run commands from inside each directory:

- `backend/`: NestJS 12 API (Express adapter). Note: `backend/` contains its own nested `.git` repo, separate from the root repo.
- `frontend/`: React 19 + Vite 8 + Tailwind CSS 4 SPA.

Each project has an `AGENTS.md` with its detailed conventions. Read `backend/AGENTS.md` or `frontend/AGENTS.md` before working in that directory.

`AI.md` documents how AI was used on this project; update its table when AI-assisted work changes.

## Commands

Backend (`cd backend`):
- Local MongoDB: `docker compose up -d` from the repo root (`docker-compose.yml`). Copy `backend/.env.example` to `backend/.env`; env vars are validated at startup in `src/config/env.validation.ts`.
- `pnpm start:dev`: run with watch (port `PORT` or 3000). Swagger UI at `/api/docs`.
- `pnpm build` / `pnpm start:prod`
- `pnpm lint`: oxlint with type-aware rules (`no-floating-promises` is an error)
- `pnpm format`: prettier
- `pnpm test`: unit tests (`src/**/*.spec.ts`); `pnpm test:e2e`: e2e tests (`test/**/*.e2e-spec.ts`, supertest). E2e tests start their own `mongodb-memory-server` and don't need Docker; the first run downloads a ~780 MB MongoDB binary.
- Single test: `pnpm vitest run src/auth/auth.service.spec.ts` or `pnpm vitest run -t "test name"` (for e2e add `--config ./vitest.config.e2e.ts`)

Frontend (`cd frontend`):
- `pnpm dev`, `pnpm build` (`tsc -b && vite build`), `pnpm lint` (ESLint), `pnpm preview`
- `pnpm test`: Vitest in jsdom. Single test: `pnpm vitest run src/path/file.test.tsx` or `pnpm vitest run -t "name"`.
- Dev setup: copy `frontend/.env.example` to `.env.local` and point `API_PROXY_TARGET` at the backend's port.

## Frontend conventions (summary of frontend/AGENTS.md)

- `tsconfig.app.json` is `strict` and uses `verbatimModuleSyntax` (use `import type`) and `erasableSyntaxOnly` (no `enum`, `namespace`, or constructor parameter properties).
- Tailwind 4 is configured in CSS; use the semantic token utilities from `src/index.css` (`bg-paper`, `text-ink`, `border-field`…), never raw hex. Light and dark come from `prefers-color-scheme`.
- Vite proxies `/api/*` to the backend (prefix stripped), so the httpOnly cookie is same-origin in development.

## Backend conventions (from backend/AGENTS.md)

- NestJS 12 is likely newer than your training data; docs index: https://docs.nestjs.com/llms.txt. Prefer first-party `@nestjs/*` packages before adding libraries.
- The project is **ESM only**: relative imports must end in `.js`, there is no `__dirname` (use `import.meta.dirname`), and `main.ts` uses top-level await.
- Tests use Vitest with globals: mocks are `vi.fn()`, never `jest.fn()`.
- Validation: `class-validator` via `ValidationPipe` is what's installed; Standard Schema validation (`StandardSchemaValidationPipe`) is also available in Nest 12.

## Architecture

**Backend.** Endpoints: `POST /auth/sign-up` (201), `POST /auth/sign-in` (200), `POST /auth/sign-out` (204), `GET /users/me` (guarded), `GET /health`.

- **Bootstrap:** global middleware, pipes and CORS live in `configureApp()` in `src/app.setup.ts`, which both `main.ts` and the e2e tests call. Put new global setup there, not in `main.ts`, or the tests won't exercise it. `ValidationPipe` runs with `whitelist` + `forbidNonWhitelisted`, so unknown body fields return 400.
- **Session:** the JWT (HS256, `sub` = user id) is stored in the **httpOnly cookie** `access_token` (`src/auth/auth.cookie.ts`), never in localStorage or an Authorization header. `JwtAuthGuard` reads the cookie and sets `request.user`; use `@CurrentUser()` in guarded handlers.
- **Module layout:** `AuthJwtModule` (`src/auth/auth-jwt.module.ts`) owns `JwtModule` and the guard, so both `AuthModule` and `UsersModule` can import it without a circular dependency.
- **Password hash safety:** `passwordHash` is `select: false` on the schema. Responses always go through `toUserResponse()` (`src/users/dto/user-response.dto.ts`), an explicit allow-list. Don't return Mongoose documents from controllers.
- **Sign-in:** errors are a generic 401 `Email or password is incorrect`; unknown emails are verified against a dummy argon2 hash to keep timing uniform.
- **Rate limiting:** a global `ThrottlerGuard` allows 100 requests/min, and sign-up/sign-in allow 5/min. It's disabled when `NODE_ENV=test`.

**Validation contract (frontend Zod schemas must mirror this exactly).** Source: `backend/src/common/validation/validation-contract.ts`.
- `email`: valid email, trimmed and lowercased (also on sign-in), unique.
- `name`: trimmed, 3 to 50 characters.
- `password` (sign-up): 8 to 128 characters, plus `HAS_LETTER` (`/[A-Za-z]/`), `HAS_NUMBER` (`/\d/`) and `HAS_SPECIAL_CHAR` (`/[^A-Za-z\d\s]/`), so whitespace does not count as a special character. Each rule is checked and reported separately. Sign-in only requires a non-empty password.
- **Messages:** user-facing copy lives in `VALIDATION_MESSAGES` / `AUTH_MESSAGES` in the same file; the frontend reuses it word for word. Each password rule is a separate check (`src/common/validation/password-rules.ts`), because two `@Matches` on one field overwrite each other in class-validator.
- **400 shape:** `{ statusCode, error, message: "Please check the highlighted fields", errors: { field: string[] } }`, built by `validationExceptionFactory`. A missing field returns only its "required" message; password returns every unmet rule. 401/409/429 return a single `message`.

**Frontend.** Routes: `/` (app page, signed-in only), `/sign-in` and `/sign-up` (guests only); guards in `src/auth/route-guards.tsx`.

- **Session:** `AuthProvider` asks `GET /users/me` on load (the cookie isn't readable from JS) and exposes `useAuth()`.
- **API:** every call goes through `src/lib/api.ts` (`credentials: 'include'`), which throws `ApiError { status, message, fieldErrors }`; forms hand it to `applyServerError()`.
- **Validation:** `src/lib/validation-contract.ts` is a copy of the backend contract, kept identical by `validation-contract.test.ts` (it imports the backend file). Change both together.
