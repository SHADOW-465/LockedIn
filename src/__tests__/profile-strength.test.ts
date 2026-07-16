import { describe, it, expect } from 'vitest'
import { calcProfileStrength } from '@/lib/profile-strength'

describe('calcProfileStrength', () => {
    it('returns 0 for empty profile', () => {
        expect(calcProfileStrength({})).toBe(0)
    })

    it('awards 20pts for master_preference', () => {
        expect(calcProfileStrength({ master_preference: 'no outdoor tasks' })).toBe(20)
    })

    it('awards 10pts for tier', () => {
        expect(calcProfileStrength({ tier: 'Slave' })).toBe(10)
    })

    it('awards 10pts for ai_personality', () => {
        expect(calcProfileStrength({ ai_personality: 'Strict Master' })).toBe(10)
    })

    it('awards 10pts for hard_limits (non-empty array)', () => {
        expect(calcProfileStrength({ hard_limits: ['blood'] })).toBe(10)
    })

    it('awards 10pts for interests (non-empty array)', () => {
        expect(calcProfileStrength({ interests: ['chastity'] })).toBe(10)
    })

    it('awards 10pts for preferred_regimens (non-empty array)', () => {
        expect(calcProfileStrength({ preferred_regimens: ['Endurance Protocol'] })).toBe(10)
    })

    it('awards 10pts for psych_profile', () => {
        expect(calcProfileStrength({ psych_profile: 'I need structure' })).toBe(10)
    })

    it('awards 5pts for initial_lock_goal_hours', () => {
        expect(calcProfileStrength({ initial_lock_goal_hours: 168 })).toBe(5)
    })

    it('awards 5pts for physical_details (non-null)', () => {
        expect(calcProfileStrength({ physical_details: { bodyType: 'slim' } })).toBe(5)
    })

    it('awards 5pts for communication_style (non-null)', () => {
        expect(calcProfileStrength({
            communication_style: { feedback_frequency: 'moderate', tone_preference: 'balanced', punishment_sensitivity: 'moderate' }
        })).toBe(5)
    })

    it('awards 5pts for availability (non-empty active_hours)', () => {
        expect(calcProfileStrength({
            availability: { active_hours: [{ start: '08:00', end: '22:00' }], timezone: 'UTC' }
        })).toBe(5)
    })

    it('caps at 100', () => {
        const fullProfile = {
            master_preference: 'no outdoor tasks',
            tier: 'Slave',
            ai_personality: 'Strict Master',
            hard_limits: ['blood'],
            interests: ['chastity'],
            preferred_regimens: ['Endurance'],
            psych_profile: 'structured',
            initial_lock_goal_hours: 168,
            physical_details: { bodyType: 'slim' },
            communication_style: { feedback_frequency: 'moderate' as const, tone_preference: 'balanced' as const, punishment_sensitivity: 'moderate' as const },
            availability: { active_hours: [{ start: '08:00', end: '22:00' }], timezone: 'UTC' },
        }
        expect(calcProfileStrength(fullProfile)).toBe(100)
    })
})
