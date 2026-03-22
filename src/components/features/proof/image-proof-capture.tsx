'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, RotateCcw, Loader2, Check, SwitchCamera, Timer } from 'lucide-react'

interface ImageProofCaptureProps {
    onCapture: (base64: string) => void
    disabled?: boolean
}

type FacingMode = 'user' | 'environment'

const TIMER_OPTIONS = [3, 5, 10] as const

export function ImageProofCapture({ onCapture, disabled }: ImageProofCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const [cameraReady, setCameraReady] = useState(false)
    const [captured, setCaptured] = useState<{ preview: string; base64: string } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [facingMode, setFacingMode] = useState<FacingMode>('environment')
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
    const [countdown, setCountdown] = useState<number | null>(null)
    const [timerSeconds, setTimerSeconds] = useState<typeof TIMER_OPTIONS[number]>(3)

    const stopStream = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
    }, [])

    const startCamera = useCallback(async (facing: FacingMode = 'environment') => {
        stopStream()
        setCameraReady(false)
        setError(null)

        // Check how many video inputs are available
        try {
            const devices = await navigator.mediaDevices.enumerateDevices()
            const videoInputs = devices.filter(d => d.kind === 'videoinput')
            setHasMultipleCameras(videoInputs.length > 1)
        } catch {
            // enumerateDevices can fail before permission granted — ignore
        }

        // Try requested facingMode first; fall back to any camera if it fails
        const constraints: MediaStreamConstraints[] = [
            { video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } } },
            { video: { width: { ideal: 1920 }, height: { ideal: 1080 } } }, // any camera
            { video: true },                                                  // minimal fallback
        ]

        let stream: MediaStream | null = null
        let lastErr: unknown = null

        for (const c of constraints) {
            try {
                stream = await navigator.mediaDevices.getUserMedia(c)
                break
            } catch (err) {
                lastErr = err
            }
        }

        if (!stream) {
            const err = lastErr as DOMException | undefined
            if (err?.name === 'NotAllowedError') {
                setError('Camera access denied. Please enable camera permissions in your browser settings.')
            } else if (err?.name === 'NotFoundError') {
                setError('No camera detected on this device.')
            } else {
                setError('Could not access camera. Please try again.')
            }
            return
        }

        streamRef.current = stream

        // Re-check cameras now that we have permission (enumerateDevices returns labels)
        try {
            const devices = await navigator.mediaDevices.enumerateDevices()
            const videoInputs = devices.filter(d => d.kind === 'videoinput')
            setHasMultipleCameras(videoInputs.length > 1)
        } catch {
            // ignore
        }

        if (videoRef.current) {
            videoRef.current.srcObject = stream
            await videoRef.current.play()
            setCameraReady(true)
        }
    }, [stopStream])

    useEffect(() => {
        startCamera(facingMode)
        return () => {
            stopStream()
            if (countdownRef.current) clearInterval(countdownRef.current)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const switchCamera = useCallback(() => {
        const next: FacingMode = facingMode === 'environment' ? 'user' : 'environment'
        setFacingMode(next)
        startCamera(next)
    }, [facingMode, startCamera])

    const doCapture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return
        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const scale = Math.min(1, 1920 / (video.videoWidth || 1920))
        canvas.width = video.videoWidth * scale
        canvas.height = video.videoHeight * scale

        // Mirror front camera so captured image matches preview orientation
        if (facingMode === 'user') {
            ctx.save()
            ctx.translate(canvas.width, 0)
            ctx.scale(-1, 1)
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            ctx.restore()
        } else {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        }

        // Timestamp watermark
        const timestamp = new Date().toLocaleString()
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
        ctx.fillRect(0, canvas.height - 36, canvas.width, 36)
        ctx.fillStyle = '#ffffff'
        ctx.font = '14px monospace'
        ctx.fillText(`LockedIn — ${timestamp}`, 10, canvas.height - 12)

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        const base64 = dataUrl.split(',')[1]

        stopStream()
        setCameraReady(false)
        setCaptured({ preview: dataUrl, base64 })
    }, [facingMode, stopStream])

    const startCountdown = useCallback(() => {
        if (!cameraReady || disabled) return
        setCountdown(timerSeconds)

        let remaining = timerSeconds
        countdownRef.current = setInterval(() => {
            remaining -= 1
            if (remaining <= 0) {
                clearInterval(countdownRef.current!)
                countdownRef.current = null
                setCountdown(null)
                doCapture()
            } else {
                setCountdown(remaining)
            }
        }, 1000)
    }, [cameraReady, disabled, doCapture, timerSeconds])

    const cancelCountdown = useCallback(() => {
        if (countdownRef.current) {
            clearInterval(countdownRef.current)
            countdownRef.current = null
        }
        setCountdown(null)
    }, [])

    const captureNow = useCallback(() => {
        cancelCountdown()
        doCapture()
    }, [cancelCountdown, doCapture])

    const retake = useCallback(() => {
        setCaptured(null)
        startCamera(facingMode)
    }, [facingMode, startCamera])

    const confirmPhoto = useCallback(() => {
        if (!captured) return
        onCapture(captured.base64)
    }, [captured, onCapture])

    // ── Error state ──
    if (error) {
        return (
            <div className="text-center py-8 space-y-3">
                <Camera size={40} className="mx-auto text-red-primary opacity-50" />
                <p className="text-sm text-red-primary">{error}</p>
                <Button variant="ghost" size="sm" onClick={() => startCamera(facingMode)}>
                    Try Again
                </Button>
            </div>
        )
    }

    // ── Captured / review state ──
    if (captured) {
        return (
            <div className="space-y-3">
                <div className="rounded-[var(--radius-lg)] overflow-hidden border border-white/10">
                    <img src={captured.preview} alt="Captured proof" className="w-full" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="ghost" size="sm" onClick={retake} disabled={disabled}>
                        <RotateCcw size={14} className="mr-1" /> Retake
                    </Button>
                    <Button variant="primary" size="sm" onClick={confirmPhoto} disabled={disabled}>
                        <Check size={14} className="mr-1" /> Use This Photo
                    </Button>
                </div>
            </div>
        )
    }

    // ── Live camera ──
    return (
        <div className="space-y-3">
            <div className="relative rounded-[var(--radius-lg)] overflow-hidden border border-white/10 bg-black aspect-[4/3]">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={facingMode === 'user' ? { transform: 'scaleX(-1)' } : undefined}
                />

                {/* Loading overlay */}
                {!cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <Loader2 size={24} className="animate-spin text-purple-primary" />
                    </div>
                )}

                {/* Countdown overlay */}
                {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="text-white font-bold drop-shadow-lg" style={{ fontSize: '6rem', lineHeight: 1 }}>
                            {countdown}
                        </span>
                    </div>
                )}

                {/* Camera switch button (top-right) */}
                {hasMultipleCameras && cameraReady && countdown === null && (
                    <button
                        onClick={switchCamera}
                        className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                        title="Switch camera"
                    >
                        <SwitchCamera size={18} className="text-white" />
                    </button>
                )}

                {/* Facing mode label */}
                {cameraReady && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded text-[10px] text-white/70 font-mono">
                        {facingMode === 'user' ? 'Front' : 'Back'}
                    </div>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {/* Timer duration picker */}
            {countdown === null && cameraReady && (
                <div className="flex items-center gap-2">
                    <Timer size={13} className="text-text-tertiary shrink-0" />
                    <span className="text-xs text-text-tertiary">Timer:</span>
                    <div className="flex gap-1">
                        {TIMER_OPTIONS.map(s => (
                            <button
                                key={s}
                                onClick={() => setTimerSeconds(s)}
                                className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                                    timerSeconds === s
                                        ? 'bg-purple-primary text-white'
                                        : 'bg-white/10 text-text-tertiary hover:bg-white/20'
                                }`}
                            >
                                {s}s
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Action buttons */}
            {countdown === null ? (
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={startCountdown}
                        disabled={!cameraReady || disabled}
                    >
                        <Timer size={16} className="mr-2" />
                        {timerSeconds}s Timer
                    </Button>
                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={captureNow}
                        disabled={!cameraReady || disabled}
                    >
                        <Camera size={16} className="mr-2" />
                        Capture Now
                    </Button>
                </div>
            ) : (
                <Button
                    variant="ghost"
                    className="w-full"
                    onClick={cancelCountdown}
                >
                    Cancel Timer
                </Button>
            )}
        </div>
    )
}
