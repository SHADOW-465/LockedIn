'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { Icon } from '@/components/ui/icon'

/** Identity snapshot — edit core fields on main Settings. */
export default function SettingsProfilePage() {
  const { user, profile } = useAuth()

  return (
    <div className="px-6 py-6 xl:px-8 xl:py-8">
      <Link href="/settings" className="mb-4 inline-block text-xs font-bold text-primary-fixed">
        ← Settings
      </Link>
      <h1 className="font-headline-md text-2xl font-semibold">Identity</h1>
      <p className="mt-1 text-sm text-on-surface-variant">Read-only snapshot of your profile row.</p>

      <div className="bento-card mt-6 max-w-lg space-y-3 rounded-2xl p-6 text-sm">
        <Row label="Email" value={user?.email || '—'} />
        <Row label="Username" value={profile?.username || '—'} />
        <Row label="Tier" value={profile?.tier || '—'} />
        <Row label="Master" value={profile?.ai_personality || '—'} />
        <Row label="Safeword" value={profile?.safeword || 'MERCY'} />
        <Row label="Willpower" value={String(profile?.willpower_score ?? '—')} />
        <Row label="XP" value={String(profile?.xp_total ?? '—')} />
        <Row label="Streak" value={String(profile?.compliance_streak ?? '—')} />
        <Row
          label="Onboarding"
          value={profile?.onboarding_completed ? 'Complete' : 'Incomplete'}
        />
      </div>

      <Link
        href="/settings"
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-fixed px-5 py-2 text-xs font-bold text-on-primary-fixed"
      >
        <Icon name="edit" className="text-base" />
        Edit in Settings
      </Link>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-right font-medium text-on-surface">{value}</span>
    </div>
  )
}
