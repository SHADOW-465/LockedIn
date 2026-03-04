'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Video, Square, RotateCcw, Loader2 } from 'lucide-react'

interface VideoProofCaptureProps {
    minDurationSeconds?: number
    maxDurationSeconds?: number
    onCapture: (base64: string, durationSeconds: number) => void
    disabled?: boolean
}

export function VideoProofCapture({
    minDurationSeconds = 10,
    maxDurationSeconds = 60,
    onCapture,
    disabled,
}: VideoProofCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const previewRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const recorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const [cameraReady, setCameraReady] = useState(false)
    const [recording, setRecording] = useState(false)
    const [elapsed, setElapsed] = useState(0)
    const [captured, setCaptured] = useState<string | null>(null)
    const [capturedDuration, setCapturedDuration] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const startCamera = useCallback(async () => {
        try {
            setError(null)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true,
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
                setCameraReady(true)
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === 'NotAllowedError') {
                setError('Camera/microphone access denied. Please enable permissions.')
            } else {
                setError('Failed to access camera. Please try again.')
            }
        }
    }, [])

    useEffect(() => {
        startCamera()
        return () => {
            streamRef.current?.getTracks().forEach(t => t.stop())
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [startCamera])

    const startRecording = () => {
        if (!streamRef.current) return
        chunksRef.current = []
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : 'video/webm'
        const recorder = new MediaRecorder(streamRef.current, { mimeType, videoBitsPerSecond: 2_000_000 })
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
                setCameraReady(false)
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
        startCamera()
    }

    const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

    if (error) {
        return (
            <div className="text-center py-8 space-y-3">
                <Video size={40} className="mx-auto text-red-primary opacity-50" />
                <p className="text-sm text-red-primary">{error}</p>
                <Button variant="ghost" size="sm" onClick={startCamera}>Try Again</Button>
            </div>
        )
    }

    if (captured) {
        return (
            <div className="space-y-3">
                <div className="rounded-[var(--radius-lg)] overflow-hidden border border-white/10">
                    <video ref={previewRef} src={captured} controls className="w-full" />
                </div>
                <p className="text-xs text-center text-text-tertiary">Duration: {formatTime(capturedDuration)}</p>
                <Button variant="ghost" size="sm" onClick={retake} disabled={disabled} className="w-full">
                    <RotateCcw size={14} className="mr-1" /> Record Again
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div className="relative rounded-[var(--radius-lg)] overflow-hidden border border-white/10 bg-black aspect-video">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {!cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <Loader2 size={24} className="animate-spin text-purple-primary" />
                    </div>
                )}
                {recording && (
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-white text-sm font-mono">{formatTime(elapsed)}</span>
                    </div>
                )}
                {recording && elapsed < minDurationSeconds && (
                    <div className="absolute bottom-3 left-0 right-0 text-center">
                        <span className="text-xs text-yellow-400 bg-black/60 px-3 py-1 rounded-full">
                            Min {minDurationSeconds}s — {minDurationSeconds - elapsed}s remaining
                        </span>
                    </div>
                )}
            </div>

            {!recording ? (
                <Button variant="primary" className="w-full" onClick={startRecording} disabled={!cameraReady || disabled}>
                    <Video size={16} className="mr-2" /> Start Recording
                </Button>
            ) : (
                <Button
                    variant="danger"
                    className="w-full"
                    onClick={stopRecording}
                    disabled={elapsed < minDurationSeconds}
                >
                    <Square size={16} className="mr-2" /> Stop Recording ({formatTime(elapsed)})
                </Button>
            )}
        </div>
    )
}
