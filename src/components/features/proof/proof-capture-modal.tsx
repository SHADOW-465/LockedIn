'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Loader2, Upload, Camera, Video, Mic, FileText } from 'lucide-react'
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

export function ProofCaptureModal({ task, userId, sessionId, onClose, onSubmitted }: ProofCaptureModalProps) {
    const proofType = task.proof_type || 'image'
    const [submitting, setSubmitting] = useState(false)
    const [capturedData, setCapturedData] = useState<{
        textContent?: string
        fileBase64?: string
        durationSeconds?: number
    } | null>(null)
    const [submitResult, setSubmitResult] = useState<{ verified: boolean; reason: string } | null>(null)

    const ProofIcon = PROOF_ICONS[proofType] || Camera

    const handleTextCapture = (text: string) => {
        setCapturedData({ textContent: text })
        submitProof({ textContent: text })
    }

    const handleImageCapture = (base64: string) => {
        setCapturedData({ fileBase64: base64 })
        submitProof({ fileBase64: base64 })
    }

    const handleVideoCapture = (base64: string, duration: number) => {
        setCapturedData({ fileBase64: base64, durationSeconds: duration })
        submitProof({ fileBase64: base64, durationSeconds: duration })
    }

    const handleAudioCapture = (base64: string, duration: number) => {
        setCapturedData({ fileBase64: base64, durationSeconds: duration })
        submitProof({ fileBase64: base64, durationSeconds: duration })
    }

    const submitProof = async (data: {
        textContent?: string
        fileBase64?: string
        durationSeconds?: number
    }) => {
        setSubmitting(true)
        try {
            const res = await fetch('/api/proof/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: task.id,
                    userId,
                    sessionId,
                    proofType,
                    textContent: data.textContent,
                    fileBase64: data.fileBase64,
                    localStorageKey: `/${userId}/${sessionId}/proofs/${task.id}_${Date.now()}`,
                    captureMetadata: {
                        device_user_agent: navigator.userAgent,
                        capture_timestamp: new Date().toISOString(),
                        duration_seconds: data.durationSeconds,
                    },
                }),
            })

            const result = await res.json()
            setSubmitResult({
                verified: result.verified,
                reason: result.verificationReason || result.error || 'Unknown',
            })
            onSubmitted({ verified: result.verified, reason: result.verificationReason || '' })
        } catch (err) {
            console.error('Proof submission error:', err)
            setSubmitResult({ verified: false, reason: 'Network error. Please try again.' })
        } finally {
            setSubmitting(false)
        }
    }

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
                        <Badge variant="genre">{proofType.toUpperCase()} Required</Badge>
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

                {/* Capture Area */}
                <div className="p-5">
                    {submitResult ? (
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
                                    onClick={() => {
                                        setSubmitResult(null)
                                        setCapturedData(null)
                                    }}
                                >
                                    Try Again
                                </Button>
                            )}
                        </div>
                    ) : submitting ? (
                        <div className="text-center py-10 space-y-3">
                            <Loader2 size={32} className="mx-auto animate-spin text-purple-primary" />
                            <p className="text-sm text-text-secondary">Verifying your proof...</p>
                            <p className="text-xs text-text-tertiary italic">
                                Your Master is reviewing your submission.
                            </p>
                        </div>
                    ) : (
                        <>
                            {proofType === 'text' && (
                                <TextProofCapture
                                    requirement={task.verification_requirement || ''}
                                    onCapture={handleTextCapture}
                                    disabled={submitting}
                                />
                            )}
                            {proofType === 'image' && (
                                <ImageProofCapture
                                    onCapture={handleImageCapture}
                                    disabled={submitting}
                                />
                            )}
                            {proofType === 'video' && (
                                <VideoProofCapture
                                    onCapture={handleVideoCapture}
                                    disabled={submitting}
                                />
                            )}
                            {proofType === 'audio' && (
                                <AudioProofCapture
                                    onCapture={handleAudioCapture}
                                    disabled={submitting}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
