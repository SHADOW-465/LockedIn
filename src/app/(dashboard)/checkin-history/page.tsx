'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ArrowLeft, Camera, Loader2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { getSupabase } from '@/lib/supabase/client'

type ProofRecord = {
    id: string
    task_id: string
    task_title: string
    task_requirement: string
    ai_feedback: string | null
    verification_status: 'pending' | 'passed' | 'failed'
    verified_at: string | null
    created_at: string
    local_storage_key: string | null
    imageDataUrl?: string
    evaluating?: boolean
}

export default function CheckinHistoryPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [records, setRecords] = useState<ProofRecord[]>([])
    const [loading, setLoading] = useState(true)

    const loadHistory = useCallback(async () => {
        if (!user) return
        setLoading(true)
        const supabase = getSupabase()

        // Today's check-in tasks
        const today = new Date().toLocaleDateString('en-CA')
        const { data: tasks } = await supabase
            .from('tasks')
            .select('id, title, verification_requirement, ai_verification_reason')
            .eq('user_id', user.id)
            .eq('task_type', 'checkin')
            .gte('assigned_at', `${today}T00:00:00.000Z`)
            .lte('assigned_at', `${today}T23:59:59.999Z`) as { data: Array<{ id: string; title: string; verification_requirement: string; ai_verification_reason: string | null }> | null }

        if (!tasks?.length) { setLoading(false); return }

        const taskIds = tasks.map(t => t.id)
        const { data: proofs } = await supabase
            .from('proof_documents')
            .select('id, task_id, verification_status, verified_at, created_at, local_storage_key')
            .in('task_id', taskIds)
            .order('created_at', { ascending: false }) as { data: Array<{ id: string; task_id: string; verification_status: string; verified_at: string | null; created_at: string; local_storage_key: string | null }> | null }

        if (!proofs?.length) { setLoading(false); return }

        const taskMap = Object.fromEntries(tasks.map(t => [t.id, t]))
        const enriched: ProofRecord[] = proofs.map(p => {
            const task = taskMap[p.task_id]
            let imageDataUrl: string | undefined
            if (p.local_storage_key) {
                try {
                    const raw = localStorage.getItem(p.local_storage_key)
                    if (raw) {
                        const parsed = JSON.parse(raw)
                        if (parsed.content) imageDataUrl = `data:image/jpeg;base64,${parsed.content}`
                    }
                } catch { /* not in localStorage */ }
            }
            return {
                ...p,
                verification_status: p.verification_status as 'pending' | 'passed' | 'failed',
                task_title: task?.title ?? 'Check-in',
                task_requirement: task?.verification_requirement ?? '',
                ai_feedback: task?.ai_verification_reason ?? null,
                imageDataUrl,
            }
        })

        setRecords(enriched)
        setLoading(false)
    }, [user])

    useEffect(() => {
        loadHistory()
    }, [loadHistory])

    const handleEvaluate = async (record: ProofRecord) => {
        if (!user || !record.imageDataUrl) return
        const base64 = record.imageDataUrl.split(',')[1]

        setRecords(prev => prev.map(r => r.id === record.id ? { ...r, evaluating: true } : r))

        try {
            const res = await fetch('/api/proof/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    proofDocId: record.id,
                    taskId: record.task_id,
                    userId: user.id,
                    fileBase64: base64,
                }),
            })
            const data = await res.json() as { verified: boolean; reason: string }
            setRecords(prev => prev.map(r => r.id === record.id ? {
                ...r,
                evaluating: false,
                verification_status: data.verified ? 'passed' : 'failed',
                ai_feedback: data.reason,
            } : r))
        } catch {
            setRecords(prev => prev.map(r => r.id === record.id ? { ...r, evaluating: false } : r))
        }
    }

    return (
        <>
            <TopBar />
            <div className="min-h-screen bg-black pb-24 p-4">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-2xl font-bold text-white">Check-in Submissions</h1>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
                        </div>
                    ) : records.length === 0 ? (
                        <div className="text-center py-20 text-white/30 space-y-3">
                            <Camera size={40} className="mx-auto opacity-30" />
                            <p className="text-sm">No check-in photos submitted today</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {records.map(record => (
                                <div
                                    key={record.id}
                                    className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
                                >
                                    {/* Photo */}
                                    {record.imageDataUrl ? (
                                        <img
                                            src={record.imageDataUrl}
                                            alt="Check-in proof"
                                            className="w-full max-h-72 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-40 bg-zinc-800 flex items-center justify-center">
                                            <Camera size={32} className="text-white/30" />
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-sm text-white">{record.task_title}</p>
                                                <p className="text-[10px] text-white/30 font-mono">
                                                    {new Date(record.created_at).toLocaleString([], {
                                                        hour: '2-digit', minute: '2-digit',
                                                        month: 'short', day: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                record.verification_status === 'passed'
                                                    ? 'bg-emerald-400/10 text-emerald-400'
                                                    : record.verification_status === 'failed'
                                                        ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                                                        : 'bg-amber-400/10 text-amber-400'
                                            }`}>
                                                {record.verification_status === 'passed' ? 'Passed'
                                                    : record.verification_status === 'failed' ? 'Rejected'
                                                        : 'Pending'}
                                            </span>
                                        </div>

                                        {/* AI Feedback */}
                                        {record.ai_feedback && (
                                            <div className={`rounded-xl p-3 border ${
                                                record.verification_status === 'passed'
                                                    ? 'bg-emerald-400/5 border-emerald-400/20'
                                                    : 'bg-[var(--accent)]/5 border-[var(--accent)]/20'
                                            }`}>
                                                <p className="text-[10px] font-bold uppercase mb-1 text-white/30">
                                                    AI Feedback
                                                </p>
                                                <p className="text-xs text-white/85 leading-relaxed">
                                                    {record.ai_feedback}
                                                </p>
                                            </div>
                                        )}

                                        {/* Re-evaluate button (only if image is available locally) */}
                                        {record.imageDataUrl && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="w-full"
                                                onClick={() => handleEvaluate(record)}
                                                disabled={record.evaluating}
                                            >
                                                {record.evaluating ? (
                                                    <><Loader2 size={13} className="mr-1 animate-spin" /> Evaluating...</>
                                                ) : (
                                                    <><RefreshCw size={13} className="mr-1" /> Re-evaluate</>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <BottomNav />
        </>
    )
}
