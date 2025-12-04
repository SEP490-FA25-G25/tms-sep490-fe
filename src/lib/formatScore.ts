/**
/**
 * Format skill assessment score - only supports n/n format
 * @param rawScore - The raw score in format "n/n" (e.g., "35/40")
 * @returns Formatted score string for display
 */
export function formatScore(rawScore?: string | null): string {
  if (!rawScore) return 'N/A'
  return rawScore // Already in n/n format
}

/**
 * Parse score from n/n format
 * @returns { score: number, maxScore: number } or null if invalid
 */
export function parseScore(rawScore?: string | null): { score: number; maxScore: number } | null {
  if (!rawScore) return null
  const parts = rawScore.split('/')
  if (parts.length !== 2) return null
  const score = parseFloat(parts[0])
  const maxScore = parseFloat(parts[1])
  if (isNaN(score) || isNaN(maxScore) || maxScore <= 0) return null
  return { score, maxScore }
}

/**
 * Calculate percentage from n/n format
 */
export function getScorePercentage(rawScore?: string | null): number | null {
  const parsed = parseScore(rawScore)
  if (!parsed) return null
  return Math.round((parsed.score / parsed.maxScore) * 100)
}
