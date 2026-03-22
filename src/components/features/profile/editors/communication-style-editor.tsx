'use client'

import { useState } from 'react'
import type { CommunicationStyle } from '@/lib/supabase/schema'

interface Props {
    value: CommunicationStyle | null
    onSave: (value: CommunicationStyle) => void
    onClose: () => void
}

export function CommunicationStyleEditor({ value, onSave, onClose }: Props) {
    const [feedbackFrequency, setFeedbackFrequency] = useState<CommunicationStyle['feedback_frequency']>(
        value?.feedback_frequency ?? 'moderate'
    )
    const [tonePreference, setTonePreference] = useState<CommunicationStyle['tone_preference']>(
        value?.tone_preference ?? 'balanced'
    )
    const [punishmentSensitivity, setPunishmentSensitivity] = useState<CommunicationStyle['punishment_sensitivity']>(
        value?.punishment_sensitivity ?? 'moderate'
    )

    function handleSave() {
        onSave({
            feedback_frequency: feedbackFrequency,
            tone_preference: tonePreference,
            punishment_sensitivity: punishmentSensitivity,
        })
    }

    return (
        <div className="p-6 space-y-5">
            <div>
                <h2 className="text-lg font-bold text-white">Communication Style</h2>
                <p className="text-xs text-white/50 mt-1">
                    How the Master interacts with you during sessions.
                </p>
            </div>

            <div className="space-y-1">
                <label className="block text-sm text-white/70 font-medium">Feedback Frequency</label>
                <p className="text-xs text-white/40 mb-2">How often the Master comments on your performance</p>
                <div className="flex gap-2">
                    {(['minimal', 'moderate', 'frequent'] as const).map((opt) => (
                        <button
                            key={opt}
                            onClick={() => setFeedbackFrequency(opt)}
                            className={`flex-1 py-2 rounded-lg border text-sm capitalize transition ${
                                feedbackFrequency === opt
                                    ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                                    : 'border-zinc-700 bg-zinc-800 text-white/60 hover:border-zinc-600'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-1">
                <label className="block text-sm text-white/70 font-medium">Tone Preference</label>
                <p className="text-xs text-white/40 mb-2">The Master&apos;s communication style</p>
                <div className="flex gap-2">
                    {(['strict', 'balanced', 'encouraging'] as const).map((opt) => (
                        <button
                            key={opt}
                            onClick={() => setTonePreference(opt)}
                            className={`flex-1 py-2 rounded-lg border text-sm capitalize transition ${
                                tonePreference === opt
                                    ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                                    : 'border-zinc-700 bg-zinc-800 text-white/60 hover:border-zinc-600'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-1">
                <label className="block text-sm text-white/70 font-medium">Punishment Sensitivity</label>
                <p className="text-xs text-white/40 mb-2">Intensity of punishment responses</p>
                <div className="flex gap-2">
                    {(['mild', 'moderate', 'severe'] as const).map((opt) => (
                        <button
                            key={opt}
                            onClick={() => setPunishmentSensitivity(opt)}
                            className={`flex-1 py-2 rounded-lg border text-sm capitalize transition ${
                                punishmentSensitivity === opt
                                    ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                                    : 'border-zinc-700 bg-zinc-800 text-white/60 hover:border-zinc-600'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
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
