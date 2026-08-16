# Nepal MECEE-BL Exam Prep Platform - Phase 1 MVP

## Tech Stack
- **Frontend & Routing:** Next.js 16 (App Router, TypeScript, Turbopack/Webpack)
- **Styling & Design System:** Tailwind CSS with CSS variables (`--ink`, `--surface`, `--marigold`, `--sal-green`, `--vermillion`, `--foreground`)
- **Typography:** IBM Plex Sans, IBM Plex Sans Devanagari, and IBM Plex Mono
- **Database & ORM:** Drizzle ORM against PGlite (local in-memory PostgreSQL for zero-external-dependency local development and testing)
- **Testing:** Vitest for unit & integration testing
- **Signature Components:** `<BubbleFill>` (OMR-style bubble simulator) & `<AdmitCard>` (ticket stub style dashboard widget)

## Data Model Schema (`src/db/schema.ts`)
- `users`: `id`, `name`, `email`, `roll_number`, `created_at`
- `exams`: `id`, `slug`, `name`, `country_code` ("NP"), `curriculum_board` ("NEB")
- `subjects`: `id`, `exam_id` (fk), `name`, `slug`, `weight_marks`
- `topics`: `id`, `subject_id` (fk), `name`, `slug`
- `questions`: `id`, `topic_id` (fk), `body`, `difficulty` ("easy"|"medium"|"hard"), `explanation`, `curriculum_board` ("NEB")
- `question_options`: `id`, `question_id` (fk), `label` ("A"|"B"|"C"|"D"), `body`, `is_correct`
- `attempts`: `id`, `user_id` (fk), `question_id` (fk), `selected_option_id` (fk), `is_correct`, `time_taken_ms`, `created_at`

## Key Architecture & Business Logic (`src/lib/mastery.ts`)
- **Subject Mastery Calculation:** `getSubjectMasteryForUser(userId, subjectId)` computes mastery as `correctAttempts / totalAttempts` for attempts joined through `questions → topics → subjects` for the specified user only.
  - Returns `isNotStarted: true` if total attempts is 0 (or no questions exist for the subject) so the UI displays `"Not started"` instead of a fabricated percentage.
- **Last Active Topic:** `getLastActiveTopicIdForUser(userId)` retrieves the topic ID from the user's most recent attempt, powering the `"resume quiz"` CTA on `/dashboard`.
