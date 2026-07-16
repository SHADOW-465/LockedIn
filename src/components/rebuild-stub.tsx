'use client'

/**
 * In-canvas placeholder for routes not yet redesigned.
 * Shell (nav / rail) is provided by AppShell — do not re-add chrome here.
 */
export function RebuildStub({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="px-6 py-8 xl:px-8 xl:py-6">
      <header className="mb-8 border-b border-white/5 pb-6">
        <p className="mb-2 font-label-caps text-[11px] tracking-widest text-on-surface-variant opacity-60">
          REBUILD PENDING
        </p>
        <h1 className="font-headline-md text-2xl font-semibold tracking-tight text-on-surface">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant">
            {description}
          </p>
        )}
      </header>

      <section className="max-w-xl rounded-2xl border border-white/5 bg-[#161B15] p-6">
        <p className="text-sm leading-relaxed text-on-surface-variant">
          This surface is intentionally empty. Use the shell to navigate; wire this page to
          Stitch designs and live APIs without reviving legacy chrome.
        </p>
      </section>
    </div>
  )
}
