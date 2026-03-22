'use client'

import { useState } from 'react'
import type { UserProfile } from '@/lib/supabase/schema'

type PhysicalDetails = UserProfile['physical_details']

interface Props {
    value: PhysicalDetails
    onSave: (value: PhysicalDetails) => void
    onClose: () => void
}

export function PhysicalDetailsEditor({ value, onSave, onClose }: Props) {
    const [bodyType, setBodyType] = useState(value?.bodyType ?? '')
    const [orientation, setOrientation] = useState(value?.orientation ?? '')
    const [genderIdentity, setGenderIdentity] = useState(value?.genderIdentity ?? '')
    const [notes, setNotes] = useState(value?.notes ?? '')

    function handleSave() {
        const updated: PhysicalDetails = {
            ...(value ?? {}),
            bodyType: bodyType || undefined,
            orientation: orientation || undefined,
            genderIdentity: genderIdentity || undefined,
            notes: notes || undefined,
        }
        onSave(updated)
    }

    return (
        <div className="p-6 space-y-4">
            <div>
                <h2 className="text-lg font-bold text-white">Physical Details</h2>
                <p className="text-xs text-white/50 mt-1">
                    Used by the Master to calibrate tasks appropriately. All fields are optional.
                </p>
            </div>
            <div className="space-y-3">
                <div>
                    <label className="block text-xs text-white/50 mb-1">Body Type</label>
                    <input
                        type="text"
                        value={bodyType}
                        onChange={(e) => setBodyType(e.target.value)}
                        placeholder="E.g. slim, athletic, average, chubby..."
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-white/30 px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                    />
                </div>
                <div>
                    <label className="block text-xs text-white/50 mb-1">Gender Identity</label>
                    <input
                        type="text"
                        value={genderIdentity}
                        onChange={(e) => setGenderIdentity(e.target.value)}
                        placeholder="E.g. male, female, non-binary, trans woman..."
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-white/30 px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                    />
                </div>
                <div>
                    <label className="block text-xs text-white/50 mb-1">Orientation</label>
                    <input
                        type="text"
                        value={orientation}
                        onChange={(e) => setOrientation(e.target.value)}
                        placeholder="E.g. straight, gay, bisexual, pansexual..."
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-white/30 px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                    />
                </div>
                <div>
                    <label className="block text-xs text-white/50 mb-1">Additional Notes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Any other physical details relevant to your training..."
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-white/30 px-3 py-2 text-sm resize-none focus:outline-none focus:border-teal-500"
                    />
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
