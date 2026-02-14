# ANTIGRAVITY BUILD PROMPT: LOCKEDIN APP
**Complete Production-Ready Implementation Guide**

> **CRITICAL**: This prompt is structured in phases to prevent context overload. Build sequentially, test each phase before proceeding to next.

---

## PHASE 0: PROJECT INITIALIZATION

### Task: Setup Next.js 14 + Firebase + Design System

**Action**: CREATE new Next.js 14 project with TypeScript, Tailwind CSS, and Firebase

**Directory Structure**:
```
lockedin/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (onboarding)/
│   │   ├── tier/
│   │   ├── personality/
│   │   ├── limits/
│   │   ├── profile/
│   │   └── review/
│   ├── (dashboard)/
│   │   ├── home/
│   │   ├── tasks/
│   │   ├── chat/
│   │   ├── calendar/
│   │   └── settings/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   └── bottom-nav.tsx
│   ├── layout/
│   │   ├── bento-grid.tsx
│   │   └── top-bar.tsx
│   └── features/
│       ├── timer/
│       ├── task-card/
│       ├── ai-chat/
│       └── calendar/
├── lib/
│   ├── firebase/
│   │   ├── config.ts
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   └── functions.ts
│   ├── ai/
│   │   ├── gemini.ts
│   │   └── prompts.ts
│   ├── utils/
│   └── types/
├── public/
├── styles/
│   └── globals.css
├── tailwind.config.ts
├── next.config.js
└── package.json
```

**Dependencies to Install**:
```bash
npm install firebase @google/generative-ai
npm install -D @types/node typescript
npm install tailwindcss-animate class-variance-authority clsx
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install date-fns zustand react-hook-form zod
```

**Tailwind Config** (`tailwind.config.ts`):
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0F1117',
          secondary: '#1E2129',
          tertiary: '#2A2D38',
          hover: '#333741',
        },
        text: {
          primary: '#F5F5F5',
          secondary: '#B0B3C1',
          tertiary: '#6E7280',
          disabled: '#4B5563',
        },
        red: {
          primary: '#D32F2F',
          hover: '#E53935',
          pressed: '#B71C1C',
        },
        purple: {
          primary: '#7C4DFF',
          hover: '#9575CD',
          pressed: '#5E35B1',
        },
        teal: {
          primary: '#26A69A',
          hover: '#4DB6AC',
          pressed: '#00897B',
        },
        tier: {
          newbie: '#4CAF50',
          slave: '#FF9800',
          hardcore: '#F44336',
          extreme: '#9C27B0',
          destruction: '#000000',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'raised': '6px 6px 12px rgba(0,0,0,0.4), -6px -6px 12px rgba(255,255,255,0.05)',
        'raised-hover': '8px 8px 16px rgba(0,0,0,0.4), -8px -8px 16px rgba(255,255,255,0.05)',
        'inset': 'inset 4px 4px 8px rgba(0,0,0,0.5), inset -4px -4px 8px rgba(255,255,255,0.03)',
        'glow-red': '0 0 20px rgba(211,47,47,0.3), 0 0 40px rgba(211,47,47,0.15)',
        'glow-purple': '0 0 20px rgba(124,77,255,0.3), 0 0 40px rgba(124,77,255,0.15)',
      },
      borderRadius: {
        'pill': '9999px',
      },
    },
  },
  plugins: [],
}
export default config
```

**Global CSS** (`styles/globals.css`):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-bg-primary text-text-primary font-sans;
  }
}

@layer utilities {
  .neumorphism-raised {
    @apply shadow-raised;
  }
  .neumorphism-inset {
    @apply shadow-inset;
  }
}
```

**Test Checklist**:
- [ ] Next.js 14 server starts successfully
- [ ] Tailwind compiles without errors
- [ ] Design tokens render correctly
- [ ] Dark theme applies by default

---

## PHASE 1: CORE UI COMPONENTS (Week 1)

### Task 1.1: Build Neumorphism Card Component

**File**: `components/ui/card.tsx`

```typescript
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const cardVariants = cva(
  'rounded-lg transition-all duration-300',
  {
    variants: {
      variant: {
        raised: 'bg-bg-secondary shadow-raised hover:shadow-raised-hover border border-white/5',
        inset: 'bg-bg-primary shadow-inset',
        flat: 'bg-bg-secondary shadow-sm',
        hero: 'bg-gradient-to-br from-bg-secondary to-bg-primary shadow-raised',
      },
      size: {
        sm: 'p-4 min-h-[100px]',
        md: 'p-6 min-h-[140px]',
        lg: 'p-8 min-h-[200px]',
      },
    },
    defaultVariants: {
      variant: 'raised',
      size: 'md',
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, size, ...props }: CardProps) {
  return (
    <div
      className={cn(cardVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

**Test**: Create `/app/test/page.tsx` to preview all card variants

### Task 1.2: Build Pill Button Component

**File**: `components/ui/button.tsx`

```typescript
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-pill font-semibold uppercase tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-red-primary text-white shadow-raised shadow-glow-red hover:bg-red-hover hover:shadow-raised-hover active:shadow-inset',
        secondary: 'bg-purple-primary text-white shadow-raised shadow-glow-purple hover:bg-purple-hover active:shadow-inset',
        ghost: 'bg-bg-secondary shadow-raised hover:shadow-raised-hover active:shadow-inset',
      },
      size: {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

### Task 1.3: Build Pill Badge Component

**File**: `components/ui/badge.tsx`

```typescript
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-pill font-bold uppercase tracking-wide shadow-inset text-xs',
  {
    variants: {
      variant: {
        tier1: 'bg-tier-newbie text-black px-3 py-1',
        tier2: 'bg-tier-slave text-black px-3 py-1',
        tier3: 'bg-tier-hardcore text-white px-3 py-1',
        tier4: 'bg-tier-extreme text-white px-3 py-1',
        tier5: 'bg-black text-red-primary border-2 border-red-primary shadow-glow-red px-3 py-1',
        locked: 'bg-red-primary text-white px-3 py-1',
        caged: 'bg-red-primary text-white px-2 py-1',
        uncaged: 'bg-teal-primary text-black px-2 py-1',
        genre: 'bg-bg-tertiary text-text-secondary border border-white/10 px-2 py-1',
      },
    },
    defaultVariants: {
      variant: 'genre',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, className }))} {...props} />
  )
}
```

### Task 1.4: Build Bento Grid Layout

**File**: `components/layout/bento-grid.tsx`

```typescript
import { cn } from '@/lib/utils'

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function BentoGrid({ className, children, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 p-4',
        'md:grid-cols-2 md:gap-5',
        'lg:grid-cols-3 lg:gap-5 lg:p-8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface BentoItemProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: 'hero' | 'wide' | 'tall' | 'default'
}

export function BentoItem({ className, span = 'default', ...props }: BentoItemProps) {
  const spanClasses = {
    hero: 'md:col-span-2 lg:row-span-2',
    wide: 'md:col-span-2',
    tall: 'lg:row-span-2',
    default: '',
  }

  return (
    <div
      className={cn(
        'bg-bg-secondary rounded-lg p-6 shadow-raised min-h-[120px]',
        spanClasses[span],
        className
      )}
      {...props}
    />
  )
}
```

### Task 1.5: Build Bottom Navigation (Mobile)

**File**: `components/layout/bottom-nav.tsx`

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ListTodo, MessageSquare, Calendar, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/tasks', icon: ListTodo, label: 'Tasks' },
  { href: '/chat', icon: MessageSquare, label: 'Chat' },
  { href: '/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-20 px-4 bg-bg-secondary/95 backdrop-blur-xl border-t border-white/5 shadow-[0_-4px_12px_rgba(0,0,0,0.3)] lg:hidden">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all',
              isActive
                ? 'text-purple-primary bg-bg-tertiary shadow-glow-purple'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            )}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

