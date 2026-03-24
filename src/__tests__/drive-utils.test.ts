// src/__tests__/drive-utils.test.ts
import { describe, it, expect } from 'vitest'
import { buildSessionFolderName, buildProofFilename } from '@/lib/google-drive/drive-utils'

describe('buildSessionFolderName', () => {
  it('uses start and end date when both present', () => {
    expect(buildSessionFolderName('2026-02-15T10:00:00Z', '2026-02-22T10:00:00Z', '2026-02-15T10:00:00Z'))
      .toBe('2026-02-15_to_2026-02-22')
  })

  it('falls back to fallback date when startTime is missing', () => {
    expect(buildSessionFolderName(undefined, '2026-02-22T10:00:00Z', '2026-02-15T10:00:00Z'))
      .toBe('2026-02-15_to_2026-02-15')
  })

  it('falls back to fallback date when endTime is missing', () => {
    expect(buildSessionFolderName('2026-02-15T10:00:00Z', undefined, '2026-03-01T08:00:00Z'))
      .toBe('2026-03-01_to_2026-03-01')
  })

  it('falls back to fallback date when both are missing', () => {
    expect(buildSessionFolderName(undefined, undefined, '2026-03-01T12:00:00Z'))
      .toBe('2026-03-01_to_2026-03-01')
  })
})

describe('buildProofFilename', () => {
  it('builds filename for checkin-morning image proof', () => {
    const result = buildProofFilename('2026-02-16T09:00:00Z', 'checkin', 'Morning Check-in', 'image')
    expect(result).toBe('2026-02-16_checkin-morning_morning-check-in.jpg')
  })

  it('builds filename for master-task video proof', () => {
    const result = buildProofFilename('2026-02-16T09:00:00Z', 'master', 'Edge Endurance Exercise', 'video')
    expect(result).toBe('2026-02-16_master-task_edge-endurance-exercise.mp4')
  })

  it('builds filename for punishment-task audio proof', () => {
    const result = buildProofFilename('2026-02-16T09:00:00Z', 'punishment', 'Wall Position Hold', 'audio')
    expect(result).toBe('2026-02-16_punishment-task_wall-position-hold.webm')
  })

  it('truncates title slug to 40 characters', () => {
    const longTitle = 'This Is A Very Long Title That Should Be Truncated By The System'
    const result = buildProofFilename('2026-02-16T09:00:00Z', 'daily', longTitle, 'image')
    // slug is everything after date_type_ prefix
    const withoutDate = result.replace(/^\d{4}-\d{2}-\d{2}_daily-task_/, '')
    const slug = withoutDate.replace('.jpg', '')
    expect(slug.length).toBeLessThanOrEqual(40)
  })

  it('replaces non-alphanumeric chars with hyphens in slug', () => {
    const result = buildProofFilename('2026-02-16T09:00:00Z', 'master', 'Task: With! Special@Chars', 'image')
    expect(result).toMatch(/^2026-02-16_master-task_task--with--special-chars\.jpg$/)
  })

  it('builds filename for checkin-night', () => {
    const night = buildProofFilename('2026-02-16T21:00:00Z', 'checkin', 'Night Check-in', 'image')
    expect(night).toBe('2026-02-16_checkin-night_night-check-in.jpg')
  })
})
