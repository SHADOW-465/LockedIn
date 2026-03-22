'use client'

import { useState } from 'react'

interface Props {
    field: 'hard_limits' | 'soft_limits'
    value: string[]
    onSave: (value: string[]) => void
    onClose: () => void
}

export function LimitsEditor({ field, value, onSave, onClose }: Props) {
    const [text, setText] = useState(value.join('\n'))

    const isHard = field === 'hard_limits'

    function handleSave() {
        const items = text
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
        onSave(items)
    }

    return (
        <div className="p-6 space-y-4">
            <div>
                <h2 className="text-lg font-bold text-white">
                    {isHard ? 'Hard Limits' : 'Soft Limits'}
                </h2>
                <p className="text-xs text-white/50 mt-1">
                    {isHard
                        ? 'Absolute limits the Master will NEVER cross under any circumstances. One per line.'
                        : 'Limits that can be pushed gently. The Master will approach these with care. One per line.'}
                </p>
            </div>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder={isHard
                    ? 'E.g.\nNo outdoor tasks\nNo involving others\nNo permanent marks'
                    : 'E.g.\nLight humiliation ok\nOccasional pain tasks'}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-white/30 p-3 text-sm resize-none focus:outline-none focus:border-teal-500 font-mono"
            />
            <p className="text-xs text-white/30">Each line = one limit. Blank lines are ignored.</p>
            <div className="flex gap-3">
                <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white/70 text-sm hover:bg-zinc-700 transition"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-500 transition"
                >
                    Save
                </button>
            </div>
        </div>
    )
}
