import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { generateSimpleText } from '@/lib/ai/ai-service'

/**
 * Ensure the user has a memoir chapter to attach daily pages to.
 * Prefer the session-linked chapter; otherwise use/create an open "Daily Chronicle".
 */
async function ensureChapterId(
    supabase: ReturnType<typeof getServerSupabase>,
    userId: string,
    sessionId: string | undefined,
    todayStr: string,
): Promise<string | null> {
    if (sessionId) {
        const { data: existingChapter } = await supabase
            .from('memoir_chapters')
            .select('id')
            .eq('session_id', sessionId)
            .maybeSingle()

        if (existingChapter?.id) return existingChapter.id

        const { data: session } = await supabase
            .from('sessions')
            .select('start_time')
            .eq('id', sessionId)
            .maybeSingle()

        const startDate = session?.start_time
            ? new Date(session.start_time).toISOString().slice(0, 10)
            : todayStr

        const { data: newChapter, error: chapErr } = await supabase
            .from('memoir_chapters')
            .insert({
                user_id: userId,
                session_id: sessionId,
                title: 'Chapter I: The Lock Protocol',
                start_date: startDate,
            })
            .select('id')
            .single()

        if (!chapErr && newChapter?.id) return newChapter.id
        console.error('[Ritual/Submit] Session chapter create error:', chapErr)
    }

    // No session (or session chapter failed): use an open daily chapter
    const { data: openChapter } = await supabase
        .from('memoir_chapters')
        .select('id')
        .eq('user_id', userId)
        .is('end_date', null)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (openChapter?.id) return openChapter.id

    const { data: dailyChapter, error: dailyErr } = await supabase
        .from('memoir_chapters')
        .insert({
            user_id: userId,
            session_id: sessionId || null,
            title: 'Daily Chronicle',
            start_date: todayStr,
        })
        .select('id')
        .single()

    if (dailyErr) {
        console.error('[Ritual/Submit] Daily chapter create error:', dailyErr)
        return null
    }
    return dailyChapter?.id ?? null
}

/**
 * Upsert by (user_id, page_date). Prefer native upsert when unique index exists;
 * fall back to select → update/insert so rituals still save without the migration.
 */
