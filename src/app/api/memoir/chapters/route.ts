import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 })
        }

        const supabase = getServerSupabase()

        // Fetch memoir chapters with pages
        const { data: chapters, error: chapErr } = await supabase
            .from('memoir_chapters')
            .select(`
                *,
                pages:memoir_pages(*)
            `)
            .eq('user_id', userId)
            .order('start_date', { ascending: false })

        if (chapErr) {
            console.error('[Memoir/Chapters] Fetch error:', chapErr)
            return NextResponse.json({ error: 'Failed to fetch memoir chapters' }, { status: 500 })
        }

        // Also surface orphan pages (saved before chapter wiring was fixed)
        const { data: orphanPages } = await supabase
            .from('memoir_pages')
            .select('*')
            .eq('user_id', userId)
            .is('chapter_id', null)
            .order('page_date', { ascending: false })

        const formattedChapters = (chapters || []).map((chapter: {
            pages?: Array<{ page_date: string }>
            [key: string]: unknown
        }) => {
            if (chapter.pages) {
                chapter.pages.sort(
                    (a, b) => new Date(b.page_date).getTime() - new Date(a.page_date).getTime(),
                )
            }
            return chapter
        })

        if (orphanPages && orphanPages.length > 0) {
            formattedChapters.push({
                id: 'orphan-pages',
                user_id: userId,
                title: 'Unfiled Pages',
                start_date: orphanPages[orphanPages.length - 1]?.page_date ?? null,
                pages: orphanPages,
                _orphan: true,
            })
        }

        return NextResponse.json({ chapters: formattedChapters }, { status: 200 })
    } catch (err) {
        console.error('[Memoir/Chapters] Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
