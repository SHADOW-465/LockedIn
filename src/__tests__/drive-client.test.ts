// src/__tests__/drive-client.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getDriveState, disconnectDrive, getValidToken } from '@/lib/google-drive/drive-client'

const STORAGE_KEY = 'lockedin_gdrive_state'

const mockState = {
  accessToken: 'tok_abc',
  expiresAt: Date.now() + 3_600_000,
  email: 'user@test.com',
  rootFolderId: 'folder-123',
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('getDriveState', () => {
  it('returns null when localStorage is empty', () => {
    expect(getDriveState()).toBeNull()
  })

  it('returns parsed state when set', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockState))
    const state = getDriveState()
    expect(state).not.toBeNull()
    expect(state!.email).toBe('user@test.com')
    expect(state!.accessToken).toBe('tok_abc')
  })
})

describe('disconnectDrive', () => {
  it('clears the localStorage key', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockState))
    disconnectDrive()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(getDriveState()).toBeNull()
  })
})

describe('getValidToken', () => {
  it('throws when not connected', async () => {
    await expect(getValidToken()).rejects.toThrow('Google Drive not connected')
  })

  it('returns stored token when not expired', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockState))
    const token = await getValidToken()
    expect(token).toBe('tok_abc')
  })

  it('calls requestAccessToken when token is expired', async () => {
    const expiredState = { ...mockState, expiresAt: Date.now() - 1000 }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expiredState))

    const mockCallback = vi.fn()
    // Mock global google GIS
    ;(globalThis as Record<string, unknown>).google = {
      accounts: {
        oauth2: {
          initTokenClient: vi.fn().mockReturnValue({
            requestAccessToken: mockCallback.mockImplementation(({ callback }) => {
              callback({ access_token: 'new_token', expires_in: 3600 })
            }),
          }),
        },
      },
    }

    const token = await getValidToken()
    expect(token).toBe('new_token')
  })
})
