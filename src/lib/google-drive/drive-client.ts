// src/lib/google-drive/drive-client.ts

const STORAGE_KEY = 'lockedin_gdrive_state'
const REFRESH_BUFFER_MS = 5 * 60 * 1000 // 5 minutes

export interface DriveState {
  accessToken: string
  expiresAt: number
  email: string
  rootFolderId: string
}

// Singleton refresh promise — prevents parallel GIS consent callbacks
let _refreshPromise: Promise<string> | null = null

export function getDriveState(): DriveState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DriveState) : null
  } catch {
    return null
  }
}

function saveDriveState(state: DriveState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    console.warn('[Drive] localStorage write failed')
  }
}

export function disconnectDrive(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export async function getValidToken(): Promise<string> {
  const state = getDriveState()
  if (!state) throw new Error('Google Drive not connected')

  // Token still valid (with buffer)
  if (state.expiresAt - Date.now() > REFRESH_BUFFER_MS) {
    return state.accessToken
  }

  // Reuse in-flight refresh if one is already running
  if (_refreshPromise) return _refreshPromise

  _refreshPromise = new Promise<string>((resolve, reject) => {
    const g = (globalThis as Record<string, unknown>).google as {
      accounts: {
        oauth2: {
          initTokenClient: (config: unknown) => { requestAccessToken: (opts: unknown) => void }
        }
      }
    }
    if (!g?.accounts?.oauth2) {
      reject(new Error('GIS not loaded'))
      return
    }
    const client = g.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      scope: 'https://www.googleapis.com/auth/drive.file',
    })
    client.requestAccessToken({
      prompt: '',
      callback: (response: { access_token?: string; expires_in?: number; error?: string }) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || 'Token refresh failed'))
          return
        }
        const currentState = getDriveState()
        if (!currentState) {
          reject(new Error('Drive state lost during refresh'))
          return
        }
        const newState: DriveState = {
          ...currentState,
          accessToken: response.access_token,
          expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
        }
        saveDriveState(newState)
        resolve(response.access_token)
      },
    })
  }).finally(() => {
    _refreshPromise = null
  })

  return _refreshPromise
}

export async function connectDrive(): Promise<void> {
  const { ensureFolder } = await import('./drive-api')

  return new Promise<void>((resolve, reject) => {
    const g = (globalThis as Record<string, unknown>).google as {
      accounts: {
        oauth2: {
          initTokenClient: (config: unknown) => { requestAccessToken: (opts: unknown) => void }
        }
      }
    }
    if (!g?.accounts?.oauth2) {
      reject(new Error('GIS not loaded'))
      return
    }

    const client = g.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      scope: 'https://www.googleapis.com/auth/drive.file',
    })

    client.requestAccessToken({
      prompt: 'select_account',
      callback: async (response: {
        access_token?: string
        expires_in?: number
        error?: string
        token_type?: string
      }) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || 'User cancelled'))
          return
        }

        // Temporary state to use ensureFolder
        const tempState: DriveState = {
          accessToken: response.access_token,
          expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
          email: '',
          rootFolderId: '',
        }
        saveDriveState(tempState)

        try {
          const rootFolderId = await ensureFolder('LockedIn', 'root')
          // Get email from token info
          const infoRes = await fetch(
            `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${response.access_token}`
          )
          const info = await infoRes.json()
          const finalState: DriveState = {
            accessToken: response.access_token,
            expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
            email: info.email ?? '',
            rootFolderId,
          }
          saveDriveState(finalState)
          resolve()
        } catch (err) {
          disconnectDrive()
          reject(err)
        }
      },
    })
  })
}
