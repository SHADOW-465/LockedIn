'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Lock, Loader2 } from 'lucide-react'
import type { UserProfile } from '@/lib/supabase/schema'

export interface SessionConfig {
  tier: string
  ai_personality: string
  hard_limits: string[]
  soft_limits: string[]
  regimens: string[]
  desired_duration_minutes: number
}

interface SessionStartFlowProps {
  profile: UserProfile
  onStart: (config: SessionConfig) => Promise<void>
  onCancel: () => void
}

const TIERS = ['Newbie', 'Slave', 'Hardcore', 'Extreme', 'Total Destruction']
const PERSONALITIES = ['Strict Master', 'Cruel Mistress', 'Sadistic Dom', 'Cold Authority', 'Nurturing Dom']
const LIMIT_OPTIONS = [
  'Scat', 'Blood', 'Breath Play', 'Minors', 'Non-Con', 'Real Harm',
  'Public Exposure', 'Extreme Pain', 'Permanent Marks', 'Animals'
]
const REGIMEN_OPTIONS = [
  'Edging', 'Orgasm Denial', 'Obedience Training', 'Body Worship',
  'Discipline', 'Humiliation', 'Chastity Protocol', 'Service Training'
]
const STEPS = ['Tier', 'Personality', 'Hard Limits', 'Soft Limits', 'Regimens', 'Duration']

export function SessionStartFlow({ profile, onStart, onCancel }: SessionStartFlowProps) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<SessionConfig>({
    tier: profile.tier || 'Newbie',
    ai_personality: profile.ai_personality || 'Strict Master',
    hard_limits: profile.hard_limits || [],
    soft_limits: profile.soft_limits || [],
    regimens: profile.preferred_regimens || [],
    desired_duration_minutes: 0,
  })

  const [durationInput, setDurationInput] = useState({ days: 0, hours: 1, minutes: 0 })

  const totalDurationMinutes =
    durationInput.days * 24 * 60 + durationInput.hours * 60 + durationInput.minutes

  const canAdvance = () => {
    if (step === 5) return totalDurationMinutes > 0
    return true
  }

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      const finalConfig = { ...config, desired_duration_minutes: totalDurationMinutes }
      setLoading(true)
      try {
        await onStart(finalConfig)
      } finally {
        setLoading(false)
      }
    }
  }

  const toggleMulti = (field: 'hard_limits' | 'soft_limits' | 'regimens', value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }))
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Choose your tier</h3>
            <div className="grid gap-2">
              {TIERS.map(t => (
                <button
                  key={t}
                  onClick={() => setConfig(prev => ({ ...prev, tier: t }))}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    config.tier === t
                      ? 'border-red-500 bg-red-500/10 text-white'
                      : 'border-gray-700 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">AI Personality</h3>
            <div className="grid gap-2">
              {PERSONALITIES.map(p => (
                <button
                  key={p}
                  onClick={() => setConfig(prev => ({ ...prev, ai_personality: p }))}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    config.ai_personality === p
                      ? 'border-purple-500 bg-purple-500/10 text-white'
                      : 'border-gray-700 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Hard Limits</h3>
            <p className="text-sm text-gray-400">These will never occur. Select all that apply.</p>
            <div className="grid grid-cols-2 gap-2">
              {LIMIT_OPTIONS.map(limit => (
                <button
                  key={limit}
                  onClick={() => toggleMulti('hard_limits', limit)}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    config.hard_limits.includes(limit)
                      ? 'border-red-500 bg-red-500/10 text-white'
                      : 'border-gray-700 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  {limit}
                </button>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Soft Limits</h3>
            <p className="text-sm text-gray-400">Allowed but approached with care.</p>
            <div className="grid grid-cols-2 gap-2">
              {LIMIT_OPTIONS.filter(l => !config.hard_limits.includes(l)).map(limit => (
                <button
                  key={limit}
                  onClick={() => toggleMulti('soft_limits', limit)}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    config.soft_limits.includes(limit)
                      ? 'border-yellow-500 bg-yellow-500/10 text-white'
                      : 'border-gray-700 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  {limit}
                </button>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Training Regimens</h3>
            <div className="grid grid-cols-2 gap-2">
              {REGIMEN_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => toggleMulti('regimens', r)}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    config.regimens.includes(r)
                      ? 'border-teal-500 bg-teal-500/10 text-white'
                      : 'border-gray-700 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Lock Duration</h3>
            <p className="text-sm text-gray-400">How long will you be locked in?</p>
            <div className="grid grid-cols-3 gap-3">
              {(['days', 'hours', 'minutes'] as const).map(unit => (
                <div key={unit} className="space-y-1">
                  <label className="text-xs text-gray-400 capitalize">{unit}</label>
                  <input
                    type="number"
                    min={0}
                    max={unit === 'days' ? 30 : unit === 'hours' ? 23 : 59}
                    value={durationInput[unit]}
                    onChange={e => setDurationInput(prev => ({ ...prev, [unit]: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-center text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
            {totalDurationMinutes > 0 && (
              <p className="text-sm text-center text-gray-300">
                Total: {durationInput.days > 0 ? `${durationInput.days}d ` : ''}
                {durationInput.hours > 0 ? `${durationInput.hours}h ` : ''}
                {durationInput.minutes > 0 ? `${durationInput.minutes}m` : ''}
              </p>
            )}
            {totalDurationMinutes === 0 && (
              <p className="text-sm text-center text-red-400">Please set a duration to proceed</p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-700">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">New Session</h2>
            <span className="text-sm text-gray-400">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-red-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          {/* Step content */}
          <div className="min-h-[280px]">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="flex-1">
                <ChevronLeft size={16} className="mr-1" /> Back
              </Button>
            ) : (
              <Button variant="ghost" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canAdvance() || loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin mr-1" />
              ) : step === STEPS.length - 1 ? (
                <>
                  <Lock size={16} className="mr-1" /> Lock In
                </>
              ) : (
                <>
                  Next <ChevronRight size={16} className="ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
