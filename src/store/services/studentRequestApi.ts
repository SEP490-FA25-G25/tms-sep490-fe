import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query'
import type { RootState } from '../index'
import type { StudentClassDTO } from '@/types/academicTransfer'
import type { WeeklyScheduleData } from '@/store/services/studentScheduleApi'

// Re-export StudentSearchResult from academicTransfer
export type { StudentSearchResult } from '@/types/academicTransfer'

// Student search response interface
interface StudentSearchResponse {
  content: import('@/types/academicTransfer').StudentSearchResult[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pageable: any
  totalElements: number
}

// Student search parameters interface
interface StudentSearchParams {
  search?: string
  status?: string
  page?: number
  size?: number
}

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type RequestType = 'ABSENCE' | 'MAKEUP' | 'TRANSFER'
export type SessionModality = 'ONLINE' | 'OFFLINE'

export interface BranchOption {
  id: number
  name: string
  code?: string
  city?: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface TimeSlotRange {
  startTime: string
  endTime: string
}

export interface StudentSessionOption {
  sessionId: number
  date: string
  courseSessionNumber: number
  courseSessionTitle: string
  timeSlot: TimeSlotRange
  status: string
  type: string
  teacher: string | null
}

export interface StudentClassSessions {
  classId: number
  classCode: string
  className: string
  courseId: number
  courseName: string
  branchId: number
  branchName: string
  modality: SessionModality
  sessionCount: number
  sessions: StudentSessionOption[]
}

export interface UserSummary {
  id: number
  fullName: string
  email: string
}

export interface TeacherSummary {
  id?: number
  fullName?: string
  email?: string
}

export interface ClassSummary {
  id: number
  code: string
  name: string
  branch?: {
    id: number
    name: string
  }
  teacher?: TeacherSummary | null
}

export interface SessionSummary {
  id: number
  date: string
  dayOfWeek?: string
  courseSessionNumber: number
  courseSessionTitle: string
  timeSlot: TimeSlotRange
  status?: string
  type?: string
  teacher?: string | null
}

export interface ClassMeta {
  id?: number
  classId: number
  classCode?: string  // Some endpoints use classCode
  code?: string       // Some endpoints use code (backend MissedSessionDTO.ClassInfo)
  className?: string
  name?: string
  branchId?: number
  branchName?: string
  modality?: SessionModality
  availableSlots?: number
  maxCapacity?: number
}

export interface TimeSlotInfo extends TimeSlotRange {
  slotId?: number
  slotName?: string
}

export interface MissedSession {
  sessionId: number
  date: string
  daysAgo: number
  courseSessionNumber: number
  courseSessionTitle: string
  courseSessionId: number
  classInfo: ClassMeta
  timeSlotInfo: TimeSlotInfo
  attendanceStatus: string
  hasExistingMakeupRequest: boolean
  isExcusedAbsence: boolean
  absenceRequestId?: number
  absenceRequestStatus?: RequestStatus
}

export interface MissedSessionsResponse {
  studentId?: number
  totalCount: number
  missedSessions?: MissedSession[]
  sessions?: MissedSession[]
}

export type MakeupPriority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface MakeupMatchScore {
  branchMatch: boolean
  modalityMatch: boolean
  capacityOk?: boolean
  dateProximityScore?: number
  totalScore: number
  priority: MakeupPriority
}

export interface MakeupOption {
  sessionId: number
  date: string
  dayOfWeek?: string
  classInfo: ClassMeta
  timeSlotInfo: TimeSlotInfo
  availableSlots: number
  maxCapacity: number
  teacher?: string | null
  warnings?: string[]
  conflict?: boolean
  matchScore: MakeupMatchScore
}

export interface MakeupOptionsResponse {
  targetSessionId: number
  targetSession: MissedSession
  makeupOptions: MakeupOption[]
  totalOptions: number
}

export interface StudentRequest {
  id: number
  requestType: RequestType
  status: RequestStatus
  currentClass: ClassSummary
  targetClass?: ClassSummary | null // For TRANSFER requests only
  targetSession: SessionSummary
  makeupSession?: (SessionSummary & { classInfo?: ClassMeta }) | null
  effectiveDate?: string | null // For TRANSFER requests - date when transfer takes effect
  requestReason: string // Student's reason for the request
  note: string | null // AA's decision note (approve/reject reason)
  submittedAt: string
  submittedBy: UserSummary
  decidedAt: string | null
  decidedBy: UserSummary | null
}

export interface StudentPaginatedRequests {
  content: StudentRequest[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
  summary?: StudentRequestSummary
}

export interface StudentRequestSummary {
  totalRequests: number
  pending: number
  approved: number
  rejected: number
  cancelled: number
  absenceRate?: number
}

export interface AcademicStudentInfo {
  id: number
  studentCode: string
  fullName: string
  email: string
  phone: string
}

export interface StudentAbsenceStats {
  totalAbsences: number
  totalSessions: number
  absenceRate: number
  excusedAbsences: number
  unexcusedAbsences: number
}

export interface PreviousRequestStats {
  totalRequests: number
  approvedRequests: number
  rejectedRequests: number
  cancelledRequests: number
}

export interface AcademicRequestAdditionalInfo {
  daysUntilSession?: number
  studentAbsenceStats?: StudentAbsenceStats
  previousRequests?: PreviousRequestStats
}

export interface AcademicStudentRequest extends StudentRequest {
  student: AcademicStudentInfo
  daysUntilSession?: number
  studentAbsenceRate?: number
  additionalInfo?: AcademicRequestAdditionalInfo
}

export interface PendingRequestsSummary {
  totalPending: number
  needsUrgentReview: number
  absenceRequests: number
  makeupRequests: number
  transferRequests: number
}

export interface PendingRequestsResponse {
  content: AcademicStudentRequest[]
  pageable: {
    pageNumber: number
    pageSize: number
  }
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  summary: PendingRequestsSummary
}

export interface AcademicRequestsResponse {
  content: AcademicStudentRequest[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

export interface StudentSessionQuery {
  date: string
  requestType?: RequestType
}

export interface StudentMonthSessionQuery {
  month: string
  requestType?: RequestType
}

export interface StudentRequestsQuery {
  requestType?: RequestType
  status?: RequestStatus
  search?: string
  page?: number
  size?: number
  sort?: string
}

export interface PendingRequestsQuery {
  branchId?: number
  requestType?: RequestType
  keyword?: string // Search by student name, student code, or class code
  sessionDateFrom?: string
  sessionDateTo?: string
  page?: number
  size?: number
  sort?: string
  urgentOnly?: boolean
}

export interface AcademicHistoryQuery {
  requestType?: RequestType
  status?: RequestStatus
  keyword?: string // Search by student name, student code, or class code
  decidedBy?: number
  submittedDateFrom?: string
  submittedDateTo?: string
  page?: number
  size?: number
  sort?: string
}

export interface AAStaffDTO {
  id: number
  fullName: string
  email: string
}

export interface StudentRequestConfig {
  makeupWeeksLimit: number
  makeupLookbackWeeks: number
  maxTransfersPerCourse: number
}

export interface MissedSessionsQuery {
  weeksBack?: number
  excludeRequested?: boolean
}

export interface AcademicMissedSessionsQuery extends MissedSessionsQuery {
  studentId: number
}

export interface MakeupOptionsQuery {
  targetSessionId: number
}

export interface AcademicMakeupOptionsQuery extends MakeupOptionsQuery {
  studentId: number
}

export interface AcademicWeeklyScheduleQuery {
  studentId: number
  weekStart?: string
  classId?: number
}

export interface SubmitStudentRequestPayload {
  requestType: RequestType
  currentClassId: number
  targetSessionId: number
  makeupSessionId?: number
  requestReason: string
  note?: string
  studentId?: number
}

export interface SubmitOnBehalfRequestPayload extends SubmitStudentRequestPayload {
  studentId: number
}

export interface ApproveRequestPayload {
  id: number
  note?: string
}

export interface RejectRequestPayload {
  id: number
  note: string // Rejection reason stored in note field
}

// Transfer Request Types
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
  branchId?: number
  branchName: string
  modality?: SessionModality
  learningMode?: SessionModality
  enrollmentStatus?: string
  enrollmentDate?: string
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

export interface ContentGapAnalysis {
  gapLevel: 'NONE' | 'MINOR' | 'MODERATE' | 'MAJOR'
  missedSessions: number
  totalSessions: number
  gapSessions: ContentGapSession[]
  recommendedActions?: string[]
  impactDescription?: string
}

export interface TransferOption {
  classId: number
  classCode: string
  className: string
  branchId: number
  branchName: string
  modality: SessionModality
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
  contentGapAnalysis?: ContentGapAnalysis
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

export interface CurrentClassInfo {
  id: number
  code: string
  name: string
  courseId: number
  branchId: number
  branchName: string
  modality: SessionModality
  currentSession: number
}

export interface TransferCriteriaSummary {
  branchChange: boolean
  modalityChange: boolean
  scheduleChange: boolean
}

export interface TransferOptionsResponse {
  currentClass: CurrentClassInfo
  transferCriteria?: TransferCriteriaSummary
  availableClasses: TransferOption[]
}

export interface TransferSession {
  sessionId: number
  courseSessionNumber: number
}

export interface TransferRequestPayload {
  currentClassId: number
  targetClassId: number
  effectiveDate: string
  sessionId: number
  requestReason: string
  note?: string
}

export interface TransferOnBehalfPayload extends TransferRequestPayload {
  studentId: number
}

export interface TransferRequestResponse {
  id: number
  student: UserSummary
  requestType: RequestType
  currentClass: ClassSummary
  targetClass: ClassSummary
  effectiveDate: string
  effectiveSession: TransferSession
  requestReason: string
  status: RequestStatus
  submittedAt: string
  submittedBy: UserSummary
  decidedAt?: string
  decidedBy?: UserSummary
}

export interface AcademicTransferOptionsQuery {
  currentClassId: number
  targetBranchId?: number
  targetModality?: SessionModality
  scheduleOnly?: boolean
}

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

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

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
      const authData = refreshResult.data as {
        data?: {
          accessToken: string
          refreshToken: string
          userId: number
          email: string
          fullName: string
          roles: string[]
        }
      }

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

        result = await baseQuery(args, api, extraOptions)
      } else {
        api.dispatch({ type: 'auth/logout' })
      }
    } else {
      api.dispatch({ type: 'auth/logout' })
    }
  }

