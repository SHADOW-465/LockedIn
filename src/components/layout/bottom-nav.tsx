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
                        className="fixed inset-0 z-40 bg-black/80"
                        onClick={() => setShowMore(false)}
                    />
                    <div className="fixed bottom-24 left-4 right-4 z-50 bg-black border border-[#141414] p-1 flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
                        {moreItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname.startsWith(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-4 px-6 py-4 transition-all duration-150 border-b border-[#141414] last:border-0 cursor-pointer',
                                        isActive
                                            ? 'text-black bg-white'
                                            : 'text-[#666] hover:text-white hover:bg-[#0a0a0a]'
                                    )}
                                >
                                    <Icon size={18} />
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">{item.label}</span>
                                </Link>
                            )
                        })}
                    </div>
                </>
            )}

            <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 bg-black border-t border-[#141414] lg:hidden safe-area-bottom">
                {mainItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer border-r border-[#141414] last:border-r-0',
                                isActive
                                    ? 'text-black bg-white'
                                    : 'text-[#444] hover:text-white hover:bg-[#0a0a0a]'
                            )}
                        >
                            <Icon size={18} />
                            <span className="text-[8px] font-mono font-bold uppercase tracking-widest">{item.label}</span>
                        </Link>
                    )
                })}

                {/* More button */}
                <button
                    onClick={() => setShowMore((v) => !v)}
                    className={cn(
                        'flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer',
                        showMore || moreActive
                            ? 'text-black bg-white'
                            : 'text-[#444] hover:text-white hover:bg-[#0a0a0a]'
                    )}
                >
                    {showMore ? <X size={18} /> : <MoreHorizontal size={18} />}
                    <span className="text-[8px] font-mono font-bold uppercase tracking-widest">More</span>
                </button>
            </nav>
        </>
    )
}
