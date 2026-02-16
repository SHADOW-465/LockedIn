-- Migration: Add onboarding fields to profiles table

-- Add columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'physical_details') THEN
        ALTER TABLE profiles ADD COLUMN physical_details JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_regimens') THEN
        ALTER TABLE profiles ADD COLUMN preferred_regimens TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notification_frequency') THEN
        ALTER TABLE profiles ADD COLUMN notification_frequency TEXT DEFAULT 'medium';
        ALTER TABLE profiles ADD CONSTRAINT profiles_notification_frequency_check CHECK (notification_frequency IN ('low', 'medium', 'high', 'extreme'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'hard_limits') THEN
        ALTER TABLE profiles ADD COLUMN hard_limits TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'soft_limits') THEN
        ALTER TABLE profiles ADD COLUMN soft_limits TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'interests') THEN
        ALTER TABLE profiles ADD COLUMN interests TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'initial_lock_goal_hours') THEN
        ALTER TABLE profiles ADD COLUMN initial_lock_goal_hours INT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_step') THEN
        ALTER TABLE profiles ADD COLUMN onboarding_step INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ai_personality') THEN
        ALTER TABLE profiles ADD COLUMN ai_personality TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tier') THEN
        ALTER TABLE profiles ADD COLUMN tier TEXT CHECK (tier IN ('Newbie','Slave','Hardcore','Extreme','Destruction'));
    END IF;
END $$;
