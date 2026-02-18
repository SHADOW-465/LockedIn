import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

const MONTHLY_TOKEN_LIMIT = 50_000

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 })
        }

        const supabase = getServerSupabase()
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        // Today's usage
        const { data: todayRows } = await supabase
            .from('api_usage')
            .select('prompt_tokens, completion_tokens, total_tokens')
            .eq('user_id', userId)
            .gte('created_at', todayStart)

        const today = (todayRows || []).reduce(
            (acc, row) => ({
                prompt: acc.prompt + (row.prompt_tokens || 0),
                completion: acc.completion + (row.completion_tokens || 0),
                total: acc.total + (row.total_tokens || 0),
            }),
            { prompt: 0, completion: 0, total: 0 },
        )

        // This month's total
        const { data: monthRows } = await supabase
            .from('api_usage')
            .select('total_tokens')
            .eq('user_id', userId)
            .gte('created_at', monthStart)

        const monthTotal = (monthRows || []).reduce((acc, row) => acc + (row.total_tokens || 0), 0)

        return NextResponse.json({
            today,
            month: { total: monthTotal },
            limit: MONTHLY_TOKEN_LIMIT,
            remaining: Math.max(0, MONTHLY_TOKEN_LIMIT - monthTotal),
        })
    } catch (error) {
        console.error('[Usage API] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 })
    }
}
