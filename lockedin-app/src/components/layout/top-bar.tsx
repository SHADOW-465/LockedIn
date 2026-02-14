'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ListTodo, MessageSquare, Calendar, Settings, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const navItems = [
    { href: '/home', icon: Home, label: 'Home' },
    { href: '/tasks', icon: ListTodo, label: 'Tasks' },
    { href: '/chat', icon: MessageSquare, label: 'Chat' },
    { href: '/calendar', icon: Calendar, label: 'Calendar' },
    { href: '/settings', icon: Settings, label: 'Settings' },
]

interface TopBarProps {
    tier?: string
    username?: string
}

export function TopBar({ tier = 'Newbie', username = 'User' }: TopBarProps) {
    const pathname = usePathname()

    return (
        <header className="sticky top-0 z-40 glass-strong px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <Lock size={20} className="text-red-primary animate-lock-glow" />
                    <h1 className="text-xl font-bold font-mono tracking-tight">
                        Locked<span className="text-red-primary">In</span>
                    </h1>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden lg:flex items-center gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-[var(--radius-pill)] text-sm font-medium transition-all duration-200 cursor-pointer',
                                    isActive
                                        ? 'bg-bg-tertiary text-purple-primary glow-purple'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                                )}
                            >
                                <Icon size={16} />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    <Badge
                        variant={
                            `tier${tier === 'Newbie'
                                ? '1'
                                : tier === 'Slave'
                                    ? '2'
                                    : tier === 'Hardcore'
                                        ? '3'
                                        : tier === 'Extreme'
                                            ? '4'
                                            : '5'
                            }` as 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5'
                        }
                    >
                        {tier.toUpperCase()}
                    </Badge>
                    <div className="w-9 h-9 rounded-full bg-purple-primary/20 flex items-center justify-center text-sm font-semibold text-purple-primary border border-purple-primary/30">
                        {username.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    )
}
