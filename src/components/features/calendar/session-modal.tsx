'use client'

import { useState } from 'react'
import { format, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns'
import { X, Lock, Unlock, Clock, Target, Shield, Check, AlertCircle, Loader2, Sparkles, ChevronRight, Edit3 } from 'lucide-react'
import type { Session } from '@/lib/supabase/schema'
import Link from 'next/link'

interface SessionModalProps {
    date: Date
    activeSession: Session | null
    daySession: Session | null
    userId: string
    onClose: () => void
    onSuccess: () => void
}

const DURATION_PRESETS = [
    { label: '24 Hours', hours: 24 },
    { label: '3 Days', hours: 72 },
    { label: '7 Days', hours: 168 },
    { label: '2 Weeks', hours: 336 },
    { label: '1 Month', hours: 720 },
]

const DEVICE_PRESETS = [
    'Silicone Cage',
    'Steel Cage',
    'Hybrid Cage',
    'Comfort Fit',
    'Custom Device',
]

export function SessionModal({
    date,
    activeSession,
    daySession,
    userId,
    onClose,
    onSuccess,
}: SessionModalProps) {
    const formattedDateStr = format(date, 'yyyy-MM-dd')
    const now = new Date()
    const isPastDate = date < new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // If daySession or activeSession exists on this day
    const existingSession = daySession || (activeSession && (
        format(new Date(activeSession.start_time), 'yyyy-MM-dd') <= formattedDateStr &&
        format(new Date(activeSession.scheduled_end_time), 'yyyy-MM-dd') >= formattedDateStr
    ) ? activeSession : null)

    // Form states for creating / logging
    const [isOngoing, setIsOngoing] = useState(true)
    const [selectedTime, setSelectedTime] = useState(
        isPastDate ? '12:00' : format(now, 'HH:mm')
    )
    const [durationHours, setDurationHours] = useState(168) // 7 days default
    const [isOpenEnded, setIsOpenEnded] = useState(false)
    const [device, setDevice] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form states for adjusting existing session
    const [editingStart, setEditingStart] = useState(false)
    const [editStartTime, setEditStartTime] = useState(
        existingSession ? format(new Date(existingSession.start_time), "yyyy-MM-dd'T'HH:mm") : ''
    )
    const [editingGoal, setEditingGoal] = useState(false)
    const [extendHours, setExtendHours] = useState(24)
    const [actionLoading, setActionLoading] = useState(false)

    // Helper to calculate progress & elapsed time
    const getSessionProgress = (sess: Session) => {
        const start = new Date(sess.start_time).getTime()
        const end = new Date(sess.scheduled_end_time).getTime()
        const current = sess.status === 'completed' && sess.actual_end_time
            ? new Date(sess.actual_end_time).getTime()
            : Date.now()

        const total = Math.max(1, end - start)
        const elapsed = Math.max(0, current - start)
        const percent = Math.min(100, Math.round((elapsed / total) * 100))

        const elapsedDays = Math.floor(elapsed / (1000 * 60 * 60 * 24))
        const elapsedHours = Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const elapsedMins = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60))

        const remainingMs = Math.max(0, end - current)
        const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24))
        const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

        return {
            percent,
            elapsedStr: elapsedDays > 0 ? `${elapsedDays}d ${elapsedHours}h` : `${elapsedHours}h ${elapsedMins}m`,
            remainingStr: remainingMs <= 0 ? 'Goal Reached' : remainingDays > 0 ? `${remainingDays}d ${remainingHours}h left` : `${remainingHours}h left`,
        }
    }

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Build ISO start time string
            const startDateTime = new Date(`${formattedDateStr}T${selectedTime}:00`)
            if (isNaN(startDateTime.getTime())) {
                throw new Error('Invalid start time selected')
            }

            const targetHours = isOpenEnded ? 8760 : durationHours // 1 year if open-ended
            const res = await fetch('/api/sessions/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    config: {
                        tier: 'Newbie',
                        desired_duration_minutes: targetHours * 60,
                        startTime: startDateTime.toISOString(),
                        isCompleted: !isOngoing,
                        device: device || undefined,
                        notes: notes || undefined,
                    },
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                if (data.error === 'active_session_exists') {
                    throw new Error('An active session already exists. You can adjust it below or end it first.')
                }
                throw new Error(data.error || 'Failed to log session')
            }

            onSuccess()
            onClose()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to start session')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStartTime = async () => {
        if (!existingSession) return
        setActionLoading(true)
        setError('')
        try {
            const newStart = new Date(editStartTime)
            if (isNaN(newStart.getTime())) throw new Error('Invalid date')

            // Calculate new end time to preserve duration
            const durationMs = existingSession.total_duration_minutes * 60 * 1000
            const newEnd = new Date(newStart.getTime() + durationMs)

            const res = await fetch('/api/sessions/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: existingSession.id,
                    userId,
                    startTime: newStart.toISOString(),
                    scheduledEndTime: newEnd.toISOString(),
                }),
            })

            if (!res.ok) throw new Error('Failed to update start time')
            setEditingStart(false)
            onSuccess()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error updating start time')
        } finally {
            setActionLoading(false)
        }
    }

    const handleExtendGoal = async () => {
        if (!existingSession) return
        setActionLoading(true)
        setError('')
        try {
            const res = await fetch('/api/sessions/extend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: existingSession.id,
                    userId,
                    deltaMinutes: extendHours * 60,
                    reason: 'Goal adjustment from Calendar',
                }),
            })

            if (!res.ok) throw new Error('Failed to adjust goal')
            setEditingGoal(false)
            onSuccess()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error adjusting goal')
        } finally {
            setActionLoading(false)
        }
    }

    const handleEndSession = async () => {
        if (!existingSession) return
        if (!confirm('Are you sure you want to log unlock and complete this session?')) return
        setActionLoading(true)
        try {
            const res = await fetch('/api/sessions/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: existingSession.id,
                    userId,
                }),
            })
            if (!res.ok) throw new Error('Failed to end session')
            onSuccess()
            onClose()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error ending session')
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
            <div
                className="w-full max-w-lg bg-zinc-950 border border-zinc-800 sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[var(--accent-dim)] border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
                            <Lock size={16} />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white">
                                {format(date, 'EEEE, MMMM d, yyyy')}
                            </h2>
                            <p className="text-xs text-white/40">
                                {existingSession
                                    ? (existingSession.status === 'active' ? '🟢 Active Chastity Session' : '🏁 Completed Session')
                                    : 'Log or Continue Chastity Session'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white/60 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mx-5 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle size={15} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Content Area */}
                <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
                    {existingSession ? (
                        /* ============================================================ */
                        /* VIEW / EDIT EXISTING SESSION                                 */
                        /* ============================================================ */
                        <div className="space-y-4">
                            {/* Summary Card */}
                            {(() => {
                                const prog = getSessionProgress(existingSession)
                                const config = existingSession.session_config as Record<string, unknown> | null
                                return (
                                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs uppercase tracking-wider font-semibold text-white/40">
                                                Session Status
                                            </span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                existingSession.status === 'active'
                                                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                                                    : 'bg-zinc-800 text-white/60'
                                            }`}>
                                                {existingSession.status.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-mono">
                                                <span className="text-white font-semibold">Locked: {prog.elapsedStr}</span>
                                                <span className="text-[var(--accent)]">{prog.remainingStr}</span>
                                            </div>
                                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[var(--accent)] transition-all duration-500"
                                                    style={{ width: `${prog.percent}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-xs">
                                            <div>
                                                <span className="text-white/40 block">Lock Start:</span>
                                                <span className="font-mono text-white font-medium">
                                                    {format(new Date(existingSession.start_time), 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-white/40 block">Scheduled Goal:</span>
                                                <span className="font-mono text-white font-medium">
                                                    {format(new Date(existingSession.scheduled_end_time), 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                            {config?.device && (
                                                <div className="col-span-2">
                                                    <span className="text-white/40 block">Device:</span>
                                                    <span className="text-white font-medium">{String(config.device)}</span>
                                                </div>
                                            )}
                                            {config?.notes && (
                                                <div className="col-span-2">
                                                    <span className="text-white/40 block">Intent / Notes:</span>
                                                    <span className="text-white/70 italic">&ldquo;{String(config.notes)}&rdquo;</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* Adjust Start Time Inline Form */}
                            {editingStart ? (
                                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 space-y-3">
                                    <p className="text-xs font-semibold text-white">Adjust Lock Start Time</p>
                                    <input
                                        type="datetime-local"
                                        value={editStartTime}
                                        onChange={(e) => setEditStartTime(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-[var(--accent)]"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditingStart(false)}
                                            className="flex-1 py-1.5 rounded-lg bg-zinc-800 text-white/60 text-xs hover:bg-zinc-700 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={handleUpdateStartTime}
                                            className="flex-1 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1"
                                        >
                                            {actionLoading ? <Loader2 size={12} className="animate-spin" /> : 'Save Time'}
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {/* Adjust Goal Duration Inline Form */}
                            {editingGoal ? (
                                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 space-y-3">
                                    <p className="text-xs font-semibold text-white">Extend or Adjust Goal</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[12, 24, 48, 72, 168].map((hrs) => (
                                            <button
                                                key={hrs}
                                                type="button"
                                                onClick={() => setExtendHours(hrs)}
                                                className={`py-1.5 px-2 rounded-lg text-xs font-mono border transition ${
                                                    extendHours === hrs
                                                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                                                        : 'bg-zinc-800 text-white/70 border-zinc-700 hover:bg-zinc-700'
                                                }`}
                                            >
                                                +{hrs >= 24 ? `${hrs / 24}d` : `${hrs}h`}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditingGoal(false)}
                                            className="flex-1 py-1.5 rounded-lg bg-zinc-800 text-white/60 text-xs hover:bg-zinc-700 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={handleExtendGoal}
                                            className="flex-1 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1"
                                        >
                                            {actionLoading ? <Loader2 size={12} className="animate-spin" /> : `Add ${extendHours}h`}
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {/* Actions Group */}
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingStart(!editingStart)}
                                        className="py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-white/80 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                                    >
                                        <Clock size={14} className="text-white/40" />
                                        Adjust Start
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingGoal(!editingGoal)}
                                        className="py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-white/80 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                                    >
                                        <Target size={14} className="text-white/40" />
                                        Adjust Goal
                                    </button>
                                </div>

                                {existingSession.status === 'active' && (
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={handleEndSession}
                                        className="w-full py-2.5 px-3 rounded-xl bg-red-950/40 border border-red-800/40 hover:bg-red-900/40 text-xs text-red-300 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                                    >
                                        <Unlock size={14} />
                                        Log Unlock & Complete Session
                                    </button>
                                )}

                                <Link
                                    href="/home"
                                    onClick={onClose}
                                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs text-center text-white/70 font-medium flex items-center justify-center gap-1.5 transition"
                                >
                                    Go to Live Home Timer <ChevronRight size={14} />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        /* ============================================================ */
                        /* CREATE / LOG NEW CHASTITY SESSION                            */
                        /* ============================================================ */
                        <form onSubmit={handleCreateSession} className="space-y-4">
                            {/* Session Type Switch: Currently Locked vs Past Log */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-white/40 uppercase tracking-wide">
                                    Tracking Mode
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsOngoing(true)}
                                        className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                                            isOngoing
                                                ? 'bg-teal-950/40 border-teal-500/50 text-white'
                                                : 'bg-zinc-900 border-zinc-800 text-white/50 hover:text-white/80'
                                        }`}
                                    >
                                        <div className={`w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 ${isOngoing ? 'bg-teal-400' : 'border border-zinc-600'}`} />
                                        <div>
                                            <p className="text-xs font-semibold">Currently Locked</p>
                                            <p className="text-[10px] text-white/40">Continues active timer</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsOngoing(false)}
                                        className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                                            !isOngoing
                                                ? 'bg-zinc-800 border-zinc-600 text-white'
                                                : 'bg-zinc-900 border-zinc-800 text-white/50 hover:text-white/80'
                                        }`}
                                    >
                                        <div className={`w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 ${!isOngoing ? 'bg-white' : 'border border-zinc-600'}`} />
                                        <div>
                                            <p className="text-xs font-semibold">Past Log</p>
                                            <p className="text-[10px] text-white/40">Record completed cycle</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Lock Start Time */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wide flex items-center gap-1.5">
                                        <Clock size={13} />
                                        Lock Start Time
                                    </label>
                                    <span className="text-[11px] font-mono text-[var(--accent)] font-medium">
                                        {format(date, 'MMM d')} at {selectedTime}
                                    </span>
                                </div>

                                <div className="grid grid-cols-4 gap-1.5">
                                    {[
                                        { label: 'Morning', time: '08:00' },
                                        { label: 'Noon', time: '12:00' },
                                        { label: 'Evening', time: '18:00' },
                                        { label: 'Night', time: '21:00' },
                                    ].map((p) => (
                                        <button
                                            key={p.label}
                                            type="button"
                                            onClick={() => setSelectedTime(p.time)}
                                            className={`py-1.5 px-2 rounded-lg text-xs font-mono border transition ${
                                                selectedTime === p.time
                                                    ? 'bg-[var(--accent)] text-white border-[var(--accent)] font-semibold'
                                                    : 'bg-zinc-900 border-zinc-800 text-white/60 hover:bg-zinc-800'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>

                                <input
                                    type="time"
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm font-mono focus:outline-none focus:border-zinc-700"
                                />
                            </div>

                            {/* Goal Duration */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wide flex items-center gap-1.5">
                                        <Target size={13} />
                                        Lock Goal
                                    </label>
                                    <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isOpenEnded}
                                            onChange={(e) => setIsOpenEnded(e.target.checked)}
                                            className="rounded border-zinc-700 bg-zinc-900 text-[var(--accent)] focus:ring-0"
                                        />
                                        Open-Ended
                                    </label>
                                </div>

                                {!isOpenEnded && (
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                                        {DURATION_PRESETS.map((p) => (
                                            <button
                                                key={p.hours}
                                                type="button"
                                                onClick={() => setDurationHours(p.hours)}
                                                className={`py-2 px-2 rounded-xl text-xs font-mono border transition text-center ${
                                                    durationHours === p.hours
                                                        ? 'bg-[var(--accent)] text-white border-[var(--accent)] font-semibold'
                                                        : 'bg-zinc-900 border-zinc-800 text-white/60 hover:bg-zinc-800'
                                                }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Device Used (Optional) */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-white/40 uppercase tracking-wide flex items-center gap-1.5">
                                    <Shield size={13} />
                                    Device (Optional)
                                </label>
                                <div className="flex flex-wrap gap-1.5 mb-1.5">
                                    {DEVICE_PRESETS.map((d) => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setDevice(device === d ? '' : d)}
                                            className={`px-2.5 py-1 rounded-full text-xs transition border ${
                                                device === d
                                                    ? 'bg-zinc-700 text-white border-zinc-500'
                                                    : 'bg-zinc-900 text-white/50 border-zinc-800 hover:text-white/80'
                                            }`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={device}
                                    onChange={(e) => setDevice(e.target.value)}
                                    placeholder="Or type device name..."
                                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-zinc-700"
                                />
                            </div>

                            {/* Intent / Daily Note */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-white/40 uppercase tracking-wide">
                                    Lock Intent / Note (Optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    placeholder="E.g., Starting fresh cycle, focusing on discipline..."
                                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-zinc-700 resize-none"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl font-semibold text-sm text-white transition hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                style={{ backgroundColor: 'var(--accent)' }}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Logging Session...
                                    </>
                                ) : isOngoing ? (
                                    <>
                                        <Lock size={16} />
                                        Start / Continue Tracking Session
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        Save Completed Log
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
