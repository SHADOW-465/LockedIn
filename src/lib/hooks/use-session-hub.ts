'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getLiveSession } from '@/lib/supabase/sessions'
import { getUserTasks } from '@/lib/supabase/tasks'
import type { Session, Task } from '@/lib/supabase/schema'

export type BehaviorCounts = { touch: number; urge: number; removal: number }

/** Row from proof_schedules (random proof slots) */
export type ProofScheduleRow = {
  id: string
  window_start: string
  window_end: string
  completed?: boolean
  missed?: boolean
  scheduled_at?: string
  [key: string]: unknown
}

const OPEN_STATUSES = [
  'pending',
  'active',
  'awaiting_proof',
  'verification_pending',
  'proof_submitted',
  'completed',
  'verified',
] as const

// Module-level hub cache so Home ↔ Tasks navigation reuses data instantly
type HubSnapshot = {
  session: Session | null
  tasks: Task[]
  behavior: BehaviorCounts
  proofSlots: ProofScheduleRow[]
  at: number
}
const hubCache = new Map<string, HubSnapshot>()
const HUB_TTL_MS = 10_000

/**
 * Shared home/tasks data with stale-while-revalidate:
 * - Instant paint from module cache when navigating between pages
 * - Background refresh without blanking UI
 * - Parallel network requests (no sequential waterfalls)
 */
export function useSessionHub(userId: string | undefined) {
  const cached = userId ? hubCache.get(userId) : undefined
  const [session, setSession] = useState<Session | null>(cached?.session ?? null)
  const [tasks, setTasks] = useState<Task[]>(cached?.tasks ?? [])
  const [behavior, setBehavior] = useState<BehaviorCounts>(
    cached?.behavior ?? { touch: 0, urge: 0, removal: 0 },
  )
  const [proofSlots, setProofSlots] = useState<ProofScheduleRow[]>(cached?.proofSlots ?? [])
  const [loading, setLoading] = useState(!cached)
  const [refreshing, setRefreshing] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const refresh = useCallback(async (opts?: { force?: boolean }) => {
    if (!userId) {
      setSession(null)
      setTasks([])
      setProofSlots([])
      setLoading(false)
      setRefreshing(false)
      return
    }

    const existing = hubCache.get(userId)
    const freshEnough =
      !opts?.force && existing && Date.now() - existing.at < HUB_TTL_MS

    // Instant: use cache if present; only block UI on cold start
    if (existing) {
      setSession(existing.session)
      setTasks(existing.tasks)
      setBehavior(existing.behavior)
      setProofSlots(existing.proofSlots)
      setLoading(false)
      if (freshEnough) return
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      // Parallel: session + tasks (was sequential waterfall)
      const [active, recent] = await Promise.all([
        getLiveSession(userId, { bypassCache: opts?.force }),
        getUserTasks(userId, [...OPEN_STATUSES]),
      ])

      if (!mounted.current) return

      setSession(active)
      const sorted = [...recent].sort(
        (a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime(),
      )
      setTasks(sorted)

      // Non-blocking: seed check-ins without delaying paint
      if (active?.id) {
        void fetch('/api/checkin/ensure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, sessionId: active.id }),
        }).catch(() => null)
      }

      const q = new URLSearchParams({ userId })
      if (active?.id) q.set('sessionId', active.id)

      const [behRes, proofRes] = await Promise.all([
        fetch(`/api/behavior/today?${q}`).then((r) => r.json()).catch(() => null),
        fetch(`/api/proof/schedule?${q}`).then((r) => r.json()).catch(() => null),
      ])

      if (!mounted.current) return

      const nextBehavior: BehaviorCounts = behRes?.counts ?? {
        touch: 0,
        urge: 0,
        removal: 0,
      }
      const schedule = proofRes?.schedule
      const nextSlots: ProofScheduleRow[] = Array.isArray(schedule) ? schedule : []

      setBehavior(nextBehavior)
      setProofSlots(nextSlots)

      hubCache.set(userId, {
        session: active,
        tasks: sorted,
        behavior: nextBehavior,
        proofSlots: nextSlots,
        at: Date.now(),
      })
    } finally {
      if (mounted.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const forceRefresh = useCallback(() => refresh({ force: true }), [refresh])

  return {
    session,
    tasks,
    behavior,
    proofSlots,
    loading,
    refreshing,
    refresh: forceRefresh,
  }
}

export function invalidateHubCache(userId?: string) {
  if (userId) hubCache.delete(userId)
  else hubCache.clear()
}
