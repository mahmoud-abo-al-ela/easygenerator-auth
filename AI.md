# AI Usage

## Tools

- **Claude Code** as the main assistant, for project context files, planning, backend code, tests and verification runs.
- Claude Code features I relied on: `/init` (project context), **plan mode** (review before any code is written), the `senior-backend` skill, the `senior-security` skill, the `clean-code` skill, the `frontend-design` skill (visual direction) and the Playwright MCP browser (end-to-end checks in a real browser).

## How I worked

1. **Gave the AI project context first.** I ran `/init` to generate `CLAUDE.md`.
2. **Plan first, code second.** In plan mode, Claude explored the repo and wrote a file-by-file plan (modules, DTOs, cookie options, guard, tests, verification). I reviewed the plan before any code was written. Correcting a plan is much cheaper than correcting generated code.
3. **"Approve with changes" instead of re-prompting.** I approved the plan with five specific corrections (listed below). Claude applied them, and they became the source of several test cases.
4. **Verification was part of the plan, not an afterthought.** The plan ended with lint, build, unit tests, e2e tests and a manual run of the built app against a real MongoDB. The manual run caught a bug that the tests missed (see below).
5. **A separate security pass after the code worked.** I asked for a security review of the finished backend instead of trusting the generated code. It found issues the first version shipped with, and I choose which ones to fix (see below).
6. **A clean-code pass at the end.** With everything working and tested, I asked for a clean-code review (SRP, DRY, YAGNI, naming) and had it applied as pure refactors, with the full test suite as the safety net.
7. **Frontend on a feature branch, with the skills chosen up front.** Before approving the frontend plan I asked which skills would actually help, and kept the list short (design direction, form UX rules, browser testing, accessibility) and skipped heavy design pipelines to keep delivery fast. The work lives on `feat/frontend-auth` so `/security-review` can review it against `main`.

## Decisions I made or changed from the AI's proposal

| Topic                  | AI proposed                                    | What I decided and why                                                                                                                            |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token storage          | n/a (my decision up front)                     | JWT in an **httpOnly cookie**, not localStorage, so it can't be read by injected scripts (XSS)                                                    |
| Name length            | min 3 only                                     | Also **max 50** characters                                                                                                                        |
| Password special char  | `[^A-Za-z\d]`, which accepted a space          | `[^A-Za-z\d\s]`: whitespace does not count as a special character (`"Password1 "` must fail)                                                      |
| Sign-in DTO            | only check that email and password are present | Still **trim and lowercase the email**, otherwise `" Jane@Example.com "` can't sign in. Password stays presence-only so the policy isn't revealed |
| Local MongoDB          | `docker run mongo:8`                           | A `docker-compose.yml` (`docker compose up -d`)                                                                                                   |
| Swagger path           | `/docs`                                        | `/api/docs`                                                                                                                                       |
| Password error message | generated text                                 | Reworded it myself                                                                                                                                |

## What had to be fixed

- **Runtime crash the tests missed.** `import { ConnectionStates } from 'mongoose'` compiled and passed all tests, but the built app crashed under plain Node, because mongoose is CommonJS and that name isn't an ESM named export. The manual run of `dist/main.js` found it. Lesson: passing tests don't prove the production build starts.
- **Input borders failed WCAG contrast.** The first frontend version drew input borders at about 1.5:1 against the background, under the 3:1 minimum for UI components (WCAG 1.4.11), so the fields were hard to find. A contrast check of every color pair caught it; a dedicated `--field` token (3.8:1 light, 3.9:1 dark) fixed it. All text pairs were already above 4.5:1.
- **Password strength bar lit up out of order.** Each segment was tied to one rule, so meeting "letter" and "number" but not "length" showed grey, yellow, yellow, grey. Seen in a browser screenshot, not in tests; it now fills left to right by the number of rules met.

### Security review findings

The first working version had these issues. All were found by the review, not by the tests.

