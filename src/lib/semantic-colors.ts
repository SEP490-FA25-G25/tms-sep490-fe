/**
 * Semantic Color System for TMS
 * 
 * This file centralizes color definitions to ensure UI/UX consistency
 * across the entire system. Use these utilities instead of hardcoding
 * Tailwind color classes.
 * 
 * Color Palette:
 * - Success: Emerald (positive states, completed, approved)
 * - Error: Rose (negative states, failed, rejected)
 * - Warning: Amber (caution, pending review)
 * - Info: Sky (informational, neutral highlights)
 * 
 * Usage Pattern:
 * - Use `text-{semantic}` for text color
 * - Use `bg-{semantic}-muted` for light backgrounds
 * - Use `text-{semantic}-muted-foreground` for text on muted backgrounds
 */

// =============================================================================
// STATUS BADGE COLORS
// =============================================================================

/**
 * Standard status color classes for badges and indicators
 * Use with Badge component or similar UI elements
 */
export const statusColors = {
  success: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  error: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
  warning: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  info: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800',
} as const;

// =============================================================================
// TEXT COLORS
// =============================================================================

/**
 * Semantic text colors for inline text styling
 */
export const textColors = {
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-rose-600 dark:text-rose-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-sky-600 dark:text-sky-400',
  muted: 'text-muted-foreground',
} as const;

/**
 * Stronger text colors for emphasis
 */
export const textColorsStrong = {
  success: 'text-emerald-700 dark:text-emerald-300',
  error: 'text-rose-700 dark:text-rose-300',
  warning: 'text-amber-700 dark:text-amber-300',
  info: 'text-sky-700 dark:text-sky-300',
} as const;

// =============================================================================
// BACKGROUND COLORS
// =============================================================================

/**
 * Light/muted background colors for cards, sections
 */
export const bgColors = {
  success: 'bg-emerald-50 dark:bg-emerald-950/30',
  error: 'bg-rose-50 dark:bg-rose-950/30',
  warning: 'bg-amber-50 dark:bg-amber-950/30',
  info: 'bg-sky-50 dark:bg-sky-950/30',
} as const;

/**
 * Stronger background colors for emphasis
 */
export const bgColorsStrong = {
  success: 'bg-emerald-100 dark:bg-emerald-900/30',
  error: 'bg-rose-100 dark:bg-rose-900/30',
  warning: 'bg-amber-100 dark:bg-amber-900/30',
  info: 'bg-sky-100 dark:bg-sky-900/30',
} as const;

// =============================================================================
// BORDER COLORS
// =============================================================================

/**
 * Border colors for cards, sections, dividers
 */
export const borderColors = {
  success: 'border-emerald-200 dark:border-emerald-800',
  error: 'border-rose-200 dark:border-rose-800',
  warning: 'border-amber-200 dark:border-amber-800',
  info: 'border-sky-200 dark:border-sky-800',
} as const;

// =============================================================================
// ICON COLORS
// =============================================================================

/**
 * Colors for icons
 */
export const iconColors = {
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-rose-600 dark:text-rose-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-sky-600 dark:text-sky-400',
} as const;

// =============================================================================
// INTERACTIVE ELEMENT COLORS
// =============================================================================

/**
 * Colors for interactive elements like buttons (outline style)
 */
export const interactiveColors = {
  success: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950',
  error: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950',
  warning: 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950',
  info: 'text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950',
} as const;

/**
 * Solid button colors
 */
export const buttonColors = {
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  error: 'bg-rose-600 hover:bg-rose-700 text-white',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white',
  info: 'bg-sky-600 hover:bg-sky-700 text-white',
} as const;

// =============================================================================
// COMBINED CARD/SECTION COLORS
// =============================================================================

/**
 * Full card styling with background, text, and border
 */
export const cardColors = {
  success: 'bg-emerald-50/50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400',
  error: 'bg-rose-50/50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400',
  warning: 'bg-amber-50/50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400',
  info: 'bg-sky-50/50 border-sky-200 text-sky-700 dark:bg-sky-950/20 dark:border-sky-900 dark:text-sky-400',
} as const;

// =============================================================================
// FORM VALIDATION COLORS
// =============================================================================

/**
 * Form field error styling
 */
export const formErrorColors = {
  border: 'border-rose-500',
  text: 'text-rose-500',
  ring: 'ring-rose-500',
} as const;

/**
 * Required field indicator
 */
export const requiredIndicator = 'text-rose-500';

// =============================================================================
// ATTENDANCE SPECIFIC COLORS
// =============================================================================

/**
 * Attendance status colors
 */
export const attendanceColors = {
  present: {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  absent: {
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    icon: 'text-rose-600 dark:text-rose-400',
  },
  excused: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  upcoming: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    icon: 'text-slate-600 dark:text-slate-400',
  },
} as const;

// =============================================================================
// REQUEST STATUS COLORS
// =============================================================================

/**
 * Request/Approval status colors
 */
export const requestStatusColors = {
  pending: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    text: 'text-amber-600 dark:text-amber-400',
  },
  approved: {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  rejected: {
    badge: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
    text: 'text-rose-600 dark:text-rose-400',
  },
  cancelled: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
  },
} as const;

// =============================================================================
// ACCOUNT STATUS COLORS
// =============================================================================

/**
 * User account status colors
 */
export const accountStatusColors = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400',
  suspended: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400',
  pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
} as const;

// =============================================================================
// SCORE/GRADE COLORS
// =============================================================================

/**
 * Get color class based on percentage score
 * @param percentage - Score as percentage (0-100)
 * @returns Tailwind text color class
 */
export function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (percentage >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

/**
 * Get color class based on attendance rate
 * @param rate - Attendance rate as percentage (0-100)
 * @returns Tailwind text color class
 */
export function getAttendanceRateColor(rate: number): string {
  if (rate >= 80) return 'text-emerald-700 dark:text-emerald-400';
  if (rate >= 50) return 'text-amber-700 dark:text-amber-400';
  return 'text-rose-700 dark:text-rose-400';
}

/**
 * Get color class based on homework completion rate
 * @param rate - Completion rate as percentage (0-100)
 * @returns Tailwind text color class
 */
export function getHomeworkRateColor(rate: number): string {
  if (rate >= 85) return 'text-emerald-600 dark:text-emerald-400';
  if (rate >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

// =============================================================================
// TREND COLORS
// =============================================================================

/**
 * Trend indicator colors
 */
export const trendColors = {
  up: 'text-emerald-600 dark:text-emerald-400',
  down: 'text-rose-600 dark:text-rose-400',
  neutral: 'text-slate-600 dark:text-slate-400',
} as const;

// =============================================================================
// CHART COLORS (for Recharts, etc.)
// =============================================================================

/**
 * Chart color palette using semantic colors
 */
export const chartColors = {
  primary: '#2E5A34',    // TMS Green
  success: '#10b981',    // Emerald-500
  error: '#f43f5e',      // Rose-500
  warning: '#f59e0b',    // Amber-500
  info: '#0ea5e9',       // Sky-500
  accent: '#D4E157',     // TMS Yellow
  muted: '#94a3b8',      // Slate-400
} as const;

/**
 * Attendance chart colors
 */
export const attendanceChartColors = {
  present: '#10b981',    // Emerald-500
  absent: '#f43f5e',     // Rose-500
  excused: '#f59e0b',    // Amber-500
  upcoming: '#94a3b8',   // Slate-400
} as const;

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type SemanticColorType = 'success' | 'error' | 'warning' | 'info' | 'neutral';
export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'upcoming';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type TrendDirection = 'up' | 'down' | 'neutral';
