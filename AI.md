# AI Usage

## Overview

I used **Claude Code** as my primary AI development assistant. AI generated most of the implementation, while I owned the architecture, technical decisions, security requirements, and review of the final output.

My approach was to use AI to accelerate implementation without delegating engineering judgment. I defined the requirements, challenged proposed solutions, reviewed the generated code, and verified the application through automated and manual testing.

## What Was AI-Assisted

AI assisted with most stages of development:

- **Project setup:** Scaffolding and configuration.
- **Backend:** NestJS configuration, authentication, JWT guards, validation, and API endpoints.
- **Frontend:** Forms, Zod schemas, routing, validation, and UI implementation.
- **Testing:** Unit and end-to-end test generation.

My responsibility was to establish the architecture and constraints, review implementation plans before execution, correct unsuitable suggestions, and verify the resulting application.

## What Worked Well

**1. Context First**

I used `/init` to generate `CLAUDE.md`, documenting the project's architecture and technical constraints. This gave Claude persistent project context, including important details such as NestJS 12 being ESM-only and the use of Vitest for testing.

**2. Plan First, Then Approve With Changes**

I used Plan Mode before implementation. Claude proposed a file-by-file implementation plan, which I reviewed and corrected before allowing it to write code. This helped catch architectural issues early rather than fixing them after implementation.

**3. Verification Built Into Every Plan**

I required every implementation plan to include verification steps:

- ESLint and build checks.
- Unit and end-to-end tests.
- Manual API testing using curl.
- Frontend verification using Playwright in a real browser.

This ensured that generated code was not considered complete simply because it compiled.

**4. Separate Review Passes**

After the implementation worked, I ran separate security and clean-code reviews. Keeping these reviews separate from implementation helped identify issues that could otherwise be overlooked during feature development.

## Decisions I Made Differently

I challenged several AI-generated suggestions and made decisions based on the application's requirements and security considerations.

| AI proposal / default                  | My decision                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| JWT authentication storage             | Use an **httpOnly cookie** instead of localStorage to prevent JavaScript from directly reading the authentication token. |
| Name validation: minimum 3 characters  | Enforce both minimum 3 and maximum 50 characters.                                                                        |
| Special character: `[^A-Za-z\d]`       | Use `[^A-Za-z\d\s]` so whitespace does not satisfy the special-character requirement.                                    |
| Sign-in: check that fields are present | Normalize email by trimming whitespace and converting it to lowercase before authentication.                             |
| Flat list of validation messages       | Use plain validation messages grouped by field and shared consistently between frontend and backend.                     |

## What Had to Be Fixed

**1. CSRF Handling and Sign-Out**

The initial CSRF implementation caused an end-to-end test failure during sign-out. Browsers can send an empty POST request with `Content-Length: 0`, which Express still treats as a request with a body.

This exposed an issue in how empty-body requests were handled. I investigated the request behavior and adjusted the implementation so legitimate sign-out requests could work without weakening CSRF protection for state-changing requests.

**2. Accessibility: Input Border Contrast**

An accessibility check revealed that the input borders had a contrast ratio of approximately 1.5:1, below the 3:1 minimum for visual component boundaries.

I increased the border contrast to make form fields easier to distinguish and improve accessibility.

## README and CI

The README and the GitHub Actions workflow were also AI-generated from a short brief. I checked that every command and default in the README matches the code, and that the CI steps match what I run locally (frozen-lockfile install, lint, build, unit and e2e tests).

---

**Final takeaway:** AI handled much of the implementation, but the architecture, security decisions, verification strategy, and final engineering judgment remained my responsibility.