**Phase 1 Test Checklist**:
- [ ] All UI components render with neumorphism shadows
- [ ] Pill buttons show hover/active states
- [ ] Badges display all tier variants correctly
- [ ] Bento grid responsive on mobile/tablet/desktop
- [ ] Bottom nav highlights active route
- [ ] No console errors

---

## PHASE 2: FIREBASE SETUP & AUTHENTICATION (Week 1-2)

### Task 2.1: Firebase Configuration

**File**: `lib/firebase/config.ts`

```typescript
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)
const db = getFirestore(app)
const functions = getFunctions(app)
const storage = getStorage(app)

export { app, auth, db, functions, storage }
```

**Environment Variables** (`.env.local`):
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
```

### Task 2.2: Firestore Schema Setup

**File**: `lib/firebase/schema.ts`

```typescript
// TypeScript interfaces matching Firestore collections

export interface UserProfile {
  userId: string
  email: string
  username: string
  createdAt: Date
  tier: 'Newbie' | 'Slave' | 'Hardcore' | 'Extreme' | 'Destruction'
  aiPersonality: string
  willpowerScore: number
  complianceStreak: number
  totalSessions: number
  totalDenialHours: number
  totalEdges: number
  subscriptionTier: 'free' | 'silver' | 'gold' | 'platinum'
  lastReleaseDate: Date | null
}

export interface UserPreferences {
  hardLimits: string[]
  softLimits: string[]
  fetishTags: { tag: string; intensity: number }[]
  physicalDetails: {
    penisSize: {
      flaccidLength: number
      flaccidGirth: number
      erectLength: number
      erectGirth: number
      growerOrShower: 'grower' | 'shower'
    }
    bodyType: string
    age: number
    orientation: string
    gender: string
  }
  notificationFrequency: 'low' | 'medium' | 'high' | 'extreme'
  quietHours: { start: string; end: string } | null
}

export interface Session {
  sessionId: string
  userId: string
  status: 'active' | 'completed' | 'emergency' | 'failed'
  startTime: Date
  scheduledEndTime: Date
  actualEndTime: Date | null
  tier: UserProfile['tier']
  aiPersonality: string
  durationHours: number
  tasksCompleted: number
  violations: number
  punishmentsReceived: number
  willpowerChange: number
  xpEarned: number
}

export interface Task {
  taskId: string
  sessionId: string
  userId: string
  type: string
  genres: string[]
  title: string
  description: string
  difficulty: number
  durationMinutes: number
  assignedAt: Date
  deadline: Date
  completedAt: Date | null
  cageStatus: 'caged' | 'uncaged' | 'semi-caged'
  verification: {
    type: 'photo' | 'video' | 'audio' | 'self-report'
    requirement: string
  }
  punishmentOnFail: {
    type: string
    hours?: number
    additional?: string
  }
  status: 'pending' | 'active' | 'completed' | 'failed'
  userSubmission?: {
    photoUrl?: string
    selfReport?: string
  }
  aiVerificationResult?: {
    passed: boolean
    reason: string
  }
}

export interface ChatMessage {
  messageId: string
  sessionId: string
  userId: string
  sender: 'ai' | 'user'
  content: string
  timestamp: Date
  messageType: 'command' | 'question' | 'response' | 'punishment'
  embeddingId?: string
}

export interface Calendar {
  userId: string
  scheduledReleaseDate: Date
  adjustmentLog: {
    timestamp: Date
    hoursAdded?: number
    hoursSubtracted?: number
    reason: string
    aiControlled: boolean
  }[]
  milestoneDates: { date: Date; type: string; description: string }[]
  specialEvents: { date: Date; name: string; type: string }[]
}
```

### Task 2.3: Authentication Helpers

**File**: `lib/firebase/auth.ts`

```typescript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { auth, db } from './config'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { UserProfile } from './schema'

