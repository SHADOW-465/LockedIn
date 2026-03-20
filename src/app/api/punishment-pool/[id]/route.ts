import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body as { userId?: string }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    // Fetch the entry to verify ownership and type
    const { data: entry, error: fetchError } = await supabase
      .from('punishment_pool')
      .select('id, user_id, is_custom')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (!entry.is_custom) {
      return NextResponse.json({ error: 'System entries cannot be deleted' }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from('punishment_pool')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('[PunishmentPool/DELETE] Error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PunishmentPool/DELETE] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
