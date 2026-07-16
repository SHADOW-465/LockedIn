import { zipSync, type Zippable } from 'fflate'
import { getSupabase } from '@/lib/supabase/client'

/**
 * Export the full chastity journey as a ZIP:
 * - memoir chapters + daily ritual pages
 * - freeform journal entries
 * - mood check-ins
 * - behavior logs (last 90 days)
 * - readable markdown book + raw JSON
 */
export async function exportMemoirJourneyZip(userId: string): Promise<void> {
  const supabase = getSupabase()
  const since = new Date()
  since.setDate(since.getDate() - 90)
  const sinceIso = since.toISOString()

  const [chaptersRes, journalRes, moodRes, behaviorRes, profileRes] = await Promise.all([
    supabase
      .from('memoir_chapters')
      .select('*, pages:memoir_pages(*)')
      .eq('user_id', userId)
      .order('start_date', { ascending: true }),
    supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    supabase
      .from('mood_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true }),
    supabase
      .from('behavior_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', sinceIso)
      .order('logged_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('username, tier, compliance_streak, willpower_score, xp_total, total_denial_hours')
      .eq('id', userId)
      .maybeSingle(),
  ])

  const chapters = chaptersRes.data ?? []
  const journals = journalRes.data ?? []
  const moods = moodRes.data ?? []
  const behaviors = behaviorRes.data ?? []
  const profile = profileRes.data

  // Flatten pages across chapters
  const pages = chapters.flatMap((ch: { pages?: unknown[]; title?: string; id?: string }) =>
    (ch.pages ?? []).map((p) => ({ ...(p as object), chapter_title: ch.title, chapter_id: ch.id }))
  )

  const behaviorCounts = behaviors.reduce(
    (acc: Record<string, number>, row: { type?: string }) => {
      const t = row.type || 'unknown'
      acc[t] = (acc[t] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const bookMd = buildMarkdownBook({
    profile,
    chapters,
    pages,
    journals,
    moods,
    behaviorCounts,
  })

  const enc = (obj: unknown) => new TextEncoder().encode(JSON.stringify(obj, null, 2))
  const files: Zippable = {
    'JOURNEY.md': new TextEncoder().encode(bookMd),
    'profile.json': enc(profile ?? {}),
    'memoir_chapters.json': enc(chapters),
    'memoir_pages.json': enc(pages),
    'journal_entries.json': enc(journals),
    'mood_checkins.json': enc(moods),
    'behavior_logs_90d.json': enc(behaviors),
    'behavior_summary.json': enc(behaviorCounts),
  }

  const zipped = zipSync(files)
  const blob = new Blob([zipped as Uint8Array<ArrayBuffer>], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const stamp = new Date().toISOString().slice(0, 10)
  a.download = `LockedIn_Memoir_${stamp}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function buildMarkdownBook(input: {
  profile: Record<string, unknown> | null | undefined
  chapters: unknown[]
  pages: Array<Record<string, unknown>>
  journals: Array<Record<string, unknown>>
  moods: Array<Record<string, unknown>>
  behaviorCounts: Record<string, number>
}): string {
  const p = input.profile ?? {}
  const lines: string[] = [
    '# LockedIn Memoir',
    '',
    `Exported: ${new Date().toISOString()}`,
    '',
    '## Profile snapshot',
    `- Username: ${p.username ?? '—'}`,
    `- Tier: ${p.tier ?? '—'}`,
    `- Compliance streak: ${p.compliance_streak ?? 0}`,
    `- Willpower: ${p.willpower_score ?? '—'}`,
    `- XP: ${p.xp_total ?? 0}`,
    `- Total denial hours: ${p.total_denial_hours ?? 0}`,
    '',
    '## Behavior (last 90 days)',
    `- Touches: ${input.behaviorCounts.touch ?? 0}`,
    `- Urges: ${input.behaviorCounts.urge ?? 0}`,
    `- Removals: ${input.behaviorCounts.removal ?? 0}`,
    '',
  ]

  lines.push('## Ritual chapters')
  if (input.chapters.length === 0) {
    lines.push('_No ritual chapters yet. Complete morning/evening rituals to fill the book._', '')
  }

  // Group pages by chapter title
  const byChapter = new Map<string, Array<Record<string, unknown>>>()
  for (const page of input.pages) {
    const key = String(page.chapter_title || 'Untitled chapter')
    if (!byChapter.has(key)) byChapter.set(key, [])
    byChapter.get(key)!.push(page)
  }

  for (const [title, chapterPages] of byChapter) {
    lines.push(`### ${title}`, '')
    const sorted = [...chapterPages].sort((a, b) =>
      String(a.page_date || '').localeCompare(String(b.page_date || ''))
    )
    for (const page of sorted) {
      lines.push(`#### Day ${page.day_number ?? '—'} — ${page.page_date ?? ''}`)
      if (page.mood) lines.push(`- Mood: ${page.mood}`)
      if (page.intention) lines.push(`- Intention: ${page.intention}`)
      if (page.energy_level != null) lines.push(`- Energy: ${page.energy_level}/10`)
      if (page.difficulty_level != null) lines.push(`- Difficulty: ${page.difficulty_level}/10`)
      if (page.journal_text) {
        lines.push('', String(page.journal_text), '')
      }
      if (page.ai_narration) {
        lines.push('> ' + String(page.ai_narration).replace(/\n/g, '\n> '), '')
      }
      lines.push('')
    }
  }

  lines.push('## Freeform journal')
  if (input.journals.length === 0) {
    lines.push('_No journal entries._', '')
  } else {
    for (const entry of input.journals) {
      lines.push(
        `### ${new Date(String(entry.created_at)).toLocaleString()}`,
        entry.mood ? `- Mood: ${entry.mood}` : '',
        entry.obedience_rating != null ? `- Obedience: ${entry.obedience_rating}/10` : '',
        '',
        String(entry.content ?? ''),
        '',
      )
      if (entry.ai_analysis) {
        lines.push(`_Observer notes:_ ${entry.ai_analysis}`, '')
      }
    }
  }

  lines.push('## Mood check-ins')
  if (input.moods.length === 0) {
    lines.push('_No mood check-ins._', '')
  } else {
    for (const m of input.moods) {
      lines.push(
        `- ${m.date}: submission=${m.submission_depth} frustration=${m.frustration_level}` +
          (Array.isArray(m.headspace_tags) && m.headspace_tags.length
            ? ` tags=${(m.headspace_tags as string[]).join(',')}`
            : '') +
          (m.notes ? ` — ${m.notes}` : '')
      )
    }
    lines.push('')
  }

  return lines.filter((l) => l !== undefined).join('\n')
}
