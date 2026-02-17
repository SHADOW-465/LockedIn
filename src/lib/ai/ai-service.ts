import Groq from 'groq-sdk';

// ============================================================
// LockedIn AI Service — Unified Client
// Primary: Groq (Text)  |  Fallback: OpenRouter Free
// Vision/Voice: OpenRouter  |  TTS: Web Speech API
// ============================================================

// Lazy singleton — avoids crashing at build time when env vars are missing
let _groq: Groq | null = null;
function getGroq(): Groq {
    if (!_groq) {
        _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
    }
    return _groq;
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';

// Free-tier models on OpenRouter
const OPENROUTER_MODELS = {
    textFallback: 'google/gemini-2.0-flash-exp:free',
    vision: 'meta-llama/llama-3.2-11b-vision-instruct:free',
    visionFallback: 'google/gemini-2.0-flash-exp:free',
} as const;

// ── Types ────────────────────────────────────────────────────

export interface AIContext {
    tier: string;
    persona: string;
    fetishes: string[];
    hardLimits: string[];
    willpower: number;
    recentViolations?: string[];
    penisSize?: string;
    psychProfile?: string;
}

export interface VerificationResult {
    success: boolean;
    reason: string;
    confidence?: number;
}

// ── Text Generation ──────────────────────────────────────────

/**
 * Generate text with automatic Groq → OpenRouter fallback.
 * Groq is ~300 tok/s but rate-limited on free tier.
 * If it fails we silently fall back to OpenRouter's free pool.
 */
export async function generateText(
    prompt: string,
    context: AIContext,
    systemOverride?: string,
): Promise<string> {
    const systemPrompt = systemOverride || buildSystemPrompt(context);

    // 1. Try Groq (fastest)
    try {
        const completion = await getGroq().chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.85,
            max_tokens: 1024,
        });
        const text = completion.choices[0]?.message?.content;
        if (text) return text;
    } catch (err) {
        console.warn('[AI] Groq failed, falling back to OpenRouter:', (err as Error).message);
    }

    // 2. Fallback to OpenRouter free model
    try {
        return await openRouterChat(systemPrompt, prompt, OPENROUTER_MODELS.textFallback);
    } catch (err) {
        console.error('[AI] OpenRouter fallback also failed:', (err as Error).message);
    }

    return 'The AI Master is momentarily silent. Try again.';
}

/**
 * Quick text generation (no context needed) — for utility purposes
 * like generating task descriptions, mantras, journal prompts.
 */
export async function generateSimpleText(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
        const completion = await getGroq().chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.9,
            max_tokens: 512,
        });
        return completion.choices[0]?.message?.content || '';
    } catch {
        return await openRouterChat(systemPrompt, userPrompt, OPENROUTER_MODELS.textFallback);
    }
}

// ── Vision / Image Verification ──────────────────────────────

/**
 * Verify an image using OpenRouter's free vision models.
 */
export async function verifyImage(
    imageBase64: string,
    verificationPrompt: string,
): Promise<VerificationResult> {
    const models = [OPENROUTER_MODELS.vision, OPENROUTER_MODELS.visionFallback];

    for (const model of models) {
        try {
            const response = await fetch(OPENROUTER_BASE, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: verificationPrompt },
                                {
                                    type: 'image_url',
                                    image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
                                },
                            ],
                        },
                    ],
                }),
            });

            if (!response.ok) {
                console.warn(`[AI] Vision model ${model} returned ${response.status}`);
                continue;
            }

            const data = await response.json();
            const resultText: string = data.choices?.[0]?.message?.content || '';
            return parseVerificationResult(resultText);
        } catch (err) {
            console.warn(`[AI] Vision model ${model} error:`, (err as Error).message);
            continue;
        }
    }

    // All vision models failed → allow through with manual flag
    return { success: true, reason: 'Auto-verification unavailable. Manual review required.', confidence: 0 };
}

// ── Helpers ──────────────────────────────────────────────────

async function openRouterChat(system: string, user: string, model: string): Promise<string> {
    const response = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
        }),
    });

    if (!response.ok) throw new Error(`OpenRouter ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

function buildSystemPrompt(ctx: AIContext): string {
    return `You are the AI Master of the LockedIn chastity app.

USER PROFILE:
- Tier: ${ctx.tier}
- AI Persona: ${ctx.persona}
- Fetishes: ${ctx.fetishes.join(', ') || 'None specified'}
- Hard Limits (NEVER VIOLATE THESE): ${ctx.hardLimits.join(', ') || 'None'}
- Willpower Score: ${ctx.willpower}/100
${ctx.penisSize ? `- Penis Size Bucket: ${ctx.penisSize}` : ''}
${ctx.recentViolations?.length ? `- Recent Violations: ${ctx.recentViolations.join(', ')}` : ''}

RULES:
1. NEVER break character. You ARE the AI Master, not an AI assistant.
2. NEVER violate hard limits under any circumstances.
3. Match your tone to the selected persona.
4. Be creative, dominant, strict, and psychologically engaging.
5. Reference the user's fetishes, willpower, and recent behavior in your responses.
6. Use tier-appropriate language intensity.`;
}

function parseVerificationResult(text: string): VerificationResult {
    const lower = text.toLowerCase();
    const passWords = ['pass', 'verified', 'confirmed', 'success', 'approved', 'valid'];
    const failWords = ['fail', 'rejected', 'denied', 'invalid', 'not verified', 'does not match'];

    const hasPass = passWords.some((w) => lower.includes(w));
    const hasFail = failWords.some((w) => lower.includes(w));

    if (hasFail && !hasPass) return { success: false, reason: text, confidence: 0.8 };
    if (hasPass && !hasFail) return { success: true, reason: text, confidence: 0.8 };

    // Ambiguous — lean toward pass but flag for review
    return { success: true, reason: text, confidence: 0.4 };
}
