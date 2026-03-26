'use client'

import type { PrefUpdate } from '@/lib/ai/pref-update-parser'

const FIELD_LABELS: Record<string, string> = {
    master_preference: 'Master Preference',
    session_intent: 'Session Goals & Intent',
    privacy_constraints: 'Privacy Constraints',
    psych_profile: 'Psych Profile',
}

interface PrefUpdateSheetProps {
    updates: PrefUpdate[]
    onConfirm: () => void
    onDismiss: () => void
}

export function PrefUpdateSheet({ updates, onConfirm, onDismiss }: PrefUpdateSheetProps) {
    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60" onClick={onDismiss} />

            {/* Sheet */}
            <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-teal-950 border-t border-teal-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-teal-400" />
                    <h3 className="text-teal-300 font-semibold text-sm uppercase tracking-widest">Care Mode — Save Preference?</h3>
                </div>

                <p className="text-white/70 text-sm mb-4">
                    Your Master detected the following preference. Save it permanently to your profile?
                </p>

                <div className="space-y-3 mb-6">
                    {updates.map((update, i) => (
                        <div key={i} className="p-3 rounded-lg bg-teal-900/50 border border-teal-700/50">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-teal-400 text-xs font-medium">
                                    {FIELD_LABELS[update.field] || update.field}
                                </span>
                                <span className="text-xs px-1.5 py-0.5 rounded bg-teal-700/50 text-teal-300">
                                    {update.action === 'append' ? 'ADD' : 'SET'}
                                </span>
                            </div>
                            <p className="text-white/80 text-sm">{update.value}</p>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onDismiss}
                        className="flex-1 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white/60 text-sm hover:bg-zinc-700 transition"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-500 transition"
                    >
                        Save to Profile
                    </button>
                </div>
            </div>
        </div>
    )
}
