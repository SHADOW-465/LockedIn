'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

type MemoirPageRow = {
  id: string
  page_date: string
  day_number?: number
  morning_completed?: boolean
  evening_completed?: boolean
  mood?: string
  intention?: string
  journal_text?: string
  ai_narration?: string
  difficulty_level?: number
}

type Chapter = {
  id: string
  title: string
  start_date: string
  pages?: MemoirPageRow[]
}

/**
 * Memoir library — Stitch mobile library cards + desktop chapter list.
 * Data from GET /api/memoir/chapters.
 */
export default function MemoirPage() {
  const { user } = useAuth()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    fetch(`/api/memoir/chapters?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
          return
        }
        const list = (data.chapters || []) as Chapter[]
        setChapters(list)
        if (list[0]?.id) setOpenId(list[0].id)
      })
      .catch(() => setError('Failed to load memoir'))
      .finally(() => setLoading(false))
  }, [user?.id])

  const filtered = chapters.filter((ch) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      ch.title.toLowerCase().includes(q) ||
      (ch.pages || []).some(
        (p) =>
          p.intention?.toLowerCase().includes(q) ||
          p.journal_text?.toLowerCase().includes(q) ||
          p.ai_narration?.toLowerCase().includes(q),
      )
    )
  })

  return (
    <div className="px-6 pb-8 pt-2 xl:px-8 xl:py-8">
      <header className="mb-6">
        <p className="font-label-caps text-[10px] tracking-widest text-primary-fixed">LIBRARY</p>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface xl:font-headline-md xl:font-semibold">
          Memoir Library
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          A legacy of discipline, page by page.
        </p>
      </header>

      <div className="relative mb-6">
        <Icon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-60"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chronicles…"
          className="w-full rounded-full border-none bg-surface-container-high py-3 pl-11 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary-fixed"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/ritual"
          className="min-h-11 rounded-full bg-primary-fixed px-5 py-2 text-xs font-bold text-on-primary-fixed"
        >
          Write today&apos;s ritual
        </Link>
        <Link
          href="/history"
          className="min-h-11 rounded-full border border-white/10 px-5 py-2 text-xs font-bold"
        >
          Session history
        </Link>
      </div>

      {loading && <p className="text-sm text-on-surface-variant">Loading chapters…</p>}
      {error && <p className="text-sm text-error">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <div className="glass-card rounded-3xl p-8">
          <Icon name="menu_book" className="mb-3 text-3xl text-on-surface-variant opacity-40" />
          <p className="text-sm text-on-surface-variant">
            No chapters yet. Complete a morning or evening ritual — pages appear here even
            without an active lock session.
          </p>
          <Link
            href="/ritual"
            className="mt-4 inline-flex text-xs font-bold text-primary-fixed"
          >
            Go to ritual →
          </Link>
        </div>
      )}

      {/* Mobile: volume cards (Stitch library) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:hidden">
        {filtered.map((ch, i) => {
          const pages = ch.pages || []
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => setOpenId(openId === ch.id ? null : ch.id)}
              className="group text-left"
            >
              <div className="relative flex aspect-[3/4] flex-col overflow-hidden rounded-xl border border-white/5 bg-surface-container-high p-6 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/10 via-transparent to-background/80" />
                <div className="absolute left-0 top-0 bottom-0 z-10 w-1.5 bg-black/40" />
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div>
                    <span className="mb-2 block font-label-caps text-[10px] text-primary-fixed">
                      Volume {roman(i + 1)}
                    </span>
                    <h3 className="text-2xl font-bold leading-tight text-on-surface group-active:text-primary-fixed">
                      {ch.title}
                    </h3>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="font-mono-data text-[10px] uppercase tracking-widest text-on-surface-variant">
                      {ch.start_date}
                      <br />
                      {pages.length} page{pages.length === 1 ? '' : 's'}
                    </div>
                    <div className="rounded-lg bg-primary-fixed p-2 text-on-primary-fixed">
                      <Icon name={openId === ch.id ? 'expand_less' : 'expand_more'} className="text-sm" />
                    </div>
                  </div>
                </div>
              </div>
              {openId === ch.id && (
                <div className="mt-3 space-y-2">
                  {pages.length === 0 && (
                    <p className="text-xs text-on-surface-variant">No pages in this volume yet.</p>
                  )}
                  {pages.map((p) => (
                    <PageCard key={p.id} page={p} />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Desktop accordion */}
      <ul className="hidden space-y-4 xl:block">
        {filtered.map((ch) => {
          const open = openId === ch.id
          const pages = ch.pages || []
          return (
            <li key={ch.id} className="bento-card overflow-hidden rounded-2xl">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : ch.id)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <div>
                  <h2 className="text-lg font-semibold text-on-surface">{ch.title}</h2>
                  <p className="font-mono-data text-[11px] text-on-surface-variant opacity-60">
                    From {ch.start_date} · {pages.length} page{pages.length === 1 ? '' : 's'}
                  </p>
                </div>
                <Icon
                  name={open ? 'expand_less' : 'expand_more'}
                  className="text-on-surface-variant"
                />
              </button>
              {open && (
                <div className="space-y-3 border-t border-white/5 px-5 pb-5 pt-3">
                  {pages.length === 0 && (
                    <p className="text-sm text-on-surface-variant">No pages in this chapter yet.</p>
                  )}
                  {pages.map((p) => (
                    <PageCard key={p.id} page={p} />
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function PageCard({ page: p }: { page: MemoirPageRow }) {
  return (
    <article className="rounded-xl border border-white/5 bg-surface-container/40 p-4 text-left">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-mono-data text-[11px] text-primary-fixed">
          {p.page_date}
          {p.day_number != null ? ` · Day ${p.day_number}` : ''}
        </span>
        {p.morning_completed && (
          <span className="rounded-full bg-primary-fixed/15 px-2 py-0.5 text-[10px] text-primary-fixed">
            morning
          </span>
        )}
        {p.evening_completed && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-on-surface-variant">
            evening
          </span>
        )}
      </div>
      {p.intention && (
        <p className="text-sm text-on-surface">
          <span className="text-on-surface-variant">Intention: </span>
          {p.intention}
        </p>
      )}
      {p.journal_text && (
        <p className="mt-1 text-sm italic text-on-surface-variant">{p.journal_text}</p>
      )}
      {p.ai_narration && (
        <p className="mt-3 border-t border-white/5 pt-3 text-sm leading-relaxed text-on-surface">
          {p.ai_narration}
        </p>
      )}
    </article>
  )
}

function roman(n: number): string {
  const map: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ]
  let rem = n
  let out = ''
  for (const [v, s] of map) {
    while (rem >= v) {
      out += s
      rem -= v
    }
  }
  return out || 'I'
}
