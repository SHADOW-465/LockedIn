'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { Icon } from '@/components/ui/icon'

/**
 * Mobile top app bar — Stitch mobile home_dashboard header.
 * Avatar + LOCKEDIN-X brand · settings affordance. Hidden at xl.
 */
export function MobileTopBar() {
  const { profile, user } = useAuth()
  const displayName =
    profile?.username?.trim() ||
    user?.email?.split('@')[0] ||
    'Operator'
  const initial = displayName.slice(0, 1).toUpperCase()

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex w-full items-center justify-between border-b border-white/5 bg-surface/80 px-6 py-4 backdrop-blur-xl xl:hidden">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-primary-fixed-dim/20 bg-surface-container text-sm font-bold text-primary-fixed">
          {initial}
        </div>
        <span className="font-headline-md text-lg font-bold tracking-tighter text-primary-fixed-dim">
          LOCKEDIN
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Link
          href="/chat"
          className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          aria-label="Companion"
        >
          <Icon name="psychology" className="text-[22px]" />
        </Link>
        <Link
          href="/settings"
          className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          aria-label="Settings"
        >
          <Icon name="settings" className="text-[22px]" />
        </Link>
      </div>
    </header>
  )
}
