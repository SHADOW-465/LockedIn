export interface NavCard {
  href: string
  label: string
  description: string
}

const NAV_MARKER_RE = /\[NAV:([^\]|]+)\|([^\]|]+)\|([^\]|]+)\]/

/**
 * Parses the first [NAV:/path|Label|Description] marker from an AI reply.
 * Strips the marker from the reply text.
 * Returns navCard: undefined if no valid marker found.
 */
export function parseNavCard(text: string): { reply: string; navCard?: NavCard } {
  const match = NAV_MARKER_RE.exec(text)
  if (!match) return { reply: text }

  const [fullMatch, href, label, description] = match
  if (!href?.trim() || !label?.trim() || !description?.trim()) {
    return { reply: text.replace(fullMatch, '').trim() }
  }

  return {
    reply: text.replace(fullMatch, '').trim(),
    navCard: {
      href: href.trim(),
      label: label.trim(),
      description: description.trim(),
    },
  }
}
