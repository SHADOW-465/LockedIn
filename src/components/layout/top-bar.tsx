'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ListTodo, MessageSquare, BookOpen, Settings } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/contexts/auth-context'
import { NotificationBell } from '@/components/features/notification-bell'
import { UsageMeter } from '@/components/features/usage-meter'

const navItems = [
    { href: '/home', icon: Home, label: 'Home' },
    { href: '/tasks', icon: ListTodo, label: 'Tasks' },
    { href: '/chat', icon: MessageSquare, label: 'Chat' },
    { href: '/journal', icon: BookOpen, label: 'Journal' },
    { href: '/settings', icon: Settings, label: 'Settings' },
]

function getTierBadge(tier: string): 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5' {
    switch (tier) {
        case 'Newbie': return 'tier1'
        case 'Slave': return 'tier2'
        case 'Hardcore': return 'tier3'
        case 'Extreme': return 'tier4'
        case 'Destruction': return 'tier5'
        default: return 'tier1'
    }
}

export function TopBar() {
    const pathname = usePathname()
    const { profile } = useAuth()

    const tier = profile?.tier ?? 'Newbie'
    const username = profile?.username ?? profile?.email?.split('@')[0] ?? 'User'

    return (
        <header className="sticky top-0 z-40 bg-black border-b border-[#141414] px-4 h-16 flex items-center">
            <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--color-accent)] flex items-center justify-center">
                        <Image src="/LockedIn-logo.png" alt="LockedIn Logo" width={20} height={20} className="invert" />
                    </div>
                    <h1 className="text-xl font-bold font-mono tracking-tighter uppercase leading-none">
                        Locked<span className="text-[var(--color-accent)]">In</span>
                    </h1>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden lg:flex items-center h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-2 px-6 h-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all cursor-pointer border-x border-transparent',
                                    isActive
                                        ? 'bg-white text-black border-x-[#141414]'
                                        : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-[#0a0a0a]'
                                )}
                            >
                                <Icon size={14} />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Right side */}
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-4 border-l border-[#141414] pl-4 h-8">
                        <UsageMeter />
                        <NotificationBell />
                    </div>
                    
                    <div className="flex items-center gap-3 border-l border-[#141414] pl-4 h-8">
                        <Badge variant={getTierBadge(tier)}>
                            {tier.toUpperCase()}
                        </Badge>
                        <div className="w-8 h-8 bg-white text-black flex items-center justify-center text-[10px] font-bold font-mono border border-black group cursor-pointer hover:bg-[var(--color-accent)] transition-colors">
                            {username.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