async function upsertMemoirPage(
    supabase: ReturnType<typeof getServerSupabase>,
    payload: Record<string, unknown>,
) {
    const userId = payload.user_id as string
    const pageDate = payload.page_date as string

    // Load existing page first so we can merge reflections (append) and
    // so we work even without a unique constraint on (user_id, page_date).
    const { data: existing } = await supabase
        .from('memoir_pages')
        .select('*')
        .eq('user_id', userId)
        .eq('page_date', pageDate)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    const merged: Record<string, unknown> = { ...payload }

    if (existing) {
        // Preserve fields the other ritual already set
        if (merged.morning_completed == null && existing.morning_completed) {
            merged.morning_completed = existing.morning_completed
        }
        if (merged.evening_completed == null && existing.evening_completed) {
            merged.evening_completed = existing.evening_completed
        }
        if (merged.mood == null && existing.mood) merged.mood = existing.mood
        if (merged.intention == null && existing.intention) {
            merged.intention = existing.intention
        }
        if (merged.difficulty_level == null && existing.difficulty_level != null) {
            merged.difficulty_level = existing.difficulty_level
        }
        if (merged.energy_level == null && existing.energy_level != null) {
            merged.energy_level = existing.energy_level
        }
        if (!merged.chapter_id && existing.chapter_id) {
            merged.chapter_id = existing.chapter_id
        }
        if (!merged.session_id && existing.session_id) {
            merged.session_id = existing.session_id
        }
        if (!merged.day_number && existing.day_number) {
            merged.day_number = existing.day_number
        }

        // Append journal text instead of overwriting
        if (typeof payload.journal_text === 'string' && payload.journal_text.trim()) {
            const prev = (existing.journal_text as string | null)?.trim()
            const next = payload.journal_text.trim()
            if (prev && prev !== next && !prev.includes(next)) {
                merged.journal_text = `${prev}\n\n${next}`
            } else if (!prev) {
                merged.journal_text = next
            } else {
                merged.journal_text = prev
            }
        } else if (existing.journal_text) {
            merged.journal_text = existing.journal_text
        }

        // Append AI narration when both morning + evening write
        if (typeof payload.ai_narration === 'string' && payload.ai_narration.trim()) {
            const prev = (existing.ai_narration as string | null)?.trim()
            const next = payload.ai_narration.trim()
            if (prev && prev !== next && !prev.includes(next)) {
                merged.ai_narration = `${prev}\n\n${next}`
            } else if (!prev) {
                merged.ai_narration = next
            }
        } else if (existing.ai_narration) {
            merged.ai_narration = existing.ai_narration
        }

        // Merge photos arrays
        if (Array.isArray(payload.photos) && payload.photos.length) {
            const prevPhotos = Array.isArray(existing.photos) ? existing.photos : []
            const nextPhotos = payload.photos as string[]
            merged.photos = Array.from(new Set([...prevPhotos, ...nextPhotos]))
        } else if (existing.photos) {
            merged.photos = existing.photos
        }
        if (!merged.cover_photo_url && existing.cover_photo_url) {
            merged.cover_photo_url = existing.cover_photo_url
        }

        const { data: updated, error: updateErr } = await supabase
            .from('memoir_pages')
            .update(merged)
            .eq('id', existing.id)
            .select()
            .single()

        return { data: updated, error: updateErr }
    }

    // Insert new page
    const { data: inserted, error: insertErr } = await supabase
        .from('memoir_pages')
        .insert(merged)
        .select()
        .single()

    // If unique index was applied and a concurrent insert raced, retry as update
    if (insertErr?.code === '23505') {
        const { data: raced } = await supabase
            .from('memoir_pages')
            .select('id')
            .eq('user_id', userId)
            .eq('page_date', pageDate)
            .maybeSingle()

        if (raced?.id) {
            const { data: updated, error: updateErr } = await supabase
                .from('memoir_pages')
                .update(merged)
                .eq('id', raced.id)
                .select()
                .single()
            return { data: updated, error: updateErr }
        }
    }

    return { data: inserted, error: insertErr }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            userId,
            sessionId,
            type, // 'morning' | 'evening'
            mood,
            energyLevel,
            difficultyLevel,
            notes,
            intention,
            storagePath,
        } = body as {
            userId: string
            sessionId?: string
            type: 'morning' | 'evening'
            mood?: string
            energyLevel?: number
            difficultyLevel?: number
            notes?: string
            intention?: string
            imageBase64?: string
            storagePath?: string
        }

        if (!userId || !type) {
            return NextResponse.json({ error: 'userId and type are required' }, { status: 400 })
        }

        if (type !== 'morning' && type !== 'evening') {
            return NextResponse.json({ error: 'type must be morning or evening' }, { status: 400 })
        }

        const supabase = getServerSupabase()
        const todayStr = new Date().toISOString().slice(0, 10)

        // 1. Always attach to a chapter (session chapter or Daily Chronicle)
        const chapterId = await ensureChapterId(supabase, userId, sessionId, todayStr)
        if (!chapterId) {
            return NextResponse.json(
                { error: 'Failed to open memoir chapter for this ritual' },
                { status: 500 },
            )
        }

        // 2. AI narration (non-blocking for save path)
        let aiNarration = ''
        try {
            const prompt = type === 'morning'
                ? `Write a short, reflective, psychological entry in the second-person ('you') describing a locked slave starting his day. He feels ${mood || 'focused'} and is setting the intention: "${intention || 'To remain locked and submissive'}". Frame his lock as a gift to his master.`
                : `Write a short, dark, submissive entry in the second-person ('you') detailing the end of a day. He logged a difficulty level of ${difficultyLevel || 5}/10 and shares: "${notes || 'Nothing to report'}". Command him to sleep and dream of his master.`

            const { text } = await generateSimpleText(
                'You are a strict, psychological, submissive memoir editor. Write a brief 2-3 sentence diary page entry.',
                prompt,
            )
            aiNarration = text
        } catch (err) {
            console.error('[Ritual/Submit] AI narration error:', err)
        }

        // 3. Build page payload
        const pageUpdatePayload: Record<string, unknown> = {
            user_id: userId,
            chapter_id: chapterId,
            session_id: sessionId || null,
            page_date: todayStr,
            updated_at: new Date().toISOString(),
        }

        if (type === 'morning') {
            pageUpdatePayload.morning_completed = true
            pageUpdatePayload.mood = mood || null
            pageUpdatePayload.intention = intention || null
            if (aiNarration) pageUpdatePayload.ai_narration = aiNarration
        } else {
            pageUpdatePayload.evening_completed = true
            pageUpdatePayload.difficulty_level = difficultyLevel ?? null
            pageUpdatePayload.energy_level = energyLevel ?? null
            pageUpdatePayload.journal_text = notes?.trim() || null
            if (aiNarration) pageUpdatePayload.ai_narration = aiNarration
        }

        if (storagePath) {
            pageUpdatePayload.cover_photo_url = storagePath
            pageUpdatePayload.photos = [storagePath]
        }

        // Day number since session start (or 1 without session)
        if (sessionId) {
            const { data: session } = await supabase
                .from('sessions')
                .select('start_time')
                .eq('id', sessionId)
                .maybeSingle()

            if (session?.start_time) {
                const diffMs = Date.now() - new Date(session.start_time).getTime()
                pageUpdatePayload.day_number = Math.max(1, Math.floor(diffMs / 86400000) + 1)
            }
        }

        const { data: page, error: pageErr } = await upsertMemoirPage(supabase, pageUpdatePayload)

        if (pageErr || !page) {
            console.error('[Ritual/Submit] Page upsert error:', pageErr)
            return NextResponse.json({ error: 'Failed to save daily memoir page' }, { status: 500 })
        }

        // Log session event when locked
        if (sessionId) {
            await supabase.from('session_events').insert({
                session_id: sessionId,
                user_id: userId,
                event_type: `${type}_ritual_completed`,
                payload: { page_id: page.id, mood, intention, notes },
            })
        }

        return NextResponse.json({ success: true, page, aiNarration, chapterId }, { status: 200 })
    } catch (err) {
        console.error('[Ritual/Submit] Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
