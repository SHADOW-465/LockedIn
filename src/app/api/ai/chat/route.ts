import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateChatResponse } from '@/lib/ai/gemini'
import { emergencyRelease } from '@/lib/supabase/sessions'

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

        // --- SAFEWORD DETECTION (Safety Critical) ---
        const lowerMessage = message.toLowerCase().trim()
        const safewords = ['red', 'stop', 'safeword', 'halt', 'end', 'quit']
        const isSafeword = safewords.some(word => lowerMessage === word || lowerMessage.includes(word))
        
        if (isSafeword) {
            // Immediately release the session
            if (sessionId) {
                await emergencyRelease(sessionId)
            }
            
            // Save the safeword message
            await supabaseAdmin.from('chat_messages').insert({
                user_id: userId,
                session_id: sessionId || null,
                sender: 'user',
                content: message,
                message_type: 'command',
            })
            
            // Save system halt message
            const { data: haltMsg } = await supabaseAdmin
                .from('chat_messages')
                .insert({
                    user_id: userId,
                    session_id: sessionId || null,
                    sender: 'ai',
                    content: '**SESSION HALTED** - Safeword detected. All activities stopped. You are free.',
                    message_type: 'system',
                })
                .select()
                .single()
            
            return NextResponse.json({
                message: haltMsg,
                safeword_triggered: true,
                session_halted: true,
            })
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

        // Detect rudeness/punishment triggers (reuse lowerMessage from safeword check)
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
