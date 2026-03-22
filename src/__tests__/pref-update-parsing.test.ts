import { describe, it, expect } from 'vitest'
import { parsePrefUpdates, stripPrefUpdates } from '@/lib/ai/pref-update-parser'

describe('parsePrefUpdates', () => {
    it('returns empty array when no marker', () => {
        expect(parsePrefUpdates('Hello slave, do this task')).toEqual([])
    })

    it('parses a single set update', () => {
        const result = parsePrefUpdates('Good girl. [PREF_UPDATE:{"field":"session_intent","action":"set","value":"focus on endurance"}]')
        expect(result).toEqual([{ field: 'session_intent', action: 'set', value: 'focus on endurance' }])
    })

    it('parses multiple updates', () => {
        const text = 'Done. [PREF_UPDATE:{"field":"master_preference","action":"set","value":"no outdoor tasks"}] [PREF_UPDATE:{"field":"session_intent","action":"append","value":"edge training"}]'
        const result = parsePrefUpdates(text)
        expect(result).toHaveLength(2)
        expect(result[0].field).toBe('master_preference')
        expect(result[1].field).toBe('session_intent')
    })

    it('skips malformed JSON', () => {
        expect(parsePrefUpdates('[PREF_UPDATE:not valid json]')).toEqual([])
    })

    it('skips updates missing required fields', () => {
        expect(parsePrefUpdates('[PREF_UPDATE:{"field":"session_intent"}]')).toEqual([])
    })

    it('skips updates with invalid action value', () => {
        expect(parsePrefUpdates('[PREF_UPDATE:{"field":"session_intent","action":"delete","value":"x"}]')).toEqual([])
    })
})

describe('stripPrefUpdates', () => {
    it('removes PREF_UPDATE markers from text', () => {
        const text = 'Good girl. [PREF_UPDATE:{"field":"session_intent","action":"set","value":"endurance"}]'
        expect(stripPrefUpdates(text)).toBe('Good girl.')
    })

    it('returns text unchanged when no markers', () => {
        expect(stripPrefUpdates('Hello slave')).toBe('Hello slave')
    })

    it('removes multiple markers', () => {
        const text = 'Done. [PREF_UPDATE:{"field":"a","action":"set","value":"x"}] [PREF_UPDATE:{"field":"b","action":"set","value":"y"}]'
        expect(stripPrefUpdates(text)).toBe('Done.')
    })
})
