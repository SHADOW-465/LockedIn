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
    message_type: 'command' | 'question' | 'response' | 'punishment' | 'system'
    created_at: string
}

export interface Calendar {
    user_id: string
    scheduled_release_date: string | null
    adjustment_log: any[]
}

// Table names for type-safe query helpers
export type TableName =
    | 'profiles'
    | 'sessions'
    | 'tasks'
    | 'chat_messages'
    | 'calendars'
