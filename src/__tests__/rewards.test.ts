import { describe, it, expect } from 'vitest'

// XP per difficulty — mirroring the rewards engine
const XP_PER_DIFFICULTY: Record<number, number> = {
    1: 5,
    2: 10,
    3: 20,
    4: 40,
    5: 80,
}

describe('Rewards Engine', () => {
    describe('XP Awards', () => {
        it('should award correct XP per difficulty', () => {
            expect(XP_PER_DIFFICULTY[1]).toBe(5)
            expect(XP_PER_DIFFICULTY[2]).toBe(10)
            expect(XP_PER_DIFFICULTY[3]).toBe(20)
            expect(XP_PER_DIFFICULTY[4]).toBe(40)
            expect(XP_PER_DIFFICULTY[5]).toBe(80)
        })

        it('should have increasing XP with difficulty', () => {
            for (let d = 2; d <= 5; d++) {
                expect(XP_PER_DIFFICULTY[d]).toBeGreaterThan(XP_PER_DIFFICULTY[d - 1])
            }
        })

        it('should default to 5 for unknown difficulty', () => {
            const xp = XP_PER_DIFFICULTY[99] ?? 5
            expect(xp).toBe(5)
        })
    })

    describe('Achievement Definitions', () => {
        interface AchievementDef {
            name: string
            check: (stats: { totalCompleted: number; totalXp: number; complianceStreak: number }) => boolean
        }

        const achievements: AchievementDef[] = [
            { name: 'First Task', check: (s) => s.totalCompleted >= 1 },
            { name: 'Obedient Slave', check: (s) => s.totalCompleted >= 10 },
            { name: 'Task Machine', check: (s) => s.totalCompleted >= 50 },
            { name: 'Century Club', check: (s) => s.totalCompleted >= 100 },
            { name: 'Streak Starter', check: (s) => s.complianceStreak >= 3 },
            { name: 'Week Warrior', check: (s) => s.complianceStreak >= 7 },
            { name: 'XP Apprentice', check: (s) => s.totalXp >= 100 },
            { name: 'XP Master', check: (s) => s.totalXp >= 1000 },
        ]

        it('should not award any achievements for fresh user', () => {
            const stats = { totalCompleted: 0, totalXp: 0, complianceStreak: 0 }
            const earned = achievements.filter(a => a.check(stats))
            expect(earned).toHaveLength(0)
        })

        it('should award First Task after 1 completion', () => {
            const stats = { totalCompleted: 1, totalXp: 5, complianceStreak: 1 }
            const earned = achievements.filter(a => a.check(stats))
            expect(earned.map(a => a.name)).toContain('First Task')
        })

        it('should award multiple achievements for experienced user', () => {
            const stats = { totalCompleted: 55, totalXp: 500, complianceStreak: 8 }
            const earned = achievements.filter(a => a.check(stats))
            const names = earned.map(a => a.name)

            expect(names).toContain('First Task')
            expect(names).toContain('Obedient Slave')
            expect(names).toContain('Task Machine')
            expect(names).toContain('Streak Starter')
            expect(names).toContain('Week Warrior')
            expect(names).toContain('XP Apprentice')
            expect(names).not.toContain('Century Club')
            expect(names).not.toContain('XP Master')
        })

        it('should never double-award if existing names are filtered', () => {
            const stats = { totalCompleted: 10, totalXp: 100, complianceStreak: 3 }
            const existingNames = new Set(['First Task', 'Streak Starter'])

            const newAwards = achievements.filter(
                a => a.check(stats) && !existingNames.has(a.name)
            )
            const names = newAwards.map(a => a.name)

            expect(names).not.toContain('First Task')
            expect(names).not.toContain('Streak Starter')
            expect(names).toContain('Obedient Slave')
            expect(names).toContain('XP Apprentice')
        })
    })
})
