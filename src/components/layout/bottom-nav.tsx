'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ListTodo, MessageSquare, Calendar, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { href: '/home', icon: Home, label: 'Home' },
    { href: '/tasks', icon: ListTodo, label: 'Tasks' },
    { href: '/chat', icon: MessageSquare, label: 'Chat' },
    { href: '/calendar', icon: Calendar, label: 'Calendar' },
    { href: '/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-20 px-4 glass-strong lg:hidden safe-area-bottom">
            {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'flex flex-col items-center gap-1 px-3 py-2 rounded-[var(--radius-lg)] transition-all duration-200 cursor-pointer',
                            isActive
                                ? 'text-purple-primary bg-bg-tertiary glow-purple'
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                        )}
                    >
                        <Icon size={20} />
                        <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}
