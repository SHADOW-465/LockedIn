import { GuideFab } from '@/components/features/guide/guide-fab'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <GuideFab />
    </>
  )
}
