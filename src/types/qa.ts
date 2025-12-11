// Base Response Types (follow project pattern)
export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ========== Dashboard V2 Types ==========

// Class Comparison (Bar Chart)
export interface ClassComparisonData {
  courseId: number;
  courseName: string;
  metricType: 'ATTENDANCE' | 'HOMEWORK';
  courseAverage: number;
  threshold: number;
  classes: ClassMetric[];
}

export interface ClassMetric {
  classId: number;
  classCode: string;
  value: number;
  isBelowThreshold: boolean;
  studentCount: number;
  status?: 'DRAFT' | 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
}

// Trend Data (Line Chart)
export interface TrendData {
  classId: number;
  classCode: string;
  className?: string;
  metricType: 'ATTENDANCE' | 'HOMEWORK';
  dataPoints: WeeklyDataPoint[];
  insight?: string;
  currentValue?: number;
  previousWeekValue?: number;
  changePercent?: number;
}

export interface WeeklyDataPoint {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  value: number;
  sessionCount: number;
}

// Combined Trend Data (dual-line chart)
export interface CombinedTrendData {
  classId: number;
  classCode: string;
  className?: string;
  dataPoints: CombinedWeeklyDataPoint[];
  attendanceInsight?: string;
  homeworkInsight?: string;
  currentAttendanceRate?: number;
  currentHomeworkRate?: number;
  attendanceChangePercent?: number;
  homeworkChangePercent?: number;
}

export interface CombinedWeeklyDataPoint {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  attendanceRate: number;
  homeworkRate: number;
  sessionCount: number;
}

// Recent Reports
export interface RecentReport {
  reportId: number;
  reportType: string;
  classCode: string;
  status: string;
  createdDate?: string;
}

// Course Options (dropdown)
export interface CourseOption {
  courseId: number;
  courseName: string;
  classCount: number;
}

// KPI Summary (tổng quan nhanh)
export interface KPISummary {
  ongoingClassesCount: number;      // Số lớp đang giám sát
  totalStudentsCount: number;       // Tổng số học viên đang học
  averageAttendanceRate: number;    // Điểm danh TB
  averageHomeworkRate: number;      // BTVN TB
}

// Draft Report (báo cáo đang viết dở)
export interface DraftReport {
  reportId: number;
  reportType: string;
  classCode: string;
  className?: string;
  lastUpdated?: string;
  phaseName?: string;
}

// Completed Phase Info (lớp vừa hết phase)
export interface CompletedPhaseInfo {
  classId: number;
  classCode: string;
  className?: string;
  phaseId: number;
  phaseName: string;
  phaseEndDate: string;
  totalSessions: number;
  hasPhaseReview: boolean;
  hasFeedbackAnalysis: boolean;
  daysSinceEnded: number;
}

// Main Dashboard DTO (V2)
export interface QADashboardDTO {
  // New V2 fields
  classComparison?: ClassComparisonData;
  trendData?: TrendData;
  recentReports?: RecentReport[];
  courseOptions?: CourseOption[];
  
  // KPI Summary & Tasks (NEW)
  kpiSummary?: KPISummary;
  draftReports?: DraftReport[];
  completedPhases?: CompletedPhaseInfo[];
  
  // Legacy fields (backward compatible)
  kpiMetrics?: {
    ongoingClassesCount: number;
    qaReportsCreatedThisMonth: number;
    averageAttendanceRate: number;
    averageHomeworkCompletionRate: number;
  };
  classesRequiringAttention?: Array<{
    classId: number;
    classCode: string;
    courseName: string;
    branchName: string;
    attendanceRate: number;
    homeworkCompletionRate: number;
    qaReportCount: number;
    warningReason: string;
  }>;
  recentQAReports?: Array<{
    reportId: number;
    reportType: string;
    classId: number;
    classCode: string;
    sessionId?: number;
    sessionDate?: string;
    status: string;
    createdAt: string;
  }>;
  dateRangeInfo?: {
    dateFrom: string;
    dateTo: string;
    displayText: string;
    isDefaultRange: boolean;
  };
}

// ========== Classes Types ==========
export interface QAClassListItemDTO {
  classId: number;
  classCode: string;
  className: string;
  subjectId: number;
  subjectName: string;
  branchName: string;
  modality: string;
  status: string;
  startDate: string;
  totalSessions: number;
  completedSessions: number;
  attendanceRate: number;
  homeworkCompletionRate: number;
  qaReportCount: number;
}

