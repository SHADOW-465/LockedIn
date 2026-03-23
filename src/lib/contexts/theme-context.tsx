'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { applyTheme } from '@/lib/themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()

  useEffect(() => {
    applyTheme(profile?.theme ?? 'crimson')
  }, [profile?.theme])

  return <>{children}</>
}
