/**
 * Semantic Status Colors - Centralized color definitions for consistent UI
 * 
 * Usage:
 * - Import the style constant you need
 * - Apply with cn(): className={cn('text-xs', CLASS_STATUS_STYLES.ONGOING)}
 * 
 * Color Palette:
 * - Emerald: Success, Present, Ongoing, Active
 * - Amber: Warning, Pending, Scheduled
 * - Rose: Error, Absent, Cancelled, Rejected
 * - Sky: Info, Upcoming, Planned
 * - Slate: Neutral, Completed, Default
 * - Indigo: Excused, Special
 * - Purple: Makeup, Transfer
 */

// ============================================
// CLASS STATUS STYLES
// ============================================
export const CLASS_STATUS_STYLES = {
  ONGOING: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SCHEDULED: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-slate-50 text-slate-700 border-slate-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  DRAFT: 'bg-slate-50 text-slate-500 border-slate-200',
} as const;

export type ClassStatus = keyof typeof CLASS_STATUS_STYLES;

// ============================================
// ENROLLMENT STATUS STYLES
// ============================================
export const ENROLLMENT_STATUS_STYLES = {
  ENROLLED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  ONGOING: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  TRANSFERRED: 'bg-muted text-muted-foreground border-border opacity-70',
  COMPLETED: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800',
  DROPPED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
  WITHDRAWN: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  PENDING: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800',
} as const;

export type EnrollmentStatus = keyof typeof ENROLLMENT_STATUS_STYLES;

// ============================================
// SESSION STATUS STYLES
// ============================================
export const SESSION_STATUS_STYLES = {
  PLANNED: 'bg-amber-50 text-amber-700 border-amber-200',
  DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
} as const;

export type SessionStatus = keyof typeof SESSION_STATUS_STYLES;

// ============================================
// ATTENDANCE STATUS STYLES
// ============================================
export const ATTENDANCE_STATUS_STYLES = {
  PLANNED: 'bg-slate-50 text-slate-600 border-slate-200',
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ABSENT: 'bg-rose-50 text-rose-700 border-rose-200',
  LATE: 'bg-amber-50 text-amber-700 border-amber-200',
  EXCUSED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  MAKEUP: 'bg-purple-50 text-purple-700 border-purple-200',
} as const;

export type AttendanceStatus = keyof typeof ATTENDANCE_STATUS_STYLES;

// ============================================
// REQUEST STATUS STYLES
// ============================================
export const REQUEST_STATUS_STYLES = {
  PENDING: 'bg-sky-50 text-sky-700 border-sky-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  CANCELLED: 'bg-slate-50 text-slate-500 border-slate-200',
} as const;

export type RequestStatus = keyof typeof REQUEST_STATUS_STYLES;

// ============================================
// REQUEST TYPE STYLES
// ============================================
export const REQUEST_TYPE_STYLES = {
  ABSENCE: 'bg-amber-50 text-amber-700 border-amber-200',
  MAKEUP: 'bg-purple-50 text-purple-700 border-purple-200',
  TRANSFER: 'bg-indigo-50 text-indigo-700 border-indigo-200',
} as const;

export type RequestType = keyof typeof REQUEST_TYPE_STYLES;

// ============================================
// ASSESSMENT KIND STYLES
// ============================================
export const ASSESSMENT_KIND_STYLES = {
  QUIZ: 'bg-sky-50 text-sky-700 border-sky-200',
  MIDTERM: 'bg-purple-50 text-purple-700 border-purple-200',
  FINAL: 'bg-rose-50 text-rose-700 border-rose-200',
  ASSIGNMENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PROJECT: 'bg-amber-50 text-amber-700 border-amber-200',
} as const;

export type AssessmentKind = keyof typeof ASSESSMENT_KIND_STYLES;

// ============================================
// HOMEWORK STATUS STYLES
// ============================================
export const HOMEWORK_STATUS_STYLES = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INCOMPLETE: 'bg-amber-50 text-amber-700 border-amber-200',
  NO_HOMEWORK: 'bg-slate-50 text-slate-600 border-slate-200',
} as const;

