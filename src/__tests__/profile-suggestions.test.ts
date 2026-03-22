import { describe, it, expect } from 'vitest'

// Pure logic tests for the suggestions endpoint behavior
const RATE_LIMIT_MS = 10 * 60 * 1000 // 10 minutes

const lastRequestMap = new Map<string, number>()

function isRateLimited(userId: string): boolean {
    const last = lastRequestMap.get(userId)
    if (!last) return false
    return Date.now() - last < RATE_LIMIT_MS
}

function recordRequest(userId: string): void {
    lastRequestMap.set(userId, Date.now())
}

describe('Profile suggestions rate limiting logic', () => {
    it('allows first request', () => {
        expect(isRateLimited('user-a')).toBe(false)
    })

    it('blocks immediately after first request', () => {
        recordRequest('user-b')
        expect(isRateLimited('user-b')).toBe(true)
    })

    it('different users are independent', () => {
        recordRequest('user-c')
        expect(isRateLimited('user-d')).toBe(false)
    })
})
