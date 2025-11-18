export interface StudentClassDTO {
  classId: number
  classCode: string
  className: string

  // Course information
  courseId: number
  courseName: string
  courseCode: string

  // Branch information
  branchId: number
  branchName: string

  // Class details
  modality: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  status: string // ONGOING, SCHEDULED, etc.
  startDate: string
  endDate: string

  // Schedule information
  scheduleSummary: string // e.g., "Mon, Wed, Fri | 09:00-11:00"

  // Enrollment information
  enrollmentId: number
  enrollmentDate: string
  enrollmentStatus: string // ACTIVE, COMPLETED, etc.

  // Progress information
  totalSessions: number
  completedSessions: number
  attendedSessions: number
  attendanceRate: number

  // Teacher information
  primaryInstructorName: string
}

export interface StudentSearchResult {
  id: number
  studentCode: string
  fullName: string
  email: string
  phone: string
  branchName: string
  branchId: number
  activeEnrollments: number
  lastEnrollmentDate?: string
  canEnroll: boolean
}

export interface ContentGapSession {
  courseSessionNumber: number
  courseSessionTitle: string
  scheduledDate?: string
}

export interface ContentGap {
  missedSessions: number
  gapSessions: ContentGapSession[]
  severity: 'NONE' | 'MINOR' | 'MODERATE' | 'MAJOR'
  recommendation: string
  totalSessions?: number
  recommendedActions?: string[]
  impactDescription?: string
}

export interface TransferQuota {
  used: number
  limit: number
  remaining: number
}

export interface TransferEligibility {
  enrollmentId: number
  classId: number
  classCode: string
  className: string
  courseId: number
  courseName: string
  branchId: number
  branchName: string
  modality: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  learningMode?: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  enrollmentStatus: string
  transferQuota: TransferQuota
  hasPendingTransfer: boolean
  canTransfer: boolean
  scheduleInfo?: string
}

export interface PolicyInfo {
  maxTransfersPerCourse: number
  usedTransfers?: number
  remainingTransfers?: number
  autoApprovalConditions?: string
  requiresAAApproval?: boolean
  policyDescription?: string
}

export interface TransferEligibilityResponse {
  eligibleForTransfer: boolean
  ineligibilityReason: string | null
  currentClasses?: TransferEligibility[]
  currentEnrollments?: TransferEligibility[]
  policyInfo: PolicyInfo
}

export interface TransferOption {
  classId: number
  classCode: string
  className: string
  branchId: number
  branchName: string
  modality: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  scheduleDays: string
  scheduleTime: string
  scheduleInfo?: string
  startDate?: string
  endDate?: string
  currentSession: number
  maxCapacity: number
  enrolledCount: number
  currentEnrollment?: number
  availableSlots: number
  classStatus: string
  contentGap?: ContentGap
  canTransfer: boolean
  contentGapAnalysis?: {
    gapLevel: 'NONE' | 'MINOR' | 'MODERATE' | 'MAJOR'
    missedSessions: number
    totalSessions: number
    gapSessions: Array<ContentGapSession & { scheduledDate?: string }>
    recommendedActions?: string[]
    impactDescription?: string
  }
  upcomingSessions?: Array<{
    sessionId: number
    date: string
    courseSessionNumber: number
    courseSessionTitle: string
    timeSlot: string
  }>
  changes?: {
    branch?: string
    modality?: string
    schedule?: string
  }
}

export interface TransferRequestResponse {
  id: number
  student?: {
    id: number
    fullName: string
    email: string
  }
  requestType?: string
  status: string
  submittedAt: string
  effectiveDate: string
  currentClass: {
    id?: number
    code: string
    name: string
  }
  targetClass: {
    id?: number
    code: string
    name: string
  }
}

