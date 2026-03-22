import { describe, it, expect } from 'vitest'
import { conflictsWithPreferences } from '@/lib/ai/preference-conflicts'

describe('conflictsWithPreferences', () => {
    const noConstraints = {
        no_public_humiliation: false,
        no_face_revealing: false,
        no_outdoor_tasks: false,
        no_involving_others: false,
    }

    it('returns false when no preference and no constraints', () => {
        expect(conflictsWithPreferences('Do 10 push-ups', '', noConstraints)).toBe(false)
    })

    it('detects conflict with master_preference keyword', () => {
        expect(conflictsWithPreferences(
            'Take a photo outside in public',
            'NO outdoor tasks ever',
            noConstraints
        )).toBe(true)
    })

    it('detects no_public_humiliation constraint', () => {
        expect(conflictsWithPreferences(
            'Humiliate yourself in public',
            '',
            { ...noConstraints, no_public_humiliation: true }
        )).toBe(true)
    })

    it('detects no_outdoor_tasks constraint', () => {
        expect(conflictsWithPreferences(
            'Go outside and perform this task',
            '',
            { ...noConstraints, no_outdoor_tasks: true }
        )).toBe(true)
    })

    it('detects no_involving_others constraint', () => {
        expect(conflictsWithPreferences(
            'Ask a friend to participate',
            '',
            { ...noConstraints, no_involving_others: true }
        )).toBe(true)
    })

    it('detects no_face_revealing constraint', () => {
        expect(conflictsWithPreferences(
            'Show your face in the photo',
            '',
            { ...noConstraints, no_face_revealing: true }
        )).toBe(true)
    })

    it('returns false when constraint is off', () => {
        expect(conflictsWithPreferences(
            'Go outside and perform this task',
            '',
            noConstraints // no_outdoor_tasks is false
        )).toBe(false)
    })

    it('handles null privacy constraints gracefully', () => {
        expect(conflictsWithPreferences('Do 10 push-ups', '', null)).toBe(false)
    })

    it('is case-insensitive for master_preference matching', () => {
        expect(conflictsWithPreferences(
            'GO OUTSIDE AND TAKE A PHOTO',
            'no outdoor activities',
            noConstraints
        )).toBe(true)
    })
})
