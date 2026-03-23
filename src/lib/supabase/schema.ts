// ==========================================
// LOCKEDIN DATABASE TYPES
// Mirrors Supabase public schema
// ==========================================

export interface PrivacyConstraints {
    no_public_humiliation: boolean
    no_face_revealing: boolean
    no_outdoor_tasks: boolean
    no_involving_others: boolean
}

export interface CommunicationStyle {
    feedback_frequency: 'minimal' | 'moderate' | 'frequent'
    tone_preference: 'strict' | 'balanced' | 'encouraging'
    punishment_sensitivity: 'mild' | 'moderate' | 'severe'
}

export interface Availability {
    active_hours: { start: string; end: string }[]
    timezone: string
}

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

    // Preferences (added 20260322)
    master_preference: string
    privacy_constraints: PrivacyConstraints | null
    session_intent: string
    communication_style: CommunicationStyle | null
    availability: Availability | null
    safeword: string
    psych_profile: string
    theme?: string  // one of: 'crimson' | 'amethyst' | 'ice' | 'gold' | 'obsidian' | 'bone'

    // Stats
    willpower_score: number
    compliance_streak: number
    xp_total: number
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
    status: 'active' | 'completing' | 'completed' | 'emergency' | 'failed'
    tier: string
    ai_personality: string | null
    lock_goal_hours: number | null
    start_time: string
    scheduled_end_time: string
    actual_end_time: string | null

    total_tasks_assigned: number
    total_tasks_completed: number
    total_tasks_failed: number
    total_punishments: number
    total_rewards: number
    care_mode_active: boolean

    total_duration_minutes: number
    session_config: Record<string, unknown> | null
    extension_count: number
    last_extended_at: string | null

    created_at: string
    updated_at: string
}

export interface Task {
    id: string
    user_id: string
    session_id: string
    task_type: 'daily' | 'master' | 'punishment' | 'checkin' | 'journal'
    source: 'ai_chat' | 'auto' | 'system' | 'user'
    genres: string[]
    title: string
    description: string
    duration_minutes: number | null
    difficulty: number
    cage_status: 'caged' | 'uncaged' | 'semi-caged'

    verification_type: 'photo' | 'video' | 'audio' | 'text' | 'self-report' | 'none'
    verification_requirement: string
    proof_type: 'text' | 'image' | 'video' | 'audio' | null

    punishment_type: string | null
    punishment_hours: number | null
    punishment_additional: string | null

    status: 'pending' | 'active' | 'completed' | 'failed' | 'skipped' | 'verification_pending' | 'awaiting_proof' | 'proof_submitted' | 'verified' | 'overdue'

    assigned_at: string
    deadline: string | null
    completed_at: string | null

    ai_verification_passed: boolean | null
    ai_verification_reason: string | null
    verification_submitted_at: string | null
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

export interface SessionEvent {
    id: string
    session_id: string
    user_id: string
    event_type: string
    payload: Record<string, unknown> | null
    created_at: string
}

export interface ProofDocument {
    id: string
    task_id: string
    user_id: string
    session_id: string | null
    file_type: 'image' | 'video' | 'text' | 'audio'
    local_storage_key: string | null
    verification_status: 'pending' | 'passed' | 'failed'
    verified_at: string | null
    created_at: string
}

export interface MoodCheckin {
    id: string
    user_id: string
    session_id: string
    date: string
    submission_depth: number
    frustration_level: number
    headspace_tags: string[]
    notes: string | null
    created_at: string
}

export interface PunishmentPoolItem {
    id: string
    user_id: string
    title: string
    description: string
    severity: number
    requires_proof: boolean
    is_custom: boolean
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
    | 'session_events'
    | 'proof_documents'
    | 'mood_checkins'
    | 'punishment_pool'
