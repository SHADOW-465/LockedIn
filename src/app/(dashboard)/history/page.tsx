'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { SessionList } from '@/components/features/history/session-list'
import { listUserArchives } from '@/lib/local-storage/session-archive'
import { useAuth } from '@/lib/contexts/auth-context'
import { Loader2 } from 'lucide-react'
import type { SessionArchive } from '@/lib/local-storage/db'

export default function HistoryPage() {
  const { user } = useAuth()
  const [archives, setArchives] = useState<SessionArchive[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    listUserArchives(user.id)
      .then((results) => {
        // Sort newest first
        setArchives(results.reverse())
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  return (
    <>
      <TopBar />
      <div className="min-h-screen pb-24 lg:pb-8 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Past Sessions</h1>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
            </div>
          ) : (
            <SessionList archives={archives} />
          )}
        </div>
      </div>
      <BottomNav />
    </>
  )
}
