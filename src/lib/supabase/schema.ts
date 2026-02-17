// ==========================================
// LOCKEDIN DATABASE TYPES
// Mirrors Supabase public schema
// ==========================================

export interface UserProfile {
    id: string
    email: string
    username: string | null
    tier: string
    ai_personality: string | null

    // Onboarding & Preferences
    hard_limits: string[]
    soft_limits: string[]
    interests: string[]
    physical_details: {
        penisSize?: {
            flaccidLength?: number
            flaccidGirth?: number
            erectLength?: number
            erectGirth?: number
            growerOrShower?: 'grower' | 'shower'
        }
        bodyType?: string
        orientation?: string
        genderIdentity?: string
        notes?: string
    } | null
    preferred_regimens: string[]
    notification_frequency: 'low' | 'medium' | 'high' | 'extreme'
    initial_lock_goal_hours: number | null

    // Stats
    willpower_score: number
    compliance_streak: number
    total_sessions: number
    total_denial_hours: number
    total_edges: number
    subscription_tier: string | null

    onboarding_completed: boolean
    onboarding_step: number

    created_at: string
    updated_at: string
}

export interface Session {
    id: string
    user_id: string
    status: 'active' | 'completed' | 'emergency' | 'failed'
    tier: string
    ai_personality: string | null
    start_time: string
    scheduled_end_time: string
    actual_end_time: string | null

    tasks_completed: number
    violations: number
    punishments_received: number

    created_at: string
}

export interface Task {
    id: string
    user_id: string
    session_id: string
    task_type: string
    genres: string[]
    title: string
    description: string
    duration_minutes: number | null
    difficulty: number
    cage_status: 'caged' | 'uncaged' | 'semi-caged'

    verification_type: 'photo' | 'video' | 'audio' | 'self-report'
    verification_requirement: string

    punishment_type: string | null
    punishment_hours: number | null
    punishment_additional: string | null

    status: 'pending' | 'active' | 'completed' | 'failed'

    assigned_at: string
    deadline: string | null
    completed_at: string | null

    ai_verification_passed: boolean | null
    ai_verification_reason: string | null
}

export interface ChatMessage {
    id: string
    user_id: string
    session_id: string
    sender: 'ai' | 'user'
    content: string
    message_type: 'command' | 'question' | 'response' | 'punishment' | 'system' | 'care_mode' | 'safeword_detected' | 'normal'
    created_at: string
}

export interface Calendar {
    user_id: string
    scheduled_release_date: string | null
    adjustment_log: CalendarAdjustment[]
}

export interface CalendarAdjustment {
    id: string
    user_id: string
    session_id: string | null
    hours_added: number
    hours_subtracted: number
    reason: string
    ai_controlled: boolean
    created_at: string
}

// Additional Interfaces for Dashboard Pages
export interface Achievement {
    id: string
    user_id: string
    name: string
    description: string | null
    icon: string
    xp_awarded: number
    awarded_at: string
}

export interface Regimen {
    id: string
    user_id: string
    name: string
    description: string | null
    level: number
    current_day: number
    total_days: number
    progress: Record<string, unknown>
    status: 'active' | 'completed' | 'paused' | 'abandoned'
    started_at: string
    completed_at: string | null
    created_at: string
}

export interface UserFeedback {
    id: string
    user_id: string
    category: string
    suggestion: string
    rating: number | null
    status: 'pending' | 'reviewed' | 'implemented'
    created_at: string
}

export interface JournalEntry {
    id: string
    user_id: string
    session_id: string | null
    content: string
    mood: 'submissive' | 'resistant' | 'broken' | 'eager' | 'neutral' | 'defiant' | null
    obedience_rating: number | null
    ai_analysis: string | null
    created_at: string
}

export interface Notification {
    id: string
    user_id: string
    type: 'checkin' | 'task' | 'punishment' | 'reward' | 'system' | 'info'
    title: string
    body: string | null
    read: boolean
    created_at: string
}

// Table names for type-safe query helpers
export type TableName =
    | 'profiles'
    | 'sessions'
    | 'tasks'
    | 'chat_messages'
    | 'calendars'
    | 'achievements'
    | 'user_feedback'
    | 'journal_entries'
    | 'notifications'
    | 'regimens'
    | 'calendar_adjustments'
