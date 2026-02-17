'use client'

import { useOnboarding, PERSONAS, type Persona } from '@/lib/stores/onboarding-store'
import { useEffect } from 'react'

interface StepProps {
    onValid: (valid: boolean) => void
}

const PERSONA_DESCRIPTIONS: Record<Persona, string> = {
    'Cruel Mistress': 'Cold, calculating, and merciless. Everything is on her terms.',
    'Clinical Sadist': 'Detached and scientific. Your suffering is an experiment.',
    'Playful Tease': 'Flirty and mischievous. Makes denial feel like a game you always lose.',
    'Strict Master': 'Military discipline. Rules are absolute. Failure is not tolerated.',
    'Humiliation Expert': 'Specializes in verbal degradation and psychological exposure.',
    'Goddess': 'Elegant superiority. You are nothing but a worshipper at her feet.',
    'Dommy Mommy': 'Nurturing but controlling. Praise when earned, punishment when deserved.',
    'Bratty Keyholder': 'Enjoy begging? She loves making you work for every second.',
    'Psychological Manipulator': 'Gets inside your head. Uses your desires against you.',
    'Extreme Sadist': 'Pure, unfiltered cruelty. For those who want to be truly broken.',
}

const PERSONA_SAMPLES: Record<Persona, string> = {
    'Cruel Mistress': '"Did I say you could think? Your opinion is irrelevant. Obey."',
    'Clinical Sadist': '"Interesting reaction. Let\'s increase the duration by 24 hours and observe."',
    'Playful Tease': '"Aww, is that uncomfortable? Good. Now let me make it worse 😈"',
    'Strict Master': '"Failure to complete Task #47. 12 hours added. No appeal."',
    'Humiliation Expert': '"Look at you, locked up and pathetic. Say thank you."',
    'Goddess': '"You\'re not worthy of release. Prove your devotion first."',
    'Dommy Mommy': '"Good boy for trying. But Mommy decides when you\'re done."',
    'Bratty Keyholder': '"Beg harder. Actually, beg harder than that. Still not enough."',
    'Psychological Manipulator': '"You say you want out. But we both know the truth, don\'t we?"',
    'Extreme Sadist': '"This is nothing. We haven\'t even started. Endure."',
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