export async function signUp(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Create initial user profile in Firestore
    const userProfile: Partial<UserProfile> = {
      userId: user.uid,
      email: user.email!,
      username: email.split('@')[0],
      createdAt: new Date(),
      tier: 'Newbie',
      willpowerScore: 50,
      complianceStreak: 0,
      totalSessions: 0,
      totalDenialHours: 0,
      totalEdges: 0,
      subscriptionTier: 'free',
      lastReleaseDate: null,
    }

    await setDoc(doc(db, 'users', user.uid), userProfile)

    return { user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', userId)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile
  }
  return null
}
```

### Task 2.4: Auth Context Provider

**File**: `lib/contexts/auth-context.tsx`

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from 'firebase/auth'
import { onAuthStateChange, getUserProfile } from '@/lib/firebase/auth'
import { UserProfile } from '@/lib/firebase/schema'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const userProfile = await getUserProfile(firebaseUser.uid)
        setProfile(userProfile)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

**Phase 2 Test Checklist**:
- [ ] Firebase initialized successfully
- [ ] User can sign up with email/password
- [ ] User can sign in
- [ ] User profile created in Firestore
- [ ] Auth state persists across page reloads
- [ ] Sign out works correctly

---

## PHASE 3: ONBOARDING FLOW (Week 2-3)

### Task 3.1: Onboarding State Management

**File**: `lib/stores/onboarding-store.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
  step: number
  tier: string | null
  aiPersonality: string | null
  hardLimits: string[]
  softLimits: string[]
  fetishTags: { tag: string; intensity: number }[]
  physicalDetails: any
  profileAnswers: Record<string, string>
  lockGoal: number
  notificationFreq: string
  
  setStep: (step: number) => void
  setTier: (tier: string) => void
  setPersonality: (personality: string) => void
  setHardLimits: (limits: string[]) => void
  setSoftLimits: (limits: string[]) => void
  setFetishTags: (tags: { tag: string; intensity: number }[]) => void
  setPhysicalDetails: (details: any) => void
  addProfileAnswer: (question: string, answer: string) => void
  setLockGoal: (hours: number) => void
  setNotificationFreq: (freq: string) => void
  reset: () => void
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      step: 0,
      tier: null,
      aiPersonality: null,
      hardLimits: [],
      softLimits: [],
      fetishTags: [],
      physicalDetails: null,
      profileAnswers: {},
      lockGoal: 168, // 7 days default
      notificationFreq: 'medium',
      
      setStep: (step) => set({ step }),
      setTier: (tier) => set({ tier }),
      setPersonality: (aiPersonality) => set({ aiPersonality }),
      setHardLimits: (hardLimits) => set({ hardLimits }),
      setSoftLimits: (softLimits) => set({ softLimits }),
      setFetishTags: (fetishTags) => set({ fetishTags }),
      setPhysicalDetails: (physicalDetails) => set({ physicalDetails }),
      addProfileAnswer: (question, answer) =>
        set((state) => ({
          profileAnswers: { ...state.profileAnswers, [question]: answer },
        })),
      setLockGoal: (lockGoal) => set({ lockGoal }),
      setNotificationFreq: (notificationFreq) => set({ notificationFreq }),
      reset: () => set({
        step: 0,
        tier: null,
        aiPersonality: null,
        hardLimits: [],
        softLimits: [],
        fetishTags: [],
        physicalDetails: null,
        profileAnswers: {},
        lockGoal: 168,
        notificationFreq: 'medium',
      }),
    }),
    {
      name: 'onboarding-storage',
    }
  )
)
```

### Task 3.2: Welcome Screen

**File**: `app/(onboarding)/welcome/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function WelcomePage() {
  const router = useRouter()
  const [ageConfirmed, setAgeConfirmed] = useState(false)

  const handleContinue = () => {
    if (ageConfirmed) {
      router.push('/onboarding/tier')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-primary">
      <Card variant="hero" className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 font-mono">LockedIn</h1>
          <p className="text-text-secondary text-lg">
            Your 24/7 AI Master. You don't negotiate. You obey.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-text-secondary">
            Welcome to LockedIn, a hardcore AI-driven kink and chastity conditioning platform.
          </p>
          
          <div className="bg-red-primary/10 border border-red-primary/30 rounded-lg p-4">
            <p className="text-sm text-red-primary font-semibold mb-2">⚠️ WARNINGS:</p>
            <ul className="text-xs text-text-secondary space-y-1">
              <li>• This app contains explicit adult content</li>
              <li>• Designed for psychological conditioning and behavioral modification</li>
              <li>• AI will be cruel, degrading, and merciless based on your tier</li>
              <li>• You must be 18+ years old to proceed</li>
            </ul>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <span className="text-sm">I am 18+ years old and consent to explicit content</span>
          </label>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!ageConfirmed}
            onClick={handleContinue}
          >
            Continue to Onboarding
          </Button>
        </div>
      </Card>
    </div>
  )
}
```

### Task 3.3: Tier Selection Screen

**File**: `app/(onboarding)/tier/page.tsx`

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useOnboarding } from '@/lib/stores/onboarding-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const tiers = [
  {
    id: 'Newbie',
    name: 'TIER 1: NEWBIE',
    badge: 'tier1',
    description: 'Curious beginner exploring submission',
    punishments: 'Mild discomfort, +30min-2h time additions',
    tasks: '1-3 edges, light CEI, basic grooming',
    language: '"Good boy", "Try harder"',
  },
  {
    id: 'Slave',
    name: 'TIER 2: SLAVE',
    badge: 'tier2',
    description: 'Committed submissive seeking firm control',
    punishments: 'Moderate pain, +2-8h time additions',
    tasks: '5-10 edges, full CEI, CBT, anal plug',
    language: '"Slave", "Pathetic", "Worthless toy"',
  },
  {
    id: 'Hardcore',
    name: 'TIER 3: HARDCORE',
    badge: 'tier3',
    description: 'Extreme masochist craving intense suffering',
    punishments: 'Severe pain, +12-48h extensions',
    tasks: '20-50 edges, ballbusting, exposure humiliation',
    language: '"Worthless pig", "Filthy cum dumpster"',
  },
  {
    id: 'Extreme',
    name: 'TIER 4: EXTREME',
    badge: 'tier4',
    description: 'Total devotion, life-altering control',
    punishments: 'Brutal torture, indefinite lock extensions',
    tasks: '100+ edges/day, gooning marathons, TPE',
    language: '"Subhuman slave", "Broken fucktoy"',
  },
  {
    id: 'Destruction',
    name: 'TIER 5: DESTRUCTION',
    badge: 'tier5',
    description: 'Complete annihilation of self and identity',
    punishments: 'Absolutely merciless, identity destruction',
    tasks: '24/7 edge state, permanent modifications, mind obliteration',
    language: 'Addressed as "it", "thing", "object"',
    warning: 'This tier will destroy your sense of self. Only proceed if you accept permanent psychological changes.',
  },
]

export default function TierSelectionPage() {
  const router = useRouter()
  const { setTier, setStep } = useOnboarding()

  const handleSelect = (tierId: string) => {
    setTier(tierId)
    setStep(1)
    router.push('/onboarding/personality')
  }

  return (
    <div className="min-h-screen p-4 pb-20 bg-bg-primary">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose Your Tier</h1>
          <p className="text-text-secondary">
            Select your intensity level. This determines AI cruelty, punishment severity, and task difficulty.
          </p>
        </div>

        <div className="space-y-4">
          {tiers.map((tier) => (
            <Card
              key={tier.id}
              variant="raised"
              className="cursor-pointer hover:border-purple-primary/50 transition-all"
              onClick={() => handleSelect(tier.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                  <p className="text-text-secondary text-sm">{tier.description}</p>
                </div>
                <Badge variant={tier.badge as any}>{tier.id.toUpperCase()}</Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-text-tertiary">Punishments:</span>
                  <p className="text-text-secondary">{tier.punishments}</p>
                </div>
                <div>
                  <span className="text-text-tertiary">Typical Tasks:</span>
                  <p className="text-text-secondary">{tier.tasks}</p>
                </div>
                <div>
                  <span className="text-text-tertiary">Language:</span>
                  <p className="text-text-secondary">{tier.language}</p>
                </div>
              </div>

              {tier.warning && (
                <div className="mt-4 bg-red-primary/10 border border-red-primary/30 rounded-lg p-3">
                  <p className="text-xs text-red-primary">⚠️ {tier.warning}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Continue with remaining onboarding screens** (personality, limits, profile, review) following same pattern.

**Phase 3 Test Checklist**:
- [ ] All onboarding steps navigate correctly
- [ ] State persists between screens
- [ ] Final review shows all collected data
- [ ] "Lock In" button animation works
- [ ] Data saves to Firestore on completion

---

## PHASE 4: DASHBOARD & TIMER (Week 3-4)

### Task 4.1: Timer Component

**File**: `components/features/timer/timer-card.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface TimerCardProps {
  endTime: Date
  tier: string
  status: 'locked' | 'punishment' | 'lockdown'
}

