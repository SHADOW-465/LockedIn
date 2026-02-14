# AGENTS.md — LockedIn

## Project Overview
LockedIn is a Next.js 16 web application with a dark cyber-noir neumorphic design theme. It uses Supabase for authentication and database.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Auth & DB**: Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Styling**: Vanilla CSS with CSS custom properties (design tokens)
- **State**: Zustand (onboarding store)
- **AI**: Google Gemini API

## Project Structure
```
lockedin-app/
├── src/
│   ├── app/
│   │   ├── (auth)/login/        # Login page
│   │   ├── (auth)/signup/       # Signup page
│   │   ├── (onboarding)/       # Onboarding flow (7 steps)
│   │   ├── auth/callback/       # Supabase OAuth callback route
│   │   ├── home/                # Main dashboard
│   │   └── layout.tsx           # Root layout with AuthProvider
│   ├── components/ui/           # Design system components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Supabase browser client (singleton)
│   │   │   ├── auth.ts          # Auth helpers (signUp, signIn, signInWithGoogle, signOut, getUserProfile)
│   │   │   └── schema.ts        # TypeScript types for DB tables
│   │   ├── contexts/
│   │   │   └── auth-context.tsx  # React auth context + provider
│   │   └── stores/
│   │       └── onboarding-store.ts  # Zustand store for onboarding
│   └── styles/                  # CSS design tokens & global styles
├── public/                      # Static assets + PWA manifest
├── .env.local                   # SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY
└── next.config.ts               # Next.js configuration
```

## Supabase Configuration
- **Project ID**: `ompdzvxzxuptsdexrxah`
- **Region**: `ap-south-1` (Mumbai)
- **Database Tables**:
  - `profiles` — User profiles (auto-created via trigger on auth.users insert)
  - `user_preferences` — User settings, limits, tags, physical details
- **RLS**: Enabled on both tables — users can only read/write their own rows
- **Auth**: Email/Password enabled by default. Google OAuth requires Google Cloud client ID/secret in Supabase dashboard.

## Environment Variables
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable anon key |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Google Gemini API key |

## Auth Flow
1. **Email signup** → `supabase.auth.signUp()` → DB trigger creates profile → redirect to `/onboarding/welcome`
2. **Google OAuth** → `supabase.auth.signInWithOAuth()` → redirect to Google → callback at `/auth/callback` → redirect to `/home`
3. **Login** → `supabase.auth.signInWithPassword()` → redirect to `/home`
4. **Session** → Managed by `AuthProvider` via `supabase.auth.onAuthStateChange()`

## Design System
- Theme: Dark cyber-noir neumorphism
- CSS custom properties defined in `:root`
- UI components: Card, Button, Input, Badge (all in `components/ui/`)
- Animations: `animate-fade-in`, `animate-scale-in`, `animate-lock-glow`

## Key Conventions
- All pages are `'use client'` components
- Supabase client is a singleton via `getSupabase()`
- Auth state provided through React context (`useAuth()`)
- Onboarding state managed by Zustand (`useOnboarding()`)
