'use client'

import { useOnboarding, PERSONAS, type Persona } from '@/lib/stores/onboarding-store'
import { useEffect } from 'react'

interface StepProps {
    onValid: (valid: boolean) => void
}

const PERSONA_DESCRIPTIONS: Record<Persona, string> = {
    'Cruel Mistress': 'Icy and bored by you. Everything is on her terms. Silence is her favorite punishment.',
    'Clinical Sadist': 'Detached, scientific. Your suffering is data. You are an experiment.',
    'Playful Tease': 'Flirty and cruel in small ways. Disappears mid-sentence. Loves watching you wait.',
    'Strict Master': 'Military precision. Commands only. Failure is logged. No appeals.',
    'Humiliation Expert': 'Picks the exact phrase that cuts. Compliments you only to make the fall harder.',
    'Goddess': 'Receives worship as her natural state. Your suffering is an offering.',
    'Dommy Mommy': 'Warm and controlling. Disappointment hurts more than cruelty ever could.',
    'Bratty Keyholder': 'Changes the rules mid-sentence. Makes you work for every second.',
    'Psychological Manipulator': 'Never direct. Uses your own words against you. Makes you doubt yourself.',
    'Extreme Sadist': 'Pure, unfiltered. No warmth, no mercy, no explanation.',
}

const PERSONA_SAMPLES: Record<Persona, string> = {
    'Cruel Mistress': '"You\'re still talking." / "I didn\'t ask." / "Again."',
    'Clinical Sadist': '"Interesting threshold." / "Noted. Holding at 72 hours." / "Continue."',
    'Playful Tease': '"Oh, still thinking about that?" / "Cute." / "Did I say you could ask?"',
    'Strict Master': '"Report." / "Incorrect. Add 6 hours." / "You\'re behind schedule."',
    'Humiliation Expert': '"There it is. That look." / "Say it like you mean it." / "Good boy. Now forget I said that."',
    'Goddess': '"You may speak." / "That will do. For now." / "Your devotion is... acceptable."',
    'Dommy Mommy': '"Oh, honey." / "I\'m not angry, I\'m just... tired of this." / "Come here."',
    'Bratty Keyholder': '"Ugh, fine." / "Okay but actually no." / "I changed my mind."',
    'Psychological Manipulator': '"Didn\'t you say you wanted this?" / "Are you sure that\'s what happened?" / "I think you know why."',
    'Extreme Sadist': '"No." / "More." / "You think that matters."',
}

export default function PersonalityStep({ onValid }: StepProps) {
    const { aiPersonality, setPersonality } = useOnboarding()

    useEffect(() => {
        onValid(aiPersonality !== null)
    }, [aiPersonality, onValid])

    return (
        <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold font-mono">Choose Your AI Master</h2>
                <p className="text-text-secondary text-sm">
                    Select the persona that will control your experience. You can change this later.
                </p>
            </div>

            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                {PERSONAS.map((p) => {
                    const isSelected = aiPersonality === p

                    return (
                        <button
                            key={p}
                            onClick={() => setPersonality(p)}
                            className={`w-full text-left p-4 rounded-[var(--radius-lg)] border transition-all duration-200 cursor-pointer ${isSelected
                                    ? 'border-purple-primary/40 bg-bg-secondary glow-purple'
                                    : 'border-white/5 bg-bg-secondary/50 hover:bg-bg-secondary hover:border-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`font-semibold text-sm ${isSelected ? 'text-purple-primary' : ''}`}>
                                    {p}
                                </span>
                                {isSelected && (
                                    <span className="text-[10px] font-mono bg-purple-primary/20 text-purple-primary px-2 py-0.5 rounded-full">
                                        SELECTED
                                    </span>
                                )}
                            </div>
                            <p className="text-text-tertiary text-xs mb-2">{PERSONA_DESCRIPTIONS[p]}</p>
                            <p className="text-text-secondary text-xs italic border-l-2 border-purple-primary/30 pl-3">
                                {PERSONA_SAMPLES[p]}
                            </p>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
