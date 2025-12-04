/**
 * Validation utilities for student and skill assessment forms
 */

// Email validation regex
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Phone validation regex (10-11 digits)
export const phoneRegex = /^[0-9]{10,11}$/

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return emailRegex.test(email)
}

/**
 * Validate phone format (10-11 digits)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return true // Optional field
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Validate score - only supports n/n format (e.g., "35/40")
 */
export function isValidScore(score: string | undefined): boolean {
  // Empty score is valid (optional field)
  if (!score) return true
  
  // Must be in n/n format
  const parts = score.split('/')
  if (parts.length !== 2) return false
  
  const achieved = parseFloat(parts[0])
  const max = parseFloat(parts[1])
  
  // Both must be valid numbers, max > 0, achieved >= 0 and <= max
  return !isNaN(achieved) && !isNaN(max) && max > 0 && achieved >= 0 && achieved <= max
}

/**
 * Validate date of birth (must be in the past)
 */
export function isValidDob(dob: string): boolean {
  if (!dob) return true // Optional field
  const dobDate = new Date(dob)
  const today = new Date()
  return dobDate < today
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  if (!url) return true // Optional field
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Score scale options grouped by language
 */
export interface ScoreScaleOption {
  value: string
  label: string
  step?: number // For input step attribute
}

export function getScoreScaleOptions(language?: 'ENGLISH' | 'JAPANESE' | 'OTHER'): ScoreScaleOption[] {
  switch (language) {
    case 'ENGLISH':
      return [
        { value: '0-9', label: 'IELTS (0-9 bands)', step: 0.5 },
        { value: '0-990', label: 'TOEIC (0-990 điểm)', step: 1 },
        { value: '0-100', label: 'Tùy chỉnh (0-100)', step: 0.1 },
      ]

    case 'JAPANESE':
      return [
        { value: 'N5', label: 'JLPT N5', step: 0.1 },
        { value: 'N4', label: 'JLPT N4', step: 0.1 },
        { value: 'N3', label: 'JLPT N3', step: 0.1 },
        { value: 'N2', label: 'JLPT N2', step: 0.1 },
        { value: 'N1', label: 'JLPT N1', step: 0.1 },
        { value: '0-100', label: 'Tùy chỉnh (0-100)', step: 0.1 },
      ]

    default:
      return [{ value: '0-100', label: 'Tùy chỉnh (0-100)', step: 0.1 }]
  }
}

/**
 * Assessment category options
 */
export const assessmentCategoryOptions = [
  { value: 'PLACEMENT', label: 'Đầu vào (Placement)' },
  { value: 'MOCK', label: 'Thử (Mock Test)' },
  { value: 'OFFICIAL', label: 'Chính thức (Official)' },
  { value: 'PRACTICE', label: 'Luyện tập (Practice)' },
  { value: 'PROGRESS', label: 'Kiểm tra giữa kỳ (Progress)' },
  { value: 'FINAL', label: 'Cuối khóa (Final)' },
]

/**
 * Skill options based on language
 */
export interface SkillOption {
  value: string
  label: string
}

export const ENGLISH_SKILLS: SkillOption[] = [
  { value: 'GENERAL', label: 'Tổng quát' },
  { value: 'READING', label: 'Đọc' },
  { value: 'WRITING', label: 'Viết' },
  { value: 'SPEAKING', label: 'Nói' },
  { value: 'LISTENING', label: 'Nghe' },
]

export const JAPANESE_SKILLS: SkillOption[] = [
  { value: 'GENERAL', label: 'Tổng quát' },
  { value: 'READING', label: 'Đọc' },
  { value: 'LISTENING', label: 'Nghe' },
  { value: 'VOCABULARY', label: 'Từ vựng' },
  { value: 'GRAMMAR', label: 'Ngữ pháp' },
  { value: 'KANJI', label: 'Kanji' },
]

export const DEFAULT_SKILLS: SkillOption[] = [{ value: 'GENERAL', label: 'Tổng quát' }]

/**
 * Get available skills based on subject
 */
export function getAvailableSkills(subjectName?: string, subjectCode?: string): SkillOption[] {
  if (!subjectName && !subjectCode) return DEFAULT_SKILLS

  const nameOrCode = (subjectName || '') + (subjectCode || '')
  const lowerCase = nameOrCode.toLowerCase()

  // Detect Japanese subjects
  if (
    lowerCase.includes('japan') ||
    lowerCase.includes('tiếng nhật') ||
    lowerCase.includes('jlpt') ||
    lowerCase.includes('jp')
  ) {
    return JAPANESE_SKILLS
  }

  // Detect English subjects
  if (
    lowerCase.includes('english') ||
    lowerCase.includes('tiếng anh') ||
    lowerCase.includes('ielts') ||
    lowerCase.includes('toeic') ||
    lowerCase.includes('en')
  ) {
    return ENGLISH_SKILLS
  }

  // Default to general skills
  return DEFAULT_SKILLS
}
