import { describe, it, expect } from 'vitest'

describe('Chat API Logic', () => {
    const DEFAULT_SAFEWORD = 'MERCY'

    describe('Safeword Detection', () => {
        it('should detect exact safeword', () => {
            const message = 'MERCY'
            const detected = message.toUpperCase().includes(DEFAULT_SAFEWORD.toUpperCase())
            expect(detected).toBe(true)
        })

        it('should detect safeword case-insensitively', () => {
            const message = 'I need mercy please'
            const detected = message.toUpperCase().includes(DEFAULT_SAFEWORD.toUpperCase())
            expect(detected).toBe(true)
        })

        it('should not detect safeword when absent', () => {
            const message = 'I am obedient, Master'
            const detected = message.toUpperCase().includes(DEFAULT_SAFEWORD.toUpperCase())
            expect(detected).toBe(false)
        })

        it('should detect custom safeword', () => {
            const customSafeword = 'PINEAPPLE'
            const message = 'I need to say pineapple'
            const detected = message.toUpperCase().includes(customSafeword.toUpperCase())
            expect(detected).toBe(true)
        })
    })

    describe('Resume Training Detection', () => {
        it('should detect resume training', () => {
            const message = 'I would like to resume training now'
            const isResume = message.toLowerCase().includes('resume training')
            expect(isResume).toBe(true)
        })

        it('should not falsely detect resume', () => {
            const message = 'I want to continue'
            const isResume = message.toLowerCase().includes('resume training')
            expect(isResume).toBe(false)
        })
    })

    describe('Rudeness Detection', () => {
        const rudeIndicators = ['fuck you', 'shut up', 'i refuse', 'make me', 'no master', 'bite me']

        it('should detect rude messages', () => {
            const message = 'Fuck you, I quit'
            const isRude = rudeIndicators.some(r => message.toLowerCase().includes(r))
            expect(isRude).toBe(true)
        })

        it('should detect subtle rudeness', () => {
            const message = 'You cant make me do anything'
            const isRude = rudeIndicators.some(r => message.toLowerCase().includes(r))
            expect(isRude).toBe(true)
        })

        it('should not detect polite messages as rude', () => {
            const message = 'Yes Master, I will obey'
            const isRude = rudeIndicators.some(r => message.toLowerCase().includes(r))
            expect(isRude).toBe(false)
        })

        it('should not detect normal conversation as rude', () => {
            const message = 'How long is my session?'
            const isRude = rudeIndicators.some(r => message.toLowerCase().includes(r))
            expect(isRude).toBe(false)
        })
    })

    describe('AI Context Building', () => {
        it('should build context with defaults', () => {
            const context = {
                tier: undefined,
                persona: undefined,
                fetishes: undefined,
                hardLimits: undefined,
                willpower: undefined,
            }

            const aiContext = {
                tier: context.tier || 'Newbie',
                persona: context.persona || 'Strict Master',
                fetishes: context.fetishes || [],
                hardLimits: context.hardLimits || [],
                willpower: context.willpower ?? 50,
            }

            expect(aiContext.tier).toBe('Newbie')
            expect(aiContext.persona).toBe('Strict Master')
            expect(aiContext.willpower).toBe(50)
            expect(aiContext.fetishes).toEqual([])
        })

        it('should use provided context values', () => {
            const context = {
                tier: 'Hardcore',
                persona: 'Cruel Mistress',
                fetishes: ['Chastity'],
                hardLimits: ['blood'],
                willpower: 80,
            }

            const aiContext = {
                tier: context.tier || 'Newbie',
                persona: context.persona || 'Strict Master',
                fetishes: context.fetishes || [],
                hardLimits: context.hardLimits || [],
                willpower: context.willpower ?? 50,
            }

            expect(aiContext.tier).toBe('Hardcore')
            expect(aiContext.persona).toBe('Cruel Mistress')
            expect(aiContext.willpower).toBe(80)
        })
    })
})
