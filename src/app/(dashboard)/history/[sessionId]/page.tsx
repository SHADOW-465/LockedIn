'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { SessionDetail } from '@/components/features/history/session-detail'
import { getSessionArchive } from '@/lib/local-storage/session-archive'
import { useAuth } from '@/lib/contexts/auth-context'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { SessionArchive } from '@/lib/local-storage/db'

export default function SessionDetailPage() {
  const { user } = useAuth()
  const { sessionId } = useParams<{ sessionId: string }>()
  const [archive, setArchive] = useState<SessionArchive | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    getSessionArchive(sessionId)
      .then((result) => setArchive(result ?? null))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [sessionId])

  return (
    <>
      <TopBar />
      <div className="min-h-screen bg-black pb-24 lg:pb-8 p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-2">
            <Link href="/history" className="text-white/30 hover:text-white/85 transition-colors flex items-center gap-1 text-sm">
              <ChevronLeft className="w-4 h-4" />
              Past Sessions
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-white/30" />
            </div>
          ) : archive && user ? (
            <SessionDetail archive={archive} userId={user.id} />
          ) : (
            <p className="text-white/30 text-center py-12">Session not found in local storage.</p>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  )
}
