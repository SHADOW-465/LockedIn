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
        <div className="space-y-10">
            <div className="text-left space-y-4 border-l-4 border-white pl-6">
                <h2 className="text-4xl font-display font-bold tracking-tighter uppercase italic">Persona Assignment</h2>
                <p className="text-[var(--color-text-secondary)] font-mono text-xs uppercase tracking-widest opacity-60">
                    SELECT THE CONTROLLING ENTITY. THIS CHOICE IS SYSTEM-PERSISTENT.
                </p>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {PERSONAS.map((p) => {
                    const isSelected = aiPersonality === p

                    return (
                        <button
                            key={p}
                            onClick={() => setPersonality(p)}
                            className={`w-full text-left p-6 border transition-all duration-150 cursor-pointer relative group ${isSelected
                                    ? 'bg-black border-[var(--color-accent)]'
                                    : 'bg-[#050505] border-[#141414] hover:border-[#222]'
                                }`}
                        >
                            {isSelected && (
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--color-accent)]" />
                            )}

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className={`font-display font-bold text-lg uppercase tracking-tight ${isSelected ? 'text-white' : 'text-[#444]'}`}>
                                        {p}
                                    </span>
                                    {isSelected && (
                                        <div className="text-[9px] font-mono font-bold bg-[var(--color-accent)] text-black px-2 py-0.5 uppercase tracking-widest">
                                            ACTIVE_LINK
                                        </div>
                                    )}
                                </div>
                                
                                <p className={`text-[11px] font-mono leading-relaxed uppercase tracking-widest ${isSelected ? 'text-[var(--color-text-secondary)]' : 'text-[#222]'}`}>
                                    {PERSONA_DESCRIPTIONS[p].toUpperCase()}
                                </p>

                                <div className={`p-3 bg-black border ${isSelected ? 'border-[var(--color-accent)]/30' : 'border-[#141414]'}`}>
                                    <p className={`text-[10px] font-mono italic tracking-widest ${isSelected ? 'text-white' : 'text-[#222]'}`}>
                                        &gt; TRANSMISSION_SAMPLE: {PERSONA_SAMPLES[p].toUpperCase()}
                                    </p>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
