'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Loader2, Upload, Camera, Video, Mic, FileText, CheckCircle, RotateCcw } from 'lucide-react'
import { TextProofCapture } from './text-proof-capture'
import { ImageProofCapture } from './image-proof-capture'
import { VideoProofCapture } from './video-proof-capture'
import { AudioProofCapture } from './audio-proof-capture'
import type { Task } from '@/lib/supabase/schema'

interface ProofCaptureModalProps {
    task: Task
    userId: string
    sessionId?: string
    onClose: () => void
    onSubmitted: (result: { verified: boolean; reason: string }) => void
}

const PROOF_ICONS: Record<string, typeof Camera> = {
    image: Camera,
    video: Video,
    audio: Mic,
    text: FileText,
}

const PROOF_LABELS: Record<string, string> = {
    image: 'Photo',
    video: 'Video',
    audio: 'Audio',
    text: 'Text',
}

/** Save proof data to localStorage so it persists on the device */
function saveProofToLocal(key: string, data: { type: string; content: string; capturedAt: string }) {
    try {
        localStorage.setItem(key, JSON.stringify(data))
    } catch (err) {
        console.warn('[Proof] localStorage save failed (likely quota exceeded):', err)
    }
}

export function ProofCaptureModal({ task, userId, sessionId, onClose, onSubmitted }: ProofCaptureModalProps) {
    // Smart proof type: use task's proof_type, fallback to 'text' (self-report) not 'image'
    const proofType = task.proof_type || 'text'
    const [phase, setPhase] = useState<'capture' | 'review' | 'submitting' | 'result'>('capture')
    const [capturedData, setCapturedData] = useState<{
        textContent?: string
        fileBase64?: string
        previewUrl?: string
        durationSeconds?: number
    } | null>(null)
    const [submitResult, setSubmitResult] = useState<{ verified: boolean; reason: string } | null>(null)

    const ProofIcon = PROOF_ICONS[proofType] || FileText

    // ── Capture handlers — move to REVIEW phase, don't auto-submit ──

    const handleTextCapture = useCallback((text: string) => {
        setCapturedData({ textContent: text })
        setPhase('review')
    }, [])

    const handleImageCapture = useCallback((base64: string) => {
        setCapturedData({
            fileBase64: base64,
            previewUrl: `data:image/jpeg;base64,${base64}`,
        })
        setPhase('review')
    }, [])

    const handleVideoCapture = useCallback((base64: string, duration: number) => {
        setCapturedData({
            fileBase64: base64,
            previewUrl: `data:video/webm;base64,${base64}`,
            durationSeconds: duration,
        })
        setPhase('review')
    }, [])

    const handleAudioCapture = useCallback((base64: string, duration: number) => {
        setCapturedData({
            fileBase64: base64,
            previewUrl: `data:audio/webm;base64,${base64}`,
            durationSeconds: duration,
        })
        setPhase('review')
    }, [])

    // ── Retake — go back to capture ──

    const handleRetake = () => {
        setCapturedData(null)
        setPhase('capture')
    }

    // ── Submit — only when user explicitly confirms ──

    const handleSubmit = async () => {
        if (!capturedData) return
        setPhase('submitting')

        // Save to localStorage first (device persistence)
        const storageKey = `lockedin_proof_${userId}_${task.id}_${Date.now()}`
        saveProofToLocal(storageKey, {
            type: proofType,
            content: capturedData.textContent || capturedData.fileBase64 || '',
            capturedAt: new Date().toISOString(),
        })

        try {
            const res = await fetch('/api/proof/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: task.id,
                    userId,
                    sessionId,
                    proofType,
                    textContent: capturedData.textContent,
                    fileBase64: capturedData.fileBase64,
                    localStorageKey: storageKey,
                    captureMetadata: {
                        device_user_agent: navigator.userAgent,
                        capture_timestamp: new Date().toISOString(),
                        local_hour: new Date().getHours(),
                        duration_seconds: capturedData.durationSeconds,
                    },
                }),
            })

            const result = await res.json()
            const verResult = {
                verified: result.verified ?? false,
                reason: result.verificationReason || result.error || 'Unknown',
            }
            setSubmitResult(verResult)
            setPhase('result')
            onSubmitted(verResult)
        } catch (err) {
            console.error('Proof submission error:', err)
            setSubmitResult({ verified: false, reason: 'Network error. Please try again.' })
            setPhase('result')
        }
    }

    // ── Render ──

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-bg-secondary border border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b border-white/5">
                    <div className="space-y-2">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <ProofIcon size={20} className="text-red-primary" />
                            Submit Proof
                        </h2>
                        <p className="text-sm text-text-secondary line-clamp-1">{task.title}</p>
                        <Badge variant="genre">{PROOF_LABELS[proofType] || proofType.toUpperCase()} Required</Badge>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                        <X size={20} className="text-text-tertiary" />
                    </button>
                </div>

                {/* Requirement */}
                {task.verification_requirement && (
                    <div className="px-5 pt-4">
                        <div className="bg-purple-primary/5 border border-purple-primary/20 rounded-[var(--radius-md)] p-3">
                            <p className="text-xs text-purple-primary font-bold uppercase mb-1">Requirement</p>
                            <p className="text-sm text-text-secondary">{task.verification_requirement}</p>
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className="p-5">
                    {/* ── CAPTURE PHASE ── */}
                    {phase === 'capture' && (
                        <>
                            {proofType === 'text' && (
                                <TextProofCapture
                                    requirement={task.verification_requirement || ''}
                                    onCapture={handleTextCapture}
                                    disabled={false}
                                />
                            )}
                            {proofType === 'image' && (
                                <ImageProofCapture
                                    onCapture={handleImageCapture}
                                    disabled={false}
                                />
                            )}
                            {proofType === 'video' && (
                                <VideoProofCapture
                                    onCapture={handleVideoCapture}
                                    disabled={false}
                                />
                            )}
                            {proofType === 'audio' && (
                                <AudioProofCapture
                                    onCapture={handleAudioCapture}
                                    disabled={false}
                                />
                            )}
                        </>
                    )}

                    {/* ── REVIEW PHASE — user confirms before submitting ── */}
                    {phase === 'review' && capturedData && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-text-secondary uppercase">Review Your Proof</h3>

                            {/* Text preview */}
                            {proofType === 'text' && capturedData.textContent && (
                                <div className="bg-bg-tertiary border border-white/10 rounded-[var(--radius-md)] p-4 max-h-48 overflow-y-auto">
                                    <p className="text-sm text-text-primary whitespace-pre-wrap">{capturedData.textContent}</p>
                                </div>
                            )}

                            {/* Image preview */}
                            {proofType === 'image' && capturedData.previewUrl && (
                                <div className="rounded-[var(--radius-lg)] overflow-hidden border border-white/10">
                                    <img src={capturedData.previewUrl} alt="Captured proof" className="w-full" />
                                </div>
                            )}

                            {/* Video preview */}
                            {proofType === 'video' && capturedData.previewUrl && (
                                <div className="rounded-[var(--radius-lg)] overflow-hidden border border-white/10">
                                    <video src={capturedData.previewUrl} controls className="w-full" />
                                    <p className="text-xs text-text-tertiary text-center py-1">
                                        Duration: {capturedData.durationSeconds}s
                                    </p>
                                </div>
                            )}

                            {/* Audio preview */}
                            {proofType === 'audio' && capturedData.previewUrl && (
                                <div className="bg-bg-tertiary rounded-[var(--radius-md)] p-4 space-y-2">
                                    <audio src={capturedData.previewUrl} controls className="w-full" />
                                    <p className="text-xs text-text-tertiary text-center">
                                        Duration: {capturedData.durationSeconds}s
                                    </p>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="ghost" onClick={handleRetake}>
                                    <RotateCcw size={14} className="mr-1" /> Retake
                                </Button>
                                <Button variant="primary" onClick={handleSubmit}>
                                    <Upload size={14} className="mr-1" /> Submit Proof
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── SUBMITTING PHASE ── */}
                    {phase === 'submitting' && (
                        <div className="text-center py-10 space-y-3">
                            <Loader2 size={32} className="mx-auto animate-spin text-purple-primary" />
                            <p className="text-sm text-text-secondary">Verifying your proof...</p>
                            <p className="text-xs text-text-tertiary italic">
                                Your Master is reviewing your submission.
                            </p>
                        </div>
                    )}

                    {/* ── RESULT PHASE ── */}
                    {phase === 'result' && submitResult && (
                        <div className={`text-center py-6 space-y-3 ${submitResult.verified ? 'text-teal-primary' : 'text-red-primary'}`}>
                            <div className="text-4xl">{submitResult.verified ? '✅' : '❌'}</div>
                            <h3 className="text-lg font-bold">
                                {submitResult.verified ? 'Proof Verified!' : 'Proof Rejected'}
                            </h3>
                            <p className="text-sm text-text-secondary">{submitResult.reason}</p>
                            {!submitResult.verified && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleRetake}
                                >
                                    Try Again
                                </Button>
                            )}
                            {submitResult.verified && (
                                <Button variant="ghost" size="sm" onClick={onClose}>
                                    <CheckCircle size={14} className="mr-1" /> Done
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
