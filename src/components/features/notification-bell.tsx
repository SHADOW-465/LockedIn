'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { useNotifications } from '@/lib/hooks/use-notifications'
import { useAuth } from '@/lib/contexts/auth-context'
import type { Notification } from '@/lib/supabase/schema'

const TYPE_ICONS: Record<string, string> = {
    checkin: '⏰',
    task: '🎯',
    punishment: '⛓️',
    reward: '',
    system: '⚙️',
    info: 'ℹ️',
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
}

export function NotificationBell() {
    const { user } = useAuth()
    const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications(user?.id)
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    return (
        <div className="relative" ref={ref}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 border border-transparent hover:border-[#141414] hover:bg-black transition-all cursor-pointer group"
                aria-label="Notifications"
            >
                <Bell size={18} className="text-[var(--color-text-secondary)] group-hover:text-white" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[var(--color-accent)] text-black text-[9px] font-bold px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center border border-black">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-[500px] bg-black border border-[#141414] shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#141414] bg-[#050505]">
                        <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--color-text-primary)]">SIGNAL_LOG</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-[9px] font-mono font-bold text-[var(--color-accent)] hover:text-white transition-colors flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                            >
                                <CheckCheck size={10} /> CLEAR_ALL
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-[#141414]">
                        {notifications.length === 0 ? (
                            <div className="py-12 text-center text-[#333] font-mono text-[10px] uppercase tracking-widest">
                                NO_ACTIVE_SIGNALS
                            </div>
                        ) : (
                            notifications.map((notif: Notification) => (
                                <button
                                    key={notif.id}
                                    onClick={() => { if (!notif.read) markAsRead(notif.id) }}
                                    className={`w-full text-left px-4 py-3 flex items-start gap-4 hover:bg-[#0a0a0a] transition-all border-b border-[#141414] last:border-0 cursor-pointer group ${!notif.read ? 'bg-[#050505]' : 'opacity-60'
                                        }`}
                                >
                                    <div className="mt-1 shrink-0">
                                        <div className={`w-1.5 h-1.5 ${!notif.read ? 'bg-[var(--color-accent)]' : 'bg-[#141414]'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <span className={`text-[11px] font-bold uppercase tracking-wide tracking-tight ${!notif.read ? 'text-white' : 'text-[#666]'}`}>
                                                {notif.title}
                                            </span>
                                            <span className="text-[8px] font-mono text-[#444] shrink-0 uppercase">
                                                {timeAgo(notif.created_at)}
                                            </span>
                                        </div>
                                        {notif.body && (
                                            <p className="text-[10px] text-[#888] font-medium leading-relaxed line-clamp-2">
                                                {notif.body}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
