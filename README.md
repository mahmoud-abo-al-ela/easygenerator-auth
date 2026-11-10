# Easygenerator Auth

A sign-up / sign-in module: a **NestJS + MongoDB** API and a **React + TypeScript** frontend. Signed-in users land on a page that says "Welcome to the application." and can log out.

## Stack

| Part     | Tech                                                                                       |
| -------- | ------------------------------------------------------------------------------------------ |
| Backend  | NestJS 12, MongoDB (Mongoose), JWT in an httpOnly cookie, argon2, class-validator, Swagger |
| Frontend | React 19, Vite 8, TypeScript (strict), react-router, react-hook-form + Zod, Tailwind CSS 4 |
| Tests    | Vitest everywhere; supertest + in-memory MongoDB for API e2e; Testing Library for the UI   |

## Quick start

**Requirements:** Node.js 22.12+ (CI uses 24), pnpm 10, Docker (for the local MongoDB).

```bash
# 1. Start MongoDB (repo root)
docker compose up -d

# 2. Backend: http://localhost:3000
cd backend
pnpm install
cp .env.example .env      # then set JWT_SECRET (see below)
pnpm start:dev

# 3. Frontend: http://localhost:5173 (new terminal)
cd frontend
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:5173, create an account, and you'll land on the welcome page. API docs (Swagger) are at http://localhost:3000/api/docs.

Generate a `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

The server won't start with the placeholder value from `.env.example`.

## Configuration

**Backend** (`backend/.env`, validated at startup):

| Variable                 | Default                 | Purpose                                                                    |
| ------------------------ | ----------------------- | -------------------------------------------------------------------------- |
| `MONGODB_URI`            | required                | MongoDB connection string                                                  |
| `JWT_SECRET`             | required                | Token signing secret, 32+ characters                                       |
| `NODE_ENV`               | `production`            | Use `development` locally; anything else makes cookies `Secure` (HTTPS)    |
| `PORT`                   | `3000`                  | API port                                                                   |
| `JWT_EXPIRES_IN_SECONDS` | `3600`                  | Session length; also the cookie's max age                                  |
| `CORS_ORIGIN`            | `http://localhost:5173` | Frontend origin allowed to send cookies                                    |
| `TRUST_PROXY_HOPS`       | `0`                     | Set to the number of reverse proxies in front of the API (for rate limits) |

**Frontend** (`frontend/.env.local`): `API_PROXY_TARGET` is where the dev server forwards `/api` requests. Match it to the backend's `PORT`.

## Commands

| Where      | Command                    | What it does                                       |
| ---------- | -------------------------- | -------------------------------------------------- |
| `backend`  | `pnpm start:dev`           | Run the API with reload                            |
|            | `pnpm test`                | Unit tests                                         |
|            | `pnpm test:e2e`            | API tests against an in-memory MongoDB (no Docker) |
|            | `pnpm lint` / `pnpm build` | Lint (oxlint) / compile                            |
| `frontend` | `pnpm dev`                 | Dev server with the `/api` proxy                   |
|            | `pnpm test`                | Unit and component tests                           |
|            | `pnpm lint` / `pnpm build` | ESLint / type-check and production build           |

Run a single test file with `pnpm vitest run path/to/file`. The first e2e run downloads a MongoDB binary (~800 MB), then it's cached.

## API

| Method | Path             | Auth   | Result                                                                 |
| ------ | ---------------- | ------ | ---------------------------------------------------------------------- |
| POST   | `/auth/sign-up`  | none   | 201, creates the user and sets the session cookie                      |
| POST   | `/auth/sign-in`  | none   | 200, sets the session cookie                                           |
| POST   | `/auth/sign-out` | none   | 204, clears the session cookie                                         |
| GET    | `/users/me`      | cookie | 200 with `{ id, email, name, createdAt }`, or 401 (protected endpoint) |
| GET    | `/health`        | none   | 200 when the database is connected                                     |

Validation errors return 400 with messages per field, ready to show under form inputs:

```json
{
  "statusCode": 400,
  "message": "Please check the highlighted fields",
  "errors": { "password": ["Include at least one number"] }
}
```

### Field rules

- **Email:** a valid address; trimmed and lowercased.
- **Name:** 3 to 50 characters.
- **Password:** 8 to 128 characters, with at least one letter, one number and one special character (a space doesn't count).

## Security

- The JWT is stored in an **httpOnly, SameSite=Lax cookie**, so page scripts can't read it; it's `Secure` outside development.
- Passwords are hashed with **argon2id** and never returned by the API.
- Sign-in gives the same error and response time whether the email exists or not.
- Request bodies must be JSON (others get 415), which blocks cross-site form posts (login CSRF).
- Rate limiting (5 sign-in/sign-up attempts per minute per IP), Helmet security headers, and logs with passwords and cookies redacted.

## Project layout

```
backend/    NestJS API: src/auth, src/users, src/common/validation, test/ (e2e)
frontend/   React app: src/pages, src/components, src/auth, src/lib
docker-compose.yml   Local MongoDB
AI.md       How AI was used to build this
```

## CI

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs on every push to `main` and every pull request: lint, build and all tests for both the backend (including e2e) and the frontend.
