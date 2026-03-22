'use client'

import { useState } from 'react'

const TIERS = [
    { value: 'Newbie', label: 'Newbie', description: 'Gentle intro. Shorter tasks, lighter punishment, encouragement.' },
    { value: 'Slave', label: 'Slave', description: 'Regular obedience training. Moderate tasks, proper punishments.' },
    { value: 'Hardcore', label: 'Hardcore', description: 'Intense conditioning. Demanding tasks, severe punishments.' },
    { value: 'Extreme', label: 'Extreme', description: 'Maximum intensity. Brutal tasks, relentless punishment.' },
    { value: 'Total Destruction', label: 'Total Destruction', description: 'No mercy. Designed to break and rebuild.' },
]

interface Props {
    value: string
    onSave: (value: string) => void
    onClose: () => void
}

export function TierEditor({ value, onSave, onClose }: Props) {
    const [selected, setSelected] = useState(value)

    return (
        <div className="p-6 space-y-4">
            <div>
                <h2 className="text-lg font-bold text-white">Training Tier</h2>
                <p className="text-xs text-white/50 mt-1">
                    Choose your intensity level. This affects task difficulty, punishment severity, and AI tone.
                </p>
            </div>
            <div className="space-y-2">
                {TIERS.map((tier) => (
                    <button
                        key={tier.value}
                        onClick={() => setSelected(tier.value)}
                        className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition ${
                            selected === tier.value
                                ? 'border-teal-500 bg-teal-500/10'
                                : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                        }`}
                    >
                        <div className={`w-4 h-4 mt-0.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            selected === tier.value ? 'border-teal-500' : 'border-zinc-600'
                        }`}>
                            {selected === tier.value && (
                                <div className="w-2 h-2 rounded-full bg-teal-500" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{tier.label}</p>
                            <p className="text-xs text-white/50 mt-0.5">{tier.description}</p>
                        </div>
                    </button>
                ))}
            </div>
            <div className="flex gap-3">
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
