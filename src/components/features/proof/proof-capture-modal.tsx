'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fileToBase64 } from '@/lib/file-to-base64'
import { saveFileToOPFS } from '@/lib/local-storage/opfs'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import type { Task } from '@/lib/supabase/schema'

export type ProofSubmitResult = {
  verified?: boolean
  verificationReason?: string
  error?: string
  [key: string]: unknown
}

type Mode = 'task' | 'random'

type Props = {
  open: boolean
  onClose: () => void
  mode: Mode
  userId: string
  sessionId?: string | null
  tier?: string
  /** Task proof */
  task?: Task | null
  /** Random proof schedule row id */
  scheduleId?: string | null
  onSubmitted?: (result: ProofSubmitResult) => void
}

/**
 * Stitch verification vault — capture chrome for image/text proofs.
 * Submits to /api/proof/submit or /api/proof/submit-random.
 */
export function ProofCaptureModal({
  open,
  onClose,
  mode,
  userId,
  sessionId,
  tier,
  task,
  scheduleId,
  onSubmitted,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState('')
  const [cameraOn, setCameraOn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'fail'>('idle')
  const [message, setMessage] = useState('')

  const proofType =
    mode === 'random'
      ? 'image'
      : (task?.proof_type as 'image' | 'video' | 'audio' | 'text' | null) || 'image'

  const title =
    mode === 'random' ? 'Random proof check' : task?.title || 'Capture proof'
  const requirement =
    mode === 'random'
      ? 'Show your locked chastity device clearly. Secure, closed, unmodified.'
      : task?.verification_requirement || task?.description || 'Provide clear proof of completion.'

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOn(false)
  }, [])

  useEffect(() => {
    if (!open) {
      stopCamera()
      setPreviewUrl(null)
      setFile(null)
      setTextContent('')
      setStatus('idle')
      setMessage('')
      setSubmitting(false)
    }
  }, [open, stopCamera])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      setCameraOn(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setMessage('Camera unavailable — use gallery or file picker.')
      fileRef.current?.click()
    }
  }

  function captureFrame() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 720
    canvas.height = video.videoHeight || 1280
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const f = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
        setFile(f)
        setPreviewUrl(URL.createObjectURL(blob))
        stopCamera()
      },
      'image/jpeg',
      0.9,
    )
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    stopCamera()
  }

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    setMessage('')
    setStatus('idle')

    try {
      if (proofType === 'text') {
        if (!textContent.trim()) {
          setMessage('Write your text proof first.')
          setSubmitting(false)
          return
        }
        if (mode !== 'task' || !task) {
          setMessage('Text proof only for tasks.')
          setSubmitting(false)
          return
        }
        const res = await fetch('/api/proof/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: task.id,
            userId,
            sessionId: sessionId || task.session_id,
            proofType: 'text',
            textContent: textContent.trim(),
            captureMetadata: {
              device_user_agent: navigator.userAgent,
              capture_timestamp: new Date().toISOString(),
              local_hour: new Date().getHours(),
            },
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setStatus('fail')
          setMessage(data.error || 'Submit failed')
          setSubmitting(false)
          return
        }
        setStatus(data.verified ? 'ok' : 'fail')
        setMessage(data.verificationReason || (data.verified ? 'Verified' : 'Rejected'))
        onSubmitted?.(data)
        setSubmitting(false)
        return
      }

      // Media proofs
      if (!file) {
        setMessage('Capture or choose a photo first.')
        setSubmitting(false)
        return
      }

      const base64 = await fileToBase64(file)
      let localKey: string | undefined
      try {
        const sid = sessionId || task?.session_id || 'no-session'
        localKey = await saveFileToOPFS(
          userId,
          sid,
          'proofs',
          `${Date.now()}-${file.name || 'proof.jpg'}`,
          file,
        )
      } catch {
        // OPFS optional
      }

      if (mode === 'random' && scheduleId) {
        const res = await fetch('/api/proof/submit-random', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduleId,
            imageBase64: base64,
            userId,
            sessionId: sessionId || undefined,
            tier,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setStatus('fail')
          setMessage(data.error || 'Random proof failed')
          setSubmitting(false)
          return
        }
        setStatus(data.verified ? 'ok' : 'fail')
        setMessage(data.reason || (data.verified ? 'Verified' : 'Not verified'))
        onSubmitted?.(data)
        setSubmitting(false)
        return
      }

      if (!task) {
        setMessage('No task selected.')
        setSubmitting(false)
        return
      }

      const res = await fetch('/api/proof/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          userId,
          sessionId: sessionId || task.session_id,
          proofType: proofType === 'video' || proofType === 'audio' ? proofType : 'image',
          fileBase64: base64,
          localStorageKey: localKey,
          captureMetadata: {
            device_user_agent: navigator.userAgent,
            capture_timestamp: new Date().toISOString(),
            local_hour: new Date().getHours(),
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('fail')
        setMessage(data.error || 'Submit failed')
        setSubmitting(false)
        return
      }
      setStatus(data.verified ? 'ok' : 'fail')
      setMessage(data.verificationReason || (data.verified ? 'Verified' : 'Rejected'))
      onSubmitted?.(data)
    } catch (err) {
      setStatus('fail')
      setMessage(err instanceof Error ? err.message : 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background text-on-surface">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-white/5 px-4 py-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-surface-container"
          aria-label="Close"
        >
          <Icon name="arrow_back" className="text-on-surface-variant" />
        </button>
        <span className="font-label-caps text-[11px] tracking-widest text-on-surface-variant">
          VERIFICATION VAULT
        </span>
        <div className="w-11" />
      </header>

      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-4 py-4 md:px-8">
        <section className="mx-auto w-full max-w-4xl">
          <h2 className="font-headline-md text-2xl font-semibold">Capture your proof.</h2>
          <p className="mt-1 max-w-xl text-sm text-on-surface-variant">{requirement}</p>
        </section>

        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Context */}
          <div className="flex flex-col gap-3 lg:col-span-4">
            <div className="glass-panel rounded-2xl border border-white/5 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-label-caps text-[11px] tracking-widest text-primary-fixed">
                  {mode === 'random' ? 'RANDOM SLOT' : 'ACTIVE TASK'}
                </span>
                <Icon name="sensors" className="animate-pulse text-primary-fixed" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {task?.deadline && (
                <p className="mt-2 font-mono-data text-[11px] text-on-surface-variant">
                  Due {new Date(task.deadline).toLocaleString()}
                </p>
              )}
              <p className="mt-3 text-xs text-on-surface-variant">
                Proof type: <span className="text-on-surface">{proofType}</span>
              </p>
            </div>
            {status !== 'idle' && (
              <div
                className={cn(
                  'rounded-2xl border p-4 text-sm',
                  status === 'ok'
                    ? 'border-primary-fixed/40 bg-primary-fixed/10 text-on-surface'
                    : 'border-error/40 bg-error/10 text-error',
                )}
              >
                {message}
              </div>
            )}
            {status === 'idle' && message && (
              <p className="text-sm text-on-surface-variant">{message}</p>
            )}
          </div>

          {/* Viewfinder */}
          <div className="relative lg:col-span-8">
            {proofType === 'text' ? (
              <div className="rounded-2xl border border-white/5 bg-surface-container p-5">
                <label className="block space-y-2">
                  <span className="font-label-caps text-[11px] text-on-surface-variant">
                    TEXT PROOF
                  </span>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={10}
                    className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-fixed"
                    placeholder="Describe completion as required…"
                  />
                </label>
              </div>
            ) : (
              <div className="relative aspect-[3/4] max-h-[70vh] overflow-hidden rounded-2xl border border-white/10 bg-surface-container-lowest camera-mesh sm:aspect-video">
                {/* corners */}
                <div className="viewfinder-corner viewfinder-corner-tl" />
                <div className="viewfinder-corner viewfinder-corner-tr" />
                <div className="viewfinder-corner viewfinder-corner-bl" />
                <div className="viewfinder-corner viewfinder-corner-br" />

                {cameraOn ? (
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Proof preview"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <Icon name="photo_camera" className="text-4xl text-on-surface-variant opacity-50" />
                    <p className="text-sm text-on-surface-variant">
                      Frame the device clearly. Use camera or gallery.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {proofType !== 'text' && (
                <>
                  <button
                    type="button"
                    onClick={() => void startCamera()}
                    className="min-h-11 rounded-full border border-white/10 px-5 py-2 text-xs font-bold hover:bg-white/5"
                  >
                    Camera
                  </button>
                  {cameraOn && (
                    <button
                      type="button"
                      onClick={captureFrame}
                      className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary-fixed bg-primary-fixed/20"
                      aria-label="Shutter"
                    >
                      <span className="h-12 w-12 rounded-full bg-primary-fixed" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="min-h-11 rounded-full border border-white/10 px-5 py-2 text-xs font-bold hover:bg-white/5"
                  >
                    Gallery
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={
                      proofType === 'video'
                        ? 'video/*'
                        : proofType === 'audio'
                          ? 'audio/*'
                          : 'image/*'
                    }
                    capture="environment"
                    className="hidden"
                    onChange={onFileChange}
                  />
                </>
              )}
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submit()}
                className="min-h-11 rounded-full bg-primary-fixed px-8 py-2 text-xs font-bold text-on-primary-fixed disabled:opacity-50"
              >
                {submitting ? 'Verifying…' : 'Submit proof'}
              </button>
              {status === 'ok' && (
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-11 rounded-full border border-primary-fixed/40 px-5 py-2 text-xs font-bold text-primary-fixed"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
