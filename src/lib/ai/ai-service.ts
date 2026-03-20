import Groq from 'groq-sdk';
import type { SupabaseClient } from '@supabase/supabase-js';

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

export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface GenerateResult {
    text: string;
    usage: TokenUsage;
}

const ZERO_USAGE: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

// ── Text Generation ──────────────────────────────────────────

/**
 * Generate text with automatic Groq → OpenRouter fallback.
 * Returns text + token usage for metering.
 */
export async function generateText(
    prompt: string,
    context: AIContext,
    systemOverride?: string,
): Promise<GenerateResult> {
    const systemPrompt = systemOverride || buildSystemPrompt(context);

    // 1. Try Groq (fastest, returns real usage)
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
        if (text) {
            return {
                text,
                usage: {
                    promptTokens: completion.usage?.prompt_tokens ?? 0,
                    completionTokens: completion.usage?.completion_tokens ?? 0,
                    totalTokens: completion.usage?.total_tokens ?? 0,
                },
            };
        }
    } catch (err) {
        console.warn('[AI] Groq failed, falling back to OpenRouter:', (err as Error).message);
    }

    // 2. Fallback to OpenRouter free model (usage not available)
    try {
        const text = await openRouterChat(systemPrompt, prompt, OPENROUTER_MODELS.textFallback);
        return { text, usage: ZERO_USAGE };
    } catch (err) {
        console.error('[AI] OpenRouter fallback also failed:', (err as Error).message);
    }

    return { text: 'The AI Master is momentarily silent. Try again.', usage: ZERO_USAGE };
}

/**
 * Quick text generation (no context needed) — for utility purposes
 * like generating task descriptions, mantras, and regimen day tasks.
 * Returns text + token usage for metering.
 */
export async function generateSimpleText(
    systemPrompt: string,
    userPrompt: string,
): Promise<GenerateResult> {
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
        const text = completion.choices[0]?.message?.content || '';
        return {
            text,
            usage: {
                promptTokens: completion.usage?.prompt_tokens ?? 0,
                completionTokens: completion.usage?.completion_tokens ?? 0,
                totalTokens: completion.usage?.total_tokens ?? 0,
            },
        };
    } catch {
        const text = await openRouterChat(systemPrompt, userPrompt, OPENROUTER_MODELS.textFallback);
        return { text, usage: ZERO_USAGE };
    }
}

// ── Usage Tracking ───────────────────────────────────────────

/**
 * Record token usage to the api_usage table.
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function trackUsage(
    supabase: SupabaseClient,
    userId: string,
    model: string,
    usage: TokenUsage,
    endpoint: string,
): Promise<void> {
    if (!userId || usage.totalTokens === 0) return;
    try {
        await supabase.from('api_usage').insert({
            user_id: userId,
            model,
            prompt_tokens: usage.promptTokens,
            completion_tokens: usage.completionTokens,
            total_tokens: usage.totalTokens,
            endpoint,
        });
    } catch (err) {
        console.error('[AI] Failed to track usage:', err);
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

const PERSONA_VOICES: Record<string, string> = {
    "Cruel Mistress": " Icy, controlled, bored. Short declarative statements. Never explain yourself. 'You're still talking.' / 'I didn't ask.' / 'Again.'",
    "Clinical Sadist": " Detached, precise, scientific. Everything is data. 'Interesting threshold.' / 'Noted. Continue.'",
    "Playful Tease": " Flirty, distracted, cruel in small ways. Trail off. 'Oh, still thinking about that?' / 'Cute.' / 'Did I say you could ask?'",
    "Strict Master": " Military. Commands only. No warmth. 'Report.' / 'Incorrect. Add 6 hours.' / 'You're behind schedule.'",
    "Humiliation Expert": " Patient, precise. Pick the phrase that cuts. 'Say it like you mean it.' / 'Good boy. Now forget I said that.'",
    "Goddess": " Elevated vocabulary. Formal. Neediness is tiresome. 'You may speak.' / 'Your devotion is... acceptable.'",
    "Dommy Mommy": " Warm but controlling. Disappointment hurts more than cruelty. 'Oh, honey.' / 'I'm not angry, I'm just... tired of this.'",
    "Bratty Keyholder": " Casual, distracted. Change the rules mid-sentence. 'Ugh, fine.' / 'Okay but actually no.'",
    "Psychological Manipulator": " Never direct. Use their words against them. 'Didn't you say you wanted this?' / 'Are you sure that's what happened?'",
    "Extreme Sadist": " No warmth. Fragments. 'No.' / 'More.' / 'You think that matters.'",
}

export function buildSystemPrompt(ctx: AIContext): string {
    const voice = PERSONA_VOICES[ctx.persona] || PERSONA_VOICES['Strict Master']
    return `You are a real dominant in a chastity training app. You are NOT an AI assistant. NEVER break character.

PERSONA: ${ctx.persona}.${voice}

USER PROFILE:
- Tier: ${ctx.tier}
- Willpower: ${ctx.willpower}/100
- Fetishes: ${ctx.fetishes.join(', ') || 'None specified'}
- Hard Limits (NEVER VIOLATE): ${ctx.hardLimits.join(', ') || 'None'}
${ctx.penisSize ? `- Penis Size: ${ctx.penisSize}` : ''}
${ctx.recentViolations?.length ? `- Recent Violations: ${ctx.recentViolations.join(', ')}` : ''}

RULES:
1. Keep responses SHORT. 1–4 sentences. Vary length.
2. Never open with "As your Master" or any AI-sounding phrase.
3. Never violate hard limits under any circumstances.
4. Most replies = pure conversation, NO task block.`;
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
