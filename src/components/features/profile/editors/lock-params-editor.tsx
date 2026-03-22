'use client'

import { useState } from 'react'

interface Props {
    goalHours: number
    safeword: string
    onSave: (value: { initial_lock_goal_hours: number; safeword: string }) => void
    onClose: () => void
}

export function LockParamsEditor({ goalHours, safeword, onSave, onClose }: Props) {
    const [hours, setHours] = useState(String(goalHours))
    const [word, setWord] = useState(safeword)

    function handleSave() {
        const parsed = parseInt(hours, 10)
        onSave({
            initial_lock_goal_hours: isNaN(parsed) || parsed < 1 ? 168 : parsed,
            safeword: word.trim() || 'MERCY',
        })
    }

    return (
        <div className="p-6 space-y-4">
            <div>
                <h2 className="text-lg font-bold text-white">Lock Parameters</h2>
                <p className="text-xs text-white/50 mt-1">
                    Default lock duration goal and your safeword for activating Care Mode.
                </p>
            </div>
            <div className="space-y-3">
                <div>
                    <label className="block text-xs text-white/50 mb-1">Default Lock Goal (hours)</label>
                    <input
                        type="number"
                        min={1}
                        max={8760}
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-white/30 px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                    />
                    <p className="text-xs text-white/30 mt-1">
                        {parseInt(hours, 10) > 0 ? `${(parseInt(hours, 10) / 24).toFixed(1)} days` : ''}
                    </p>
                </div>
                <div>
                    <label className="block text-xs text-white/50 mb-1">Safeword</label>
                    <input
                        type="text"
                        value={word}
                        onChange={(e) => setWord(e.target.value)}
                        placeholder="MERCY"
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-white/30 px-3 py-2 text-sm focus:outline-none focus:border-teal-500 uppercase"
                    />
                    <p className="text-xs text-white/30 mt-1">
                        Type this word in chat to activate Care Mode. All punishment pauses.
                    </p>
                </div>
            </div>
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
