'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, Loader2 } from 'lucide-react'
import type { PunishmentPoolItem } from '@/lib/supabase/schema'

const SEVERITY_LABELS: Record<number, string> = {
  1: 'Mild',
  2: 'Moderate',
  3: 'Strict',
  4: 'Severe',
  5: 'Brutal',
}

interface Props {
  userId: string
}

export function PunishmentPoolEditor({ userId }: Props) {
  const [pool, setPool] = useState<PunishmentPoolItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // New entry form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState(2)
  const [requiresProof, setRequiresProof] = useState(false)

  const fetchPool = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/punishment-pool?userId=${userId}`)
      const data = await res.json()
      setPool(data.pool ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchPool()
  }, [fetchPool])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/punishment-pool/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        setPool((prev) => prev.filter((p) => p.id !== id))
      }
    } finally {
      setDeleting(null)
    }
  }

  const handleAdd = async () => {
    if (!title.trim() || !description.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/punishment-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title: title.trim(), description: description.trim(), severity, requires_proof: requiresProof }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to add entry')
        return
      }
      setPool((prev) => [...prev, data.item])
      setTitle('')
      setDescription('')
      setSeverity(2)
      setRequiresProof(false)
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  const customEntries = pool.filter((p) => p.is_custom)
  const systemEntries = pool.filter((p) => !p.is_custom)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Punishment Pool</h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            {customEntries.length}/20 custom entries
          </p>
        </div>
        {!showForm && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowForm(true)}
            disabled={customEntries.length >= 20}
          >
            <Plus size={14} className="mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <Card variant="flat" className="space-y-3">
          <p className="text-xs font-semibold text-text-secondary">New Custom Entry</p>
          <Input
            placeholder="Title (e.g. Cold shower)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
          <textarea
            placeholder="Description — what must the subject do?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={2}
            className="w-full bg-bg-tertiary border border-white/10 rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:border-purple-primary/50"
          />

          {/* Severity picker */}
          <div>
            <p className="text-xs text-text-tertiary mb-1.5">Severity: <span className="text-text-secondary">{SEVERITY_LABELS[severity]}</span></p>
            <div className="flex gap-1.5">
              {([1, 2, 3, 4, 5] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`flex-1 py-1 text-xs font-medium rounded border transition-colors ${
                    severity === s
                      ? 'bg-purple-primary border-purple-primary text-white'
                      : 'bg-bg-tertiary border-white/10 text-text-tertiary hover:bg-bg-hover'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Requires proof toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setRequiresProof((v) => !v)}
              className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${requiresProof ? 'bg-purple-primary' : 'bg-bg-tertiary border border-white/10'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${requiresProof ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-xs text-text-secondary">Requires photo proof</span>
          </label>

          {error && <p className="text-xs text-red-primary">{error}</p>}

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setError(null) }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
              disabled={submitting || !title.trim() || !description.trim()}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Add Entry'}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 size={18} className="animate-spin text-text-tertiary" />
        </div>
      ) : (
        <div className="space-y-2">
          {/* Custom entries */}
          {customEntries.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold px-1">Custom</p>
              {customEntries.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[var(--radius-md)] bg-bg-tertiary border border-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-text-tertiary truncate">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="locked">
                      <span className="text-[10px]">{SEVERITY_LABELS[item.severity]}</span>
                    </Badge>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      className="text-text-tertiary hover:text-red-primary transition-colors"
                    >
                      {deleting === item.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* System entries */}
          {systemEntries.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold px-1">Default</p>
              {systemEntries.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[var(--radius-md)] bg-bg-secondary border border-white/5 opacity-70"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                  </div>
                  <Badge variant="info">
                    <span className="text-[10px]">{SEVERITY_LABELS[item.severity]}</span>
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {pool.length === 0 && (
            <p className="text-xs text-text-tertiary text-center py-4">Pool is empty — start a session to seed defaults.</p>
          )}
        </div>
      )}
    </div>
  )
}
