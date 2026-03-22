'use client'

import { useState } from 'react'

const PERSONAS = [
    { value: 'Cruel Mistress', description: 'Icy and bored. Everything on her terms. Silence is punishment.' },
    { value: 'Clinical Sadist', description: 'Detached, scientific. Your suffering is data.' },
    { value: 'Playful Tease', description: 'Flirty and cruel in small ways. Loves making you wait.' },
    { value: 'Strict Master', description: 'Military precision. Commands only. Failure is logged. No appeals.' },
    { value: 'Humiliation Expert', description: 'Picks the exact phrase that cuts. Compliments to make the fall harder.' },
    { value: 'Goddess', description: 'Receives worship as her natural state.' },
    { value: 'Dommy Mommy', description: 'Warm and controlling. Disappointment hurts more than cruelty.' },
    { value: 'Bratty Keyholder', description: 'Changes the rules mid-sentence. Makes you work for every second.' },
    { value: 'Psychological Manipulator', description: 'Never direct. Uses your words against you.' },
    { value: 'Extreme Sadist', description: 'Pure, unfiltered. No warmth, no mercy, no explanation.' },
]

interface Props {
    value: string
    onSave: (value: string) => void
    onClose: () => void
}

export function PersonaEditor({ value, onSave, onClose }: Props) {
    const [selected, setSelected] = useState(value)

    return (
        <div className="p-6 space-y-4">
            <div>
                <h2 className="text-lg font-bold text-white">AI Master Persona</h2>
                <p className="text-xs text-white/50 mt-1">
                    Choose your Master&apos;s personality. This controls tone, chat style, and punishment narration.
                </p>
            </div>
            <div className="space-y-2">
                {PERSONAS.map((persona) => (
                    <button
                        key={persona.value}
                        onClick={() => setSelected(persona.value)}
                        className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition ${
                            selected === persona.value
                                ? 'border-teal-500 bg-teal-500/10'
                                : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                        }`}
                    >
                        <div className={`w-4 h-4 mt-0.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            selected === persona.value ? 'border-teal-500' : 'border-zinc-600'
                        }`}>
                            {selected === persona.value && (
                                <div className="w-2 h-2 rounded-full bg-teal-500" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{persona.value}</p>
                            <p className="text-xs text-white/50 mt-0.5">{persona.description}</p>
                        </div>
                    </button>
                ))}
            </div>
            <div className="flex gap-3 pb-2">
                <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white/70 text-sm hover:bg-zinc-700 transition"
                >
                    Cancel
                </button>
                <button
                    onClick={() => onSave(selected)}
                    className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-500 transition"
                >
                    Save
                </button>
            </div>
        </div>
    )
}
