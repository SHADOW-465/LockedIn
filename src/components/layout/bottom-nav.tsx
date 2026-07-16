'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MOBILE_NAV, isNavActive } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'

/**
 * Mobile bottom pill — Stitch home Navigation Shell.
 * Floating frosted capsule, lime active disc. Hidden at xl.
 *
 * Position: one clear inset from the physical bottom — do not stack
 * both marginBottom and paddingBottom with the same safe-area value
 * (that double-counts the home indicator and mis-sizes clearance).
 */
export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'fixed left-4 right-4 z-50 mx-auto flex max-w-md items-center justify-around',
        'rounded-full border border-white/10 bg-surface-container/70 px-2 py-2',
        'shadow-2xl shadow-primary-fixed-dim/10 backdrop-blur-2xl',
        'xl:hidden',
      )}
      style={{
        bottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
      }}
      aria-label="Primary"
    >
      {MOBILE_NAV.map((item) => {
        const active = isNavActive(pathname, item)
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-12 min-w-12 flex-col items-center justify-center rounded-full p-3 transition-all duration-200',
              active
                ? 'bg-primary-fixed text-on-primary-fixed shadow-[0_0_18px_rgba(171,214,0,0.35)]'
                : 'text-on-surface-variant active:scale-95',
            )}
          >
            <Icon name={item.icon} filled={active} className="text-[24px]" />
          </Link>
        )
      })}
    </nav>
  )
}
