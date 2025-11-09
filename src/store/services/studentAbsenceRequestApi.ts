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

export interface StudentAbsenceRequest {
  id: number
  requestType: RequestType
  status: RequestStatus
  currentClass: ClassSummary
  targetSession: SessionSummary
  requestReason: string
  note: string | null
  submittedAt: string
  submittedBy: UserSummary
  decidedAt: string | null
  decidedBy: UserSummary | null
  rejectionReason: string | null
}

export interface StudentPaginatedRequests {
  content: StudentAbsenceRequest[]
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

export interface AcademicAbsenceRequest extends StudentAbsenceRequest {
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
  content: AcademicAbsenceRequest[]
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
  content: AcademicAbsenceRequest[]
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
  status?: RequestStatus
  studentName?: string
  classCode?: string
  submittedDateFrom?: string
  submittedDateTo?: string
  page?: number
  size?: number
  sort?: string
}

export interface SubmitAbsenceRequestPayload {
  requestType: RequestType
  currentClassId: number
  targetSessionId: number
  requestReason: string
  note?: string
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

export const studentAbsenceRequestApi = createApi({
  reducerPath: 'studentAbsenceRequestApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['StudentRequests', 'PendingRequests', 'RequestDetail'],
  endpoints: (builder) => ({
    getAvailableSessions: builder.query<ApiResponse<StudentClassSessions[]>, StudentSessionQuery>({
      query: ({ date, requestType = 'ABSENCE' }) => ({
        url: '/students/me/classes/sessions',
        params: { date, requestType },
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
    getMyRequestById: builder.query<ApiResponse<StudentAbsenceRequest>, number>({
      query: (id) => ({
        url: `/students/me/requests/${id}`,
      }),
      providesTags: (result) => (result?.data ? [{ type: 'RequestDetail', id: result.data.id }] : []),
    }),
    submitAbsenceRequest: builder.mutation<ApiResponse<StudentAbsenceRequest>, SubmitAbsenceRequestPayload>({
      query: (body) => ({
        url: '/student-requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StudentRequests'],
    }),
    cancelRequest: builder.mutation<ApiResponse<StudentAbsenceRequest>, number>({
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
    getRequestDetail: builder.query<ApiResponse<AcademicAbsenceRequest>, number>({
      query: (id) => ({
        url: `/student-requests/${id}`,
      }),
      providesTags: (_result, _error, id) => [
        { type: 'RequestDetail', id },
      ],
    }),
    approveRequest: builder.mutation<ApiResponse<AcademicAbsenceRequest>, ApproveRequestPayload>({
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
    rejectRequest: builder.mutation<ApiResponse<AcademicAbsenceRequest>, RejectRequestPayload>({
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
  }),
})

export const {
  useGetAvailableSessionsQuery,
  useGetMyRequestsQuery,
  useLazyGetMyRequestsQuery,
  useGetMyRequestByIdQuery,
  useSubmitAbsenceRequestMutation,
  useCancelRequestMutation,
  useGetPendingRequestsQuery,
  useLazyGetPendingRequestsQuery,
  useGetAcademicRequestsQuery,
  useLazyGetAcademicRequestsQuery,
  useGetRequestDetailQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
} = studentAbsenceRequestApi
