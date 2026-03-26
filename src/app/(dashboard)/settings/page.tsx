'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'
import { HardDrive, ExternalLink, RefreshCw, Loader2 as DriveLoader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ProfileStrengthRing } from '@/components/features/profile/profile-strength-ring'
import { MasterPreferenceEditor } from '@/components/features/profile/editors/master-preference-editor'
import { SessionIntentEditor } from '@/components/features/profile/editors/session-intent-editor'
import { TierEditor } from '@/components/features/profile/editors/tier-editor'
import { PersonaEditor } from '@/components/features/profile/editors/persona-editor'
import { LimitsEditor } from '@/components/features/profile/editors/limits-editor'
import { InterestsEditor } from '@/components/features/profile/editors/interests-editor'
import { RegimensEditor } from '@/components/features/profile/editors/regimens-editor'
import { PsychProfileEditor } from '@/components/features/profile/editors/psych-profile-editor'
import { PhysicalDetailsEditor } from '@/components/features/profile/editors/physical-details-editor'
import { CommunicationStyleEditor } from '@/components/features/profile/editors/communication-style-editor'
import { LockParamsEditor } from '@/components/features/profile/editors/lock-params-editor'
import { AvailabilityEditor } from '@/components/features/profile/editors/availability-editor'
import { emergencyRelease, getActiveSession } from '@/lib/supabase/sessions'
import { getSupabase } from '@/lib/supabase/client'
import { signOut } from '@/lib/supabase/auth'
import { PunishmentPoolEditor } from '@/components/features/punishment/punishment-pool-editor'
import { THEMES, applyTheme } from '@/lib/themes'
import { connectDrive, disconnectDrive, getDriveState } from '@/lib/google-drive/drive-client'
import { getQueue, type QueueEntry } from '@/lib/google-drive/upload-queue'
import { retryQueueEntry, uploadSessionArchive } from '@/lib/google-drive/session-uploader'
import { listUserArchives } from '@/lib/local-storage/session-archive'

