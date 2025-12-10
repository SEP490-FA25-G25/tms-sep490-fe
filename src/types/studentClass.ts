// Base response interface from backend API
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Pagination response wrapper
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Class status options
export type ClassStatus = "DRAFT" | "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";

// Modality options
export type Modality = "ONLINE" | "OFFLINE";

// Enrollment status options
export type EnrollmentStatus = "ENROLLED" | "TRANSFERRED" | "DROPPED" | "COMPLETED";

// Session status options
export type SessionStatus = "PLANNED" | "CANCELLED" | "DONE";

// Session type options
export type SessionType = "CLASS" | "TEACHER_RESCHEDULE";

// Assessment kinds
export type AssessmentKind = "QUIZ" | "MIDTERM" | "FINAL" | "ASSIGNMENT" | "PROJECT" | "ORAL" | "PRACTICE" | "OTHER";

// Attendance status options
export type AttendanceStatus = "PLANNED" | "PRESENT" | "ABSENT" | "EXCUSED" | "LATE" | "MAKEUP";

// Homework status options
export type HomeworkStatus = "COMPLETED" | "INCOMPLETE" | "NO_HOMEWORK";

export interface ScheduleDetail {
  day: string;
  startTime: string;
  endTime: string;
}

export interface StudentClassDTO {
  classId: number;
  classCode: string;
  className: string;
  courseId: number;
  courseName: string;
  courseCode: string;
  branchId: number;
  branchAddress: string;
  modality: Modality;
  status: ClassStatus;
  startDate: string; // ISO date
  plannedEndDate?: string; // ISO date
  enrollmentId: number;
  enrollmentDate: string; // ISO datetime
  enrollmentStatus: EnrollmentStatus;
  totalSessions: number;
  completedSessions: number;
  scheduleSummary: string; // e.g., "T2,T4,T6 19:00-21:00"
  scheduleDetails?: ScheduleDetail[]; // Detailed schedule per day
  // Removed over-fetched fields (Phase 2 optimization):
  // - attendedSessions (expensive SUM query)
  // - attendanceRate (expensive calculation)
  // - averageScore (expensive calculation)
  // These are now available only in dedicated report endpoints
}

// Nested interfaces for ClassDetailDTO
export interface CurriculumInfo {  // Renamed from SubjectInfo
  id: number;
  code: string;
  name: string;
}

export interface LevelInfo {
  id: number;
  code: string;
  name: string;
}

export interface SubjectInfo {
  id: number;
  name: string;
  code: string;
  description?: string;
  totalHours?: number;
  numberOfSessions?: number;
  hoursPerSession?: number;
  prerequisites?: string;
  targetAudience?: string;
  curriculum?: CurriculumInfo;
  level?: LevelInfo;
}

export interface BranchInfo {
  id: number;
  name: string;
  address: string;
}

export interface TeacherSummary {
  teacherId: number;
  teacherName: string;
  teacherEmail?: string;
  isPrimaryInstructor: boolean;
}

export interface EnrollmentSummary {
  totalEnrolled: number;
  maxCapacity: number;
}

// Main DTO for class detail page
export interface ClassDetailDTO {
  id: number;
  code: string;
  name: string;
  subject: SubjectInfo;
  branch: BranchInfo;
  modality: Modality;
  startDate: string; // ISO date
  plannedEndDate?: string; // ISO date
  actualEndDate?: string; // ISO date
  scheduleDays: number[]; // [1,3,5] for T2,T4,Thứ6 (1=Thứ2, 2=Thứ3, etc.)
  maxCapacity: number;
  status: ClassStatus;
  enrollmentStatus?: EnrollmentStatus; 
  teachers: TeacherSummary[];
  scheduleSummary: string;
  scheduleDetails?: ScheduleDetail[];
  enrollmentSummary: EnrollmentSummary;
  nextSession?: SessionDTO;
}

