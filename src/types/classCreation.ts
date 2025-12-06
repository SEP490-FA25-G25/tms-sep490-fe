/**
 * Type definitions for Create Class workflow
 * 7-step wizard for creating a new class
 */

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type ClassModality = 'ONLINE' | 'OFFLINE' | 'HYBRID'

export type AvailabilityStatus = 'FULLY_AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE'

export type ConflictReason = 'CAPACITY_EXCEEDED' | 'BOOKING_CONFLICT' | 'UNKNOWN'

// ============ STEP 1: Basic Info ============

export interface CreateClassFormData {
  branchId: number
  courseId: number
  code?: string
  name: string
  modality: ClassModality
  startDate: string // ISO date string
  plannedEndDate?: string // dùng cho update, backend yêu cầu
  scheduleDays: number[] // 0-6 (Sunday-Saturday)
  maxCapacity: number
  regenerateSessions?: boolean // dùng cho update khi đổi lịch
}

export interface CreateClassResponse {
  success: boolean
  message: string
  data: {
    classId: number
    code: string
    status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
    sessionSummary: {
      totalSessions: number
      startDate: string
      endDate: string
    }
  }
}

// ============ STEP 2: Review Sessions ============

export interface GeneratedClassSession {
  sessionId: number
  sequenceNumber: number
  date: string
  dayOfWeek: string
  courseSessionName: string
  hasTimeSlot: boolean
  hasResource: boolean
  hasTeacher: boolean
  timeSlotInfo: Record<string, unknown> | null
  timeSlotTemplateId?: number | null
  timeSlotName?: string
  timeSlotLabel?: string
  resourceId?: number | null
  resourceName?: string
  resourceDisplayName?: string
  resourceInfo?: Record<string, unknown> | null
  resource?: Record<string, unknown> | null
  room?: string
  roomName?: string
  teacherName?: string
  teacherNames?: string
  teachers?: Array<{ teacherId: number; fullName?: string; name?: string }>
  teacherIds?: number[]
  teacherAssignments?: Array<{ teacherId?: number; fullName?: string; name?: string }>
  teacherInfo?: Array<{ teacherId?: number; fullName?: string; name?: string }>
  assignedTeachers?: Array<{ teacherId?: number; fullName?: string; name?: string }>
}

export interface ClassSessionsWeekGroup {
  weekNumber: number
  weekRange: string
  sessionCount: number
  sessionIds: number[]
}

export interface ClassSessionsOverview {
  classId: number
  classCode: string
  totalSessions: number
  dateRange: {
    startDate: string
    endDate: string
  }
  sessions: GeneratedClassSession[]
  groupedByWeek: ClassSessionsWeekGroup[]
}

export interface GetClassSessionsResponse {
  success: boolean
  message: string
  data: ClassSessionsOverview
}

// ============ STEP 3: Time Slots ============

export interface TimeSlotOption {
  id: number
  name: string
  startTime: string
  endTime: string
}

export interface TimeSlotAssignment {
  dayOfWeek: number
  timeSlotTemplateId: number
}

export interface AssignTimeSlotsRequest {
  assignments: TimeSlotAssignment[]
}

export interface DaySlotSelection {
  dayOfWeek: number
  timeSlotId?: number | ''
}

export interface AssignTimeSlotsResponse {
  success: boolean
  message: string
  data: {
    successCount: number
    failedCount: number
    processingTimeMs: number
  }
}

// ============ STEP 4: Resources ============

export interface ResourceOption {
  id: number
  code: string
  name: string
  resourceType: 'ROOM' | 'ONLINE_ACCOUNT'
  capacity: number
  displayName: string
  availabilityRate?: number
  conflictCount?: number
  totalSessions?: number
  isRecommended?: boolean
}

export interface ResourceAssignment {
  dayOfWeek: number
  resourceId: number
}

export interface ResourceConflict {
  sessionId: number
  sessionNumber?: number | null
  sessionDate?: string | null
  date?: string | null
  dayOfWeek?: string | number | null
  conflictReason: ConflictReason | string
  requestedCapacity?: number | null
  availableCapacity?: number | null
  resourceId?: number | null
  resourceName?: string | null
  resourceDisplayName?: string | null
  timeSlotStart?: string | null
  timeSlotEnd?: string | null
  suggestions?: ResourceOption[]
  conflictingClasses?: string[] | null
  conflictDetails?: string | null
}

export interface AssignResourcesRequest {
  pattern: ResourceAssignment[]
  skipConflictCheck?: boolean
}

export interface AssignResourcesResponse {
  success: boolean
  message: string
  data: {
    successCount: number
    conflictCount: number
    conflicts: ResourceConflict[]
    processingTimeMs: number
  }
}

export interface AssignSessionResourceRequest {
  resourceId: number
}

export interface AssignSessionResourceResponse {
  success: boolean
  message: string
  data: {
    sessionId: number
    sessionNumber?: number | null
    resourceId: number
    resourceName: string
    conflictResolved: boolean
  }
}

