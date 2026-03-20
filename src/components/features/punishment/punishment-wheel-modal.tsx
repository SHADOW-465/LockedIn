'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import type { PunishmentPoolItem } from '@/lib/supabase/schema'

interface SpinResult {
  task: Record<string, unknown>
  selected: PunishmentPoolItem
  narration: string
}

interface Props {
  userId: string
  sessionId: string
  onClose: () => void
  onPunishmentCreated?: (taskId: string) => void
}

const SEVERITY_LABELS: Record<number, string> = {
  1: 'Mild',
  2: 'Moderate',
  3: 'Strict',
  4: 'Severe',
  5: 'Brutal',
}

const SEVERITY_COLORS: Record<number, string> = {
  1: 'text-tier-newbie',
  2: 'text-teal-primary',
  3: 'text-tier-slave',
  4: 'text-red-primary',
  5: 'text-red-primary',
}

// 12 segments for the conic wheel (matches DEFAULT_POOL_SEED count)
const WHEEL_COLORS = [
  '#8b5cf6', '#ef4444', '#14b8a6', '#f59e0b',
  '#6366f1', '#ec4899', '#10b981', '#f97316',
  '#8b5cf6', '#ef4444', '#14b8a6', '#6366f1',
]

export function PunishmentWheelModal({ userId, sessionId, onClose, onPunishmentCreated }: Props) {
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<SpinResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const segmentAngle = 360 / 12
  const conicGradient = WHEEL_COLORS.map((color, i) => {
    const start = i * segmentAngle
    const end = (i + 1) * segmentAngle
    return `${color} ${start}deg ${end}deg`
  }).join(', ')

  const handleSpin = async () => {
    if (spinning) return
    setSpinning(true)
    setResult(null)
    setError(null)

    // Animate spin (3-5 full rotations + random offset)
    const extraRotation = 360 * (3 + Math.floor(Math.random() * 3)) + Math.random() * 360
    setRotation((prev) => prev + extraRotation)

    try {
      // Wait for animation to start
      await new Promise((r) => setTimeout(r, 300))

      const res = await fetch('/api/punishment-wheel/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Spin failed')
      }

      // Wait for animation to finish
      await new Promise((r) => setTimeout(r, 3200))

      setResult(data as SpinResult)
      onPunishmentCreated?.(String(data.task?.id ?? ''))
    } catch (err) {
      await new Promise((r) => setTimeout(r, 3200))
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSpinning(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-bg-secondary border border-border-subtle rounded-2xl w-full max-w-sm space-y-5 p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-tertiary hover:text-text-secondary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-bold">Punishment Wheel</h2>
          <p className="text-xs text-text-tertiary mt-0.5">Spin to face your consequence</p>
        </div>

        {/* Wheel */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[16px] border-l-transparent border-r-transparent border-b-white" />
            <div
              className="w-48 h-48 rounded-full"
              style={{
                background: `conic-gradient(${conicGradient})`,
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 3.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
              }}
            />
          </div>
        </div>

        {/* Result */}
        {result && (
          <Card variant="flat" className="space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">{result.selected.title}</h3>
              <Badge variant="locked">
                <span className={SEVERITY_COLORS[result.selected.severity]}>
                  {SEVERITY_LABELS[result.selected.severity]}
                </span>
              </Badge>
            </div>
            <p className="text-sm text-text-secondary italic leading-relaxed">{result.narration}</p>
            {result.selected.requires_proof && (
              <p className="text-xs text-tier-slave">⚠ Proof required — submit via Tasks page</p>
            )}
          </Card>
        )}

        {error && (
          <p className="text-red-primary text-xs text-center">{error}</p>
        )}

        <Button
          variant="primary"
          className="w-full"
          onClick={handleSpin}
          disabled={spinning}
        >
          {spinning ? '🎰 Spinning…' : result ? '🎰 Spin Again' : '🎰 Spin the Wheel'}
        </Button>
      </div>
    </div>
  )
}
