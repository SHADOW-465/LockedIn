'use client'

import { useState } from 'react'
import type { Availability } from '@/lib/supabase/schema'

interface Props {
    value: Availability | null
    onSave: (value: Availability) => void
    onClose: () => void
}

interface TimeWindow {
    start: string
    end: string
}

export function AvailabilityEditor({ value, onSave, onClose }: Props) {
    const [windows, setWindows] = useState<TimeWindow[]>(
        value?.active_hours?.length ? value.active_hours : [{ start: '09:00', end: '22:00' }]
    )
    const [timezone, setTimezone] = useState(value?.timezone ?? '')

    function updateWindow(index: number, field: 'start' | 'end', val: string) {
        setWindows((prev) => prev.map((w, i) => i === index ? { ...w, [field]: val } : w))
    }

    function addWindow() {
        setWindows((prev) => [...prev, { start: '09:00', end: '22:00' }])
    }

    function removeWindow(index: number) {
        setWindows((prev) => prev.filter((_, i) => i !== index))
    }

    function handleSave() {
        onSave({
            active_hours: windows.filter((w) => w.start && w.end),
            timezone: timezone.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
    }

    return (
        <div className="p-6 space-y-4">
            <div>
                <h2 className="text-lg font-bold text-white">Availability</h2>
                <p className="text-xs text-white/50 mt-1">
                    When you&apos;re available for training. The Master uses this to schedule tasks appropriately.
                </p>
            </div>

            <div className="space-y-3">
                {windows.map((window, i) => (
                    <div key={i} className="p-3 rounded-lg bg-zinc-800 border border-zinc-700 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-white/50">Window {i + 1}</span>
                            {windows.length > 1 && (
                                <button
                                    onClick={() => removeWindow(i)}
                                    className="text-xs text-red-400 hover:text-red-300"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <label className="block text-xs text-white/40 mb-1">Start</label>
                                <input
                                    type="time"
                                    value={window.start}
                                    onChange={(e) => updateWindow(i, 'start', e.target.value)}
                                    className="w-full rounded-lg bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-white/40 mb-1">End</label>
                                <input
                                    type="time"
                                    value={window.end}
                                    onChange={(e) => updateWindow(i, 'end', e.target.value)}
                                    className="w-full rounded-lg bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                                />
                            </div>
                        </div>
                    </div>
                ))}
                <button
                    onClick={addWindow}
                    className="w-full py-2 rounded-lg border border-dashed border-zinc-700 text-xs text-white/40 hover:text-white/60 hover:border-zinc-600 transition"
                >
                    + Add Time Window
                </button>
            </div>

            <div>
                <label className="block text-xs text-white/50 mb-1">Timezone</label>
                <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder={Intl.DateTimeFormat().resolvedOptions().timeZone}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-white/30 px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                />
                <p className="text-xs text-white/30 mt-1">E.g. America/New_York, Europe/London</p>
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
