'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'

export default function SettingsNotificationsPage() {
  const { profile } = useAuth()

  return (
    <div className="px-6 py-6 xl:px-8 xl:py-8">
      <Link href="/settings" className="mb-4 inline-block text-xs font-bold text-primary-fixed">
        ← Settings
      </Link>
      <h1 className="font-headline-md text-2xl font-semibold">Notifications</h1>
      <p className="mt-1 text-sm text-on-surface-variant">
        Frequency preference is stored on your profile. Push wiring is product backlog.
      </p>
      <div className="bento-card mt-6 max-w-md rounded-2xl p-6">
        <p className="font-label-caps text-[11px] text-on-surface-variant">CURRENT</p>
        <p className="mt-2 text-lg font-semibold capitalize">
          {profile?.notification_frequency || 'medium'}
        </p>
        <p className="mt-3 text-sm text-on-surface-variant">
          Change notification intensity during a full onboarding redesign or via future prefs API.
          In-app task and punishment notifications still write to the notifications table.
        </p>
      </div>
    </div>
  )
}
