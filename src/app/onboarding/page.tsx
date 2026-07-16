'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { getSupabase } from '@/lib/supabase/client'
import {
  useOnboarding,
  TIERS,
  PERSONAS,
  FETISH_GENRES,
  REGIMEN_OPTIONS,
  type Tier,
  type Persona,
} from '@/lib/stores/onboarding-store'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, label: 'Welcome', title: 'The architecture of discipline' },
  { id: 2, label: 'Tier', title: 'Choose your intensity' },
  { id: 3, label: 'Master', title: 'Who holds the keys' },
  { id: 4, label: 'Limits', title: 'Hard lines and soft edges' },
  { id: 5, label: 'Interests', title: 'What you train for' },
  { id: 6, label: 'Regimens', title: 'Programs to run' },
  { id: 7, label: 'Lock', title: 'Duration, safeword, alerts' },
  { id: 8, label: 'Commit', title: 'Review and seal' },
] as const

const LIMIT_SUGGESTIONS = [
  'Blood',
  'Scat',
  'Public exposure',
  'Involving others',
  'Face photos',
  'Financial',
  'Permanent marks',
  'Breath play',
  'Electro',
  'Extreme pain',
]

const LOCK_PRESETS = [
  { label: '24h', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '7 days', hours: 168 },
  { label: '14 days', hours: 336 },
  { label: '30 days', hours: 720 },
]

/**
 * Full Stitch-styled onboarding — 8 steps, Zustand-backed, single DB upsert.
 */
