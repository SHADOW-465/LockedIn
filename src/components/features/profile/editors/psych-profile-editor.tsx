'use client'

import { useState } from 'react'

interface Props {
    value: string
    onSave: (value: string) => void
    onClose: () => void
}

export function PsychProfileEditor({ value, onSave, onClose }: Props) {
    const [text, setText] = useState(value)

    return (
        <div className="p-6 space-y-4">
            <div>
                <h2 className="text-lg font-bold text-white">Psych Profile</h2>
                <p className="text-xs text-white/50 mt-1">
                    Psychological calibration data for the AI Master. Describe your motivations, triggers, headspace, and what drives you to submit.
                </p>
            </div>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder="Describe your psychology, motivations, what you find most challenging, what kind of dominance resonates with you..."
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-white/30 p-3 text-sm resize-none focus:outline-none focus:border-teal-500"
            />
            <div className="flex gap-3">
                <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white/70 text-sm hover:bg-zinc-700 transition"
                >
                    Cancel
                </button>
                <button
                    onClick={() => onSave(text)}
                    className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-500 transition"
                >
                    Save
                </button>
            </div>
        </div>
    )
}
