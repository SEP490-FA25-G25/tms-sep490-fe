import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query'
import type { RootState } from '../index'

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type RequestType = 'ABSENCE' | 'MAKEUP' | 'TRANSFER'
export type SessionModality = 'ONLINE' | 'OFFLINE' | 'HYBRID'

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

export interface ClassSummary {
  id: number
  code: string
  name: string
  branch?: {
    id: number
    name: string
  }
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
  classId: number
  classCode: string
  className?: string
  branchId?: number
  branchName?: string
  modality?: SessionModality
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
  missedSessions: MissedSession[]
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
  targetSession: SessionSummary
  makeupSession?: (SessionSummary & { classInfo?: ClassMeta }) | null
  requestReason: string
  note: string | null
  submittedAt: string
  submittedBy: UserSummary
  decidedAt: string | null
  decidedBy: UserSummary | null
  rejectionReason: string | null
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

export interface AcademicStudentRequest extends StudentRequest {
  student: AcademicStudentInfo
  daysUntilSession?: number
  studentAbsenceRate?: number
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

export interface StudentRequestsQuery {
  requestType?: RequestType
  status?: RequestStatus
  page?: number
  size?: number
  sort?: string
}

export interface PendingRequestsQuery {
  branchId?: number
  requestType?: RequestType
  studentName?: string
  classCode?: string
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
  studentName?: string
  classCode?: string
  submittedDateFrom?: string
  submittedDateTo?: string
  page?: number
  size?: number
  sort?: string
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
  rejectionReason: string
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
  tagTypes: ['StudentRequests', 'PendingRequests', 'RequestDetail'],
  endpoints: (builder) => ({
    getAvailableSessions: builder.query<ApiResponse<StudentClassSessions[]>, StudentSessionQuery>({
      query: ({ date, requestType = 'ABSENCE' }) => ({
        url: '/students/me/classes/sessions',
        params: { date, requestType },
      }),
    }),
    getMissedSessions: builder.query<ApiResponse<MissedSessionsResponse>, MissedSessionsQuery | void>({
      query: (params) => {
        if (!params) {
          return '/students/me/missed-sessions'
        }
        return {
          url: '/students/me/missed-sessions',
          params,
        }
      },
    }),
    getMakeupOptions: builder.query<ApiResponse<MakeupOptionsResponse>, MakeupOptionsQuery>({
      query: ({ targetSessionId }) => ({
        url: '/students/me/makeup-options',
        params: { targetSessionId },
      }),
    }),
    getMyRequests: builder.query<ApiResponse<StudentPaginatedRequests>, StudentRequestsQuery | void>({
      query: (params) => {
        if (!params) {
          return '/students/me/requests'
        }
        return {
          url: '/students/me/requests',
          params,
        }
      },
      providesTags: ['StudentRequests'],
    }),
    getMyRequestById: builder.query<ApiResponse<StudentRequest>, number>({
      query: (id) => ({
        url: `/students/me/requests/${id}`,
      }),
      providesTags: (result) => (result?.data ? [{ type: 'RequestDetail', id: result.data.id }] : []),
    }),
    submitStudentRequest: builder.mutation<ApiResponse<StudentRequest>, SubmitStudentRequestPayload>({
      query: (body) => ({
        url: '/student-requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StudentRequests'],
    }),
    cancelRequest: builder.mutation<ApiResponse<StudentRequest>, number>({
      query: (id) => ({
        url: `/students/me/requests/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['StudentRequests'],
    }),
    getPendingRequests: builder.query<ApiResponse<PendingRequestsResponse>, PendingRequestsQuery | void>({
      query: (params) => {
        if (!params) {
          return '/student-requests/pending'
        }
        return {
          url: '/student-requests/pending',
          params,
        }
      },
      providesTags: ['PendingRequests'],
    }),
    getStudentMissedSessions: builder.query<ApiResponse<MissedSessionsResponse>, AcademicMissedSessionsQuery>({
      query: ({ studentId, ...params }) => ({
        url: `/students/${studentId}/missed-sessions`,
        params,
      }),
    }),
    getStudentMakeupOptions: builder.query<ApiResponse<MakeupOptionsResponse>, AcademicMakeupOptionsQuery>({
      query: ({ studentId, targetSessionId }) => ({
        url: `/students/${studentId}/makeup-options`,
        params: { targetSessionId },
      }),
    }),
    getAcademicRequests: builder.query<ApiResponse<AcademicRequestsResponse>, AcademicHistoryQuery | void>({
      query: (params) => {
        if (!params) {
          return '/student-requests'
        }
        return {
          url: '/student-requests',
          params,
        }
      },
      providesTags: ['PendingRequests'],
    }),
    getRequestDetail: builder.query<ApiResponse<AcademicStudentRequest>, number>({
      query: (id) => ({
        url: `/student-requests/${id}`,
      }),
      providesTags: (_result, _error, id) => [
        { type: 'RequestDetail', id },
      ],
    }),
    approveRequest: builder.mutation<ApiResponse<AcademicStudentRequest>, ApproveRequestPayload>({
      query: ({ id, note }) => ({
        url: `/student-requests/${id}/approve`,
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
      query: ({ id, rejectionReason }) => ({
        url: `/student-requests/${id}/reject`,
        method: 'PUT',
        body: { rejectionReason },
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
        url: '/student-requests/on-behalf',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PendingRequests', 'StudentRequests'],
    }),
  }),
})

export const {
  useGetAvailableSessionsQuery,
  useGetMissedSessionsQuery,
  useLazyGetMissedSessionsQuery,
  useGetMakeupOptionsQuery,
  useLazyGetMakeupOptionsQuery,
  useGetMyRequestsQuery,
  useLazyGetMyRequestsQuery,
  useGetMyRequestByIdQuery,
  useSubmitStudentRequestMutation,
  useCancelRequestMutation,
  useGetStudentMissedSessionsQuery,
  useGetStudentMakeupOptionsQuery,
  useGetPendingRequestsQuery,
  useLazyGetPendingRequestsQuery,
  useGetAcademicRequestsQuery,
  useLazyGetAcademicRequestsQuery,
  useGetRequestDetailQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
  useCreateOnBehalfRequestMutation,
} = studentRequestApi