export default function OnboardingPage() {
  const router = useRouter()
  const { user, refreshProfile } = useAuth()
  const store = useOnboarding()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hardInput, setHardInput] = useState('')
  const [softInput, setSoftInput] = useState('')

  const progress = (step / STEPS.length) * 100
  const meta = STEPS[step - 1]

  const canNext = useMemo(() => {
    switch (step) {
      case 1:
        return store.ageConfirmed && store.termsAccepted
      case 2:
        return Boolean(store.tier)
      case 3:
        return Boolean(store.aiPersonality)
      case 4:
        return true
      case 5:
        return store.fetishProfile.length >= 1
      case 6:
        return store.selectedRegimens.length >= 1
      case 7:
        return store.initialLockGoalHours > 0 && store.safeword.trim().length >= 2
      case 8:
        return true
      default:
        return false
    }
  }, [step, store])

  function next() {
    setError('')
    if (step < STEPS.length) setStep(step + 1)
  }

  function back() {
    setError('')
    if (step > 1) setStep(step - 1)
  }

  function toggleList(
    list: string[],
    item: string,
    set: (v: string[]) => void,
  ) {
    set(list.includes(item) ? list.filter((x) => x !== item) : [...list, item])
  }

  function addCustomLimit(kind: 'hard' | 'soft') {
    const raw = (kind === 'hard' ? hardInput : softInput).trim()
    if (!raw) return
    if (kind === 'hard') {
      if (!store.hardLimits.includes(raw)) store.setHardLimits([...store.hardLimits, raw])
      setHardInput('')
    } else {
      if (!store.softLimits.includes(raw)) store.setSoftLimits([...store.softLimits, raw])
      setSoftInput('')
    }
  }

  function toggleRegimen(id: string, name: string) {
    const exists = store.selectedRegimens.find((r) => r.id === id)
    if (exists) {
      store.setSelectedRegimens(store.selectedRegimens.filter((r) => r.id !== id))
      return
    }
    const isPrimary = store.selectedRegimens.length === 0
    store.setSelectedRegimens([
      ...store.selectedRegimens.map((r) => ({ ...r, isPrimary: false })),
      { id, name, isPrimary: isPrimary || store.selectedRegimens.every((r) => !r.isPrimary) },
    ])
  }

  function setPrimaryRegimen(id: string) {
    store.setSelectedRegimens(
      store.selectedRegimens.map((r) => ({ ...r, isPrimary: r.id === id })),
    )
  }

  async function finish() {
    if (!user) {
      setError('You must be signed in.')
      return
    }
    if (!store.tier || !store.aiPersonality) {
      setError('Tier and Master persona are required.')
      return
    }
    setSaving(true)
    setError('')

    const psychText = Object.entries(store.psychAnswers)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')

    const supabase = getSupabase()
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: user.email,
        tier: store.tier,
        ai_personality: store.aiPersonality,
        hard_limits: store.hardLimits,
        soft_limits: store.softLimits,
        interests: store.fetishProfile,
        physical_details: store.physicalDetails || {},
        preferred_regimens: store.selectedRegimens.map((r) => r.name),
        initial_lock_goal_hours: store.initialLockGoalHours,
        notification_frequency: store.notificationFrequency,
        safeword: store.safeword.trim() || 'MERCY',
        psych_profile: psychText || null,
        onboarding_completed: true,
        onboarding_step: 11,
      },
      { onConflict: 'id' },
    )

    if (profileError) {
      setError(profileError.message)
      setSaving(false)
      return
    }

    await supabase.from('user_preferences').upsert(
      {
        user_id: user.id,
        safeword: store.safeword.trim() || 'MERCY',
        notification_frequency: store.notificationFrequency,
        standby_consent: store.standbyConsent,
        hard_limits: store.hardLimits,
        soft_limits: store.softLimits,
      },
      { onConflict: 'user_id' },
    )

    store.reset()
    await refreshProfile()
    router.replace('/home')
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top progress */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-fixed">
              <Icon name="shield_with_heart" filled className="text-on-primary-fixed" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">LOCKEDIN</p>
              <p className="font-label-caps text-[9px] tracking-widest text-on-surface-variant opacity-60">
                INTAKE · STEP {step}/{STEPS.length}
              </p>
            </div>
          </div>
          <span className="font-label-caps text-[10px] tracking-widest text-primary-fixed">
            {meta.label}
          </span>
        </div>
        <div className="h-1 w-full bg-surface-container">
          <div
            className="h-full bg-primary-fixed transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="mb-2 font-label-caps text-[11px] tracking-[0.15em] text-on-surface-variant">
          {meta.label.toUpperCase()}
        </p>
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
          {meta.title}
        </h1>

        {error && (
          <p className="mb-6 rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error">
            {error}
          </p>
        )}

        {/* ── Step bodies ─────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bento-card rounded-2xl p-6">
              <p className="text-sm leading-relaxed text-on-surface-variant">
                LockedIn is an adult chastity and D/s training companion. An AI Master assigns
                tasks, verifies proof, and holds lock sessions. You remain responsible for your
                safety, limits, and offline keys.
              </p>
              <p className="mt-4 text-sm italic text-on-surface-variant opacity-70">
                &ldquo;You are not your urges. You are your decisions.&rdquo;
              </p>
            </div>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={store.ageConfirmed}
                onChange={(e) => store.setAgeConfirmed(e.target.checked)}
                className="mt-1 accent-primary-fixed"
              />
              <span>I confirm I am 18 years of age or older.</span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={store.termsAccepted}
                onChange={(e) => store.setTermsAccepted(e.target.checked)}
                className="mt-1 accent-primary-fixed"
              />
              <span>
                I understand this is consensual fantasy training software, not medical advice, and I
                accept responsibility for my participation.
              </span>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-3">
            {TIERS.map((t) => {
              const active = store.tier === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => store.setTier(t as Tier)}
                  className={cn(
                    'rounded-2xl border p-5 text-left transition',
                    active
                      ? 'border-primary-fixed bg-primary-fixed/10'
                      : 'border-white/10 bg-[#161B15] hover:border-white/20',
                  )}
                >
                  <p className="font-semibold text-on-surface">{t}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {t === 'Newbie' && 'Gentle intro. Lighter tasks and encouragement.'}
                    {t === 'Slave' && 'Regular obedience. Moderate tasks and punishments.'}
                    {t === 'Hardcore' && 'Demanding conditioning. Strict rules.'}
                    {t === 'Extreme' && 'Maximum intensity. Relentless pressure.'}
                    {t === 'Total Destruction' && 'No mercy. Only the most dedicated.'}
                  </p>
                </button>
              )
            })}
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {PERSONAS.map((p) => {
              const active = store.aiPersonality === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => store.setPersonality(p as Persona)}
                  className={cn(
                    'rounded-2xl border p-4 text-left transition',
                    active
                      ? 'border-primary-fixed bg-primary-fixed/10'
                      : 'border-white/10 bg-[#161B15] hover:border-white/20',
                  )}
                >
                  <p className="text-sm font-semibold">{p}</p>
                </button>
              )
            })}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Hard limits (never crossed)</h3>
              <div className="mb-3 flex flex-wrap gap-2">
                {LIMIT_SUGGESTIONS.map((l) => (
                  <Chip
                    key={l}
                    label={l}
                    on={store.hardLimits.includes(l)}
                    onClick={() => toggleList(store.hardLimits, l, store.setHardLimits)}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={hardInput}
                  onChange={(e) => setHardInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomLimit('hard'))}
                  placeholder="Add custom hard limit"
                  className="flex-1 rounded-xl border border-white/10 bg-surface-container-lowest px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => addCustomLimit('hard')}
                  className="rounded-xl border border-white/10 px-3 text-xs font-bold"
                >
                  Add
                </button>
              </div>
              {store.hardLimits.length > 0 && (
                <p className="mt-2 text-xs text-on-surface-variant">
                  Active: {store.hardLimits.join(' · ')}
                </p>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Soft limits (can be pushed carefully)</h3>
              <div className="mb-3 flex flex-wrap gap-2">
                {LIMIT_SUGGESTIONS.map((l) => (
                  <Chip
                    key={`s-${l}`}
                    label={l}
                    on={store.softLimits.includes(l)}
                    onClick={() => toggleList(store.softLimits, l, store.setSoftLimits)}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={softInput}
                  onChange={(e) => setSoftInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomLimit('soft'))}
                  placeholder="Add custom soft limit"
                  className="flex-1 rounded-xl border border-white/10 bg-surface-container-lowest px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => addCustomLimit('soft')}
                  className="rounded-xl border border-white/10 px-3 text-xs font-bold"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-wrap gap-2">
            {FETISH_GENRES.map((g) => (
              <Chip
                key={g}
                label={g}
                on={store.fetishProfile.includes(g)}
                onClick={() =>
                  toggleList(store.fetishProfile, g, store.setFetishProfile)
                }
              />
            ))}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-3">
            <p className="text-sm text-on-surface-variant">
              Pick at least one. Tap a selected card again to set it as primary.
            </p>
            <div className="custom-scrollbar max-h-[50vh] space-y-2 overflow-y-auto overflow-x-hidden pr-1">
              {REGIMEN_OPTIONS.map((opt) => {
                const sel = store.selectedRegimens.find((r) => r.id === opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      if (sel) setPrimaryRegimen(opt.id)
                      else toggleRegimen(opt.id, opt.name)
                    }}
                    onDoubleClick={() => toggleRegimen(opt.id, opt.name)}
                    className={cn(
                      'w-full rounded-2xl border p-4 text-left transition',
                      sel
                        ? 'border-primary-fixed bg-primary-fixed/10'
                        : 'border-white/10 bg-[#161B15]',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{opt.name}</p>
                      {sel?.isPrimary && (
                        <span className="font-label-caps text-[9px] text-primary-fixed">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-on-surface-variant">{opt.description}</p>
                    {sel && (
                      <button
                        type="button"
                        className="mt-2 text-[11px] text-error underline"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleRegimen(opt.id, opt.name)
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Default lock goal</h3>
              <div className="flex flex-wrap gap-2">
                {LOCK_PRESETS.map((p) => (
                  <button
                    key={p.hours}
                    type="button"
                    onClick={() => store.setInitialLockGoalHours(p.hours)}
                    className={cn(
                      'rounded-full px-4 py-2 text-xs font-bold',
                      store.initialLockGoalHours === p.hours
                        ? 'bg-primary-fixed text-on-primary-fixed'
                        : 'border border-white/10',
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="block space-y-1">
              <span className="font-label-caps text-[11px] text-on-surface-variant">Safeword</span>
              <input
                value={store.safeword}
                onChange={(e) => store.setSafeword(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm uppercase tracking-wide"
              />
              <p className="text-xs text-on-surface-variant">
                Type this in Companion for Care Mode. Default MERCY.
              </p>
            </label>
            <label className="block space-y-1">
              <span className="font-label-caps text-[11px] text-on-surface-variant">
                Notification intensity
              </span>
              <select
                value={store.notificationFrequency}
                onChange={(e) =>
                  store.setNotificationFrequency(
                    e.target.value as 'low' | 'medium' | 'high' | 'extreme',
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="extreme">Extreme</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="font-label-caps text-[11px] text-on-surface-variant">
                Why are you here? (psych calibration)
              </span>
              <textarea
                rows={3}
                value={store.psychAnswers.why || ''}
                onChange={(e) => store.setPsychAnswer('why', e.target.value)}
                placeholder="Optional — helps your Master tone"
                className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-3 text-sm"
              />
            </label>
          </div>
        )}

        {step === 8 && (
          <div className="bento-card space-y-4 rounded-2xl p-6 text-sm">
            <Row label="Tier" value={store.tier || '—'} />
            <Row label="Master" value={store.aiPersonality || '—'} />
            <Row label="Hard limits" value={store.hardLimits.join(', ') || 'None set'} />
            <Row label="Soft limits" value={store.softLimits.join(', ') || 'None set'} />
            <Row label="Interests" value={store.fetishProfile.join(', ') || '—'} />
            <Row
              label="Regimens"
              value={
                store.selectedRegimens
                  .map((r) => (r.isPrimary ? `${r.name} ★` : r.name))
                  .join(', ') || '—'
              }
            />
            <Row label="Default lock" value={`${store.initialLockGoalHours}h`} />
            <Row label="Safeword" value={store.safeword || 'MERCY'} />
            <Row label="Alerts" value={store.notificationFrequency} />
            <p className="pt-2 text-xs text-on-surface-variant">
              Sealing writes your profile and opens the workbench. You can refine settings between
              sessions.
            </p>
          </div>
        )}

        {/* Footer nav */}
        <div className="mt-10 flex items-center justify-between gap-3 border-t border-white/5 pt-6">
          <button
            type="button"
            onClick={back}
            disabled={step === 1 || saving}
            className="min-h-11 rounded-full border border-white/10 px-5 text-xs font-bold disabled:opacity-30"
          >
            Back
          </button>
          {step < STEPS.length ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={next}
              className="min-h-11 rounded-full bg-primary-fixed px-8 text-xs font-bold text-on-primary-fixed disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={saving || !canNext}
              onClick={() => void finish()}
              className="min-h-11 rounded-full bg-primary-fixed px-8 text-xs font-bold text-on-primary-fixed disabled:opacity-40"
            >
              {saving ? 'Sealing…' : 'Seal commitment'}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

function Chip({
  label,
  on,
  onClick,
}: {
  label: string
  on: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-[11px] font-bold transition',
        on
          ? 'bg-primary-fixed text-on-primary-fixed'
          : 'border border-white/10 text-on-surface-variant hover:border-white/25',
      )}
    >
      {label}
    </button>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
      <span className="text-on-surface-variant">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-on-surface">{value}</span>
    </div>
  )
}
