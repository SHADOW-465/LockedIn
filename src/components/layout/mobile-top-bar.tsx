'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

/**
 * Mobile top app bar — Stitch header.
 * Avatar → Identity · Companion (primary entry) · Settings.
 * Hidden at xl (desktop uses left rail).
 */
export function MobileTopBar() {
  const pathname = usePathname()
  const { profile, user } = useAuth()
  const displayName =
    profile?.username?.trim() ||
    user?.email?.split('@')[0] ||
    'Operator'
  const initial = displayName.slice(0, 1).toUpperCase()
  const companionActive = pathname === '/chat' || pathname.startsWith('/chat/')

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex w-full items-center justify-between border-b border-white/5 bg-surface/80 px-6 py-4 backdrop-blur-xl xl:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/settings/profile"
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary-fixed-dim/20 bg-surface-container text-sm font-bold text-primary-fixed transition active:scale-95"
          aria-label="Identity profile"
          title="Identity"
        >
          {initial}
        </Link>
        <span className="font-headline-md truncate text-lg font-bold tracking-tighter text-primary-fixed-dim">
          LOCKEDIN
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Link
          href="/chat"
          className={cn(
            'flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-2.5 transition-colors',
            companionActive
              ? 'bg-primary-fixed/15 text-primary-fixed'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
          )}
          aria-label="AI Companion"
          aria-current={companionActive ? 'page' : undefined}
          title="Companion"
        >
          <Icon name="psychology" className="text-[22px]" />
          <span className="font-label-caps text-[9px] font-bold tracking-wide">AI</span>
        </Link>
        <Link
          href="/settings"
          className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          aria-label="Settings"
          title="Settings"
        >
          <Icon name="settings" className="text-[22px]" />
        </Link>
      </div>
    </header>
  )
}
