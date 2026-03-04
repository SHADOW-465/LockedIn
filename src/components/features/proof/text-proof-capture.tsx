'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'

interface TextProofCaptureProps {
    requirement: string
    onCapture: (textContent: string) => void
    disabled?: boolean
}

export function TextProofCapture({ requirement, onCapture, disabled }: TextProofCaptureProps) {
    const [text, setText] = useState('')

    return (
        <div className="space-y-4">
            {requirement && (
                <Card variant="flat" size="sm" className="!min-h-0 bg-purple-primary/5 border-purple-primary/20">
                    <p className="text-sm text-purple-primary">
                        <span className="font-bold">Required:</span> {requirement}
                    </p>
                </Card>
            )}

            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type your proof response here..."
                rows={4}
                disabled={disabled}
                className="w-full bg-bg-tertiary border border-white/10 rounded-[var(--radius-md)] p-3 text-white text-sm resize-none focus:border-purple-primary focus:outline-none transition-colors placeholder:text-text-tertiary"
            />

            <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">{text.length} characters</span>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onCapture(text)}
                    disabled={disabled || !text.trim()}
                >
                    {disabled ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Send size={14} className="mr-1" />}
                    Submit Text Proof
                </Button>
            </div>
        </div>
    )
}
