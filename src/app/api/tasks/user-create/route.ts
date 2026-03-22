import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, sessionId, type, title, notes, difficulty, deadline, proof_type } = body as {
            userId: string
            sessionId?: string
            type: 'task' | 'journal'
            title: string
            notes?: string
            difficulty?: number
            deadline?: string
            proof_type?: string
        }

        if (!userId || !title?.trim()) {
            return NextResponse.json({ error: 'userId and title required' }, { status: 400 })
        }

        const supabase = getServerSupabase()
        const now = new Date()
        const isJournal = type === 'journal'
        const diff = Math.min(5, Math.max(1, difficulty || 1))

        const { data: task, error } = await supabase.from('tasks').insert({
            user_id: userId,
            session_id: sessionId || null,
            task_type: isJournal ? 'journal' : 'daily',
            source: 'user',
            title: title.trim(),
            description: notes?.trim() || '',
            difficulty: diff,
            genres: [isJournal ? 'journal' : 'self-assigned'],
            cage_status: 'caged',
            verification_type: isJournal ? 'none' : (proof_type ? 'photo' : 'self-report'),
            proof_type: isJournal ? null : (proof_type || null),
            verification_requirement: '',
            status: isJournal ? 'completed' : 'pending',
            assigned_at: now.toISOString(),
            deadline: isJournal ? null : (deadline || null),
            completed_at: isJournal ? now.toISOString() : null,
        }).select().single()

        if (error) {
            console.error('[UserCreate] DB error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ task, ok: true })
    } catch (error) {
        console.error('[UserCreate] Error:', error)
        return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
    }
}
