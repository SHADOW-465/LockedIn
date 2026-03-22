import { describe, it, expect } from 'vitest'

// Test the session-exemption logic in isolation (pure logic, no HTTP)
const SESSION_EXEMPT_FIELDS = new Set(['master_preference', 'session_intent', 'privacy_constraints'])

function isAllExempt(bodyKeys: string[]): boolean {
    return bodyKeys.filter(k => k !== 'userId').every(k => SESSION_EXEMPT_FIELDS.has(k))
}

describe('Profile update active-session exemption logic', () => {
    it('allows master_preference alone (exempt)', () => {
        expect(isAllExempt(['userId', 'master_preference'])).toBe(true)
    })

    it('allows session_intent alone (exempt)', () => {
        expect(isAllExempt(['userId', 'session_intent'])).toBe(true)
    })

    it('allows privacy_constraints alone (exempt)', () => {
        expect(isAllExempt(['userId', 'privacy_constraints'])).toBe(true)
    })

    it('blocks tier change (non-exempt) during session', () => {
        expect(isAllExempt(['userId', 'tier'])).toBe(false)
    })

    it('blocks mixed exempt + non-exempt update', () => {
        expect(isAllExempt(['userId', 'master_preference', 'tier'])).toBe(false)
    })

    it('allows all three exempt fields together', () => {
        expect(isAllExempt(['userId', 'master_preference', 'session_intent', 'privacy_constraints'])).toBe(true)
    })
})
