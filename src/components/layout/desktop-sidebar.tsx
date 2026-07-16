'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { signOut } from '@/lib/supabase/auth'
import { DESKTOP_NAV, isNavActive } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'

/**
 * Left rail — Stitch home_dashboard__desktop_ aside (w-64).
 */
export function DesktopSidebar() {
  const pathname = usePathname()
  const { profile, user } = useAuth()

  const displayName =
    profile?.username?.trim() ||
    user?.email?.split('@')[0] ||
    'Operator'

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-dvh max-h-dvh w-64 flex-col overflow-hidden border-r border-white/5 bg-surface xl:flex">
      <div className="flex min-h-0 flex-1 flex-col px-6 py-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed">
            <Icon
              name="shield_with_heart"
              filled
              className="text-on-primary-fixed"
            />
          </div>
          <div>
            <h1 className="font-headline-md text-lg font-bold tracking-tighter text-on-surface">
              LOCKEDIN
            </h1>
            <p className="font-label-caps text-[10px] tracking-widest text-on-surface-variant opacity-60">
              DISCIPLINE. IDENTITY. FREEDOM.
            </p>
          </div>
        </div>

        <nav
          className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden pr-0.5"
          aria-label="Primary"
        >
          {DESKTOP_NAV.map((item) => {
            const active = isNavActive(pathname, item)
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                prefetch
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200',
                  active
                    ? 'scale-[0.98] border-l-4 border-primary-fixed bg-secondary-container font-bold text-primary-fixed'
                    : 'border-l-4 border-transparent text-on-surface-variant hover:bg-surface-variant hover:text-on-surface',
                )}
              >
                <Icon name={item.icon} filled={active} className="text-[22px]" />
                <span className="font-label-caps text-xs tracking-wide">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-white/5 p-4">
        <div className="mb-3 rounded-xl border border-white/5 bg-surface-container p-4">
          <h3 className="mb-1 font-headline-md text-sm text-primary-fixed">Focus Mode</h3>
          <p className="mb-3 text-[12px] text-on-surface-variant">Minimize distractions.</p>
          <button
            type="button"
            className="w-full rounded-lg bg-primary-fixed py-2 text-sm font-bold text-on-primary-fixed transition-all hover:brightness-110"
            onClick={() => {
              /* shell only — wire later */
            }}
          >
            Activate
          </button>
        </div>

        <div className="flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-surface-container text-sm font-bold text-primary-fixed">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-label-caps text-sm text-on-surface">{displayName}</p>
            <p className="text-[10px] text-on-surface-variant opacity-50">
              {profile?.tier ?? '—'}
              {profile?.xp_total != null ? ` · ${profile.xp_total} XP` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface"
            title="Sign out"
            aria-label="Sign out"
          >
            <Icon name="logout" className="text-[20px]" />
          </button>
        </div>
      </div>
    </aside>
  )
}
