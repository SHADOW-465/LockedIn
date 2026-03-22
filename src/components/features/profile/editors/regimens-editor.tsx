'use client'

import { useState } from 'react'

const REGIMENS = [
    'Sissy Training',
    'Obedience & Service',
    'CEI Mastery',
    'Edging Endurance',
    'SPH Conditioning',
    'Anal Training',
    'Body Worship',
    'Pet Play Training',
    'Self-Bondage',
    'Chastity Endurance',
    'Body Writing',
    'Exhibitionism Training',
    'Orgasm Control',
    'Mental Conditioning',
    'Wardrobe Control',
    'Domestic Service',
    'Foot Worship',
    'Humiliation Training',
    'Impact Play',
    'Financial Control',
    'Degradation Training',
    'JOI Training',
    'CBT Conditioning',
    'Femdom Worship',
    'Bondage Training',
]

interface Props {
    value: string[]
    onSave: (value: string[]) => void
    onClose: () => void
}

export function RegimensEditor({ value, onSave, onClose }: Props) {
    const [selected, setSelected] = useState<string[]>(value)

    function toggle(regimen: string) {
        setSelected((prev) => {
            if (prev.includes(regimen)) {
                return prev.filter((r) => r !== regimen)
            }
            // Primary goes first if empty, otherwise append
            return [...prev, regimen]
        })
    }

    const primary = selected[0] ?? null

    return (
        <div className="p-6 space-y-4">
            <div>
                <h2 className="text-lg font-bold text-white">Training Regimens</h2>
                <p className="text-xs text-white/50 mt-1">
                    First selected is your primary regimen. All selected influence task generation.
                </p>
            </div>
            {primary && (
                <div className="px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/30">
                    <p className="text-xs text-teal-400">Primary: <span className="font-semibold">{primary}</span></p>
                </div>
            )}
            <div className="grid grid-cols-2 gap-2">
                {REGIMENS.map((regimen) => {
                    const active = selected.includes(regimen)
                    const isPrimary = selected[0] === regimen
                    return (
                        <button
                            key={regimen}
                            onClick={() => toggle(regimen)}
                            className={`px-3 py-2.5 rounded-lg border text-left text-sm transition relative ${
                                active
                                    ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                                    : 'border-zinc-700 bg-zinc-800 text-white/70 hover:border-zinc-600'
                            }`}
                        >
                            {isPrimary && (
                                <span className="absolute top-1 right-1 text-[9px] text-teal-400 font-bold uppercase">primary</span>
                            )}
                            {regimen}
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
