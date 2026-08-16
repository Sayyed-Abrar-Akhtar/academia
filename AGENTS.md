# Nepal MECEE-BL Exam Prep Platform - Phase 1 MVP

## Tech Stack
- **Frontend & Routing:** Next.js 16 (App Router, TypeScript, Turbopack/Webpack)
- **Styling & Design System:** Tailwind CSS with CSS variables (`--ink`, `--surface`, `--marigold`, `--sal-green`, `--vermillion`, `--foreground`)
- **Typography:** IBM Plex Sans, IBM Plex Sans Devanagari, and IBM Plex Mono
- **Database & ORM:** Drizzle ORM against PGlite (local in-memory PostgreSQL for zero-external-dependency local development and testing)
- **Authentication:** Passwordless Magic-Link Auth with Resend, encrypted httpOnly cookies, and `jose` JWTs
- **Testing:** Vitest for unit & integration testing
- **Signature Components:** `<BubbleFill>` (OMR-style bubble simulator) & `<AdmitCard>` (ticket stub style dashboard widget)

## Data Model Schema (`src/db/schema.ts`)
- `users`: `id`, `name`, `email` (unique), `email_verified`, `last_login_at`, `avatar_url`, `roll_number`, `created_at`
- `exams`: `id`, `slug`, `name`, `country_code` ("NP"), `curriculum_board` ("NEB")
- `subjects`: `id`, `exam_id` (fk), `name`, `slug`, `weight_marks`
- `topics`: `id`, `subject_id` (fk), `name`, `slug`
- `questions`: `id`, `topic_id` (fk), `body`, `difficulty` ("easy"|"medium"|"hard"), `explanation`, `curriculum_board` ("NEB")
- `question_options`: `id`, `question_id` (fk), `label` ("A"|"B"|"C"|"D"), `body`, `is_correct`
- `attempts`: `id`, `user_id` (fk), `question_id` (fk), `selected_option_id` (fk), `is_correct`, `time_taken_ms`, `created_at`

## Authentication System
- **Magic-Link Authentication Flow:**
  1. Student enters email on `/login` page.
  2. `POST /api/auth/request-login` checks or creates user record, signs a 20-minute expiration JWT using `jose`, and sends a magic link via Resend.
  3. Student clicks link (`GET /api/auth/verify-login?token=...`). The token signature/expiration is verified via `jose`.
  4. Upon successful verification, user's `email_verified` flag is set to `true`, `last_login_at` is updated, and a 7-day encrypted httpOnly session cookie (`session`) is set before redirecting to `/dashboard`.
- **Session Management:**
  - Session stored securely in `session` httpOnly cookie (no separate sessions DB table required).
  - Server action `getCurrentUser()` in `src/app/actions/auth.ts` / `src/lib/auth.ts` decrypts and verifies the session token and fetches the user object.
- **Environment Variables Required (`.env.local`):**
  - `RESEND_API_KEY`: API key from Resend (e.g. `re_...`) for sending magic links.
  - `NEXTAUTH_SECRET`: Secret key for JWT signing and session encryption (generate with `openssl rand -base64 32`).
  - `BASE_URL`: Application base URL (e.g. `http://localhost:3000` locally, or `https://academia.sayyedabrarakhtar.com.np` in production).
- **How to Test Locally:**
  - Set `RESEND_API_KEY` in `.env.local` to send real emails via Resend.
  - In development/test environments without a Resend API key set, the server logs generated magic links to stdout for easy testing.

## Key Architecture & Business Logic (`src/lib/mastery.ts` & `src/lib/auth.ts`)
- **Subject Mastery Calculation:** `getSubjectMasteryForUser(userId, subjectId)` computes mastery as `correctAttempts / totalAttempts` for attempts joined through `questions → topics → subjects` for the specified user only.
  - Returns `isNotStarted: true` if total attempts is 0 (or no questions exist for the subject) so the UI displays `"Not started"` instead of a fabricated percentage.
- **Last Active Topic:** `getLastActiveTopicIdForUser(userId)` retrieves the topic ID from the user's most recent attempt, powering the `"resume quiz"` CTA on `/dashboard`.
- **Route Protection (`src/middleware.ts`):** Protects `/dashboard`, `/quiz/*`, and private `/api/*` endpoints. Unauthenticated requests are redirected to `/login?redirect=...`.
