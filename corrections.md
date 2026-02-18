# Regression Corrections — Login Works, Dashboard Access Fails

**Reference commit (last working):** `2c10dd4`
**Regression introduced in:** `191a57b` (feat: implement system architecture upgrade, AI usage tracking, and onboarding fixes)

---

## Root Causes

### 1. middleware.ts: Silent profile query failure → onboarding redirect loop (PRIMARY)

**File:** `src/middleware.ts`

The middleware was upgraded from a pass-through to a full SSR auth guard. When it queries `profiles.onboarding_completed`, the error is silently discarded:

```typescript
// BUG — error ignored, null profile treated as "not onboarded"
const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

onboardingDone = profile?.onboarding_completed === true
// If query fails → profile = null → onboardingDone = false → redirect to /onboarding
```

**Impact:** Any user whose profile can't be read by the SSR client (RLS policy edge case, Edge Runtime cookie handling, network error) gets permanently redirected to `/onboarding` and can never reach the dashboard. Login succeeds but app is inaccessible.

---

### 2. middleware.ts: Session cookies lost on redirect (SECONDARY)

**File:** `src/middleware.ts`

When Supabase refreshes the access token during `getUser()`, it calls `setAll()` which writes updated cookies to the `response` variable. However, all redirect returns (`NextResponse.redirect(url)`) create a fresh response object and **do not copy those refreshed cookies**. The browser never receives the new tokens, causing auth failure on the next request.

```typescript
// BUG — refreshed cookies on `response` are abandoned
return NextResponse.redirect(homeUrl)  // should carry cookies from `response`
```

---

### 3. api_usage table migration not applied (SECONDARY)

**File:** `supabase/migrations/20260218_add_api_usage.sql`

New API routes (`/api/tasks/complete`, `/api/usage`, `/api/regimens/complete-day`) call `trackUsage()` which inserts into `api_usage`. If the migration was not applied, these routes fail with a 500 error.

---

## Proposed Fixes

### Fix 1 — Handle profile query error safely (`src/middleware.ts`)

Replace the profile query in the main middleware body:

```typescript
// BEFORE
const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

onboardingDone = profile?.onboarding_completed === true

// AFTER
const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

if (profileError) {
    // Query failed — fall through to client-side RouteGuard (as in working commit)
    return response
}

onboardingDone = profile?.onboarding_completed === true
```

Apply the same error check to the `isRootPath` profile query:

```typescript
// BEFORE
const { data: rootProfile } = await supabase...
const dest = rootProfile?.onboarding_completed ? '/home' : '/onboarding'

// AFTER
const { data: rootProfile, error: rootProfileError } = await supabase...
if (rootProfileError) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/home'
    return NextResponse.redirect(homeUrl)
}
const dest = rootProfile?.onboarding_completed ? '/home' : '/onboarding'
```

---

### Fix 2 — Carry session cookies on all redirects (`src/middleware.ts`)

Add a helper function and use it for every redirect in the middleware:

```typescript
// Add this helper near the top of middleware.ts
function redirectWithCookies(url: URL, response: NextResponse): NextResponse {
    const redirect = NextResponse.redirect(url)
    response.cookies.getAll().forEach(({ name, value, ...options }) => {
        redirect.cookies.set(name, value, options)
    })
    return redirect
}

// Then replace EVERY instance of:
//   return NextResponse.redirect(someUrl)
// With:
//   return redirectWithCookies(someUrl, response)
```

---

### Fix 3 — Apply the api_usage migration

Run in Supabase SQL editor or via `mcp__supabase__apply_migration`:

```sql
-- Contents of supabase/migrations/20260218_add_api_usage.sql
-- (already exists on disk — just needs to be applied to the live database)
```

---

## Safe Rollback Option

If the above fixes need more investigation, the **minimal safe rollback** is to revert only `src/middleware.ts` to the working commit's pass-through:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    return NextResponse.next({
        request: { headers: request.headers },
    })
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
}
```

This keeps all other improvements (server component `page.tsx`, new API routes, landing-page.tsx split) while restoring working auth — `RouteGuard` (client-side) handles routing as before.

---

## Verification After Applying Fix

1. `npm run dev`
2. Login with valid credentials → must reach `/home` without looping to `/onboarding`
3. Create fresh account (`onboarding_completed=false`) → must land at `/onboarding`, not loop
4. Expire access token (or wait 1h+), navigate to dashboard → must NOT redirect to `/login`
5. Complete a task → `/api/tasks/complete` must return 200 (no `api_usage` insert error)
6. Clear all cookies, visit `/home` → must redirect to `/login`