export interface SessionResourceSuggestionsResponse {
  success: boolean
  message: string
  data: ResourceOption[]
}

// ============ STEP 5A: Teacher Availability ============

export interface TeacherDayAvailability {
  available: number
  total: number
  rate: number
}

export interface TeacherConflictDetail {
  sessionDate: string
  dayOfWeek: string
  timeSlot: {
    id: number
    name: string
    startTime: string
    endTime: string
    displayTime: string
  }
  conflictingClass: {
    id: number
    name: string
    code: string
  }
  resource?: {
    id: number
    name: string
    code: string
    type: 'ROOM' | 'VIRTUAL'
  }
}

export type TeacherAvailabilityStatus = 'FULLY_AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE'

export interface TeacherConflictSummary {
  noAvailability: number
  teachingConflict: number
  leaveConflict: number
  skillMismatch: number
  totalConflicts: number
}

export interface ScheduleInfo {
  days: string[]
  timeSlot: string
  location: string
}

export interface TeacherSkillDetail {
  skill: string
  specialization: string
  level: number
}

export interface TeacherAvailability {
  teacherId: number
  fullName: string
  email: string
  skills: string[]
  specializations?: string[] // e.g., ["IELTS", "TOEIC"]
  skillDetails?: TeacherSkillDetail[] // Detailed skills with levels
  hasGeneralSkill: boolean
  totalSessions: number
  availableSessions: number
  availabilityPercentage: number
  availabilityStatus: TeacherAvailabilityStatus
  conflicts: TeacherConflictSummary
  availabilityByDay?: Record<number, TeacherDayAvailability> | null
  conflictDetails?: TeacherConflictDetail[] | null
  teacherSchedule?: ScheduleInfo | null
  classSchedule?: ScheduleInfo | null
}

export interface GetTeacherAvailabilityResponse {
  success: boolean
  message: string
  data: TeacherAvailability[]
}

export interface TeacherDayAvailabilityInfo {
  dayOfWeek: number
  dayName: string
  totalSessions: number
  availableSessions: number
  firstDate: string
  lastDate: string
  isFullyAvailable: boolean
  timeSlotDisplay?: string
}

export interface TeacherAvailableByDay {
  teacherId: number
  fullName: string
  email: string
  avatarUrl?: string | null
  skills: string[]
  skillDetails?: { skill: string; specialization: string; level: number }[]
  totalClassSessions: number
  availableDays: TeacherDayAvailabilityInfo[]
}

export interface GetTeachersAvailableByDayResponse {
  success: boolean
  message: string
  data: TeacherAvailableByDay[]
}

// ============ STEP 5B: Assign Teacher ============

export interface AssignTeacherRequest {
  teacherId: number
  sessionIds?: number[] | null // null => assign all sessions
}

export interface AssignTeacherResponse {
  success: boolean
  message: string
  data: {
    assignedCount: number
    needsSubstitute: boolean
    remainingSessions?: number
    processingTimeMs: number
  }
}

// ============ STEP 6: Validation ============

export interface ValidationChecks {
  totalSessions: number
  sessionsWithTimeSlots: number
  sessionsWithResources: number
  sessionsWithTeachers: number
  sessionsWithoutTimeSlots: number
  sessionsWithoutResources: number
  sessionsWithoutTeachers: number
  completionPercentage: number
  allSessionsHaveTimeSlots: boolean
  allSessionsHaveResources: boolean
  allSessionsHaveTeachers: boolean
  hasMultipleTeachersPerSkillGroup?: boolean
  startDateInPast?: boolean
  hasValidationErrors?: boolean
  hasValidationWarnings?: boolean
}

export interface ValidateClassData {
  valid: boolean
  canSubmit: boolean
  classId: number
  message: string
  checks: ValidationChecks
  errors: string[]
  warnings: string[]
}

export interface ValidateClassResponse {
  success: boolean
  message: string
  data: ValidateClassData | null
}

// ============ STEP 7: Submit ============

export interface SubmitClassResponse {
  success: boolean
  message: string
  data: {
    classId: number
    status: 'SCHEDULED'
    approvalStatus: 'PENDING'
  }
}

// ============ Class Code Preview ============

export interface ClassCodePreviewData {
  previewCode: string
  prefix: string
  nextSequence: number
  warning?: string | null
}

export interface PreviewClassCodeRequest {
  branchId: number
  courseId: number
  startDate: string
}

export interface PreviewClassCodeResponse {
  success: boolean
  message: string
  data: ClassCodePreviewData
}

// ============ Wizard State ============

export interface WizardState {
  currentStep: WizardStep
  completedSteps: number[]
  classId: number | null
  classData: Partial<CreateClassFormData>
}

export interface ClassDraft {
  step: number
  classId: number | null
  formData: Partial<CreateClassFormData>
  timestamp: number
}

// ============ Branch & Course Options ============

export interface BranchOption {
  id: number
  name: string
  code: string
}

export interface CourseOption {
  id: number
  name: string
  code: string
}
