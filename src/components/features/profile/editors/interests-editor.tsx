'use client'

import { useState } from 'react'

const INTERESTS = [
    'Chastity & Denial',
    'Edging & Orgasm Control',
    'CBT',
    'SPH',
    'CEI',
    'Sissy Training',
    'Femdom Worship',
    'Humiliation',
    'Body Writing',
    'Anal Training',
    'Bondage',
    'Impact Play',
    'Foot Worship',
    'Pet Play',
    'Degradation',
    'Financial Domination',
    'Exhibitionism',
    'JOI',
]

interface Props {
    value: string[]
    onSave: (value: string[]) => void
    onClose: () => void
}

export function InterestsEditor({ value, onSave, onClose }: Props) {
    const [selected, setSelected] = useState<string[]>(value)

    function toggle(interest: string) {
        setSelected((prev) =>
            prev.includes(interest)
                ? prev.filter((i) => i !== interest)
                : [...prev, interest]
        )
    }

    return (
        <div className="p-6 space-y-4">
            <div>
                <h2 className="text-lg font-bold text-white">Fetish Interests</h2>
                <p className="text-xs text-white/50 mt-1">
                    Select all that apply. The Master uses this to tailor tasks and themes.
                </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {INTERESTS.map((interest) => {
                    const active = selected.includes(interest)
                    return (
                        <button
                            key={interest}
                            onClick={() => toggle(interest)}
                            className={`px-3 py-2.5 rounded-lg border text-left text-sm transition ${
                                active
                                    ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                                    : 'border-zinc-700 bg-zinc-800 text-white/70 hover:border-zinc-600'
                            }`}
                        >
                            {interest}
                        </button>
                    )
                })}
            </div>
            <p className="text-xs text-white/30">{selected.length} selected</p>
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
