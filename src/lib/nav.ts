/**
 * App navigation — mapped from Stitch home_dashboard HTML.
 *
 * Mobile-primary IA (product decision):
 * - Bottom pill stays exactly 5 slots (Stitch purity).
 * - Tasks / Companion / History / Calendar / Identity are hub-discovered
 *   (Home CTA, top bar, Settings “More”) — not extra nav slots.
 * - Regimens deferred from chrome.
 */

export type NavItem = {
  href: string
  label: string
  /** Material Symbols name → Lucide map in Icon */
  icon: string
  match?: string
  /** Short blurb for Settings hub cards */
  description?: string
}

/** Full left-rail list (desktop) — Stitch sidebar + Tasks */
export const DESKTOP_NAV: NavItem[] = [
  { href: '/home', label: 'Home', icon: 'home' },
  { href: '/ritual', label: 'Daily Ritual', icon: 'history_edu' },
  { href: '/tasks', label: 'Tasks', icon: 'task_alt' },
  { href: '/support', label: 'Support Mode', icon: 'shield_with_heart' },
  { href: '/memoir', label: 'Memoir', icon: 'book' },
  { href: '/chat', label: 'AI Companion', icon: 'psychology' },
  { href: '/achievements', label: 'Insights', icon: 'leaderboard' },
  { href: '/history', label: 'Progress', icon: 'trending_up' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar_today' },
  { href: '/settings/profile', label: 'Identity', icon: 'fingerprint', match: '/settings/profile' },
  { href: '/settings', label: 'Settings', icon: 'settings', match: '/settings' },
]

/**
 * Mobile bottom pill — exact 5 slots (do not expand):
 * Home · Rituals · Support · Memoir · Insights
 */
export const MOBILE_NAV: NavItem[] = [
  { href: '/home', label: 'Home', icon: 'home' },
  { href: '/ritual', label: 'Rituals', icon: 'rebase_edit' },
  { href: '/support', label: 'Support', icon: 'shield_with_heart' },
  { href: '/memoir', label: 'Memoir', icon: 'menu_book' },
  { href: '/achievements', label: 'Insights', icon: 'leaderboard' },
]

/**
 * Secondary destinations for mobile hub (Settings “More” + Home CTAs).
 * Keep regimens out until product re-enables them.
 */
export const MOBILE_HUB_LINKS: NavItem[] = [
  {
    href: '/tasks',
    label: 'Tasks & proof',
    icon: 'task_alt',
    description: 'Queue, deadlines, submit proof',
  },
  {
    href: '/chat',
    label: 'AI Companion',
    icon: 'psychology',
    description: 'Full chat with your Master',
  },
  {
    href: '/history',
    label: 'Progress',
    icon: 'trending_up',
    description: 'Session archives & exports',
  },
  {
    href: '/calendar',
    label: 'Calendar',
    icon: 'calendar_today',
    description: 'Lock days and history map',
  },
  {
    href: '/settings/profile',
    label: 'Identity',
    icon: 'fingerprint',
    match: '/settings/profile',
    description: 'Profile snapshot & stats',
  },
]

export function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/home') return pathname === '/home' || pathname === '/'
  if (item.href === '/settings') {
    if (pathname.startsWith('/settings/profile')) return false
    return pathname === '/settings' || pathname.startsWith('/settings/')
  }
  if (item.match) {
    return pathname === item.match || pathname.startsWith(item.match + '/')
  }
  return pathname === item.href || pathname.startsWith(item.href + '/')
}
