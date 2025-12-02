import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query'

// Teacher summary DTO for classes
export interface TeacherSummaryDTO {
  id: number // User account ID
  teacherId: number // Teacher entity ID
  fullName: string
  email: string
  phone: string
  employeeCode: string
  sessionCount: number // Number of sessions this teacher teaches
}

// Types based on backend ClassListItemDTO
export interface ClassListItemDTO {
  id: number
  code: string
  name: string
  courseName: string
  courseCode: string
  branchName: string
  branchCode: string
  modality: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  startDate: string // LocalDate from backend
  plannedEndDate: string // LocalDate from backend
  status: 'DRAFT' | 'SUBMITTED' | 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  maxCapacity: number
  currentEnrolled: number
  availableSlots: number
  utilizationRate: number
  teachers: TeacherSummaryDTO[] // Changed from teacherName to teachers array
  scheduleSummary?: string
  canEnrollStudents: boolean
  enrollmentRestrictionReason?: string
}

export interface Branch {
  id: number
  name: string
  address: string
  phone: string
  email: string
  status: 'ACTIVE' | 'INACTIVE'
}

export interface Subject {
  id: number
  name: string
  code: string
  description: string
  status: 'ACTIVE' | 'INACTIVE'
}

export interface Teacher {
  id: number
  fullName: string
  email: string
  phone: string
  specializations: string[]
  status: 'ACTIVE' | 'INACTIVE'
}

export interface ClassSession {
  id: number
  date: string
  startTime: string
  endTime: string
  room: string
  topic: string
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
}

export interface Student {
  id: number
  fullName: string
  email: string
  phone: string
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'DROPPED'
  enrollDate: string
}

export interface Class {
  id: number
  name: string
  code: string
  subject: Subject
  teacher: Teacher
  branch: Branch
  room: string
  schedule: string
  startDate: string
  endDate: string
  maxStudents: number
  currentStudents: number
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  sessions: ClassSession[]
  students: Student[]
  createdAt: string
  updatedAt: string
}

export interface ClassListRequest {
  page?: number
  size?: number // Backend uses 'size' instead of 'limit'
  branchIds?: number[] // Backend expects list of branch IDs
  courseId?: number // Backend uses courseId instead of subjectId
  status?: 'DRAFT' | 'SUBMITTED' | 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' // NEW: Filter by class status
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' // NEW: Filter by approval status
  modality?: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  search?: string
  sort?: string // Sort field
  sortDir?: 'asc' | 'desc'
}

export interface PaginationInfo {
  size: number
  number: number // Current page number (0-indexed)
  totalElements: number
  totalPages: number
}

export interface PagedResponse<T> {
  content: T[]
  page: PaginationInfo
}

export interface ClassListResponse {
  success: boolean
  message: string
  data: PagedResponse<ClassListItemDTO>
}

export interface ClassDetailResponse {
  success: boolean
  message: string
  data: ClassDetailDTO
}

// Nested interfaces for ClassDetailDTO
export interface CourseDTO {
  id: number
  code: string
  name: string
  description: string
  totalHours: number
  durationWeeks: number
  sessionPerWeek: number
}

export interface BranchDTO {
  id: number
  code: string
  name: string
  address: string
  phone: string
  email: string
}

export interface EnrollmentSummary {
  currentEnrolled: number
  maxCapacity: number
  availableSlots: number
  utilizationRate: number
  canEnrollStudents: boolean
  enrollmentRestrictionReason?: string
}

export interface SessionDTO {
  id: number
  date: string // LocalDate from backend
  startTime: string
  endTime: string
  teachers: TeacherSummaryDTO[] // List of teachers for this session
  room: string
  status: string
  type: string
}

export interface ClassDetailDTO {
  id: number
  code: string
  name: string
  course: CourseDTO
  branch: BranchDTO
  modality: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  startDate: string // LocalDate from backend
  plannedEndDate: string // LocalDate from backend
  actualEndDate?: string // LocalDate from backend
  scheduleDays: number[] // Short[] from backend
  maxCapacity: number
  status: 'DRAFT' | 'SUBMITTED' | 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  rejectionReason?: string
  submittedAt?: string | null // LocalDate from backend
  decidedAt?: string | null // LocalDate from backend
  decidedByName?: string
  room: string
  teachers: TeacherSummaryDTO[] // List of all teachers teaching this class
  scheduleSummary: string
  enrollmentSummary: EnrollmentSummary
  upcomingSessions: SessionDTO[]
}

export interface ClassStudentDTO {
  id: number
  studentId: number
  studentCode: string
  fullName: string
  email: string
  phone: string
  avatarUrl?: string
  branchName: string
  enrolledAt: string // OffsetDateTime from backend
  enrolledBy: string
  enrolledById: number
  status: string // EnrollmentStatus enum
  joinSessionId?: number
  joinSessionDate?: string
  capacityOverride?: boolean
  overrideReason?: string
}

export interface ClassStudentsResponse {
  success: boolean
  message: string
  data: PagedResponse<ClassStudentDTO>
}

// New nested DTOs for enhanced assessment data
export interface SkillAssessmentDTO {
  id: number
  skill: 'READING' | 'WRITING' | 'SPEAKING' | 'LISTENING' | 'GENERAL'
  level: LevelInfoDTO
  score: number
  assessmentDate: string
  assessmentType: string
  note?: string
  assessedBy: AssessorDTO
}

export interface LevelInfoDTO {
  id: number
  code: string
  name: string
  subject: SubjectInfoDTO
  expectedDurationHours: number
  description: string
}

export interface SubjectInfoDTO {
  id: number
  name: string
}

export interface AssessorDTO {
  id: number
  fullName: string
}

