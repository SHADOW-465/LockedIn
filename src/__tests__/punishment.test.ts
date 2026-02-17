import { describe, it, expect } from 'vitest'
import { PUNISHMENT_TABLE, getPunishmentHours } from '@/lib/engines/punishment'

describe('Punishment Engine', () => {
    describe('PUNISHMENT_TABLE', () => {
        it('should have entries for all violation types', () => {
            const types = ['task_failed', 'rude_chat', 'failed_verification', 'missed_deadline', 'unauthorized_release', 'skipped_task']
            for (const t of types) {
                expect(PUNISHMENT_TABLE).toHaveProperty(t)
            }
        })

        it('should have entries for all tiers', () => {
            const tiers = ['Newbie', 'Slave', 'Hardcore', 'Extreme', 'Total Destruction']
            for (const type of Object.keys(PUNISHMENT_TABLE)) {
                for (const tier of tiers) {
                    expect(PUNISHMENT_TABLE[type]).toHaveProperty(tier)
                }
            }
        })

        it('should escalate punishment hours with tier', () => {
            const tiers = ['Newbie', 'Slave', 'Hardcore', 'Extreme', 'Total Destruction']
            for (const type of Object.keys(PUNISHMENT_TABLE)) {
                for (let i = 1; i < tiers.length; i++) {
                    const prevHours = PUNISHMENT_TABLE[type][tiers[i - 1]]
                    const currHours = PUNISHMENT_TABLE[type][tiers[i]]
                    expect(currHours).toBeGreaterThanOrEqual(prevHours)
                }
            }
        })
    })

    describe('getPunishmentHours', () => {
        it('should return correct hours for known types and tiers', () => {
            expect(getPunishmentHours('task_failed', 'Newbie')).toBe(2)
            expect(getPunishmentHours('rude_chat', 'Slave')).toBe(2)
            expect(getPunishmentHours('unauthorized_release', 'Total Destruction')).toBe(168)
        })

        it('should return default 4 hours for unknown violation type', () => {
            expect(getPunishmentHours('nonexistent_type', 'Newbie')).toBe(4)
        })

        it('should return default 4 hours for unknown tier', () => {
            expect(getPunishmentHours('task_failed', 'NonexistentTier')).toBe(4)
        })

        it('should never return zero or negative hours', () => {
            const tiers = ['Newbie', 'Slave', 'Hardcore', 'Extreme', 'Total Destruction']
            for (const type of Object.keys(PUNISHMENT_TABLE)) {
                for (const tier of tiers) {
                    expect(getPunishmentHours(type, tier)).toBeGreaterThan(0)
                }
            }
        })
    })
})
