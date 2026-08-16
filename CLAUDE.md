# CLAUDE.md - Academia Auth Architecture & Project Overview

@AGENTS.md

## High-Level Authentication Architecture

### Magic-Link Passwordless Authentication Flow
1. **Request Login (`POST /api/auth/request-login`):** Accepts `{ email }`. Normalizes email address and looks up existing user or creates a new user with default name (`email.split('@')[0]`). Signs a 20-minute JWT token with `jose` containing `userId` and `email`. Sends magic link (`/api/auth/verify-login?token=${token}`) via Resend.
2. **Verify Login (`GET /api/auth/verify-login`):** Reads `token` query param. Verifies signature and expiration using `jose`. Updates `email_verified = true` and `last_login_at = NOW()`. Encrypts/signs a 7-day session token stored in a secure `httpOnly` cookie (`session`). Redirects to `/dashboard`. Renders a styled dark-theme error page if token is expired or invalid.
3. **Logout (`POST /api/auth/logout`):** Clears the `session` httpOnly cookie and redirects to `/`.

### Session Management & Server Actions
- **`getCurrentUser()` Server Action (`src/app/actions/auth.ts` / `src/lib/auth.ts`):** Reads the `session` cookie from `next/headers`, verifies JWT payload using `jose`, and retrieves the user record from Drizzle DB.
- Usage in React Server Components:
  ```ts
  import { getCurrentUser } from "@/lib/auth";

  const user = await getCurrentUser();
  ```

### Route Protection in Middleware (`src/middleware.ts`)
- Next.js Edge Middleware checks incoming requests.
- Protected routes: `/dashboard`, `/quiz/*`, and non-auth `/api/*` endpoints.
- Public routes: `/`, `/login`, `/exams/*`, `/api/auth/*`.
- Unauthenticated access to protected pages redirects to `/login?redirect=${pathname}`.
- Unauthenticated access to protected API routes returns HTTP 401 JSON error.

### Required Environment Variables
```env
RESEND_API_KEY=re_...
NEXTAUTH_SECRET=...
BASE_URL=http://localhost:3000
```
