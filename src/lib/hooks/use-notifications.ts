'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Notification } from '@/lib/supabase/schema'

/**
 * Hook for realtime notifications with unread count and mark-as-read actions.
 */
export function useNotifications(userId: string | undefined) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    const unreadCount = notifications.filter((n) => !n.read).length

    const fetchNotifications = useCallback(async () => {
        if (!userId) return
        const supabase = getSupabase()

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50)

        if (!error && data) {
            setNotifications(data as Notification[])
        }
        setLoading(false)
    }, [userId])

    const markAsRead = useCallback(async (notificationId: string) => {
        const supabase = getSupabase()
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)

        setNotifications((prev) =>
            prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        )
    }, [])

    const markAllRead = useCallback(async () => {
        if (!userId) return
        const supabase = getSupabase()
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false)

        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }, [userId])

    useEffect(() => {
        if (!userId) return

        fetchNotifications()

        const supabase = getSupabase()
        const channel: RealtimeChannel = supabase
            .channel('notifications_realtime')
            .on(
                'postgres_changes' as never,
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload: { new: Notification }) => {
                    setNotifications((prev) => [payload.new, ...prev].slice(0, 50))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, fetchNotifications])

    return { notifications, unreadCount, loading, markAsRead, markAllRead, refetch: fetchNotifications }
}
