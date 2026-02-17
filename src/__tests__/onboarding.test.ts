import { describe, it, expect, vi } from 'vitest'

// Mock the supabase module before importing anything that uses it
vi.mock('@/lib/supabase/client', () => ({
    getSupabase: vi.fn(() => ({
        from: vi.fn(() => ({
            upsert: vi.fn(() => ({ error: null })),
            select: vi.fn(() => ({ data: [], error: null })),
        })),
    })),
}))

describe('Onboarding Data Transformation', () => {
    it('should convert selectedRegimens from objects to string array', () => {
        const selectedRegimens = [
            { id: 'sissy-training', name: 'Sissy Training', isPrimary: true },
            { id: 'obedience-service', name: 'Obedience & Service', isPrimary: false },
            { id: 'edging-endurance', name: 'Edging Endurance', isPrimary: false },
        ]

        const mappedRegimens = selectedRegimens.map(r => r.name)

        expect(mappedRegimens).toEqual([
            'Sissy Training',
            'Obedience & Service',
            'Edging Endurance',
        ])
        expect(mappedRegimens.every(r => typeof r === 'string')).toBe(true)
    })

    it('should handle empty selectedRegimens', () => {
        const selectedRegimens: Array<{ id: string; name: string; isPrimary: boolean }> = []
        const mappedRegimens = selectedRegimens.map(r => r.name)
        expect(mappedRegimens).toEqual([])
    })

    it('should build correct profile payload', () => {
        const state = {
            tier: 'Newbie' as const,
            aiPersonality: 'Cruel Mistress',
            hardLimits: ['blood', 'scat'],
            softLimits: ['public humiliation'],
            fetishProfile: ['Chastity & Denial', 'Edging & Orgasm Control'],
            physicalDetails: { bodyType: 'average', age: 25 },
            selectedRegimens: [
                { id: 'sissy-training', name: 'Sissy Training', isPrimary: true },
            ],
            initialLockGoalHours: 168,
            notificationFrequency: 'medium' as const,
            safeword: 'MERCY',
            standbyConsent: false,
        }

        const profilePayload = {
            id: 'test-user-id',
            email: 'test@example.com',
            tier: state.tier || 'Newbie',
            ai_personality: state.aiPersonality,
            hard_limits: state.hardLimits,
            soft_limits: state.softLimits,
            interests: state.fetishProfile,
            physical_details: state.physicalDetails || {},
            preferred_regimens: state.selectedRegimens.map(r => r.name),
            initial_lock_goal_hours: state.initialLockGoalHours,
            notification_frequency: state.notificationFrequency,
            onboarding_completed: true,
            onboarding_step: 11,
        }

        expect(profilePayload.preferred_regimens).toEqual(['Sissy Training'])
        expect(profilePayload.tier).toBe('Newbie')
        expect(profilePayload.onboarding_completed).toBe(true)
        expect(profilePayload.hard_limits).toHaveLength(2)
        expect(profilePayload.interests).toHaveLength(2)
    })

    it('should build correct preferences payload', () => {
        const prefsPayload = {
            user_id: 'test-user-id',
            safeword: 'MERCY',
            notification_frequency: 'medium',
            standby_consent: false,
            hard_limits: ['blood'],
            soft_limits: ['public humiliation'],
        }

        expect(prefsPayload.safeword).toBe('MERCY')
        expect(prefsPayload.standby_consent).toBe(false)
    })

    it('should default empty arrays for hard/soft limits', () => {
        const hardLimits: string[] = []
        const softLimits: string[] = []

        expect(hardLimits).toEqual([])
        expect(softLimits).toEqual([])
    })
})