export function TimerCard({ endTime, tier, status }: TimerCardProps) {
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const diff = endTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('00d 00h 00m 00s')
        clearInterval(interval)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining(
        `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [endTime])

  return (
    <Card
      variant="hero"
      className="relative overflow-hidden animate-pulse-slow"
      style={{
        animation: status === 'punishment' ? 'timer-pulse 2s infinite' : 'none',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <Badge variant="locked">🔒 LOCKED IN</Badge>
        <Badge variant={`tier${tier.toLowerCase()}` as any}>{tier.toUpperCase()}</Badge>
      </div>

      <div className="text-center">
        <div className="text-5xl md:text-6xl font-mono font-bold mb-4 text-red-primary drop-shadow-glow-red">
          {timeRemaining}
        </div>
        <p className="text-text-secondary">Time Remaining Until Release</p>
      </div>

      {status === 'punishment' && (
        <div className="mt-4 text-center">
          <Badge variant="locked" className="animate-pulse">
            PUNISHMENT MODE ACTIVE
          </Badge>
        </div>
      )}
    </Card>
  )
}
```

### Task 4.2: Dashboard Layout

**File**: `app/(dashboard)/home/page.tsx`

```typescript
'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { TimerCard } from '@/components/features/timer/timer-card'
import { BentoGrid, BentoItem } from '@/components/layout/bento-grid'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/layout/bottom-nav'

export default function DashboardPage() {
  const { profile } = useAuth()

  if (!profile) return <div>Loading...</div>

  // Mock data - replace with real Firestore data
  const mockEndTime = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // 4 days from now

  return (
    <>
      <div className="min-h-screen pb-24 lg:pb-8">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-bg-secondary/95 backdrop-blur-xl border-b border-white/5 px-4 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold font-mono">LockedIn</h1>
            <div className="flex items-center gap-4">
              <Badge variant={`tier${profile.tier.toLowerCase()}` as any}>
                {profile.tier.toUpperCase()}
              </Badge>
              <div className="w-10 h-10 rounded-full bg-purple-primary/20 flex items-center justify-center">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Bento Grid */}
        <BentoGrid>
          {/* Hero Timer */}
          <BentoItem span="hero">
            <TimerCard endTime={mockEndTime} tier={profile.tier} status="locked" />
          </BentoItem>

          {/* Willpower */}
          <BentoItem>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Willpower</h3>
              <div className="relative w-32 h-32 mx-auto">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-bg-tertiary"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 56}
                    strokeDashoffset={2 * Math.PI * 56 * (1 - profile.willpowerScore / 100)}
                    className="text-purple-primary"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{profile.willpowerScore}</span>
                </div>
              </div>
            </div>
          </BentoItem>

          {/* Current Task */}
          <BentoItem span="wide">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Current Task</h3>
                <div className="flex gap-2">
                  <Badge variant="genre">JOI</Badge>
                  <Badge variant="genre">CEI</Badge>
                  <Badge variant="genre">SPH</Badge>
                </div>
              </div>
              <p className="text-text-secondary">
                Edge 15 times slowly, then ruined orgasm. Consume all evidence.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="uncaged">🗝️ UNCAGED TASK</Badge>
                <span className="text-sm text-text-tertiary">Deadline: 2h 34m</span>
              </div>
              <Button variant="primary" className="w-full">
                Submit Proof
              </Button>
            </div>
          </BentoItem>

          {/* Streak */}
          <BentoItem>
            <div className="text-center">
              <div className="text-5xl mb-2">🔥</div>
              <div className="text-3xl font-bold mb-1">{profile.complianceStreak}</div>
              <div className="text-sm text-text-secondary">Day Streak</div>
            </div>
          </BentoItem>

          {/* Next Release */}
          <BentoItem>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text-tertiary">Next Release</h3>
              <div className="text-2xl font-bold">Feb 21</div>
              <p className="text-xs text-text-secondary">Based on current compliance</p>
            </div>
          </BentoItem>

          {/* Future Crime Prediction */}
          <BentoItem>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text-tertiary flex items-center gap-2">
                <span>⚠️</span> Future Crime
              </h3>
              <p className="text-sm text-red-primary">Late night check-in</p>
              <p className="text-xs text-text-tertiary">Predicted next violation</p>
            </div>
          </BentoItem>
        </BentoGrid>
      </div>

      <BottomNav />
    </>
  )
}
```

**Phase 4 Test Checklist**:
- [ ] Timer counts down accurately
- [ ] Bento grid responsive across breakpoints
- [ ] All cards render with neumorphism
- [ ] Timer pulses in punishment mode
- [ ] Dashboard data loads from Firestore

---

## PHASE 5: AI INTEGRATION (Week 4-5)

### Task 5.1: Gemini AI Setup

**File**: `lib/ai/gemini.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)

export async function generateTaskWithGemini(
  tier: string,
  fetishTags: string[],
  profile: any,
  aiPersonality: string
): Promise<any> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const prompt = `
You are the MASTER AI generating personalized kink tasks for your slave.

SLAVE PROFILE:
- Tier: ${tier}
- Fetishes: ${fetishTags.join(', ')}
- AI Personality: ${aiPersonality}
- Penis Size: ${profile.penisSize}
- Willpower: ${profile.willpower}/100

TASK GENERATION RULES:
1. Personalization: Use slave's profile data
2. Genre Mixing: Combine 2-4 genres from their fetishes
3. Difficulty Scaling: Match tier intensity (Newbie=simple, Destruction=brutal)
4. Language Style: Use ${aiPersonality} tone
5. Instructions Clarity: Be VERY specific with steps
6. Verification: Specify photo/video/audio requirements
7. Punishment Clause: State consequence for failure

OUTPUT FORMAT (JSON):
{
  "task_type": "multi_genre",
  "genres": ["JOI", "CEI", "SPH"],
  "title": "Task title",
  "description": "Step 1: ...\nStep 2: ...\n",
  "duration_minutes": 25,
  "difficulty": 3,
  "cage_status": "uncaged",
  "verification": {
    "type": "photo",
    "requirement": "Clean hand after CEI"
  },
  "punishment_on_fail": {
    "type": "time_add",
    "hours": 8,
    "additional": "40 ball slaps"
  }
}

Generate task now.
`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()
  
  // Extract JSON from response
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1])
  }
  
  return JSON.parse(text)
}

export async function generateAIChatResponse(
  userMessage: string,
  sessionContext: any,
  aiPersonality: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const prompt = `
You are the AI Master with personality: ${aiPersonality}

CONTEXT:
- Session: ${sessionContext.sessionId}
- Tier: ${sessionContext.tier}
- Current Status: ${sessionContext.status}

USER MESSAGE: "${userMessage}"

RULES:
- Respond in character as ${aiPersonality}
- Be cruel, degrading, and merciless
- If user is rude/demanding, punish them
- If requesting easier tasks, deny and amplify punishment
- If respectful request for harder task, approve
- Reference past failures if applicable

Generate response:
`

  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}
```

### Task 5.2: Cloud Function for Task Generation

**File**: `functions/src/index.ts` (Firebase Functions)

```typescript
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { GoogleGenerativeAI } from '@google/generative-ai'

admin.initializeApp()
const db = admin.firestore()

export const generateTask = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  const { sessionId, userId } = data

  // Fetch user profile
  const userDoc = await db.collection('users').doc(userId).get()
  const userProfile = userDoc.data()

  // Fetch session
  const sessionDoc = await db.collection('sessions').doc(sessionId).get()
  const session = sessionDoc.data()

  // Generate task using Gemini
  const genAI = new GoogleGenerativeAI(functions.config().gemini.key)
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  // ... (use same prompt logic as above)

  const result = await model.generateContent(prompt)
  const taskData = JSON.parse(result.response.text())

  // Save task to Firestore
  const taskRef = db.collection('tasks').doc()
  await taskRef.set({
    taskId: taskRef.id,
    sessionId,
    userId,
    ...taskData,
    assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'pending',
  })

  return { taskId: taskRef.id, task: taskData }
})

export const addLockTime = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  const { sessionId, hours, reason } = data
  const userId = context.auth.uid

  // Fetch current session
  const sessionRef = db.collection('sessions').doc(sessionId)
  const sessionDoc = await sessionRef.get()
  const session = sessionDoc.data()

  if (!session) {
    throw new functions.https.HttpsError('not-found', 'Session not found')
  }

  // Calculate new end time
  const currentEnd = session.scheduledEndTime.toDate()
  const newEnd = new Date(currentEnd.getTime() + hours * 60 * 60 * 1000)

  // Update session
  await sessionRef.update({
    scheduledEndTime: newEnd,
    adjustmentLog: admin.firestore.FieldValue.arrayUnion({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      type: 'ai_addition',
      hours: hours,
      reason: reason,
    }),
  })

  // Update calendar
  await db.collection('calendar').doc(userId).update({
    scheduledReleaseDate: newEnd,
    adjustmentLog: admin.firestore.FieldValue.arrayUnion({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      hoursAdded: hours,
      reason: reason,
      aiControlled: true,
    }),
  })

  // Send notification
  await admin.messaging().send({
    token: session.fcmToken,
    notification: {
      title: '⏱️ Lock Time Extended',
      body: `AI Master added ${hours} hours. Reason: ${reason}`,
    },
  })

  return { success: true, newEndTime: newEnd }
})
```

**Phase 5 Test Checklist**:
- [ ] Gemini API returns valid task JSON
- [ ] Cloud functions deploy successfully
- [ ] Task generation works end-to-end
- [ ] Lock time auto-adjusts from AI commands
- [ ] AI chat responds in character

---

## PHASE 6: TASKS & VERIFICATION (Week 5-6)

### Task 6.1: Task List Component

**File**: `app/(dashboard)/tasks/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Task } from '@/lib/firebase/schema'
import { BottomNav } from '@/components/layout/bottom-nav'

export default function TasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      where('status', 'in', ['pending', 'active'])
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        assignedAt: doc.data().assignedAt?.toDate(),
        deadline: doc.data().deadline?.toDate(),
      })) as Task[]
      setTasks(tasksData)
    })

    return unsubscribe
  }, [user])

  return (
    <>
      <div className="min-h-screen pb-24 lg:pb-8 p-4">
        <h1 className="text-3xl font-bold mb-6">Tasks</h1>

        <div className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.taskId} variant="raised" className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{task.title}</h3>
                  <div className="flex gap-2 mb-3">
                    {task.genres.map((genre) => (
                      <Badge key={genre} variant="genre">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Badge
                  variant={
                    task.cageStatus === 'caged'
                      ? 'caged'
                      : task.cageStatus === 'uncaged'
                      ? 'uncaged'
                      : 'genre'
                  }
                >
                  {task.cageStatus.toUpperCase()}
                </Badge>
              </div>

              <p className="text-text-secondary whitespace-pre-line">{task.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="text-sm text-text-tertiary">
                  Deadline: {task.deadline ? formatDistanceToNow(task.deadline, { addSuffix: true }) : 'No deadline'}
                </div>
                <Button variant="primary" size="sm">
                  Start Task
                </Button>
              </div>

              {task.punishmentOnFail && (
                <div className="bg-red-primary/10 border border-red-primary/30 rounded-lg p-3">
                  <p className="text-xs text-red-primary">
                    ⚠️ Failure: {task.punishmentOnFail.type === 'time_add' && `+${task.punishmentOnFail.hours}h`}
                    {task.punishmentOnFail.additional && ` + ${task.punishmentOnFail.additional}`}
                  </p>
                </div>
              )}
            </Card>
          ))}

          {tasks.length === 0 && (
            <Card variant="flat" className="text-center py-12">
              <p className="text-text-secondary">No active tasks. AI Master will assign soon.</p>
            </Card>
          )}
        </div>
      </div>

      <BottomNav />
    </>
  )
}
```

### Task 6.2: Image Verification with Gemini Vision

**File**: `lib/ai/vision-verification.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)

export async function verifyTaskPhoto(
  imageBase64: string,
  taskRequirement: string,
  cageStatus: 'caged' | 'uncaged'
): Promise<{ passed: boolean; reason: string }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' })

  const prompt = `
VERIFICATION TASK:
- Requirement: ${taskRequirement}
- Expected cage status: ${cageStatus}

Analyze this image and verify:
1. Is the requirement met? (e.g., device visible and locked/unlocked as expected)
2. Is there evidence of completion?
3. Any signs of cheating or old photos?

Respond in JSON format:
{
  "passed": true/false,
  "reason": "Detailed explanation"
}
`

  const image = {
    inlineData: {
      data: imageBase64,
      mimeType: 'image/jpeg',
    },
  }

  const result = await model.generateContent([prompt, image])
  const response = await result.response
  const text = response.text()

  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1])
  }

  return JSON.parse(text)
}
```

**Phase 6 Test Checklist**:
- [ ] Tasks list displays from Firestore
- [ ] Real-time updates when new tasks added
- [ ] Photo upload works
- [ ] Gemini Vision analyzes verification photos
- [ ] Pass/fail logic updates task status

---

## PHASE 7: CHAT INTERFACE (Week 6-7)

### Task 7.1: AI Chat Component

**File**: `app/(dashboard)/chat/page.tsx`

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/layout/bottom-nav'
import { generateAIChatResponse } from '@/lib/ai/gemini'
import { Send } from 'lucide-react'

export default function ChatPage() {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return

    // Get active session
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      where('status', '==', 'active')
    )

    const unsubscribe = onSnapshot(sessionsQuery, (sessionsSnapshot) => {
      if (sessionsSnapshot.empty) return

      const activeSession = sessionsSnapshot.docs[0]
      const sessionId = activeSession.id

      // Listen to messages for this session
      const messagesQuery = query(
        collection(db, 'chat_messages'),
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'asc')
      )

      const messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => ({
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
        }))
        setMessages(messagesData)
        scrollToBottom()
      })

      return messagesUnsubscribe
    })

    return unsubscribe
  }, [user])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!inputValue.trim() || !user || !profile) return

    setIsLoading(true)

    try {
      // Get active session
      const sessionsSnapshot = await getDocs(
        query(collection(db, 'sessions'), where('userId', '==', user.uid), where('status', '==', 'active'))
      )

      if (sessionsSnapshot.empty) {
        alert('No active session')
        return
      }

      const sessionId = sessionsSnapshot.docs[0].id
      const sessionData = sessionsSnapshot.docs[0].data()

      // Save user message
      await addDoc(collection(db, 'chat_messages'), {
        sessionId,
        userId: user.uid,
        sender: 'user',
        content: inputValue,
        timestamp: new Date(),
        messageType: 'response',
      })

      // Generate AI response
      const aiResponse = await generateAIChatResponse(inputValue, sessionData, profile.aiPersonality)

      // Save AI message
      await addDoc(collection(db, 'chat_messages'), {
        sessionId,
        userId: user.uid,
        sender: 'ai',
        content: aiResponse,
        timestamp: new Date(),
        messageType: 'command',
      })

      setInputValue('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen pb-24 lg:pb-8 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-bg-secondary/95 backdrop-blur-xl border-b border-white/5 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{profile?.aiPersonality || 'AI Master'}</h1>
              <p className="text-sm text-text-tertiary">Tier {profile?.tier}</p>
            </div>
            <Badge variant={`tier${profile?.tier.toLowerCase()}` as any}>ACTIVE</Badge>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] ${
                  message.sender === 'ai'
                    ? 'bg-purple-primary/20 border border-purple-primary/30'
                    : 'bg-bg-tertiary'
                } rounded-2xl px-4 py-3`}
              >
                <p className="text-sm whitespace-pre-line">{message.content}</p>
                <span className="text-xs text-text-tertiary mt-1 block">
                  {message.timestamp?.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-20 lg:bottom-0 p-4 bg-bg-primary border-t border-white/5">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              placeholder="Address Master respectfully..."
              className="flex-1 bg-bg-secondary rounded-pill px-4 py-3 shadow-inset focus:outline-none focus:border-purple-primary"
              disabled={isLoading}
            />
            <Button
              variant="primary"
              size="md"
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="!rounded-full w-12 h-12 p-0"
            >
              <Send size={20} />
            </Button>
          </div>
          <p className="text-xs text-text-tertiary mt-2 text-center">
            Rudeness or disrespect will be punished
          </p>
        </div>
      </div>

      <BottomNav />
    </>
  )
}
```

**Phase 7 Test Checklist**:
- [ ] Messages display in real-time
- [ ] User can send messages
- [ ] AI responds in character
- [ ] Chat scrolls to bottom on new messages
- [ ] Rude messages trigger punishment (test manually)

---

## PHASE 8: CALENDAR & NOTIFICATIONS (Week 7-8)

### Task 8.1: Calendar View

**File**: `app/(dashboard)/calendar/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Calendar as CalendarType } from '@/lib/firebase/schema'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'

export default function CalendarPage() {
  const { user } = useAuth()
  const [calendar, setCalendar] = useState<CalendarType | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  useEffect(() => {
    if (!user) return

    const unsubscribe = onSnapshot(doc(db, 'calendar', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        setCalendar({
          ...data,
          scheduledReleaseDate: data.scheduledReleaseDate?.toDate(),
          adjustmentLog: data.adjustmentLog?.map((log: any) => ({
            ...log,
            timestamp: log.timestamp?.toDate(),
          })),
        } as CalendarType)
      }
    })

    return unsubscribe
  }, [user])

  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  return (
    <>
      <div className="min-h-screen pb-24 lg:pb-8 p-4">
        <h1 className="text-3xl font-bold mb-6">Calendar</h1>

        {/* Scheduled Release */}
        <Card variant="hero" className="mb-6">
          <div className="text-center">
            <p className="text-sm text-text-tertiary mb-2">Scheduled Release Date</p>
            <div className="text-4xl font-bold font-mono mb-2">
              {calendar?.scheduledReleaseDate
                ? format(calendar.scheduledReleaseDate, 'MMM dd, yyyy')
                : 'Not set'}
            </div>
            <Badge variant="locked">Subject to change based on performance</Badge>
          </div>
        </Card>

        {/* Month Grid */}
        <Card variant="raised" className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs text-text-tertiary font-semibold">
                {day}
              </div>
            ))}
            {daysInMonth.map((day) => {
              const isReleaseDay =
                calendar?.scheduledReleaseDate && isSameDay(day, calendar.scheduledReleaseDate)
              const isToday = isSameDay(day, new Date())

              return (
                <div
                  key={day.toString()}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm ${
                    isToday ? 'bg-purple-primary text-white font-bold' : ''
                  } ${isReleaseDay ? 'bg-red-primary text-white font-bold' : ''} ${
                    !isToday && !isReleaseDay ? 'text-text-secondary' : ''
                  }`}
                >
                  {format(day, 'd')}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Adjustment Log */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Recent Adjustments</h2>
          <div className="space-y-2">
            {calendar?.adjustmentLog?.slice(-5).reverse().map((log, index) => (
              <Card key={index} variant="flat" size="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">
                      {log.hoursAdded && `+${log.hoursAdded}h`}
                      {log.hoursSubtracted && `-${log.hoursSubtracted}h`}
                    </p>
                    <p className="text-xs text-text-tertiary">{log.reason}</p>
                  </div>
                  <Badge variant={log.aiControlled ? 'locked' : 'genre'}>
                    {log.aiControlled ? 'AI' : 'Manual'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </>
  )
}
```

### Task 8.2: Push Notifications Setup

**File**: `lib/firebase/messaging.ts`

```typescript
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { app } from './config'

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const messaging = getMessaging(app)
    const permission = await Notification.requestPermission()

    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      })
      return token
    }

    return null
  } catch (error) {
    console.error('Error getting notification permission:', error)
    return null
  }
}

