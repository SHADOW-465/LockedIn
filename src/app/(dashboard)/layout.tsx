import { AppShell } from '@/components/layout/app-shell'

/**
 * Dashboard chrome — Stitch workbench shell.
 * Auth is handled by root RouteGuard; do not add guards here.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
