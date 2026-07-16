'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { DesktopSidebar } from './desktop-sidebar'
import { BottomNav } from './bottom-nav'
import { MobileTopBar } from './mobile-top-bar'
import { RightRail } from './right-rail'
import { DESKTOP_NAV, MOBILE_NAV } from '@/lib/nav'
import { cn } from '@/lib/utils'

/** Routes that show the desktop right utility rail (workbench density). */
const RIGHT_RAIL_PATHS = ['/home']

const PREFETCH_PATHS = Array.from(
  new Set([
    ...DESKTOP_NAV.map((n) => n.href),
    ...MOBILE_NAV.map((n) => n.href),
    '/regimens',
    '/support',
    '/history',
  ]),
)

/**
 * Stitch workbench shell.
 *
 * Scroll model (critical for wheel/trackpad):
 * - Outer frame is a FIXED viewport height (`h-dvh overflow-hidden`)
 * - Main canvas is the ONLY page scrollport (`h-full min-h-0 overflow-y-auto`)
 * - Never use `min-h-screen` + `overflow-y-auto` together — the box grows with
 *   content, never overflows, and wheel events get trapped with nowhere to go.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const showRightRail = RIGHT_RAIL_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )

  useEffect(() => {
    for (const href of PREFETCH_PATHS) {
      try {
        router.prefetch(href)
      } catch {
        /* ignore */
      }
    }
  }, [router])

  // Lock document scroll while dashboard is mounted — page scroll lives on <main>
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [])

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-background text-on-surface">
      <DesktopSidebar />
      <MobileTopBar />

      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1',
          'xl:ml-64',
        )}
      >
        <main
          id="app-scroll-main"
          className={cn(
            /* Single page scrollport — wheel/trackpad target for all dashboard routes */
            'custom-scrollbar flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden',
            /* mobile: top bar clearance; bottom room via spacer below */
            'pt-[4.5rem] xl:pt-0',
          )}
        >
          {/* flex-1 min-h-0 lets full-height pages (chat) fill the viewport */}
          <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>

          {/*
            Mobile-only scroll spacer so the last content clears the fixed
            floating pill (bottom-6 + bar height + home-indicator safe area).
            A real block in the scroll flow is more reliable than padding on a
            flex-1 child, which browsers often collapse.
          */}
          <div
            className="w-full shrink-0 xl:hidden"
            style={{
              height: 'calc(7.25rem + env(safe-area-inset-bottom, 0px))',
            }}
            aria-hidden
          />
        </main>

        {showRightRail && <RightRail />}
      </div>

      <BottomNav />
    </div>
  )
}
