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
  scheduleDays: number[] // 0-6 (Sunday-Saturday)
  maxCapacity: number
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
  sessionDate: string
  dayOfWeek: string
  conflictReason: ConflictReason
  requestedCapacity: number
  availableCapacity: number
  resourceId: number
  resourceName: string
  conflictingClasses: string[]
}

export interface AssignResourcesRequest {
  pattern: ResourceAssignment[]
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

export interface TeacherAvailability {
  id: number
  name: string
  email: string
  skills: string[]
  conflictCount: number
  totalSessions: number
  availableSessions: number
  availabilityRate: number
  isRecommended: boolean
  conflicts?: TeacherConflictDetail[] | null
  availabilityByDay?: Record<number, TeacherDayAvailability> | null
}

export interface GetTeacherAvailabilityResponse {
  success: boolean
  message: string
  data: TeacherAvailability[]
}

// ============ STEP 5B: Assign Teacher ============

export interface AssignTeacherRequest {
  teacherId: number
  sessionIds?: number[] // Optional: for partial assignment
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

export interface MissingAssignment {
  sessionId: number
  sessionDate: string
  missingFields: string[]
}

export interface ValidationSummary {
  totalSessions: number
  sessionsWithTimeSlots: number
  sessionsWithResources: number
  sessionsWithTeachers: number
}

export interface ValidateClassResponse {
  success: boolean
  data: {
    isValid: boolean
    validationSummary: ValidationSummary
    missingAssignments: MissingAssignment[]
  }
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
