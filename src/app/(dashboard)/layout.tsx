import { GuideFab } from '@/components/features/guide/guide-fab'
import { ThemeProvider } from '@/lib/contexts/theme-context'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      {children}
      <GuideFab />
    </ThemeProvider>
  )
}