export function onMessageListener() {
  const messaging = getMessaging(app)

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload)
    })
  })
}
```

**Cloud Function for Scheduled Notifications**:

```typescript
export const sendScheduledNotification = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const now = new Date()

    // Find users with active sessions
    const sessionsSnapshot = await db
      .collection('sessions')
      .where('status', '==', 'active')
      .get()

    for (const sessionDoc of sessionsSnapshot.docs) {
      const session = sessionDoc.data()
      const userDoc = await db.collection('users').doc(session.userId).get()
      const user = userDoc.data()

      // Determine if notification should be sent based on tier and frequency
      const shouldSend = Math.random() < 0.3 // 30% chance per hour

      if (shouldSend && user?.fcmToken) {
        await admin.messaging().send({
          token: user.fcmToken,
          notification: {
            title: '⏰ Check-In Required',
            body: 'Your Master requires immediate attention. Respond within 5 minutes.',
          },
          data: {
            type: 'check-in',
            sessionId: sessionDoc.id,
          },
        })
      }
    }

    return null
  })
```

**Phase 8 Test Checklist**:
- [ ] Calendar displays scheduled release date
- [ ] Adjustment log shows recent changes
- [ ] Push notifications permission requested
- [ ] Notifications received on mobile
- [ ] Cloud function sends scheduled notifications

---

## PHASE 9: SETTINGS & POLISH (Week 8-9)

### Task 9.1: Settings Page

**File**: `app/(dashboard)/settings/page.tsx`

```typescript
'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { signOut } from '@/lib/firebase/auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ChevronRight, Bell, Shield, HelpCircle, MessageSquare, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { profile } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const settingsItems = [
    { icon: Bell, label: 'Notifications', href: '/settings/notifications' },
    { icon: Shield, label: 'Hard Limits', href: '/settings/limits' },
    { icon: HelpCircle, label: 'Help & Support', href: '/settings/help' },
    { icon: MessageSquare, label: 'Suggestions', href: '/settings/suggestions' },
  ]

  return (
    <>
      <div className="min-h-screen pb-24 lg:pb-8 p-4">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        {/* Profile Card */}
        <Card variant="hero" className="mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-primary/20 flex items-center justify-center text-2xl">
              {profile?.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{profile?.username}</h2>
              <p className="text-sm text-text-secondary">{profile?.email}</p>
            </div>
            <Badge variant={`tier${profile?.tier.toLowerCase()}` as any}>
              {profile?.tier.toUpperCase()}
            </Badge>
          </div>
        </Card>

        {/* Subscription */}
        <Card variant="raised" className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Subscription</h3>
              <p className="text-sm text-text-tertiary">{profile?.subscriptionTier.toUpperCase()} Tier</p>
            </div>
            <Button variant="secondary" size="sm">
              Upgrade
            </Button>
          </div>
        </Card>

        {/* Settings List */}
        <div className="space-y-2">
          {settingsItems.map((item) => {
            const Icon = item.icon
            return (
              <Card
                key={item.href}
                variant="flat"
                className="cursor-pointer hover:bg-bg-tertiary transition-colors"
                onClick={() => router.push(item.href)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon size={20} className="text-text-tertiary" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronRight size={20} className="text-text-tertiary" />
                </div>
              </Card>
            )
          })}

          <Card
            variant="flat"
            className="cursor-pointer hover:bg-red-primary/10 transition-colors border-red-primary/30"
            onClick={handleSignOut}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LogOut size={20} className="text-red-primary" />
                <span className="font-medium text-red-primary">Sign Out</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />
    </>
  )
}
```

**Phase 9 Test Checklist**:
- [ ] Settings page displays user profile
- [ ] All navigation links work
- [ ] Sign out works and redirects to login
- [ ] Settings persist across sessions

---

## PHASE 10: PRODUCTION DEPLOYMENT (Week 9-10)

### Task 10.1: Environment Variables

**Production `.env.production`**:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lockedin-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lockedin-prod
# ... rest of production config
```

### Task 10.2: Build & Deploy

```bash
# Build Next.js
npm run build

# Deploy Firebase Functions
firebase deploy --only functions

# Deploy Firebase Hosting
firebase deploy --only hosting

# Deploy to Vercel (alternative)
vercel --prod
```

### Task 10.3: Firestore Security Rules

**File**: `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }

    match /tasks/{taskId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }

    match /chat_messages/{messageId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }

    match /calendar/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Task 10.4: Performance Optimization

- [ ] Enable Next.js image optimization
- [ ] Add PWA manifest and service worker
- [ ] Implement lazy loading for heavy components
- [ ] Add Firestore query indexes
- [ ] Enable Firebase caching
- [ ] Compress images
- [ ] Minify CSS/JS

**Phase 10 Test Checklist**:
- [ ] Production build completes successfully
- [ ] App loads on production URL
- [ ] All features work in production
- [ ] Lighthouse score: Performance 90+, Accessibility 95+
- [ ] PWA installable on mobile
- [ ] Push notifications work in production

---

## FINAL TESTING CHECKLIST

### Functionality
- [ ] User can sign up and complete onboarding
- [ ] Dashboard displays all data correctly
- [ ] Timer counts down accurately
- [ ] AI generates personalized tasks
- [ ] Tasks can be completed and verified
- [ ] Chat with AI works in real-time
- [ ] Calendar shows scheduled release
- [ ] Notifications deliver on time
- [ ] Settings save correctly
- [ ] Emergency release works

### UI/UX
- [ ] Neumorphism shadows render correctly
- [ ] Pill buttons have proper hover/active states
- [ ] Bento grid responsive on all breakpoints
- [ ] Bottom nav highlights active route
- [ ] Animations smooth at 60fps
- [ ] Dark theme consistent throughout
- [ ] Typography scales properly
- [ ] Loading states display correctly

### Security
- [ ] Firebase auth working
- [ ] Firestore rules enforced
- [ ] API keys secured
- [ ] User data isolated
- [ ] Hard limits respected
- [ ] Emergency release always available

### Performance
- [ ] Initial load <3 seconds
- [ ] Time to interactive <5 seconds
- [ ] Lighthouse score >90
- [ ] No memory leaks
- [ ] Efficient Firestore queries
- [ ] Images optimized

---

## DEPLOYMENT COMMAND

**Single command to build and deploy**:

```bash
# Install dependencies
npm install

# Build Next.js
npm run build

# Deploy Firebase (Functions + Hosting)
firebase deploy

# Or deploy to Vercel
vercel --prod
```

---

## MAINTENANCE & MONITORING

### Post-Launch Tasks
1. Monitor Firebase usage and costs
2. Set up error tracking (Sentry)
3. Monitor AI API usage
4. Collect user feedback
5. Fix bugs reported in production
6. Implement additional features from Phase 11+

### Analytics Setup
- Google Analytics 4
- Firebase Analytics
- Custom events for key actions (task completed, session started, etc.)

---

**END OF ANTIGRAVITY BUILD PROMPT**

This prompt provides complete, phase-by-phase implementation guidance for building LockedIn. Each phase is self-contained and testable before proceeding to the next.