export default function SettingsPage() {
    const { user, profile, loading, refreshProfile } = useAuth()
    const router = useRouter()

    const [openCard, setOpenCard] = useState<string | null>(null)
    const [sessionLocked, setSessionLocked] = useState(false)
    const [hasActiveSession, setHasActiveSession] = useState(false)
    const [masterReviewLoading, setMasterReviewLoading] = useState(false)
    const [masterReview, setMasterReview] = useState<string | null>(null)
    const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [themeChanging, setThemeChanging] = useState(false)
    const [driveState, setDriveState] = useState<ReturnType<typeof getDriveState>>(null)
    const [driveQueue, setDriveQueue] = useState<QueueEntry[]>([])
    const [driveConnecting, setDriveConnecting] = useState(false)
    const [driveUploading, setDriveUploading] = useState(false)
    const [driveUploadProgress, setDriveUploadProgress] = useState<{ current: number; total: number } | null>(null)

    // Check for active session on mount
    useEffect(() => {
        if (!user) return
        getActiveSession(user.id).then((session) => {
            setHasActiveSession(!!session)
        })
    }, [user])

    // Load Drive state on mount
    useEffect(() => {
        setDriveState(getDriveState())
        setDriveQueue(getQueue())
    }, [])

    const handleConnectDrive = async () => {
        setDriveConnecting(true)
        try {
            await connectDrive()
            setDriveState(getDriveState())
        } catch (err) {
            console.error('[Settings] Drive connect failed:', err)
        } finally {
            setDriveConnecting(false)
        }
    }

    const handleDisconnectDrive = () => {
        disconnectDrive()
        setDriveState(null)
    }

    const handleRetryEntry = async (entry: QueueEntry) => {
        if (!user) return
        await retryQueueEntry(user.id, entry)
        setDriveQueue(getQueue())
    }

    const handleUploadPastSessions = async () => {
        if (!user || driveUploading) return
        setDriveUploading(true)
        try {
            const archives = await listUserArchives(user.id)
            setDriveUploadProgress({ current: 0, total: archives.length })
            for (let i = 0; i < archives.length; i++) {
                setDriveUploadProgress({ current: i + 1, total: archives.length })
                try {
                    await uploadSessionArchive(user.id, archives[i])
                } catch {
                    // individual session failures are queued inside uploadSessionArchive
                }
            }
            setDriveQueue(getQueue())
        } finally {
            setDriveUploading(false)
            setDriveUploadProgress(null)
        }
    }

    // Save helper — PATCH /api/profile/update
    async function saveField(fields: Record<string, unknown>) {
        const res = await fetch('/api/profile/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user?.id, ...fields }),
        })
        if (res.status === 403) {
            setSessionLocked(true)
            setOpenCard(null)
            return
        }
        if (res.ok) {
            await refreshProfile()
            setOpenCard(null)
        }
    }

    // AI Master Review
    async function requestMasterReview() {
        setMasterReviewLoading(true)
        try {
            const res = await fetch('/api/profile/suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileSection: 'full profile review' }),
            })
            const data = await res.json()
            setMasterReview(
                Array.isArray(data.suggestions) ? data.suggestions.join('\n\n') : data.suggestions ?? null
            )
        } catch {
            setMasterReview('The Master is unavailable right now. Try again later.')
        } finally {
            setMasterReviewLoading(false)
        }
    }

    // Emergency release (preserved from original page)
    const handleEmergencyRelease = async () => {
        if (!user) return
        setProcessing(true)
        const session = await getActiveSession(user.id)
        if (session) {
            await emergencyRelease(session.id)
            const supabase = getSupabase()
            await supabase
                .from('profiles')
                .update({
                    willpower_score: Math.max((profile?.willpower_score ?? 50) - 30, 0),
                    compliance_streak: 0,
                })
                .eq('id', user.id)
        }
        setProcessing(false)
        setShowEmergencyConfirm(false)
        setHasActiveSession(false)
        await refreshProfile()
        router.refresh()
    }

    const handleSignOut = async () => {
        try {
            setProcessing(true)
            await signOut()
            router.refresh()
            router.replace('/login')
        } catch (error) {
            console.error('Sign out failed:', error)
            setProcessing(false)
        }
    }

    async function handleThemeChange(themeName: string) {
        if (themeChanging || hasActiveSession) return
        setThemeChanging(true)
        // Apply immediately for instant preview
        applyTheme(themeName)
        try {
            const res = await fetch('/api/profile/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, theme: themeName }),
            })
            if (res.ok) {
                await refreshProfile()
            } else {
                // Revert on server error
                applyTheme(profile?.theme ?? 'crimson')
            }
        } catch {
            // Revert on network failure
            applyTheme(profile?.theme ?? 'crimson')
        } finally {
            setThemeChanging(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-black">
                <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!profile) return null

    // 13 profile cards
    const cards = [
        {
            id: 'master_preference',
            title: 'Master Preference',
            value: profile.master_preference ? profile.master_preference.slice(0, 40) + (profile.master_preference.length > 40 ? '…' : '') : 'Not set',
            description: 'Hard constraints the AI never violates',
        },
        {
            id: 'session_intent',
            title: 'Session Goals & Intent',
            value: profile.session_intent ? profile.session_intent.slice(0, 40) + (profile.session_intent.length > 40 ? '…' : '') : 'Not set',
            description: 'What you want to achieve this session',
        },
        {
            id: 'tier',
            title: 'Training Tier',
            value: profile.tier || 'Newbie',
            description: 'Intensity level of your training',
        },
        {
            id: 'ai_personality',
            title: 'AI Persona',
            value: profile.ai_personality || 'Strict Master',
            description: "Your Master's personality",
        },
        {
            id: 'hard_limits',
            title: 'Hard Limits',
            value: `${(profile.hard_limits || []).length} limits set`,
            description: 'Absolute limits never crossed',
        },
        {
            id: 'soft_limits',
            title: 'Soft Limits',
            value: `${(profile.soft_limits || []).length} limits set`,
            description: 'Limits that can be pushed',
        },
        {
            id: 'interests',
            title: 'Fetish Interests',
            value: `${(profile.interests || []).length} selected`,
            description: 'Your fetish profile',
        },
        {
            id: 'preferred_regimens',
            title: 'Training Regimens',
            value: `${(profile.preferred_regimens || []).length} selected`,
            description: 'Active training programs',
        },
        {
            id: 'psych_profile',
            title: 'Psych Profile',
            value: profile.psych_profile ? 'Completed' : 'Not set',
            description: 'Psychological calibration for the AI',
        },
        {
            id: 'physical_details',
            title: 'Physical Details',
            value: profile.physical_details ? 'Set' : 'Not set',
            description: 'Body details for task calibration',
        },
        {
            id: 'communication_style',
            title: 'Communication Style',
            value: profile.communication_style
                ? `${profile.communication_style.tone_preference} / ${profile.communication_style.feedback_frequency}`
                : 'Not set',
            description: 'How the Master communicates with you',
        },
        {
            id: 'lock_params',
            title: 'Lock Parameters',
            value: `${profile.initial_lock_goal_hours || 168}h goal`,
            description: 'Default lock duration & safeword',
        },
        {
            id: 'availability',
            title: 'Availability',
            value: profile.availability?.active_hours?.length
                ? `${profile.availability.active_hours.length} window${profile.availability.active_hours.length !== 1 ? 's' : ''}`
                : 'Not set',
            description: 'Your active training hours',
        },
    ]

    function renderBottomSheet() {
        if (!openCard || !profile) return null
        const commonProps = { onClose: () => setOpenCard(null) }

        switch (openCard) {
            case 'master_preference':
                return (
                    <MasterPreferenceEditor
                        value={profile.master_preference || ''}
                        onSave={(v) => saveField({ master_preference: v })}
                        {...commonProps}
                    />
                )
            case 'session_intent':
                return (
                    <SessionIntentEditor
                        value={profile.session_intent || ''}
                        onSave={(v) => saveField({ session_intent: v })}
                        {...commonProps}
                    />
                )
            case 'tier':
                return (
                    <TierEditor
                        value={profile.tier || 'Newbie'}
                        onSave={(v) => saveField({ tier: v })}
                        {...commonProps}
                    />
                )
            case 'ai_personality':
                return (
                    <PersonaEditor
                        value={profile.ai_personality || 'Strict Master'}
                        onSave={(v) => saveField({ ai_personality: v })}
                        {...commonProps}
                    />
                )
            case 'hard_limits':
                return (
                    <LimitsEditor
                        field="hard_limits"
                        value={profile.hard_limits || []}
                        onSave={(v) => saveField({ hard_limits: v })}
                        {...commonProps}
                    />
                )
            case 'soft_limits':
                return (
                    <LimitsEditor
                        field="soft_limits"
                        value={profile.soft_limits || []}
                        onSave={(v) => saveField({ soft_limits: v })}
                        {...commonProps}
                    />
                )
            case 'interests':
                return (
                    <InterestsEditor
                        value={profile.interests || []}
                        onSave={(v) => saveField({ interests: v })}
                        {...commonProps}
                    />
                )
            case 'preferred_regimens':
                return (
                    <RegimensEditor
                        value={profile.preferred_regimens || []}
                        onSave={(v) => saveField({ preferred_regimens: v })}
                        {...commonProps}
                    />
                )
            case 'psych_profile':
                return (
                    <PsychProfileEditor
                        value={profile.psych_profile || ''}
                        onSave={(v) => saveField({ psych_profile: v })}
                        {...commonProps}
                    />
                )
            case 'physical_details':
                return (
                    <PhysicalDetailsEditor
                        value={profile.physical_details}
                        onSave={(v) => saveField({ physical_details: v })}
                        {...commonProps}
                    />
                )
            case 'communication_style':
                return (
                    <CommunicationStyleEditor
                        value={profile.communication_style}
                        onSave={(v) => saveField({ communication_style: v })}
                        {...commonProps}
                    />
                )
            case 'lock_params':
                return (
                    <LockParamsEditor
                        goalHours={profile.initial_lock_goal_hours || 168}
                        safeword={profile.safeword || 'MERCY'}
                        onSave={(v) => saveField(v)}
                        {...commonProps}
                    />
                )
            case 'availability':
                return (
                    <AvailabilityEditor
                        value={profile.availability}
                        onSave={(v) => saveField({ availability: v })}
                        {...commonProps}
                    />
                )
            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <div className="px-4 pt-8 pb-4">
                <h1 className="text-2xl font-bold">Settings</h1>

                {/* Session active info banner */}
                {hasActiveSession && (
                    <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                        Session active — some settings are locked until your session ends.
                    </div>
                )}

                {/* Session locked error banner (shown after 403) */}
                {sessionLocked && (
                    <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        Settings are locked during an active session. End your session first.
                    </div>
                )}
            </div>

            {/* Profile Strength Ring */}
            <div className="flex flex-col items-center py-6">
                <ProfileStrengthRing profile={profile} size={140} />
                <button
                    onClick={requestMasterReview}
                    disabled={masterReviewLoading}
                    className="mt-4 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-sm text-white/80 hover:bg-zinc-700 transition disabled:opacity-50"
                >
                    {masterReviewLoading ? 'Consulting Master...' : 'Ask Master to Review'}
                </button>
                {masterReview && (
                    <div className="mt-3 mx-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white/70 whitespace-pre-line max-w-lg w-full">
                        {masterReview}
                    </div>
                )}
            </div>

            {/* 13 Profile Cards */}
            <div className="px-4 space-y-2">
                {/* ── Appearance ── */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div>
                        <p className="text-white font-semibold text-sm">Appearance</p>
                        <p className="text-white/40 text-xs mt-0.5">Theme color — reflects your training dynamic</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {Object.entries(THEMES).map(([key, t]) => {
                            const isActive = (profile?.theme ?? 'crimson') === key
                            return (
                                <button
                                    key={key}
                                    title={t.label}
                                    aria-label={t.label}
                                    disabled={themeChanging || hasActiveSession}
                                    onClick={() => handleThemeChange(key)}
                                    className="relative flex flex-col items-center gap-1.5 disabled:opacity-40"
                                >
                                    <span
                                        className="w-9 h-9 rounded-full border-2 transition-all duration-200 flex items-center justify-center"
                                        style={{
                                            backgroundColor: t.accent,
                                            borderColor: isActive ? '#ffffff' : 'transparent',
                                            boxShadow: isActive ? `0 0 0 3px ${t.accentDim}` : undefined,
                                        }}
                                    >
                                        {isActive && (
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        )}
                                    </span>
                                    <span className="text-white/40 text-[10px]">{t.label}</span>
                                </button>
                            )
                        })}
                    </div>
                    {hasActiveSession && (
                        <p className="text-white/30 text-xs">Theme cannot change during an active session.</p>
                    )}
                </div>

                {cards.map((card) => (
                    <button
                        key={card.id}
                        onClick={() => setOpenCard(card.id)}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition text-left"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm">{card.title}</p>
                            <p className="text-xs text-white/40 mt-0.5">{card.description}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3 shrink-0">
                            <span className="text-sm text-white/60 max-w-[130px] truncate">{card.value}</span>
                            <span className="text-white/30 text-lg leading-none">›</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* ── Google Drive Backup ── */}
            <div className="px-4 mt-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white font-semibold text-sm flex items-center gap-2">
                                <HardDrive size={14} className="text-[var(--accent)]" />
                                Google Drive Backup
                            </p>
                            {!driveState && (
                                <p className="text-white/40 text-xs mt-0.5">
                                    Auto-backup proof files and session archives to your Google Drive.
                                </p>
                            )}
                        </div>
                        {driveState && (
                            <span className="text-xs text-teal-400 font-medium flex items-center gap-1">
                                ✓ Connected
                            </span>
                        )}
                    </div>

                    {!driveState ? (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleConnectDrive}
                            disabled={driveConnecting || hasActiveSession}
                        >
                            {driveConnecting ? <DriveLoader size={14} className="animate-spin mr-1" /> : null}
                            Connect Google Drive
                        </Button>
                    ) : (
                        <>
                            <p className="text-white/50 text-xs">
                                {driveState.email}
                                {driveState.rootFolderId && (
                                    <>
                                        {' · Folder: LockedIn '}
                                        <a
                                            href={`https://drive.google.com/drive/folders/${driveState.rootFolderId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-0.5 text-[var(--accent)] hover:underline"
                                        >
                                            <ExternalLink size={10} />
                                        </a>
                                    </>
                                )}
                            </p>

                            {driveQueue.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-white/40 font-medium">Failed uploads ({driveQueue.length})</p>
                                    {driveQueue.map((entry) => (
                                        <div key={entry.id} className="flex items-center justify-between gap-2">
                                            <span className="text-xs text-white/60 truncate flex-1">{entry.filename}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRetryEntry(entry)}
                                            >
                                                <RefreshCw size={12} className="mr-1" /> Retry
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {driveUploading && driveUploadProgress && (
                                <div className="space-y-1">
                                    <p className="text-xs text-white/40">
                                        Uploading session {driveUploadProgress.current} of {driveUploadProgress.total}…
                                    </p>
                                    <div className="w-full bg-zinc-800 rounded-full h-1.5">
                                        <div
                                            className="bg-[var(--accent)] h-1.5 rounded-full transition-all"
                                            style={{ width: `${(driveUploadProgress.current / driveUploadProgress.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleUploadPastSessions}
                                    disabled={driveUploading || hasActiveSession}
                                >
                                    {driveUploading ? <DriveLoader size={12} className="animate-spin mr-1" /> : null}
                                    Upload Past Sessions
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDisconnectDrive}
                                    disabled={hasActiveSession}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    Disconnect
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Punishment Pool */}
            <div className="px-4 mt-6">
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                    <PunishmentPoolEditor userId={user?.id ?? ''} />
                </div>
            </div>

            {/* Help link */}
            <div className="px-4 mt-6">
                <Link href="/settings/help" className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition">
                    <div>
                        <p className="font-medium text-white text-sm">Help & Tutorial Guide</p>
                        <p className="text-xs text-white/40 mt-0.5">How to use every feature in LockedIn</p>
                    </div>
                    <span className="text-white/30">›</span>
                </Link>
            </div>

            {/* Danger Zone */}
            <div className="px-4 mt-4 space-y-3">
                <p className="text-xs text-white/30 uppercase tracking-widest">Danger Zone</p>

                {/* Emergency Release */}
                {!showEmergencyConfirm ? (
                    <button
                        onClick={() => setShowEmergencyConfirm(true)}
                        className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-red-500/30 text-left hover:bg-red-500/5 transition"
                    >
                        <AlertTriangle size={18} className="text-red-400 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-red-400">Emergency Release</p>
                            <p className="text-xs text-white/40 mt-0.5">Always available. Severe in-game penalties apply.</p>
                        </div>
                    </button>
                ) : (
                    <div className="p-4 rounded-xl bg-zinc-900 border border-red-500/30 space-y-4">
                        <div className="flex items-center gap-2 text-red-400">
                            <AlertTriangle size={18} />
                            <h3 className="font-bold text-sm">Confirm Emergency Release</h3>
                        </div>
                        <p className="text-sm text-white/60">This will immediately end your session. Penalties:</p>
                        <ul className="text-xs text-red-400 space-y-1 list-disc pl-4">
                            <li>-30 willpower score</li>
                            <li>Compliance streak reset to 0</li>
                            <li>Session marked as emergency</li>
                        </ul>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowEmergencyConfirm(false)}
                                className="flex-1 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white/70 text-sm hover:bg-zinc-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEmergencyRelease}
                                disabled={processing}
                                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                                {processing ? (
                                    <><Loader2 size={14} className="animate-spin" /> Releasing...</>
                                ) : (
                                    'Yes, Release Now'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Sign Out */}
                <button
                    onClick={!processing ? handleSignOut : undefined}
                    disabled={processing}
                    className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white/70 hover:bg-zinc-800 transition disabled:opacity-50 text-left"
                >
                    {processing ? 'Signing Out...' : 'Sign Out'}
                </button>
            </div>

            <BottomNav />

            {/* GIS — lazy-loaded only when Drive card is rendered */}
            <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />

            {/* Bottom Sheet Overlay */}
            {openCard && (
                <div className="fixed inset-0 z-[100]">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70"
                        onClick={() => setOpenCard(null)}
                    />
                    {/* Sheet */}
                    <div className="absolute bottom-0 left-0 right-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-zinc-950 border-t border-zinc-800">
                        {renderBottomSheet()}
                    </div>
                </div>
            )}
        </div>
    )
}
