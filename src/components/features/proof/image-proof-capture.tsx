'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, RotateCcw, Loader2 } from 'lucide-react'

interface ImageProofCaptureProps {
    onCapture: (base64: string) => void
    disabled?: boolean
}

export function ImageProofCapture({ onCapture, disabled }: ImageProofCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [cameraReady, setCameraReady] = useState(false)
    const [captured, setCaptured] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const startCamera = useCallback(async () => {
        try {
            setError(null)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
                setCameraReady(true)
            }
        } catch (err) {
            console.error('Camera error:', err)
            if (err instanceof DOMException && err.name === 'NotAllowedError') {
                setError('Camera access denied. Please enable camera permissions in your browser/device settings.')
            } else if (err instanceof DOMException && err.name === 'NotFoundError') {
                setError('No camera detected on this device.')
            } else {
                setError('Failed to access camera. Please try again.')
            }
        }
    }, [])

    useEffect(() => {
        startCamera()
        return () => {
            streamRef.current?.getTracks().forEach(t => t.stop())
        }
    }, [startCamera])

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return
        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size to video dimensions (max 1920px wide)
        const scale = Math.min(1, 1920 / video.videoWidth)
        canvas.width = video.videoWidth * scale
        canvas.height = video.videoHeight * scale

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Add timestamp watermark
        const now = new Date()
        const timestamp = now.toLocaleString()
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(0, canvas.height - 36, canvas.width, 36)
        ctx.fillStyle = '#ffffff'
        ctx.font = '14px monospace'
        ctx.fillText(`LockedIn — ${timestamp}`, 10, canvas.height - 12)

        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
        setCaptured(canvas.toDataURL('image/jpeg', 0.8))

        // Stop camera
        streamRef.current?.getTracks().forEach(t => t.stop())
        setCameraReady(false)
        onCapture(base64)
    }

    const retake = () => {
        setCaptured(null)
        startCamera()
    }

    if (error) {
        return (
            <div className="text-center py-8 space-y-3">
                <Camera size={40} className="mx-auto text-red-primary opacity-50" />
                <p className="text-sm text-red-primary">{error}</p>
                <Button variant="ghost" size="sm" onClick={startCamera}>
                    Try Again
                </Button>
            </div>
        )
    }

    if (captured) {
        return (
            <div className="space-y-3">
                <div className="rounded-[var(--radius-lg)] overflow-hidden border border-white/10">
                    <img src={captured} alt="Captured proof" className="w-full" />
                </div>
                <Button variant="ghost" size="sm" onClick={retake} disabled={disabled} className="w-full">
                    <RotateCcw size={14} className="mr-1" /> Retake Photo
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div className="relative rounded-[var(--radius-lg)] overflow-hidden border border-white/10 bg-black aspect-[4/3]">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />
                {!cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <Loader2 size={24} className="animate-spin text-purple-primary" />
                    </div>
                )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <Button
                variant="primary"
                className="w-full"
                onClick={capturePhoto}
                disabled={!cameraReady || disabled}
            >
                <Camera size={16} className="mr-2" />
                Capture Photo
            </Button>
        </div>
    )
}
