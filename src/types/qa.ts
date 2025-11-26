// Base Response Types (follow project pattern)
export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Dashboard Types
export interface QADashboardDTO {
  kpiMetrics: {
    ongoingClassesCount: number;
    qaReportsCreatedThisMonth: number;
    averageAttendanceRate: number;
    averageHomeworkCompletionRate: number;
  };
  classesRequiringAttention: Array<{
    classId: number;
    classCode: string;
    courseName: string;
    branchName: string;
    attendanceRate: number;
    qaReportCount: number;
    warningReason: string;
  }>;
  recentQAReports: Array<{
    reportId: number;
    reportType: string;
    classId: number;
    classCode: string;
    sessionId?: number;
    sessionDate?: string;
    status: string;
    createdAt: string;
  }>;
}

// Classes Types
export interface QAClassListItemDTO {
  classId: number;
  classCode: string;
  className: string;
  courseName: string;
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
  courseName: string;
  courseId: number;
  branchName: string;
  branchId: number;
  modality: string;
  status: string;
  startDate: string;
  endDate?: string;
  maxCapacity: number;
  currentEnrollment: number;
  sessionSummary: {
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
    cancelledSessions: number;
    nextSessionDate?: string;
  };
  performanceMetrics: {
    attendanceRate: number;
    homeworkCompletionRate: number;
    totalAbsences: number;
    studentsAtRisk: number;
  };
  qaReports: Array<{
    reportId: number;
    reportType: string;
    reportLevel: string;
    status: string;
    createdAt: string;
    reportedByName: string;
  }>;
  teachers: Array<{
    teacherId: number;
    teacherName: string;
    sessionsAssigned: number;
    sessionsCompleted: number;
  }>;
}

// Session Types
export interface SessionDetailDTO {
  sessionId: number;
  classId: number;
  classCode: string;
  courseName: string;
  date: string;
  timeSlot: string;
  topic: string;
  studentTask: string;
  status: string;
  teacherName: string;
  teacherNote: string;
  attendanceStats: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
    homeworkCompletedCount: number;
    homeworkCompletionRate: number;
  };
  students: Array<{
    studentId: number;
    studentCode: string;
    studentName: string;
    attendanceStatus: string;
    homeworkStatus: string;
    isMakeup: boolean;
    note: string;
  }>;
  closCovered: Array<{
    cloId: number;
    cloCode: string;
    description: string;
  }>;
}

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
    topic: string;
    status: string;
    teacherName: string;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
    homeworkCompletedCount: number;
    homeworkCompletionRate: number;
    hasQAReport: boolean;
    qaReportCount: number;
  }>;
}

// QA Report Types
export interface CreateQAReportRequest {
  classId: number;
  sessionId?: number;
  phaseId?: number;
  reportType: string;
  findings: string;
  actionItems?: string;
  status: string;
}

export interface UpdateQAReportRequest {
  reportType: string;
  findings: string;
  actionItems?: string;
  status: string;
}

export interface ChangeQAReportStatusRequest {
  status: string;
}

export interface QAReportListItemDTO {
  id: number;
  reportType: string;
  reportLevel: string;
  classId: number;
  classCode: string;
  sessionId?: number;
  sessionDate?: string;
  phaseId?: number;
  phaseName?: string;
  status: string;
  reportedByName: string;
  createdAt: string;
  updatedAt: string;
  findingsPreview: string;
}

export interface QAReportDetailDTO {
  id: number;
  reportType: string;
  status: string;
  classId: number;
  classCode: string;
  className: string;
  sessionId?: number;
  sessionDate?: string;
  phaseId?: number;
  phaseName?: string;
  findings: string;
  actionItems: string;
  reportedById: number;
  reportedByName: string;
  createdAt: string;
  updatedAt: string;
}

// Student Feedback Types
export interface StudentFeedbackListResponse {
  statistics: {
    totalStudents: number;
    submittedCount: number;
    notSubmittedCount: number;
    submissionRate: number;
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
  }>;
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
// Update enum definitions to match backend values
export const QAReportType = {
  CLASSROOM_OBSERVATION: "classroom_observation",
  PHASE_REVIEW: "phase_review",
  CLO_ACHIEVEMENT_ANALYSIS: "clo_achievement_analysis",
  STUDENT_FEEDBACK_ANALYSIS: "student_feedback_analysis",
  ATTENDANCE_ENGAGEMENT_REVIEW: "attendance_engagement_review",
  TEACHING_QUALITY_ASSESSMENT: "teaching_quality_assessment"
} as const

export type QAReportType = typeof QAReportType[keyof typeof QAReportType]

export const QAReportStatus = {
  DRAFT: "draft",
  SUBMITTED: "submitted"
} as const

export type QAReportStatus = typeof QAReportStatus[keyof typeof QAReportStatus]

// Helper functions for display names (Vietnamese)
export const getQAReportTypeDisplayName = (type: QAReportType): string => {
  const displayNames: Record<QAReportType, string> = {
    [QAReportType.CLASSROOM_OBSERVATION]: "Quan sát lớp học",
    [QAReportType.PHASE_REVIEW]: "Đánh giá giai đoạn",
    [QAReportType.CLO_ACHIEVEMENT_ANALYSIS]: "Phân tích CLO",
    [QAReportType.STUDENT_FEEDBACK_ANALYSIS]: "Phân tích phản hồi học viên",
    [QAReportType.ATTENDANCE_ENGAGEMENT_REVIEW]: "Đánh giá điểm danh",
    [QAReportType.TEACHING_QUALITY_ASSESSMENT]: "Đánh giá chất lượng giảng dạy"
  };
  return displayNames[type] || type;
};

export const getQAReportStatusDisplayName = (status: QAReportStatus): string => {
  const displayNames: Record<QAReportStatus, string> = {
    [QAReportStatus.DRAFT]: "Bản nháp",
    [QAReportStatus.SUBMITTED]: "Đã nộp"
  };
  return displayNames[status] || status;
};

// Options for form selects (Vietnamese)
export const qaReportTypeOptions = Object.values(QAReportType).map(type => ({
  value: type,
  label: getQAReportTypeDisplayName(type)
}));

export const qaReportStatusOptions = Object.values(QAReportStatus).map(status => ({
  value: status,
  label: getQAReportStatusDisplayName(status)
}));

// Validation helper
export const isValidQAReportType = (value: string): value is QAReportType => {
  return Object.values(QAReportType).includes(value as QAReportType);
};

export const isValidQAReportStatus = (value: string): value is QAReportStatus => {
  return Object.values(QAReportStatus).includes(value as QAReportStatus);
};