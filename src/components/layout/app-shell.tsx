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
 * - Main canvas is the ONLY page scrollport (`overflow-y-auto`)
 * - Content must grow with its children (no flex-1 min-h-0 wrapper that
 *   pins height) or long pages clip under the fixed bottom nav with no
 *   way to scroll past them.
 * - Mobile bottom inset is padding on the scrollport so the last pixels
 *   clear the floating pill + home-indicator safe area.
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
            'custom-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden',
            /*
              Mobile chrome clearance:
              - top: fixed MobileTopBar (~4.5rem)
              - bottom: floating pill (~bottom-6 + bar ~3.5–4rem + safe area)
                Use generous inset so last CTAs clear the nav on tall phones.
            */
            'pt-[4.5rem] pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))]',
            'xl:pt-0 xl:pb-0',
          )}
        >
          {/*
            min-h-full: short pages (chat) can still fill the viewport.
            NO flex-1 / min-h-0 here — those pin the box height and prevent
            long page content from expanding scrollHeight, which is why items
            sat under the bottom nav with no scroll room.
          */}
          <div className="flex min-h-full w-full flex-col">{children}</div>
        </main>

        {showRightRail && <RightRail />}
      </div>

      <BottomNav />
    </div>
  )
}