// Session DTO for class schedule
export interface SessionDTO {
  id: number;
  classId: number;
  date: string; // ISO date
  type: SessionType;
  status: SessionStatus;
  room?: string;
  teacherNote?: string;
  startTime: string; // ISO time
  endTime: string; // ISO time
  teachers: string[];
}

// Student session DTO for attendance tracking
export interface StudentSessionDTO {
  sessionId: number;
  studentId: number;
  attendanceStatus: AttendanceStatus;
  homeworkStatus: HomeworkStatus;
  isMakeup: boolean;
  makeupSessionId?: number;
  originalSessionId?: number;
  isTransferredOut: boolean;
  note?: string;
  recordedAt?: string; // ISO datetime
}

// Combined response for class sessions
export interface ClassSessionsResponseDTO {
  upcomingSessions: SessionDTO[];
  pastSessions: SessionDTO[];
  studentSessions: StudentSessionDTO[];
}

// Assessment DTO
export interface AssessmentDTO {
  id: number;
  classId: number;
  courseAssessmentId: number;
  name: string;
  description?: string;
  kind: AssessmentKind;
  maxScore: number;
  durationMinutes?: number;
  scheduledDate: string; // ISO datetime
  actualDate?: string; // ISO datetime
  teacherName?: string;
}

// Student assessment score DTO
export interface StudentAssessmentScoreDTO {
  assessmentId: number;
  studentId: number;
  score?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string; // ISO datetime
  createdAt: string; // ISO datetime
  maxScore: number;
  isSubmitted: boolean;
  isGraded: boolean;
  scorePercentage?: number;
}

// Classmate DTO
export interface ClassmateDTO {
  studentId: number;
  fullName: string;
  avatar?: string;
  email?: string;
  studentCode: string;
  enrollmentId: number;
  enrollmentDate: string; // ISO datetime
  enrollmentStatus: EnrollmentStatus;
  attendanceRate?: number;
}

// Request parameters for API calls
export interface GetStudentClassesRequest {
  studentId: number;
  enrollmentStatus?: EnrollmentStatus[];
  classStatus?: ClassStatus[];
  branchId?: number[];
  courseId?: number[];
  modality?: Modality[];
  page?: number;
  size?: number;
  sort?: string;
  direction?: string;
}

export interface GetClassSessionsRequest {
  classId: number;
  // studentId not needed - backend gets it from JWT token via StudentContextHelper
}

export interface GetStudentScoresRequest {
  classId: number;
  studentId: number; // Required in URL path: /classes/{classId}/students/{studentId}/assessment-scores
}

// Vietnamese constants for UI
export const CLASS_STATUSES: Record<ClassStatus, string> = {
  DRAFT: 'Bản nháp',
  SCHEDULED: 'Đã lên lịch',
  ONGOING: 'Đang học',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy'
};

export const MODALITIES: Record<Modality, string> = {
  ONLINE: 'Trực tuyến',
  OFFLINE: 'Trực tiếp'
};

export const ENROLLMENT_STATUSES: Record<EnrollmentStatus, string> = {
  ENROLLED: 'Đang học',
  TRANSFERRED: 'Đã chuyển lớp',
  DROPPED: 'Đã hủy',
  COMPLETED: 'Đã hoàn thành'
};

export const SESSION_STATUSES: Record<SessionStatus, string> = {
  PLANNED: 'Đã lên lịch',
  CANCELLED: 'Đã hủy',
  DONE: 'Đã hoàn thành'
};

export const ASSESSMENT_KINDS: Record<AssessmentKind, string> = {
  QUIZ: 'Quiz',
  MIDTERM: 'Midterm',
  FINAL: 'Final',
  ASSIGNMENT: 'Assignment',
  PROJECT: 'Project',
  ORAL: 'Oral',
  PRACTICE: 'Practice',
  OTHER: 'Other'
};

export const HOMEWORK_STATUSES: Record<HomeworkStatus, string> = {
  COMPLETED: 'Đã hoàn thành',
  INCOMPLETE: 'Chưa hoàn thành',
  NO_HOMEWORK: 'Không có bài tập'
};