  return result
}

export const studentRequestApi = createApi({
  reducerPath: 'studentRequestApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['StudentRequests', 'PendingRequests', 'RequestDetail', 'AAStaff'],
  endpoints: (builder) => ({
    // Student request configuration - /api/v1/students-request/config
    getStudentRequestConfig: builder.query<ApiResponse<StudentRequestConfig>, void>({
      query: () => '/students-request/config',
    }),

    // Student-specific endpoints - /api/v1/students-request
    getAvailableSessions: builder.query<ApiResponse<StudentClassSessions[]>, StudentSessionQuery>({
      query: ({ date, requestType = 'ABSENCE' }) => ({
        url: '/students-request/classes/sessions',
        params: { date, requestType },
      }),
    }),
    getAvailableSessionsByMonth: builder.query<ApiResponse<StudentClassSessions[]>, StudentMonthSessionQuery>({
      query: ({ month, requestType = 'ABSENCE' }) => ({
        url: '/students-request/classes/sessions/month',
        params: { month, requestType },
      }),
    }),
    getMissedSessions: builder.query<ApiResponse<MissedSessionsResponse>, MissedSessionsQuery | void>({
      query: (params) => {
        if (!params) {
          return '/students-request/missed-sessions'
        }
        return {
          url: '/students-request/missed-sessions',
          params,
        }
      },
    }),
    getMakeupOptions: builder.query<ApiResponse<MakeupOptionsResponse>, MakeupOptionsQuery>({
      query: ({ targetSessionId }) => ({
        url: '/students-request/makeup-options',
        params: { targetSessionId },
      }),
    }),
    getMyRequests: builder.query<ApiResponse<StudentPaginatedRequests>, StudentRequestsQuery | void>({
      query: (params) => {
        if (!params) {
          return '/students-request/requests'
        }
        return {
          url: '/students-request/requests',
          params,
        }
      },
      providesTags: ['StudentRequests'],
    }),
    getMyRequestById: builder.query<ApiResponse<StudentRequest>, number>({
      query: (id) => ({
        url: `/students-request/requests/${id}`,
      }),
      providesTags: (result) => (result?.data ? [{ type: 'RequestDetail', id: result.data.id }] : []),
    }),
    submitStudentRequest: builder.mutation<ApiResponse<StudentRequest>, SubmitStudentRequestPayload>({
      query: (body) => ({
        url: '/student-requests-submission',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StudentRequests'],
    }),
    cancelRequest: builder.mutation<ApiResponse<StudentRequest>, number>({
      query: (id) => ({
        url: `/students-request/requests/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['StudentRequests'],
    }),
    // Transfer Request Endpoints (Student)
    getTransferEligibility: builder.query<ApiResponse<TransferEligibilityResponse>, void>({
      query: () => '/students-request/transfer-eligibility',
    }),
    getTransferOptions: builder.query<ApiResponse<TransferOptionsResponse>, { currentClassId: number }>({
      query: ({ currentClassId }) => ({
        url: '/students-request/transfer-options',
        params: { currentClassId },
      }),
    }),
    submitTransferRequest: builder.mutation<ApiResponse<TransferRequestResponse>, TransferRequestPayload>({
      query: (body) => ({
        url: '/students-request/transfer-requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StudentRequests'],
    }),

    // Academic Affairs endpoints - /api/v1/academic-requests
    getPendingRequests: builder.query<ApiResponse<PendingRequestsResponse>, PendingRequestsQuery | void>({
      query: (params) => {
        if (!params) {
          return '/academic-requests/pending'
        }
        return {
          url: '/academic-requests/pending',
          params,
        }
      },
      providesTags: ['PendingRequests'],
    }),
    getStudentMissedSessions: builder.query<ApiResponse<MissedSessionsResponse>, AcademicMissedSessionsQuery>({
      query: ({ studentId, ...params }) => ({
        url: `/academic-requests/students/${studentId}/missed-sessions`,
        params,
      }),
    }),
    getStudentMakeupOptions: builder.query<ApiResponse<MakeupOptionsResponse>, AcademicMakeupOptionsQuery>({
      query: ({ studentId, targetSessionId }) => ({
        url: `/academic-requests/makeup-options`,
        params: { studentId, targetSessionId },
      }),
    }),
    getAcademicWeeklySchedule: builder.query<ApiResponse<WeeklyScheduleData>, AcademicWeeklyScheduleQuery>({
      query: ({ studentId, weekStart, classId }) => {
        const params: Record<string, string | number> = {}
        if (weekStart) {
          params.weekStart = weekStart
        }
        if (typeof classId === 'number') {
          params.classId = classId
        }
        return {
          url: `/academic-requests/students/${studentId}/schedule`,
          params: Object.keys(params).length ? params : undefined,
        }
      },
    }),
    getAcademicRequests: builder.query<ApiResponse<AcademicRequestsResponse>, AcademicHistoryQuery | void>({
      query: (params) => {
        if (!params) {
          return '/academic-requests'
        }
        return {
          url: '/academic-requests',
          params,
        }
      },
      providesTags: ['PendingRequests'],
    }),
    getAAStaff: builder.query<ApiResponse<AAStaffDTO[]>, void>({
      query: () => '/academic-requests/staff',
      providesTags: ['AAStaff'],
    }),
    getRequestDetail: builder.query<ApiResponse<AcademicStudentRequest>, number>({
      query: (id) => ({
        url: `/academic-requests/${id}`,
      }),
      providesTags: (_result, _error, id) => [
        { type: 'RequestDetail', id },
      ],
    }),
    approveRequest: builder.mutation<ApiResponse<AcademicStudentRequest>, ApproveRequestPayload>({
      query: ({ id, note }) => ({
        url: `/academic-requests/${id}/approve`,
        method: 'PUT',
        body: { note },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        'PendingRequests',
        'StudentRequests',
        { type: 'RequestDetail', id },
      ],
    }),
    rejectRequest: builder.mutation<ApiResponse<AcademicStudentRequest>, RejectRequestPayload>({
      query: ({ id, note }) => ({
        url: `/academic-requests/${id}/reject`,
        method: 'PUT',
        body: { note },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        'PendingRequests',
        'StudentRequests',
        { type: 'RequestDetail', id },
      ],
    }),
    createOnBehalfRequest: builder.mutation<
      ApiResponse<AcademicStudentRequest>,
      SubmitOnBehalfRequestPayload
    >({
      query: (body) => ({
        url: '/academic-requests/on-behalf',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PendingRequests', 'StudentRequests'],
    }),
    submitAbsenceOnBehalf: builder.mutation<ApiResponse<StudentRequest>, SubmitOnBehalfRequestPayload>({
      query: (body) => ({
        url: '/academic-requests/absence/on-behalf',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PendingRequests', 'StudentRequests'],
    }),
    // AA Transfer Endpoints
    getAcademicTransferEligibility: builder.query<ApiResponse<TransferEligibilityResponse>, { studentId: number }>({
      query: ({ studentId }) => ({
        url: `/academic-requests/students/${studentId}/transfer-eligibility`,
      }),
    }),
    getAcademicTransferOptions: builder.query<ApiResponse<TransferOptionsResponse>, AcademicTransferOptionsQuery>({
      query: ({ currentClassId, targetBranchId, targetModality, scheduleOnly }) => {
        const params: Record<string, string | number | boolean> = { currentClassId }

        if (typeof targetBranchId === 'number') {
          params.targetBranchId = targetBranchId
        }

        if (targetModality) {
          params.targetModality = targetModality
        }

        if (scheduleOnly) {
          params.scheduleOnly = scheduleOnly
        }

        return {
          url: '/academic-requests/transfer-options',
          params,
        }
      },
    }),
    submitTransferOnBehalf: builder.mutation<ApiResponse<TransferRequestResponse>, TransferOnBehalfPayload>({
      query: (body) => ({
        url: '/academic-requests/transfer/on-behalf',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PendingRequests', 'StudentRequests'],
    }),

    // Student Classes API for AA - /api/v1/students
    // Backend trả về Page<StudentClassDTO> với pagination structure
    getStudentClasses: builder.query<ApiResponse<{ content: StudentClassDTO[]; totalElements: number }>, { studentId: number }>({
      query: ({ studentId }) => ({
        url: `/students/${studentId}/classes`,
      }),
    }),
    // Student search for AA - /api/v1/students
    searchStudents: builder.query<ApiResponse<StudentSearchResponse>, StudentSearchParams>({
      query: (params) => ({
        url: '/students',
        params,
      }),
    }),
    // Branch list for transfer filters
    getBranches: builder.query<ApiResponse<BranchOption[]>, { excludeId?: number } | void>({
      query: (params) => ({
        url: '/branches',
        params: params?.excludeId ? { excludeId: params.excludeId } : undefined,
      }),
    }),
  }),
})

export const {
  useGetStudentRequestConfigQuery,
  useGetAvailableSessionsQuery,
  useGetMissedSessionsQuery,
  useLazyGetMissedSessionsQuery,
  useGetMakeupOptionsQuery,
  useLazyGetMakeupOptionsQuery,
  useGetAvailableSessionsByMonthQuery,
  useGetMyRequestsQuery,
  useLazyGetMyRequestsQuery,
  useGetMyRequestByIdQuery,
  useSubmitStudentRequestMutation,
  useCancelRequestMutation,
  // Academic Affairs endpoints
  useGetPendingRequestsQuery,
  useLazyGetPendingRequestsQuery,
  useGetStudentMissedSessionsQuery,
  useGetStudentMakeupOptionsQuery,
  useGetAcademicWeeklyScheduleQuery,
  useGetAcademicRequestsQuery,
  useLazyGetAcademicRequestsQuery,
  useGetRequestDetailQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
  useCreateOnBehalfRequestMutation,
  useSubmitAbsenceOnBehalfMutation,
  // Transfer Request Hooks
  useGetTransferEligibilityQuery,
  useGetTransferOptionsQuery,
  useSubmitTransferRequestMutation,
  // Academic Affairs Transfer Hooks
  useGetAcademicTransferEligibilityQuery,
  useGetAcademicTransferOptionsQuery,
  useSubmitTransferOnBehalfMutation,
  // Student Classes Hooks for AA
  useGetStudentClassesQuery,
  useSearchStudentsQuery,
  useGetBranchesQuery,
  useGetAAStaffQuery,
} = studentRequestApi
