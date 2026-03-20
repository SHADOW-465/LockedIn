import type { PunishmentPoolItem } from '@/lib/supabase/schema'

// Default pool seeded for every new user (idempotent via DB unique constraint)
export const DEFAULT_POOL_SEED: Omit<PunishmentPoolItem, 'id' | 'user_id' | 'created_at'>[] = [
  { title: 'Cold shower', description: 'Take a full cold shower — no warm water.', severity: 1, requires_proof: false, is_custom: false },
  { title: '50 jumping jacks', description: 'Complete 50 jumping jacks immediately.', severity: 1, requires_proof: false, is_custom: false },
  { title: 'Write lines ×20', description: 'Write "I will obey without question" 20 times by hand.', severity: 2, requires_proof: true, is_custom: false },
  { title: 'No orgasm extension: +2h', description: 'Lock time extended by 2 hours. Noted in your record.', severity: 2, requires_proof: false, is_custom: false },
  { title: 'Kneel for 10 minutes', description: 'Kneel on a hard floor for 10 full minutes. No kneeling pad.', severity: 2, requires_proof: false, is_custom: false },
  { title: 'Edge denial report', description: 'Write a detailed report of your current denial state and frustration level.', severity: 2, requires_proof: true, is_custom: false },
  { title: 'Inspection photo', description: 'Take and submit a device inspection photo within 15 minutes.', severity: 3, requires_proof: true, is_custom: false },
  { title: 'Write lines ×50', description: 'Write "I am locked and owned" 50 times. No shortcuts.', severity: 3, requires_proof: true, is_custom: false },
  { title: 'No orgasm extension: +6h', description: 'Lock time extended by 6 hours for your failure.', severity: 3, requires_proof: false, is_custom: false },
  { title: 'Humiliation mantra', description: 'Record yourself saying your assigned mantra 10 times aloud.', severity: 4, requires_proof: true, is_custom: false },
  { title: 'No orgasm extension: +12h', description: 'Lock time extended by 12 hours. Consider this a lesson.', severity: 4, requires_proof: false, is_custom: false },
  { title: 'Full obedience essay', description: 'Write a 200-word essay on why you deserve punishment and what you will do better.', severity: 5, requires_proof: true, is_custom: false },
]

/**
 * Build a weighted pool where higher-severity items appear more often
 * when violations (total_tasks_failed) are higher.
 *
 * At 0 violations: all items equally weighted.
 * At 5+ violations: severity-5 items have 5× the weight of severity-1.
 */
export function buildWeightedPool(
  pool: PunishmentPoolItem[],
  violations: number,
): PunishmentPoolItem[] {
  if (pool.length === 0) return []

  const violationFactor = Math.min(violations, 10) / 10 // 0..1

  const weighted: PunishmentPoolItem[] = []
  for (const item of pool) {
    // Base weight: 1. Extra weight scales with violations × severity
    const weight = Math.round(1 + violationFactor * (item.severity - 1) * 2)
    for (let i = 0; i < weight; i++) {
      weighted.push(item)
    }
  }
  return weighted
}

/**
 * Pick a random item from a weighted pool.
 * Pool must be non-empty.
 */
export function pickFromWeightedPool(pool: PunishmentPoolItem[]): PunishmentPoolItem {
  if (pool.length === 0) throw new Error('empty_pool')
  return pool[Math.floor(Math.random() * pool.length)]
}
