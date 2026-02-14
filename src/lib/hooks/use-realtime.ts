'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Hook that subscribes to a Supabase table in realtime.
 * Returns live data that auto-updates on INSERT, UPDATE, DELETE.
 */
export function useRealtimeQuery<T>(
    table: string,
    filters: Record<string, string>,
    orderBy: string = 'created_at',
    ascending: boolean = false
) {
    const [data, setData] = useState<T[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        const supabase = getSupabase()
        let query = supabase.from(table).select('*')

        for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value)
        }

        query = query.order(orderBy, { ascending })

        const { data: result, error: fetchError } = await query

        if (fetchError) {
            setError(fetchError.message)
            setLoading(false)
            return
        }

        setData((result ?? []) as T[])
        setLoading(false)
    }, [table, JSON.stringify(filters), orderBy, ascending])

    useEffect(() => {
        fetchData()

        const supabase = getSupabase()

        // Build filter string for realtime
        const filterParts = Object.entries(filters).map(
            ([key, value]) => `${key}=eq.${value}`
        )
        const filterString = filterParts.join(',')

        const channel: RealtimeChannel = supabase
            .channel(`${table}_changes`)
            .on(
                'postgres_changes' as never,
                {
                    event: '*',
                    schema: 'public',
                    table,
                    filter: filterString || undefined,
                },
                () => {
                    // Re-fetch on any change (simpler and more reliable than manual patching)
                    fetchData()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchData])

    return { data, loading, error, refetch: fetchData }
}

/**
 * Hook that subscribes to a single row in realtime.
 */
export function useRealtimeSingle<T>(
    table: string,
    filters: Record<string, string>
) {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        const supabase = getSupabase()
        let query = supabase.from(table).select('*')

        for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value)
        }

        const { data: result, error: fetchError } = await query.maybeSingle()

        if (fetchError) {
            setError(fetchError.message)
            setLoading(false)
            return
        }

        setData(result as T | null)
        setLoading(false)
    }, [table, JSON.stringify(filters)])

    useEffect(() => {
        fetchData()

        const supabase = getSupabase()

        const filterParts = Object.entries(filters).map(
            ([key, value]) => `${key}=eq.${value}`
        )
        const filterString = filterParts.join(',')

        const channel: RealtimeChannel = supabase
            .channel(`${table}_single_changes`)
            .on(
                'postgres_changes' as never,
                {
                    event: '*',
                    schema: 'public',
                    table,
                    filter: filterString || undefined,
                },
                () => {
                    fetchData()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchData])

    return { data, loading, error, refetch: fetchData }
}
