'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

const HEADSPACE_TAGS = ['needy', 'floaty', 'defiant', 'broken', 'eager', 'desperate', 'content', 'frustrated'] as const
type HeadspaceTag = typeof HEADSPACE_TAGS[number]

interface Props {
  userId: string
  sessionId: string
  onClose: () => void
  onSubmit?: () => void
}

export function MoodCheckinModal({ userId, sessionId, onClose, onSubmit }: Props) {
  const [submissionDepth, setSubmissionDepth] = useState(5)
  const [frustrationLevel, setFrustrationLevel] = useState(5)
  const [selectedTags, setSelectedTags] = useState<HeadspaceTag[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleTag = (tag: HeadspaceTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSkip = () => {
    // Store skip in sessionStorage per session so it persists across tab switches
    sessionStorage.setItem(`mood_skip_${sessionId}`, '1')
    onClose()
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/mood/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          submission_depth: submissionDepth,
          frustration_level: frustrationLevel,
          headspace_tags: selectedTags,
          notes: notes.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save check-in')
      }
      onSubmit?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-bg-secondary border border-border-subtle rounded-2xl w-full max-w-md space-y-5 p-5 relative">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-text-tertiary hover:text-text-secondary transition-colors"
          aria-label="Skip check-in"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <h2 className="text-lg font-bold">Mood Check-in</h2>
          <p className="text-xs text-text-tertiary mt-0.5">How are you feeling right now?</p>
        </div>

        {/* Submission depth */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary font-medium">Submission Depth</span>
            <span className="text-purple-primary font-mono font-bold">{submissionDepth}/10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={submissionDepth}
            onChange={(e) => setSubmissionDepth(Number(e.target.value))}
            className="w-full accent-purple-primary"
          />
          <div className="flex justify-between text-[10px] text-text-tertiary">
            <span>Resistant</span>
            <span>Deeply submissive</span>
          </div>
        </div>

        {/* Frustration level */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary font-medium">Frustration Level</span>
            <span className="text-red-primary font-mono font-bold">{frustrationLevel}/10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={frustrationLevel}
            onChange={(e) => setFrustrationLevel(Number(e.target.value))}
            className="w-full accent-red-500"
          />
          <div className="flex justify-between text-[10px] text-text-tertiary">
            <span>Calm</span>
            <span>Desperate</span>
          </div>
        </div>

        {/* Headspace tags */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-secondary">Headspace</p>
          <div className="flex flex-wrap gap-2">
            {HEADSPACE_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-purple-primary text-white'
                    : 'bg-bg-tertiary text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Optional notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes (max 280 chars)"
          maxLength={280}
          rows={2}
          className="w-full bg-bg-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:border-purple-primary/50"
        />

        {error && <p className="text-red-primary text-xs">{error}</p>}

        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="flex-1">
            Skip for now
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Saving…' : 'Submit'}
          </Button>
        </div>
      </div>
    </div>
  )
}
