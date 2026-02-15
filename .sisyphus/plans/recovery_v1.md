# Recovery Plan: LockedIn Safety, Auth & UX Fixes

## TL;DR

> **Quick Summary**: Fixes critical safety gaps (missing Safeword), resolves "Zombie Loop" redirection bugs caused by stale sessions, and relaxes onboarding to be flexible/progressive as requested.
> 
> **Deliverables**:
> - **Middleware**: Robust session validation (fixes Zombie Loop) + Relaxed onboarding checks.
> - **Auth**: "Lock In" / "Create Account" redirects to correct pages (Home/Login), not Onboarding loop.
> - **Safety**: Chat API immediately respects Safewords (e.g., "Red").
> - **UX**: Dashboard & Settings handle missing data gracefully (Progressive Onboarding).
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Middleware Fix → Auth Route Fix → Safety Logic

---

## Context

### Original Request
User reported:
1.  **Zombie Loop**: Manually deleted users cause infinite spinning (stale session).
2.  **Redirection Bug**: "Lock In" (Sign In) and "Create Account" redirect to Onboarding instead of Login/Signup forms.
3.  **Rigid Onboarding**: User wants flexible onboarding (can skip/finish later in Settings/Dashboard).
4.  **Post-Onboarding Fail**: Redirect to Home fails (likely race condition).

### Interview Summary
**Key Discussions**:
- **Middleware**: Must NOT force redirect to `/onboarding` for authenticated users.
- **Onboarding**: Should be "one-time" for new users but recoverable via Settings if skipped.
- **Zombie Loop**: Caused by `getUser()` failing (user deleted) but session persisting. Fix: Force SignOut.

**Research Findings**:
- **Critical Safety Gap**: Chat API ignores Safewords.
- **Security Gap**: API routes use `supabaseAdmin` with trusted user input (IDOR risk).
- **Architecture**: Next.js API routes used instead of Edge Functions (Spec deviation, but acceptable for now).

### Metis Review
**Identified Gaps** (addressed):
- **Edge Case**: If Supabase is down (5xx), Middleware might trigger "Sign Out" aggressively. Added check for distinct error types (401/403 vs 500).
- **Missing UI**: Dashboard needs a "Select Regimen" state if user skipped onboarding.
- **Data Integrity**: Profile creation must handle "upsert" to prevent race conditions on Signup.

---

## Work Objectives

### Core Objective
Stabilize the Authentication flow, enforce Safety (Safeword), and implement Flexible Onboarding.

### Concrete Deliverables
- `src/middleware.ts`: Updated logic (Zombie fix + Flexible routing).
- `src/app/api/ai/chat/route.ts`: Safeword detection logic.
- `src/app/(dashboard)/home/page.tsx`: "Empty State" for missing Regimen.
- `src/app/(dashboard)/settings/page.tsx`: "Complete Profile" section.
- `src/lib/supabase/auth.ts`: Robust `signOut` (clears local storage).

### Definition of Done
- [ ] User can Sign In/Up and land on Home (or Onboarding if new).
- [ ] Deleted user is immediately signed out (no spin).
- [ ] Chat responds to "Red" by halting session.
- [ ] Dashboard works even with empty profile data.

### Must Have
- **Safeword Priority**: Safety logic runs *before* AI generation.
- **Fail-Safe Auth**: Invalid session = Immediate Logout.

### Must NOT Have (Guardrails)
- **No Infinite Loops**: Middleware must never redirect to itself.
- **No PII in LocalStorage**: (Long-term fix, but for now ensure `onboarding-store` clears after use).

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: NO (No Jest/Vitest found).
- **Automated tests**: NO (Focus on Agent-Executed QA).
- **Agent-Executed QA**: ALWAYS (mandatory for all tasks).

### Agent-Executed QA Scenarios (MANDATORY)

**Example — Middleware (Zombie Loop Fix):**
```
Scenario: Middleware detects deleted user and signs out
  Tool: Bash (curl)
  Preconditions: Valid JWT for a deleted user (simulated via mock or deletion)
  Steps:
    1. curl -I -H "Cookie: sb-access-token=..." http://localhost:3000/home
    2. Assert: Location header is "/login" (or similar)
    3. Assert: Set-Cookie clears session
  Expected Result: Redirect to login, session cleared
  Evidence: Response headers
```

**Example — Safety (Safeword):**
```
Scenario: Chat halts on Safeword "Red"
  Tool: Bash (curl)
  Preconditions: Active session
  Steps:
    1. POST /api/ai/chat {"message": "Red", "userId": "..."}
    2. Assert: Response contains "SAFEWORD_TRIGGERED" or similar
    3. Assert: AI does NOT generate continuation
  Expected Result: Immediate halt
  Evidence: Response body
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Core Logic):
├── Task 1: Middleware & Zombie Loop Fix
├── Task 2: Safety Implementation (Chat API)
└── Task 3: Auth Callback & Redirection Fix

Wave 2 (UI & Robustness):
├── Task 4: Dashboard Empty State (Regimen)
├── Task 5: Settings Page (Profile Completion)
└── Task 6: Onboarding Finalization (Redirect Fix)

Critical Path: Task 1 → Task 3 → Task 4
```

---

## TODOs