| Finding                                                                                                                                                      | Fix                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Login CSRF.** Nest accepts form-encoded bodies by default, so an attacker's page could sign a victim into the attacker's account (confirmed: 200 + cookie) | Middleware rejects non-JSON bodies with 415; body-less POSTs like sign-out still work. Covered by e2e tests |
| **Placeholder JWT secret passed validation.** The `.env.example` value is 50 characters, so a copied example file would sign tokens with a public secret     | Startup fails if `JWT_SECRET` still contains the placeholder marker                                         |
| **Unsafe default when `NODE_ENV` is unset.** It defaulted to `development`, so cookies lost the `Secure` flag                                                | Defaults to `production`; cookies are `Secure` unless `NODE_ENV` is explicitly `development` or `test`      |
| **Rate limiting behind a proxy.** Behind a load balancer all users share one IP, so 5 sign-ins/min would apply to everyone                                   | `TRUST_PROXY_HOPS` env var sets Express `trust proxy`; default 0, so a spoofed `X-Forwarded-For` is ignored |

## What was AI-assisted

| Area                                                            | AI-assisted? | What I did myself                                                                       |
| --------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------- |
| Project scaffolding (NestJS, Vite)                              | Yes          | Checked and ran the commands                                                            |
| `CLAUDE.md` / `AGENTS.md` context files                         | Yes          | Reviewed them; they define the rules the AI follows in this repo                        |
| Backend config, bootstrap, Helmet, CORS, logging, rate limiting | Yes          | Reviewed the plan; chose the throttling limits and log redaction (passwords, cookies)   |
| User schema and DTO validation                                  | Yes          | Set the validation rules (name 3 to 50, password regex, email normalization on sign-in) |
| Auth service, JWT and guard                                     | Yes          | Chose httpOnly cookie storage, argon2, generic sign-in errors                           |
| Tests                                                           | Yes          | Edge cases came from my corrections                                                     |
| Frontend forms, Zod schemas, routing and session handling       | Yes          | Made the Zod schemas reuse the backend's exact rules and messages, with a test that fails if the two copies drift |
| Frontend visual design                                          | Yes          | Reviewed the direction (one bold element: the password checklist) and checked light, dark and mobile in a real browser |
| README / CI                                                     | Pending      | To do                                                                                   |
| Swagger                                                         | Yes          | Chose the `/api/docs` path                                                              |

## How I verified the output

- `pnpm lint` and `pnpm build`: clean.
- `pnpm audit --prod`: no known vulnerabilities.
- `pnpm test`: 54 unit tests (DTO rules and messages, validation error format, env validation, cookie options, auth service, JWT guard).
- `pnpm test:e2e`: 20 e2e tests against an in-memory MongoDB, including exact error messages and the login CSRF fix.
- Manual run of the built app against a local MongoDB, using curl:
  - sign-up → `/users/me` → sign-in → sign-out → `/users/me` returns 401
  - the session cookie is `HttpOnly`
  - responses never contain the password hash
  - a wrong password returns the generic "Email or password is incorrect"
  - an invalid sign-up returns per-field messages
  - the 6th sign-in attempt within a minute returns 429 with a friendly message
  - a form-encoded sign-in from another origin returns 415 and sets no cookie
  - the server refuses to start with the placeholder `JWT_SECRET`
  - passwords and cookies are redacted in the logs
  - Swagger UI loads under Helmet's Content Security Policy
- Frontend: `pnpm lint`, `pnpm build` (strict TypeScript) and 47 tests (schemas, contract drift guard, both forms, routing, log out).
- Frontend in a real browser (Playwright) against the running backend:
  - a weak sign-up is blocked client-side, the first invalid field gets focus, and the checklist shows which rules are met
  - a valid sign-up opens "Welcome to the application." with the normalized email
  - `document.cookie` is empty (the session cookie is `HttpOnly`), and the session survives a reload
  - log out returns to sign-in, removes the cookie, and `/` then redirects to sign-in
  - a wrong password shows "Email or password is incorrect"
  - keyboard tab order is logical with visible focus; dark mode and a 375px phone width have no horizontal scroll

## To be completed

The README and CI are still in progress. This file will be updated with how AI was used for them.
