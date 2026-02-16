'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { useAuth } from '@/lib/contexts/auth-context'
import { signIn, signOut } from '@/lib/supabase/auth'
import { getSupabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Shield, Bell, Dumbbell, Lock, Save, Loader2, LogOut } from 'lucide-react'

// Sub-components for tabs
function AccountTab({ user, profile, onSignOut }: any) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [mode, setMode] = useState<'login' | 'register'>('register') // Register to claim, Login to switch

    const isGuest = user?.email?.includes('@lockedin.temp')

    const handleAction = async () => {
        setLoading(true)
        setMessage('')
        const supabase = getSupabase()

        if (mode === 'register') {
            // Update current user
            const { error } = await supabase.auth.updateUser({ email, password })
            if (error) setMessage(`Error: ${error.message}`)
            else setMessage('Account updated! Please verify your email if required.')
        } else {
            // Login (switch account)
            const { error } = await signIn(email, password)
            if (error) setMessage(`Login failed: ${error.message}`)
            else window.location.reload() // Force reload to pick up new session
        }
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <Card variant="raised">
                <h3 className="text-lg font-bold mb-2">Current Session</h3>
                <div className="text-sm space-y-1">
                    <p><span className="text-text-tertiary">ID:</span> {user?.id.slice(0, 8)}...</p>
                    <p><span className="text-text-tertiary">Type:</span> {isGuest ? 'Guest (Unsaved)' : 'Registered'}</p>
                    <p><span className="text-text-tertiary">Email:</span> {user?.email}</p>
                </div>
                {isGuest && (
                    <div className="mt-3 p-2 bg-red-primary/10 border border-red-primary/30 rounded text-xs text-red-primary">
                        ⚠️ You are using a temporary guest account. You will lose your data if you clear cookies. Register below to save progress.
                    </div>
                )}
            </Card>

            <Card variant="flat" className="!min-h-0">
                <div className="flex gap-4 border-b border-white/10 mb-4 pb-2">
                    <button
                        onClick={() => setMode('register')}
                        className={`text-sm font-medium pb-2 ${mode === 'register' ? 'text-purple-primary border-b-2 border-purple-primary' : 'text-text-tertiary'}`}
                    >
                        {isGuest ? 'Claim Account' : 'Update Credentials'}
                    </button>
                    <button
                        onClick={() => setMode('login')}
                        className={`text-sm font-medium pb-2 ${mode === 'login' ? 'text-purple-primary border-b-2 border-purple-primary' : 'text-text-tertiary'}`}
                    >
                        Switch Account
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-text-tertiary mb-1 block">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-bg-primary border border-white/10 rounded p-2 text-sm"
                            placeholder="user@example.com"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-text-tertiary mb-1 block">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-bg-primary border border-white/10 rounded p-2 text-sm"
                            placeholder="••••••••"
                        />
                    </div>
                    {message && <p className="text-xs text-yellow-500">{message}</p>}

                    <Button variant="primary" className="w-full" onClick={handleAction} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : (mode === 'register' ? 'Save Account' : 'Login')}
                    </Button>
                </div>
            </Card>

            <Button variant="ghost" className="w-full text-red-primary hover:text-red-hover" onClick={onSignOut}>
                <LogOut size={16} className="mr-2" /> Sign Out
            </Button>
        </div>
    )
}

function ProfileTab({ profile }: any) {
    const [tier, setTier] = useState(profile?.tier || 'Newbie')
    const [personality, setPersonality] = useState(profile?.ai_personality || 'Cruel Mistress')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        const supabase = getSupabase()
        await supabase.from('profiles').update({ tier, ai_personality: personality }).eq('id', profile.id)
        setSaving(false)
    }

    return (
        <div className="space-y-6">
            <Card variant="raised">
                <h3 className="text-lg font-bold mb-4">Training Parameters</h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Difficulty Tier</label>
                        <div className="flex flex-wrap gap-2">
                            {['Newbie', 'Slave', 'Hardcore', 'Extreme', 'Destruction'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTier(t)}
                                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${tier === t ? 'bg-purple-primary border-purple-primary text-white' : 'border-white/10 hover:border-purple-primary/50'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">AI Personality</label>
                        <select
                            value={personality}
                            onChange={e => setPersonality(e.target.value)}
                            className="w-full bg-bg-tertiary border border-white/10 rounded p-2 text-sm"
                        >
                            <option value="Cruel Mistress">Cruel Mistress</option>
                            <option value="Clinical Sadist">Clinical Sadist</option>
                            <option value="Playful Tease">Playful Tease</option>
                            <option value="Strict Master">Strict Master</option>
                            <option value="Humiliation Expert">Humiliation Expert</option>
                        </select>
                    </div>
                </div>
            </Card>

            <Button variant="primary" className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Update Profile'}
            </Button>
        </div>
    )
}

export default function SettingsPage() {
    const { user, profile } = useAuth()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('account')

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
    }

    return (
        <>
            <TopBar />
            <div className="min-h-screen pb-24 lg:pb-8 p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <h1 className="text-3xl font-bold">Settings</h1>

                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {[
                            { id: 'account', icon: User, label: 'Account' },
                            { id: 'profile', icon: Dumbbell, label: 'Profile' },
                            // Add more tabs later
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'bg-purple-primary text-white'
                                        : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
                                }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="animate-fade-in">
                        {activeTab === 'account' && (
                            <AccountTab user={user} profile={profile} onSignOut={handleSignOut} />
                        )}
                        {activeTab === 'profile' && (
                            <ProfileTab profile={profile} />
                        )}
                    </div>
                </div>
            </div>
            <BottomNav />
        </>
    )
}