export type HomeworkStatus = keyof typeof HOMEWORK_STATUS_STYLES;

// ============================================
// MODALITY STYLES
// ============================================
export const MODALITY_STYLES = {
  OFFLINE: 'bg-slate-50 text-slate-700 border-slate-200',
  ONLINE: 'bg-sky-50 text-sky-700 border-sky-200',
} as const;

export type Modality = keyof typeof MODALITY_STYLES;

// ============================================
// USER STATUS STYLES
// ============================================
export const USER_STATUS_STYLES = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-slate-50 text-slate-500 border-slate-200',
  SUSPENDED: 'bg-rose-50 text-rose-700 border-rose-200',
} as const;

export type UserStatus = keyof typeof USER_STATUS_STYLES;


export const CALENDAR_SESSION_VARIANTS = {
  PLANNED: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    borderLeft: 'border-l-sky-600',
    text: 'text-sky-700',
  },
  DONE: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    borderLeft: 'border-l-emerald-600',
    text: 'text-emerald-700',
  },
  CANCELLED: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    borderLeft: 'border-l-rose-600',
    text: 'text-rose-700',
  },
  DEFAULT: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    borderLeft: 'border-l-slate-600',
    text: 'text-slate-700',
  },
} as const;

export const ATTENDANCE_CALENDAR_VARIANTS = {
  PRESENT: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    borderLeft: 'border-l-emerald-600',
    text: 'text-emerald-700',
  },
  ABSENT: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    borderLeft: 'border-l-rose-600',
    text: 'text-rose-700',
  },
  EXCUSED: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    borderLeft: 'border-l-purple-600',
    text: 'text-purple-700',
  },
  LATE: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    borderLeft: 'border-l-amber-600',
    text: 'text-amber-700',
  },
} as const;

/**
 * Get calendar variant based on session and attendance status
 * Logic: If session is DONE, prioritize attendance status colors
 */
export function getCalendarVariant(
  sessionStatus: string,
  attendanceStatus?: string
): { bg: string; border: string; borderLeft: string; text: string } {
  // Priority 1: CANCELLED sessions always red
  if (sessionStatus === 'CANCELLED') {
    return CALENDAR_SESSION_VARIANTS.CANCELLED;
  }

  // Priority 2: If DONE, use attendance status color
  if (sessionStatus === 'DONE' && attendanceStatus) {
    const attendanceVariant = ATTENDANCE_CALENDAR_VARIANTS[attendanceStatus as keyof typeof ATTENDANCE_CALENDAR_VARIANTS];
    if (attendanceVariant) {
      return attendanceVariant;
    }
  }

  // Priority 3: Use session status color (PLANNED, DONE without attendance)
  const sessionVariant = CALENDAR_SESSION_VARIANTS[sessionStatus as keyof typeof CALENDAR_SESSION_VARIANTS];
  return sessionVariant || CALENDAR_SESSION_VARIANTS.DEFAULT;
}

// ============================================
// MATERIAL TYPE STYLES (for file downloads)
// ============================================
export const MATERIAL_TYPE_STYLES: Record<string, { label: string; className: string }> = {
  pdf: { label: 'PDF', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  ppt: { label: 'Slide', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  pptx: { label: 'Slide', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  doc: { label: 'Tài liệu', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  docx: { label: 'Tài liệu', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  xls: { label: 'Bảng tính', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  xlsx: { label: 'Bảng tính', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  mp4: { label: 'Video', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  mov: { label: 'Video', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  txt: { label: 'Ghi chú', className: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export function getMaterialTypeMeta(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return (
    MATERIAL_TYPE_STYLES[ext] ?? {
      label: 'Tài liệu',
      className: 'bg-slate-50 text-slate-600 border-slate-200',
    }
  );
}

// ============================================
// HELPER FUNCTION: Get style with fallback
// ============================================
export function getStatusStyle<T extends Record<string, string>>(
  styles: T,
  status: string | undefined | null,
  fallback = 'bg-slate-50 text-slate-600 border-slate-200'
): string {
  if (!status) return fallback;
  return (styles as Record<string, string>)[status] ?? fallback;
}

