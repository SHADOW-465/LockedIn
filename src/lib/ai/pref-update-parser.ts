export interface PrefUpdate {
    field: string
    action: 'set' | 'append'
    value: string
}

export function parsePrefUpdates(text: string): PrefUpdate[] {
    const updates: PrefUpdate[] = []
    const regex = /\[PREF_UPDATE:([\s\S]*?)\]/g
    let match
    while ((match = regex.exec(text)) !== null) {
        try {
            const parsed = JSON.parse(match[1]) as PrefUpdate
            if (
                parsed.field &&
                ['set', 'append'].includes(parsed.action) &&
                parsed.value !== undefined
            ) {
                updates.push(parsed)
            }
        } catch {
            // malformed JSON — skip
        }
    }
    return updates
}

export function stripPrefUpdates(text: string): string {
    return text.replace(/\[PREF_UPDATE:[\s\S]*?\]\s*/g, '').trim()
}
