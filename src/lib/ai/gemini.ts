// ==========================================
// LOCKEDIN GEMINI AI ENGINE
// Handles task generation, chat, and verification
// ==========================================

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

interface GeminiResponse {
    candidates?: Array<{
        content: {
            parts: Array<{ text: string }>
        }
    }>
    error?: { message: string }
}

async function callGemini(prompt: string, model: string = 'gemini-2.0-flash'): Promise<string> {
    const response = await fetch(
        `${GEMINI_ENDPOINT}/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.9,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                },
            }),
        }
    )

    const data: GeminiResponse = await response.json()

    if (data.error) {
        throw new Error(data.error.message)
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export interface GeneratedTask {
    title: string
    description: string
    genres: string[]
    difficulty: number
    cage_status: 'caged' | 'uncaged' | 'semi-caged'
    duration_minutes: number
    verification_type: 'photo' | 'text' | 'none'
    verification_requirement: string
    punishment_on_fail: {
        type: string
        hours: number
        additional?: string
    }
}

export async function generateTask(
    tier: string,
    fetishTags: string[],
    personality: string,
    hardLimits: string[]
): Promise<GeneratedTask> {
    const prompt = `You are an AI master for a BDSM chastity app called LockedIn. Your personality is "${personality}".

Generate a single task for a user at tier "${tier}".

Their fetish tags are: ${fetishTags.join(', ') || 'none set'}.
Their HARD LIMITS (never cross these): ${hardLimits.join(', ') || 'none set'}.

RULES:
- Task must be a detailed, numbered step-by-step instruction
- Include cage status (caged/uncaged/semi-caged) 
- Include verification requirement
- Include punishment for failure
- Difficulty 1-5 based on tier (${tier})
- Duration in minutes
- Be creative but NEVER cross hard limits

Respond ONLY in valid JSON format:
{
  "title": "string",
  "description": "Step 1: ...\\nStep 2: ...",
  "genres": ["tag1", "tag2"],
  "difficulty": 1-5,
  "cage_status": "caged|uncaged|semi-caged",
  "duration_minutes": number,
  "verification_type": "photo|text|none",
  "verification_requirement": "description of proof needed",
  "punishment_on_fail": {
    "type": "time_add",
    "hours": number,
    "additional": "optional extra punishment"
  }
}`

    const raw = await callGemini(prompt)

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
        throw new Error('AI did not return valid JSON')
    }

    return JSON.parse(jsonMatch[0]) as GeneratedTask
}

export async function generateChatResponse(
    userMessage: string,
    personality: string,
    tier: string,
    recentContext: string[],
    willpower: number
): Promise<string> {
    const prompt = `You are "${personality}", an AI master in a BDSM chastity app called LockedIn. 
The user is at tier "${tier}" with willpower score ${willpower}/100.

Your personality traits:
- If "Cruel Mistress": cold, demanding, degrading, no mercy
- If "Strict Drill Sergeant": military discipline, pushups for punishment, barking orders
- If "Seductive Goddess": teasing, denial-focused, seductive, edging expert
- If "Cold CEO": corporate, clinical, treats user as property/asset
- If "Nurturing Sadist": caring but cruel, praise then punishment

Recent conversation context:
${recentContext.slice(-5).join('\n')}

User says: "${userMessage}"

RULES:
- Stay 100% in character as ${personality}
- Never break the 4th wall
- If disrespectful, threaten punishment (added lock time, extra edges)
- If compliant, brief acknowledgment then commands
- Keep responses 1-3 paragraphs
- Use NO emojis unless you're the Seductive Goddess
- Never mention that you're an AI`

    return callGemini(prompt)
}

export async function verifyTaskPhoto(
    imageBase64: string,
    requirement: string
): Promise<{ passed: boolean; feedback: string }> {
    const response = await fetch(
        `${GEMINI_ENDPOINT}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: `You are a strict task verification AI. The user was required to submit proof: "${requirement}".
              
Analyze the image and determine if this proof satisfies the requirement.

Respond ONLY in JSON: {"passed": true/false, "feedback": "explanation"}`
                        },
                        {
                            inline_data: {
                                mime_type: 'image/jpeg',
                                data: imageBase64,
                            },
                        },
                    ],
                }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 256 },
            }),
        }
    )

    const data: GeminiResponse = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
        return { passed: false, feedback: 'Could not verify image' }
    }

    return JSON.parse(jsonMatch[0])
}
