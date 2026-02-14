import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateChatResponse } from '@/lib/ai/gemini'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
    try {
        const { userId, sessionId, message, personality, tier, willpower } = await request.json()

        if (!userId || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Save user message
        await supabaseAdmin.from('chat_messages').insert({
            user_id: userId,
            session_id: sessionId || null,
            sender: 'user',
            content: message,
            message_type: 'response',
        })

        // Fetch recent context
        const { data: recentMessages } = await supabaseAdmin
            .from('chat_messages')
            .select('sender, content')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10)

        const context = (recentMessages ?? [])
            .reverse()
            .map((m) => `${m.sender === 'ai' ? 'AI Master' : 'User'}: ${m.content}`)

        // Generate AI response
        const aiResponse = await generateChatResponse(
            message,
            personality ?? 'Cruel Mistress',
            tier ?? 'Newbie',
            context,
            willpower ?? 50
        )

        // Detect rudeness/punishment triggers
        const lowerMessage = message.toLowerCase()
        const isRude =
            lowerMessage.includes('fuck you') ||
            lowerMessage.includes('shut up') ||
            lowerMessage.includes('no') === (lowerMessage.length < 10) ||
            lowerMessage.includes('refuse')

        let messageType: string = 'command'
        if (isRude) {
            messageType = 'punishment'
            // Apply punishment: add lock time
            if (sessionId) {
                await supabaseAdmin.rpc('add_lock_time', {
                    p_session_id: sessionId,
                    p_hours: 2,
                    p_reason: 'Rude behavior in chat',
                })
            }
        }

        // Save AI message
        const { data: aiMsg, error } = await supabaseAdmin
            .from('chat_messages')
            .insert({
                user_id: userId,
                session_id: sessionId || null,
                sender: 'ai',
                content: aiResponse,
                message_type: messageType,
            })
            .select()
            .single()

        if (error) {
            console.error('Failed to save AI message:', error)
            return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
        }

        return NextResponse.json({
            message: aiMsg,
            punished: isRude,
        })
    } catch (err) {
        console.error('Chat error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to generate response' },
            { status: 500 }
        )
    }
}
