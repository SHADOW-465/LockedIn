import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { verifyImage, generateSimpleText } from '@/lib/ai/ai-service'

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
            imageBase64,
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

        const supabase = getServerSupabase()
        const todayStr = new Date().toISOString().slice(0, 10)

        // 1. Get or create active chapter for this session
        let chapterId: string | null = null
        if (sessionId) {
            const { data: existingChapter } = await supabase
                .from('memoir_chapters')
                .select('id')
                .eq('session_id', sessionId)
                .maybeSingle()

            if (existingChapter) {
                chapterId = existingChapter.id
            } else {
                // Fetch session started_at date to set start_date on chapter
                const { data: session } = await supabase
                    .from('sessions')
                    .select('start_time')
                    .eq('id', sessionId)
                    .single()

                const startDate = session ? new Date(session.start_time).toISOString().slice(0, 10) : todayStr

                const { data: newChapter, error: chapErr } = await supabase
                    .from('memoir_chapters')
                    .insert({
                        user_id: userId,
                        session_id: sessionId,
                        title: 'Chapter I: The Lock Protocol',
                        start_date: startDate,
                    })
                    .select()
                    .single()

                if (!chapErr && newChapter) {
                    chapterId = newChapter.id
                }
            }
        }

        // 2. Perform AI narration of the checkin to make the memoir feel "living"
        let aiNarration = ''
        try {
            const prompt = type === 'morning'
                ? `Write a short, reflective, psychological entry in the second-person ('you') describing a locked slave starting his day. He feels ${mood || 'focused'} and is setting the intention: "${intention || 'To remain locked and submissive'}". Frame his lock as a gift to his master.`
                : `Write a short, dark, submissive entry in the second-person ('you') detailing the end of a day. He logged a difficulty level of ${difficultyLevel || 5}/10 and shares: "${notes || 'Nothing to report'}". Command him to sleep and dream of his master.`

            const { text } = await generateSimpleText(
                'You are a strict, psychological, submissive memoir editor. Write a brief 2-3 sentence diary page entry.',
                prompt
            )
            aiNarration = text
        } catch (err) {
            console.error('[Ritual/Submit] AI narration error:', err)
        }

        // 3. Upsert memoir page
        const pageUpdatePayload: Record<string, any> = {
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
            pageUpdatePayload.difficulty_level = difficultyLevel || null
            pageUpdatePayload.energy_level = energyLevel || null
            pageUpdatePayload.journal_text = notes || null
            if (aiNarration) pageUpdatePayload.ai_narration = aiNarration
        }

        if (storagePath) {
            pageUpdatePayload.cover_photo_url = storagePath
            pageUpdatePayload.photos = [storagePath]
        }

        // Calculate day_number since session started
        if (sessionId) {
            const { data: session } = await supabase
                .from('sessions')
                .select('start_time')
                .eq('id', sessionId)
                .single()

            if (session) {
                const diffMs = Date.now() - new Date(session.start_time).getTime()
                pageUpdatePayload.day_number = Math.max(1, Math.floor(diffMs / 86400000) + 1)
            }
        }

        const { data: page, error: pageErr } = await supabase
            .from('memoir_pages')
            .upsert(pageUpdatePayload, { onConflict: 'user_id,page_date' })
            .select()
            .single()

        if (pageErr) {
            console.error('[Ritual/Submit] Page upsert error:', pageErr)
            return NextResponse.json({ error: 'Failed to save daily memoir page' }, { status: 500 })
        }

        // Log session event
        if (sessionId) {
            await supabase.from('session_events').insert({
                session_id: sessionId,
                user_id: userId,
                event_type: `${type}_ritual_completed`,
                payload: { page_id: page.id, mood, intention },
            })
        }

        return NextResponse.json({ success: true, page, aiNarration }, { status: 200 })
    } catch (err) {
        console.error('[Ritual/Submit] Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
