import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { getOrScheduleTodayProofs } from '@/lib/proof-scheduler'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const sessionId = searchParams.get('sessionId')

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 })
        }

        const supabase = getServerSupabase()
        const schedule = await getOrScheduleTodayProofs(supabase, userId, sessionId || null)

        return NextResponse.json({ schedule }, { status: 200 })
    } catch (err) {
        console.error('[Proof/Schedule] Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
