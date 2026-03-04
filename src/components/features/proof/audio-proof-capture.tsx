'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, RotateCcw, Loader2 } from 'lucide-react'

interface AudioProofCaptureProps {
    minDurationSeconds?: number
    maxDurationSeconds?: number
    onCapture: (base64: string, durationSeconds: number) => void
    disabled?: boolean
}

export function AudioProofCapture({
    minDurationSeconds = 5,
    maxDurationSeconds = 120,
    onCapture,
    disabled,
}: AudioProofCaptureProps) {
    const streamRef = useRef<MediaStream | null>(null)
    const recorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const [micReady, setMicReady] = useState(false)
    const [recording, setRecording] = useState(false)
    const [elapsed, setElapsed] = useState(0)
    const [captured, setCaptured] = useState<string | null>(null)
    const [capturedDuration, setCapturedDuration] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const startMic = useCallback(async () => {
        try {
            setError(null)
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream
            setMicReady(true)
        } catch (err) {
            if (err instanceof DOMException && err.name === 'NotAllowedError') {
                setError('Microphone access denied. Please enable permissions in your browser/device settings.')
            } else {
                setError('Failed to access microphone. Please try again.')
            }
        }
    }, [])

    useEffect(() => {
        startMic()
        return () => {
            streamRef.current?.getTracks().forEach(t => t.stop())
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [startMic])

    const startRecording = () => {
        if (!streamRef.current) return
        chunksRef.current = []
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/webm'
        const recorder = new MediaRecorder(streamRef.current, { mimeType })
        recorderRef.current = recorder

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeType })
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1]
                const url = URL.createObjectURL(blob)
                setCaptured(url)
                setCapturedDuration(elapsed)
                streamRef.current?.getTracks().forEach(t => t.stop())
                setMicReady(false)
                onCapture(base64, elapsed)
            }
            reader.readAsDataURL(blob)
        }

        recorder.start(1000)
        setRecording(true)
        setElapsed(0)

        timerRef.current = setInterval(() => {
            setElapsed(prev => {
                const next = prev + 1
                if (next >= maxDurationSeconds) {
                    recorder.stop()
                    setRecording(false)
                    if (timerRef.current) clearInterval(timerRef.current)
                }
                return next
            })
        }, 1000)
    }

    const stopRecording = () => {
        recorderRef.current?.stop()
        setRecording(false)
        if (timerRef.current) clearInterval(timerRef.current)
    }

    const retake = () => {
        if (captured) URL.revokeObjectURL(captured)
        setCaptured(null)
        setElapsed(0)
        startMic()
    }

    const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

    if (error) {
        return (
            <div className="text-center py-8 space-y-3">
                <Mic size={40} className="mx-auto text-red-primary opacity-50" />
                <p className="text-sm text-red-primary">{error}</p>
                <Button variant="ghost" size="sm" onClick={startMic}>Try Again</Button>
            </div>
        )
    }

    if (captured) {
        return (
            <div className="space-y-3">
                <div className="bg-bg-tertiary rounded-[var(--radius-lg)] p-4 border border-white/10">
                    <audio src={captured} controls className="w-full" />
                </div>
                <p className="text-xs text-center text-text-tertiary">Duration: {formatTime(capturedDuration)}</p>
                <Button variant="ghost" size="sm" onClick={retake} disabled={disabled} className="w-full">
                    <RotateCcw size={14} className="mr-1" /> Record Again
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="bg-bg-tertiary rounded-[var(--radius-lg)] p-8 border border-white/10 text-center">
                {recording ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-2xl font-mono font-bold text-white">{formatTime(elapsed)}</span>
                        </div>
                        {/* Simple level bars animation */}
                        <div className="flex items-end justify-center gap-1 h-8">
                            {[...Array(12)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1.5 bg-red-primary rounded-full transition-all duration-150"
                                    style={{
                                        height: `${Math.random() * 100}%`,
                                        animationDelay: `${i * 50}ms`,
                                    }}
                                />
                            ))}
                        </div>
                        {elapsed < minDurationSeconds && (
                            <p className="text-xs text-yellow-400">
                                Min {minDurationSeconds}s — {minDurationSeconds - elapsed}s remaining
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Mic size={32} className="mx-auto text-text-tertiary" />
                        <p className="text-sm text-text-tertiary">Tap to start recording</p>
                    </div>
                )}
            </div>

            {!recording ? (
                <Button variant="primary" className="w-full" onClick={startRecording} disabled={!micReady || disabled}>
                    <Mic size={16} className="mr-2" /> Start Recording
                </Button>
            ) : (
                <Button
                    variant="danger"
                    className="w-full"
                    onClick={stopRecording}
                    disabled={elapsed < minDurationSeconds}
                >
                    <Square size={16} className="mr-2" /> Stop Recording
                </Button>
            )}
        </div>
    )
}
