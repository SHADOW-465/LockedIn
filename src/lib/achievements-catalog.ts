/** Mirrors achievement names in lib/engines/rewards.ts for client display. */
export const ACHIEVEMENT_CATALOG = [
  { id: 'first-task', name: 'First Task', description: 'Complete your very first task', icon: 'task_alt' },
  { id: 'obedient', name: 'Obedient Slave', description: 'Complete 10 tasks', icon: 'military_tech' },
  { id: 'machine', name: 'Task Machine', description: 'Complete 50 tasks', icon: 'bolt' },
  { id: 'century', name: 'Century Club', description: 'Complete 100 tasks', icon: 'emoji_events' },
  { id: 'streak-3', name: 'Streak Starter', description: 'Maintain a 3-day compliance streak', icon: 'local_fire_department' },
  { id: 'streak-7', name: 'Week Warrior', description: 'Maintain a 7-day compliance streak', icon: 'whatshot' },
  { id: 'streak-30', name: 'Iron Will', description: 'Maintain a 30-day compliance streak', icon: 'diamond' },
  { id: 'xp-100', name: 'XP Apprentice', description: 'Earn 100 XP total', icon: 'star' },
  { id: 'xp-1000', name: 'XP Master', description: 'Earn 1000 XP total', icon: 'workspace_premium' },
  { id: 'denial', name: 'Denial Expert', description: 'Accumulate 168 hours of denial', icon: 'lock' },
  { id: 'edge', name: 'Edge Lord', description: 'Complete 100 edges', icon: 'trending_up' },
] as const
