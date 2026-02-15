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
    reward: '✨',
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
                className="relative p-2 rounded-[var(--radius-md)] hover:bg-bg-tertiary transition-colors cursor-pointer"
                aria-label="Notifications"
            >
                <Bell size={18} className="text-text-secondary" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px] px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-bg-secondary border border-white/10 rounded-[var(--radius-lg)] shadow-xl overflow-hidden z-50 animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                        <h3 className="text-sm font-semibold">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-purple-primary hover:text-purple-primary/80 flex items-center gap-1 cursor-pointer"
                            >
                                <CheckCheck size={12} /> Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto max-h-80">
                        {notifications.length === 0 ? (
                            <div className="py-8 text-center text-text-tertiary text-sm">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map((notif: Notification) => (
                                <button
                                    key={notif.id}
                                    onClick={() => { if (!notif.read) markAsRead(notif.id) }}
                                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-bg-tertiary transition-colors border-b border-white/5 last:border-0 cursor-pointer ${!notif.read ? 'bg-purple-primary/5' : ''
                                        }`}
                                >
                                    <span className="text-lg shrink-0 mt-0.5">
                                        {TYPE_ICONS[notif.type] ?? 'ℹ️'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium truncate ${!notif.read ? 'text-text-primary' : 'text-text-secondary'}`}>
                                                {notif.title}
                                            </span>
                                            <span className="text-[10px] text-text-tertiary shrink-0">
                                                {timeAgo(notif.created_at)}
                                            </span>
                                        </div>
                                        {notif.body && (
                                            <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">
                                                {notif.body}
                                            </p>
                                        )}
                                    </div>
                                    {!notif.read && (
                                        <div className="w-2 h-2 rounded-full bg-purple-primary shrink-0 mt-2" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