export interface QAClassDetailDTO {
  classId: number;
  classCode: string;
  className: string;
  subjectName: string;
  subjectId: number;
  branchId: number;
  branchName: string;
  branchAddress?: string;
  branchPhone?: string;
  branchDistrict?: string;
  branchCity?: string;
  modality: string;
  status: string;
  startDate: string;
  endDate?: string;
  maxCapacity: number;
  currentEnrollment: number;

  // Session Summary
  sessionSummary: {
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
    cancelledSessions: number;
    nextSessionDate?: string;
  };

  // QA Performance Metrics
  performanceMetrics: {
    attendanceRate: number;
    homeworkCompletionRate: number;
    totalAbsences: number;
    studentsAtRisk: number;
  };

  // QA Reports
  qaReports: Array<{
    reportId: number;
    reportType: string;
    reportLevel: string;
    status: string;
    createdAt: string;
    reportedByName: string;
  }>;

  // Teachers
  teachers: Array<{
    teacherId: number;
    teacherName: string;
    sessionsAssigned: number;
    sessionsCompleted: number;
  }>;
}

// Session Types
export interface QASessionListResponse {
  classId: number;
  classCode: string;
  totalSessions: number;
  sessions: Array<{
    sessionId: number;
    sequenceNumber?: number;
    date: string;
    dayOfWeek?: string;
    timeSlot: string; 
    startTime?: string;
    endTime?: string;
    topic: string;
    status: string;
    teacherName: string;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    homeworkCompletedCount: number;
    hasHomework: boolean;
    hasQAReport: boolean;
    qaReportCount: number;
  }>;
}

// ========== QA Scores Types ==========
export interface QAClassScoresDTO {
  classId: number;
  classCode: string;
  scoreSummary: ScoreSummary;
  students: StudentScoresSummary[];
}

export interface ScoreSummary {
  classAverage: number;
  totalStudents: number;
  studentsWithScores: number;
  totalAssessments: number;
}

export interface StudentScoresSummary {
  studentId: number;
  studentCode: string;
  studentName: string;
  email?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  enrolledAt?: string;
  averageScore: number;
  totalAssessments: number;
  completedAssessments: number;
  scores: AssessmentScore[];
}

export interface AssessmentScore {
  assessmentId: number;
  assessmentName: string;
  assessmentKind: string;
  skill: string;
  maxScore: number;
  durationMinutes?: number;
  scheduledDate?: string;
  actualDate?: string;
  scoreId?: number;
  score?: number;
  scorePercentage?: number;
  feedback?: string;
  gradedByName?: string;
  gradedAt?: string;
}

export interface SessionDetailDTO {
  sessionId: number;
  classId: number;
  classCode: string;
  subjectName: string;
  date: string;
  timeSlot: string;
  topic: string;
  studentTask?: string;
  status: string;
  teacherName: string;
  teacherNote?: string;
  attendanceStats: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    homeworkCompletedCount: number;
    hasHomework: boolean;
  };
  students: Array<{
    studentId: number;
    studentCode: string;
    studentName: string;
    attendanceStatus?: string;
    homeworkStatus?: string;
    isMakeup?: boolean;
    note?: string;
  }>;
  closCovered: Array<{
    cloId: number;
    cloCode: string;
    description?: string;
  }>;
  
  sequenceNo?: number;
  skills?: string[];
  phase?: {
    phaseId: number;
    phaseNumber: number;
    phaseName: string;
    learningFocus?: string;
  };
  resources?: Array<{
    resourceId: number;
    resourceType: 'ROOM' | 'VIRTUAL';
    code: string;
    name: string;
    // For ROOM
    branchName?: string;
    branchAddress?: string;
    capacity?: number;
    equipment?: string;
    // For VIRTUAL
    meetingUrl?: string;
    meetingId?: string;
    meetingPasscode?: string;
    accountEmail?: string;
  }>;
  materials?: Array<{
    materialId: number;
    title: string;
    description?: string;
    materialType: 'DOCUMENT' | 'MEDIA' | 'ARCHIVE' | 'LINK' | 'OTHER';
    url: string;
  }>;
}

