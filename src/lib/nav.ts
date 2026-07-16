/**
 * App navigation — mapped from Stitch home_dashboard HTML.
 * Desktop rail vs mobile pill use different IA (Stitch product DNA).
 */

export type NavItem = {
  href: string
  label: string
  /** Material Symbols name → Lucide map in Icon */
  icon: string
  match?: string
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
 * Mobile bottom pill — Stitch mobile home Navigation Shell (exact 5 slots):
 * Home · Rituals · Support · Memoir · Insights
 * Tasks/Companion reachable from Home actions.
 */
export const MOBILE_NAV: NavItem[] = [
  { href: '/home', label: 'Home', icon: 'home' },
  { href: '/ritual', label: 'Rituals', icon: 'rebase_edit' },
  { href: '/support', label: 'Support', icon: 'shield_with_heart' },
  { href: '/memoir', label: 'Memoir', icon: 'menu_book' },
  { href: '/achievements', label: 'Insights', icon: 'leaderboard' },
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