- [ ] 1. Fix Middleware & Zombie Loop (Core Stability) - **CORRECTED**

  **CRITICAL FIX REQUIRED**: The previous implementation was too aggressive and treated "no session" as an error.
  
  **What to do**:
  - Update `src/middleware.ts`:
    - Check `supabase.auth.getUser()`.
    - **IF** error is "Auth session missing": This is NORMAL for unauthenticated users. Set `user = null` and continue (don't redirect).
    - **IF** error is 401/403 or "user not found" (deleted user): Clear cookies + Redirect to `/login`.
    - **IF** valid user: Allow access to `/home` (DO NOT redirect to `/onboarding` even if `!onboarding_completed`).
    - **IF** unauthenticated: Allow `/login`, `/signup`, `/auth/callback`.

  **Corrected Implementation**:
  ```typescript
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  // --- Zombie Loop Fix: Only clear session on specific auth errors (user deleted/invalid), not "no session" ---
  if (authError && authError.message !== 'Auth session missing!') {
      console.error('Auth error in middleware:', authError)
      // Only clear cookies if it's a real auth error (not just missing session)
      if (authError.status === 401 || authError.status === 403 || 
          authError.message?.includes('not found') || 
          authError.message?.includes('invalid')) {
          const cookies = request.cookies.getAll()
          const response = NextResponse.redirect(new URL('/login', request.url))
          cookies.forEach((cookie) => {
              if (cookie.name.includes('sb-')) {
                  response.cookies.delete(cookie.name)
              }
          })
          return response
      }
  }
  // "No session" is normal - continue with user = null
  ```

  **Acceptance Criteria**:
  - [ ] Unauthenticated user can access `/login` page (shows form, doesn't redirect).
  - [ ] Deleted user gets cleared session + redirect to `/login`.
  - [ ] Authenticated user with `onboarding_completed: false` can access `/home`.
  - [ ] Middleware does NOT loop.

  **Agent-Executed QA Scenarios**:
  - `Scenario: Unauthenticated user access /login` -> Shows login form (200 OK).
  - `Scenario: Deleted user access /home` -> Redirects to /login with cleared cookies.
  - `Scenario: Valid user (incomplete onboarding) access /home` -> Allows access (200 OK).

---

- [ ] 2. Implement Safeword Logic (Safety Critical)

  **What to do**:
  - Update `src/app/api/ai/chat/route.ts`:
    - Add explicit check for "Red", "Stop", "Safeword" *before* sending to Gemini.
    - If detected:
      - Call `emergencyRelease` (from `src/lib/supabase/sessions.ts`).
      - Return "Session Halted" message.
  - Ensure `emergencyRelease` is accessible server-side (may need to create/export if only client-side).

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`explore`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Blocks**: None

  **References**:
  - `src/app/api/ai/chat/route.ts` - Chat logic
  - `src/lib/supabase/sessions.ts` - `emergencyRelease` function

  **Acceptance Criteria**:
  - [ ] POST to chat with "Red" triggers release.
  - [ ] AI does not respond to "Red".

  **Agent-Executed QA Scenarios**:
  - `Scenario: User says Red` -> API returns success + release status.

---

- [ ] 3. Fix Auth Redirection & Callback (UX Fix)

  **What to do**:
  - Update `src/app/(auth)/login/page.tsx` & `signup/page.tsx`:
    - Remove client-side redirect to `/onboarding`.
    - Redirect to `/home` on success.
  - Update `src/app/auth/callback/route.ts`:
    - After code exchange, check profile.
    - **IF** profile missing: Create minimal profile.
    - Redirect to `/home` (User can finish onboarding later).

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`explore`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Blocked By**: Task 1 (Middleware needs to allow /home first)

  **References**:
  - `src/app/(auth)/login/page.tsx`
  - `src/app/auth/callback/route.ts`

  **Acceptance Criteria**:
  - [ ] "Lock In" clicks go to Login form, not Onboarding.
  - [ ] Successful login redirects to `/home`.

---

- [ ] 4. Dashboard "Empty State" (Progressive Onboarding)

  **What to do**:
  - Update `src/app/(dashboard)/home/page.tsx`:
    - Check if `user_preferences.regimen` is set.
    - **IF** missing: Show "Select Regimen" card/modal (instead of crashing or showing empty data).
  - Update `src/app/(dashboard)/settings/page.tsx`:
    - Ensure all fields (Limits, Physical, etc.) can be edited/saved even if initially empty.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `explore`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Blocked By**: Task 1 (Middleware allow access)

  **References**:
  - `src/app/(dashboard)/home/page.tsx`
  - `src/lib/stores/onboarding-store.ts` (for types)

  **Acceptance Criteria**:
  - [ ] Dashboard loads without error for user with 0 data.
  - [ ] "Select Regimen" UI is visible and functional.

---

- [ ] 5. Fix Post-Onboarding Redirect (Race Condition)

  **What to do**:
  - Update `src/app/(onboarding)/onboarding/review/page.tsx`:
    - After `updateProfile`:
      - **AWAIT** the result.
      - **CALL** `router.refresh()` (Next.js cache bust).
      - **THEN** `router.replace('/home')` (not `window.location`).
  - Update `src/lib/stores/onboarding-store.ts`:
    - Ensure `reset()` clears local storage properly.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`explore`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)

  **References**:
  - `src/app/(onboarding)/onboarding/review/page.tsx`

  **Acceptance Criteria**:
  - [ ] Completing onboarding redirects to `/home` reliably.
  - [ ] No infinite loop back to onboarding.

---

## Success Criteria

### Final Checklist
- [ ] Middleware handles deleted users (SignOut)
- [ ] Middleware allows partial onboarding access to `/home`
- [ ] "Lock In" goes to Login Page
- [ ] "Create Account" goes to Signup Page
- [ ] Chat respects "Red" (Safeword)
- [ ] Dashboard works with empty data
