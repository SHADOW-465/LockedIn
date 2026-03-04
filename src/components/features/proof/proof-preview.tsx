'use client'

import { Badge } from '@/components/ui/badge'

interface ProofPreviewProps {
    proofType: 'text' | 'image' | 'video' | 'audio'
    textContent?: string
    imageUrl?: string
    videoUrl?: string
    audioUrl?: string
    durationSeconds?: number
}

export function ProofPreview({ proofType, textContent, imageUrl, videoUrl, audioUrl, durationSeconds }: ProofPreviewProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Badge variant="info" className="text-xs">
                    {proofType === 'text' ? '📝' : proofType === 'image' ? '📸' : proofType === 'video' ? '🎥' : '🎤'}{' '}
                    {proofType.toUpperCase()} PROOF
                </Badge>
                {durationSeconds && (
                    <span className="text-xs text-text-tertiary">{durationSeconds}s</span>
                )}
            </div>

            {proofType === 'text' && textContent && (
                <div className="bg-bg-tertiary rounded-[var(--radius-md)] p-3 border border-white/10">
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{textContent}</p>
                </div>
            )}

            {proofType === 'image' && imageUrl && (
                <div className="rounded-[var(--radius-lg)] overflow-hidden border border-white/10">
                    <img src={imageUrl} alt="Proof" className="w-full" />
                </div>
            )}

            {proofType === 'video' && videoUrl && (
                <div className="rounded-[var(--radius-lg)] overflow-hidden border border-white/10">
                    <video src={videoUrl} controls className="w-full" />
                </div>
            )}

            {proofType === 'audio' && audioUrl && (
                <div className="bg-bg-tertiary rounded-[var(--radius-lg)] p-4 border border-white/10">
                    <audio src={audioUrl} controls className="w-full" />
                </div>
            )}
        </div>
    )
}
