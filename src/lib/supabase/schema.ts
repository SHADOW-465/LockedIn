export interface UserProfile {
    id: string
    email: string
    username: string | null
    tier: string
    ai_personality: string | null
    willpower_score: number
    compliance_streak: number
    total_sessions: number
    total_denial_hours: number
    total_edges: number
    subscription_tier: string
    last_release_date: string | null
    created_at: string
}

export interface UserPreferences {
    id: string
    user_id: string
    hard_limits: string[]
    soft_limits: string[]
    fetish_tags: string[]
    physical_details: Record<string, string>
    notification_frequency: string
    quiet_hours: Record<string, string> | null
    profile_answers: Record<string, string>
}

export interface Session {
    id: string
    user_id: string
    start_time: string
    end_time: string | null
    duration_minutes: number
    session_type: string
    completed: boolean
}

export interface Task {
    id: string
    user_id: string
    title: string
    description: string
    genre: string
    difficulty: number
    deadline: string
    verification_type: string
    status: string
    punishment_on_fail: string
    created_at: string
}

export interface ChatMessage {
    id: string
    user_id: string
    role: 'user' | 'ai'
    content: string
    timestamp: string
}

export interface CalendarData {
    id: string
    user_id: string
    date: string
    rating: number
    events: string[]
    adjustments: string[]
}