// QA Report Types
export interface QAReportListItemDTO {
  id: number;
  reportType: string;
  reportLevel: string;
  classId: number;
  classCode: string;
  branchId?: number;
  branchName?: string;
  sessionId?: number;
  sessionDate?: string;
  phaseId?: number;
  phaseName?: string;
  status: string;
  reportedByName: string;
  createdAt: string;
  updatedAt: string;
  contentPreview: string;
}

export interface QAReportDetailDTO {
  id: number;
  reportType: string;
  status: string;
  classId: number;
  classCode: string;
  className: string;
  branchId?: number;
  branchName?: string;
  sessionId?: number;
  sessionDate?: string;
  phaseId?: number;
  phaseName?: string;
  content: string;
  reportedById: number;
  reportedByName: string;
  createdAt: string;
  updatedAt: string;

  // Class metrics at report creation time
  classMetrics?: {
    attendanceRate: number;
    homeworkCompletionRate: number;
    totalSessions: number;
    completedSessions: number;
    totalStudents: number;
    presentStudents: number;
    completedHomeworkStudents: number;
  };
}

export interface CreateQAReportRequest {
  classId: number;
  sessionId?: number;
  phaseId?: number;
  reportType: string;
  status: string;
  content: string;
}

export interface UpdateQAReportRequest {
  reportType: string;
  status: string;
  content: string;
}

export interface ChangeQAReportStatusRequest {
  status: string;
}

// Student Feedback Types
export interface StudentFeedbackListResponse {
  statistics: {
    totalStudents: number;
    submittedCount: number;
    notSubmittedCount: number;
    submissionRate: number;
    averageRating?: number;
    positiveFeedbackCount?: number;
    negativeFeedbackCount?: number;
  };
  feedbacks: Array<{
    feedbackId: number;
    studentId: number;
    studentName: string;
    phaseId?: number;
    phaseName?: string;
    isFeedback: boolean;
    submittedAt?: string;
    responsePreview: string;
    rating?: number;
    sentiment?: string;
  }>;
  total: number;
  page: number;
  size: number;
}

export interface StudentFeedbackDetailDTO {
  feedbackId: number;
  studentId: number;
  studentName: string;
  classId: number;
  classCode: string;
  phaseId?: number;
  phaseName?: string;
  isFeedback: boolean;
  submittedAt?: string;
  response: string;
  rating?: number;
  sentiment?: string;
  detailedResponses: Array<{
    questionId: number;
    questionText: string;
    answerText: string;
  }>;
}

// Filter and Pagination Types
export interface QAListParams {
  branchIds?: number[];
  status?: string;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: string;
}

export interface QAReportFilters {
  classId?: number;
  sessionId?: number;
  phaseId?: number;
  reportType?: string;
  status?: string;
  reportedBy?: number;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: string;
}

export interface FeedbackFilters {
  phaseId?: number;
  isFeedback?: boolean;
  page?: number;
  size?: number;
}


// Enums
// Update enum definitions to match backend UPPERCASE values
export const QAReportType = {
  CLASSROOM_OBSERVATION: "CLASSROOM_OBSERVATION",
  PHASE_REVIEW: "PHASE_REVIEW",
  CLO_ACHIEVEMENT_ANALYSIS: "CLO_ACHIEVEMENT_ANALYSIS",
  STUDENT_FEEDBACK_ANALYSIS: "STUDENT_FEEDBACK_ANALYSIS",
  ATTENDANCE_ENGAGEMENT_REVIEW: "ATTENDANCE_ENGAGEMENT_REVIEW",
  TEACHING_QUALITY_ASSESSMENT: "TEACHING_QUALITY_ASSESSMENT"
} as const;

export type QAReportType = typeof QAReportType[keyof typeof QAReportType]

export const QAReportStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED"
} as const;

export type QAReportStatus = typeof QAReportStatus[keyof typeof QAReportStatus]

// Helper function for display names
export const getQAReportStatusDisplayName = (status: QAReportStatus | string): string => {
  const normalizedStatus = (status as string).toUpperCase()

  switch (normalizedStatus) {
    case QAReportStatus.DRAFT:
      return "Bản nháp"
    case QAReportStatus.SUBMITTED:
      return "Đã nộp"
    default:
      return status
  }
}

