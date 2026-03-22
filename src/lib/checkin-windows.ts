// On-time windows (local hours) for daily check-in tasks
// Used in both /api/checkin/ensure and /api/proof/submit

export const MORNING_WINDOW = { start: 6, end: 10 }   // 6am–10am local
export const NIGHT_WINDOW   = { start: 20, end: 24 }  // 8pm–midnight local
