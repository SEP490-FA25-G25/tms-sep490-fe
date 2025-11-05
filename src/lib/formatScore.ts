/**
 * Format skill assessment score based on score scale type
 * @param scaledScore - The standardized score (e.g., 7.5 for IELTS, 850 for TOEIC)
 * @param scoreScale - The score scale type (e.g., '0-9', '0-990', 'N1-N5')
 * @returns Formatted score string for display
 */
export function formatScore(
  scaledScore?: number | null,
  scoreScale?: string | null
): string {
  if (!scaledScore && scaledScore !== 0) return 'N/A'

  if (!scoreScale) return scaledScore.toString()

  switch (scoreScale) {
    case '0-9': // IELTS
      return `${scaledScore.toFixed(1)} bands`

    case '0-990': // TOEIC
      return `${Math.round(scaledScore)} điểm`

    case 'N1':
    case 'N2':
    case 'N3':
    case 'N4':
    case 'N5': // JLPT
      return `${scoreScale}: ${scaledScore.toFixed(1)}%`

    case '0-100': // Custom percentage
      return `${scaledScore.toFixed(1)}%`

    default:
      return `${scaledScore} (${scoreScale})`
  }
}

/**
 * Get placeholder text for score input based on score scale
 */
export function getScorePlaceholder(scoreScale?: string): string {
  switch (scoreScale) {
    case '0-9':
      return 'Ví dụ: 7.5'
    case '0-990':
      return 'Ví dụ: 850'
    case 'N1':
    case 'N2':
    case 'N3':
    case 'N4':
    case 'N5':
      return 'Phần trăm (0-100)'
    case '0-100':
      return 'Ví dụ: 85'
    default:
      return 'Nhập điểm'
  }
}

/**
 * Get min/max range for score input based on score scale
 */
export function getScoreRange(scoreScale?: string): { min: number; max: number } {
  switch (scoreScale) {
    case '0-9':
      return { min: 0, max: 9 }
    case '0-990':
      return { min: 0, max: 990 }
    case 'N1':
    case 'N2':
    case 'N3':
    case 'N4':
    case 'N5':
    case '0-100':
      return { min: 0, max: 100 }
    default:
      return { min: 0, max: 100 }
  }
}
