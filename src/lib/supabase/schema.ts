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
    status: 'active' | 'completed' | 'emergency_released' | 'failed'
    tier: string
    ai_personality: string | null
    lock_goal_hours: number
    start_time: string
    scheduled_end_time: string
    actual_end_time: string | null
    total_tasks_assigned: number
    total_tasks_completed: number
    total_tasks_failed: number
    total_punishments: number
    total_rewards: number
    created_at: string
    updated_at: string
}

export interface Task {
    id: string
    user_id: string
    session_id: string | null
    title: string
    description: string
    genres: string[]
    difficulty: number
    cage_status: 'caged' | 'uncaged' | 'semi-caged'
    status: 'pending' | 'active' | 'completed' | 'failed' | 'skipped'
    duration_minutes: number
    deadline: string | null
    verification_type: 'photo' | 'video' | 'audio' | 'text' | 'none'
    verification_requirement: string | null
    verification_image_url: string | null
    ai_verification_result: string | null
    punishment_on_fail: {
        type: string
        hours: number
        additional?: string
    } | null
    assigned_at: string
    completed_at: string | null
    created_at: string
}

export interface ChatMessage {
    id: string
    user_id: string
    session_id: string | null
    sender: 'ai' | 'user'
    content: string
    message_type: 'command' | 'response' | 'question' | 'punishment' | 'reward' | 'system'
    created_at: string
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

export interface Notification {
    id: string
    user_id: string
    type: 'checkin' | 'task' | 'punishment' | 'reward' | 'system' | 'info'
    title: string
    body: string | null
    read: boolean
    created_at: string
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

export interface Achievement {
    id: string
    user_id: string
    name: string
    description: string | null
    icon: string
    xp_awarded: number
    awarded_at: string
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

// Table names for type-safe query helpers
export type TableName =
    | 'profiles'
    | 'user_preferences'
    | 'sessions'
    | 'tasks'
    | 'chat_messages'
    | 'calendar_adjustments'
    | 'notifications'
    | 'regimens'
    | 'achievements'
    | 'user_feedback'
    | 'journal_entries'
