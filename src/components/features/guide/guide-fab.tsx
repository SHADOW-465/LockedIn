'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { GuideSheet } from './guide-sheet'

export function GuideFab() {
  const { user, loading } = useAuth()
  const [open, setOpen] = useState(false)

  // Render nothing until auth is confirmed
  if (loading || !user) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-10 h-10 rounded-full bg-gradient-to-br from-purple-700 to-purple-500 shadow-lg shadow-purple-900/50 flex items-center justify-center text-white font-bold text-lg border border-white/15 hover:scale-105 transition-transform"
        aria-label="Open app guide"
      >
        ?
      </button>
      {open && <GuideSheet onClose={() => setOpen(false)} />}
    </>
  )
}
