'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'
import type { SessionArchive } from '@/lib/local-storage/db'

interface Props {
  archives: SessionArchive[]
}

function gradeColor(grade: string) {
  if (!grade) return 'text-text-tertiary'
  if (grade.startsWith('A')) return 'text-teal-primary'
  if (grade.startsWith('B')) return 'text-tier-slave'
  return 'text-red-primary'
}

export function SessionList({ archives }: Props) {
  if (archives.length === 0) {
    return (
      <Card variant="flat" className="text-center py-12">
        <p className="text-text-tertiary mb-2">No archived sessions yet.</p>
        <p className="text-xs text-text-tertiary">Complete your first session to see it here.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {archives.map((archive) => {
        const data = archive.session_data
        const summary = archive.summary
        const grade = typeof summary?.performance_grade === 'string' ? summary.performance_grade : ''
        const compliance = typeof summary?.compliance_rate === 'number' ? summary.compliance_rate : null
        const personality = typeof data?.ai_personality === 'string' ? data.ai_personality : 'Unknown'
        const startTime = typeof data?.start_time === 'string' ? data.start_time : ''
        const endTime = typeof data?.actual_end_time === 'string' ? data.actual_end_time : ''
        const durationMin = typeof data?.total_duration_minutes === 'number' ? data.total_duration_minutes : 0

        return (
          <Link key={archive.session_id} href={`/history/${archive.session_id}`}>
            <Card
              variant="raised"
              className="hover:border-purple-primary/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base">{personality}</h3>
                    {grade && (
                      <span className={`text-lg font-black font-mono ${gradeColor(grade)}`}>{grade}</span>
                    )}
                  </div>
                  <p className="text-xs text-text-tertiary font-mono">
                    {startTime ? format(new Date(startTime), 'MMM d') : '?'}
                    {endTime ? ` → ${format(new Date(endTime), 'MMM d, yyyy')}` : ''}
                    {' · '}
                    {Math.round(durationMin / 60 / 24)} days
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {compliance !== null && (
                    <Badge variant="info">{compliance}% compliance</Badge>
                  )}
                  <Badge variant="genre">
                    {archive.tasks.length} tasks
                  </Badge>
                </div>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
