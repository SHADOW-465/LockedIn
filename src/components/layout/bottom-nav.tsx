'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ListTodo, MessageSquare, Settings, MoreHorizontal, BookOpen, Calendar, History, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

const mainItems = [
    { href: '/home', icon: Home, label: 'Home' },
    { href: '/tasks', icon: ListTodo, label: 'Tasks' },
    { href: '/chat', icon: MessageSquare, label: 'Chat' },
    { href: '/settings', icon: Settings, label: 'Settings' },
]

const moreItems = [
    { href: '/journal', icon: BookOpen, label: 'Journal' },
    { href: '/calendar', icon: Calendar, label: 'Calendar' },
    { href: '/history', icon: History, label: 'History' },
]

export function BottomNav() {
    const pathname = usePathname()
    const [showMore, setShowMore] = useState(false)

    // Close "More" when navigating
    useEffect(() => { setShowMore(false) }, [pathname])

    const moreActive = moreItems.some((i) => pathname.startsWith(i.href))

    return (
        <>
            {/* More menu overlay */}
            {showMore && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMore(false)}
                    />
                    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 flex gap-1 shadow-xl">
                        {moreItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname.startsWith(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex flex-col items-center gap-1 px-4 py-2.5 rounded-[var(--radius-lg)] transition-all duration-200 min-w-[72px]',
                                        isActive
                                            ? 'text-[var(--accent)] bg-zinc-800'
                                            : 'text-white/40 hover:text-white/70 hover:bg-zinc-800/50'
                                    )}
                                >
                                    <Icon size={20} />
                                    <span className="text-xs font-medium">{item.label}</span>
                                </Link>
                            )
                        })}
                    </div>
                </>
            )}

            <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-20 px-4 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 lg:hidden safe-area-bottom">
                {mainItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center gap-1 px-3 py-2 rounded-[var(--radius-lg)] transition-all duration-200 cursor-pointer',
                                isActive
                                    ? 'text-[var(--accent)] bg-zinc-800'
                                    : 'text-white/40 hover:text-white/70 hover:bg-zinc-800/50'
                            )}
                        >
                            <Icon size={20} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    )
                })}

                {/* More button */}
                <button
                    onClick={() => setShowMore((v) => !v)}
                    className={cn(
                        'flex flex-col items-center gap-1 px-3 py-2 rounded-[var(--radius-lg)] transition-all duration-200 cursor-pointer',
                        showMore || moreActive
                            ? 'text-[var(--accent)] bg-zinc-800'
                            : 'text-white/40 hover:text-white/70 hover:bg-zinc-800/50'
                    )}
                >
                    {showMore ? <X size={20} /> : <MoreHorizontal size={20} />}
                    <span className="text-xs font-medium">More</span>
                </button>
            </nav>
        </>
    )
}
