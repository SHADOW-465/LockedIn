/**
 * Instant feedback while a dashboard route segment loads.
 * Shell (sidebar/nav) stays mounted — only the main canvas shows this.
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-4 px-6 py-8 xl:px-8">
      <div className="h-3 w-24 rounded bg-surface-container-high" />
      <div className="h-8 w-48 rounded-lg bg-surface-container-high" />
      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-surface-container" />
        ))}
      </div>
      <div className="mt-4 h-40 rounded-2xl bg-surface-container" />
    </div>
  )
}