export interface ClassMatchInfoDTO {
  matchPriority: number
  matchingSkill: string
  matchingLevel: {
    id: number
    code: string
    name: string
  }
  matchReason: string
}

// Available student for enrollment
export interface AvailableStudentDTO {
  id: number
  studentCode: string
  fullName: string
  email: string
  phone: string
  avatarUrl?: string
  branchId: number
  branchName: string
  activeEnrollments: number
  canEnroll: boolean
  replacementSkillAssessments: SkillAssessmentDTO[]
  classMatchInfo: ClassMatchInfoDTO

  // Legacy fields for backward compatibility
  lastAssessmentDate?: string
  lastAssessmentSubject?: string
  lastAssessmentLevel?: string
  matchPriority: number // 1=Perfect, 2=Partial, 3=None
  matchReason: string
}

export interface AvailableStudentsResponse {
  success: boolean
  message: string
  data: PagedResponse<AvailableStudentDTO>
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
}

// Reuse the same base query with token injection and refresh logic from authApi
const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

// Base query with token refresh logic (same as authApi)
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  // Handle 401 Unauthorized - try to refresh token
  if (result.error && result.error.status === 401) {
    const refreshResult = await baseQuery(
      {
        url: '/auth/refresh',
        method: 'POST',
        body: {
          refreshToken: (api.getState() as RootState).auth.refreshToken,
        },
      },
      api,
      extraOptions
    )

    if (refreshResult.data) {
      // Update auth state with new tokens
      const authData = refreshResult.data as { data?: { accessToken: string; refreshToken: string; userId: number; email: string; fullName: string; roles: string[] } }
      if (authData?.data) {
        api.dispatch({
          type: 'auth/setCredentials',
          payload: {
            accessToken: authData.data.accessToken,
            refreshToken: authData.data.refreshToken,
            user: {
              id: authData.data.userId,
              email: authData.data.email,
              fullName: authData.data.fullName,
              roles: authData.data.roles,
            },
          },
        })
      }

      // Retry the original request with new token
      result = await baseQuery(args, api, extraOptions)
    } else {
      // Refresh failed, logout user
      api.dispatch({ type: 'auth/logout' })
    }
  }

  return result
}

export interface ApproveClassResponse {
  success: boolean
  message: string
  data: string
}

export interface RejectClassResponse {
  success: boolean
  message: string
  data: {
    classId: number
    classCode: string
    rejectedAt: string
    rejectedBy: string
    reason: string
    status: 'DRAFT'
    approvalStatus: 'REJECTED'
  }
}

export const classApi = createApi({
  reducerPath: 'classApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Classes', 'ClassStudents', 'AvailableStudents'],
  endpoints: (builder) => ({
    // Get classes with filtering and pagination
    getClasses: builder.query<ClassListResponse, ClassListRequest>({
      query: (params) => ({
        url: '/classes',
        method: 'GET',
        params: {
          page: params.page || 0,
          size: params.size || 20,
          branchIds: params.branchIds,
          courseId: params.courseId,
          status: params.status, // NEW: Class status filter
          approvalStatus: params.approvalStatus, // NEW: Approval status filter
          modality: params.modality,
          search: params.search,
          sort: params.sort || 'startDate',
          sortDir: params.sortDir || 'asc',
        },
      }),
      providesTags: ['Classes'],
    }),

    // Get class details by ID
    getClassById: builder.query<ClassDetailResponse, number>({
      query: (id) => ({
        url: `/classes/${id}`,
        method: 'GET',
      }),
      providesTags: ['ClassStudents'],
    }),

    // Get students in a class
    getClassStudents: builder.query<ClassStudentsResponse, { classId: number; search?: string; page?: number; size?: number; sort?: string; sortDir?: string }>({
      query: ({ classId, search, page = 0, size = 20, sort = 'enrolledAt', sortDir = 'desc' }) => ({
        url: `/classes/${classId}/students`,
        method: 'GET',
        params: { search, page, size, sort, sortDir },
      }),
      providesTags: ['ClassStudents'],
    }),

    // Get available students for enrollment in a class
    getAvailableStudents: builder.query<AvailableStudentsResponse, { classId: number; search?: string; page?: number; size?: number; sort?: string; sortDir?: string }>({
      query: ({ classId, search, page = 0, size = 20, sort = 'matchPriority', sortDir = 'asc' }) => ({
        url: `/classes/${classId}/available-students`,
        method: 'GET',
        params: { search, page, size, sort, sortDir },
      }),
      providesTags: ['AvailableStudents'],
    }),

    approveClass: builder.mutation<ApproveClassResponse, number>({
      query: (classId) => ({
        url: `/classes/${classId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Classes'],
    }),

    rejectClass: builder.mutation<RejectClassResponse, { classId: number; reason: string }>({
      query: ({ classId, reason }) => ({
        url: `/classes/${classId}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Classes'],
    }),

    deleteClass: builder.mutation<{ success: boolean; message: string }, number>({
      query: (classId) => ({
        url: `/classes/${classId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Classes'],
    }),

    // Get sessions with attendance and homework metrics
    getClassSessionsWithMetrics: builder.query<
      ApiResponse<import('@/types/qa').QASessionListResponse>,
      number
    >({
      query: (classId) => ({
        url: `/classes/${classId}/sessions/metrics`,
        method: 'GET',
      }),
      providesTags: ['Classes'],
    }),
  }),
})

// Export hooks for usage in components
export const {
  useGetClassesQuery,
  useGetClassByIdQuery,
  useGetClassStudentsQuery,
  useGetAvailableStudentsQuery,
  useApproveClassMutation,
  useRejectClassMutation,
  useDeleteClassMutation,
  useGetClassSessionsWithMetricsQuery,
  util: { invalidateTags: invalidateClassApiTags },
} = classApi