// Vietnamese display names aligned with backend QAReportType enum displayNames
export const getQAReportTypeDisplayName = (reportType: QAReportType | string): string => {
  const normalizedType = (reportType as string).toUpperCase()

  switch (normalizedType) {
    case QAReportType.CLASSROOM_OBSERVATION:
      return "Quan sát lớp học"
    case QAReportType.PHASE_REVIEW:
      return "Đánh giá giai đoạn"
    case QAReportType.CLO_ACHIEVEMENT_ANALYSIS:
      return "Phân tích mức độ đạt CLO"
    case QAReportType.STUDENT_FEEDBACK_ANALYSIS:
      return "Phân tích phản hồi học viên"
    case QAReportType.ATTENDANCE_ENGAGEMENT_REVIEW:
      return "Đánh giá chuyên cần và tham gia"
    case QAReportType.TEACHING_QUALITY_ASSESSMENT:
      return "Đánh giá chất lượng giảng dạy"
    default:
      return reportType
  }
}

export const qaReportTypeOptions = [
  {
    value: QAReportType.CLASSROOM_OBSERVATION,
    label: getQAReportTypeDisplayName(QAReportType.CLASSROOM_OBSERVATION)
  },
  {
    value: QAReportType.PHASE_REVIEW,
    label: getQAReportTypeDisplayName(QAReportType.PHASE_REVIEW)
  },
  {
    value: QAReportType.CLO_ACHIEVEMENT_ANALYSIS,
    label: getQAReportTypeDisplayName(QAReportType.CLO_ACHIEVEMENT_ANALYSIS)
  },
  {
    value: QAReportType.STUDENT_FEEDBACK_ANALYSIS,
    label: getQAReportTypeDisplayName(QAReportType.STUDENT_FEEDBACK_ANALYSIS)
  },
  {
    value: QAReportType.ATTENDANCE_ENGAGEMENT_REVIEW,
    label: getQAReportTypeDisplayName(QAReportType.ATTENDANCE_ENGAGEMENT_REVIEW)
  },
  {
    value: QAReportType.TEACHING_QUALITY_ASSESSMENT,
    label: getQAReportTypeDisplayName(QAReportType.TEACHING_QUALITY_ASSESSMENT)
  }
]

export const isValidQAReportType = (reportType: string | undefined): boolean => {
  if (!reportType) return false

  const normalizedType = reportType.toUpperCase()
  return Object.values(QAReportType).includes(normalizedType as QAReportType)
}

// Session Status enum and utilities
export const SessionStatus = {
  PLANNED: "PLANNED",
  CANCELLED: "CANCELLED",
  DONE: "DONE"
} as const

export type SessionStatusType = typeof SessionStatus[keyof typeof SessionStatus]

export const getSessionStatusDisplayName = (status: SessionStatusType | string): string => {
  const normalizedStatus = (status as string).toUpperCase()

  switch (normalizedStatus) {
    case SessionStatus.PLANNED:
      return "Đã lên lịch"
    case SessionStatus.CANCELLED:
      return "Đã hủy"
    case SessionStatus.DONE:
      return "Đã hoàn thành"
    default:
      return status
  }
}

export const isValidSessionStatus = (status: string | undefined): boolean => {
  if (!status) return false

  const normalizedStatus = status.toUpperCase()
  return Object.values(SessionStatus).includes(normalizedStatus as SessionStatusType)
}

// Export Types for QA Export Feature
export interface QAExportRequest {
  dateFrom: string
  dateTo: string
  format: string // "EXCEL" or "CSV" (currently only EXCEL supported)
  includeSections: string[] // Array of section IDs
  branchIds?: number[] // Optional: filter by specific branches
}

export interface QAExportResponse {
  filename: string
  content: Blob // File content
}

export const sessionStatusOptions = [
  {
    value: SessionStatus.PLANNED,
    label: getSessionStatusDisplayName(SessionStatus.PLANNED)
  },
  {
    value: SessionStatus.CANCELLED,
    label: getSessionStatusDisplayName(SessionStatus.CANCELLED)
  },
  {
    value: SessionStatus.DONE,
    label: getSessionStatusDisplayName(SessionStatus.DONE)
  }
]

// Course Phase Types
export interface CoursePhaseDTO {
  id: number;
  courseId: number;
  courseName: string;
  phaseNumber: number;
  name: string;
  durationWeeks?: number;
  learningFocus?: string;

  // Legacy fields for compatibility
  description?: string;
  sequenceNo?: number;
}
