import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query'

// Student types based on backend DTOs
export interface StudentListItemDTO {
  id: number
  studentCode: string
  fullName: string
  email: string
  phone: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  branchName: string
  totalEnrollments: number
  activeEnrollments: number
  lastEnrollmentDate?: string
}

export interface StudentDetailDTO {
  id: number
  studentCode: string
  fullName: string
  email: string
  phone: string
  address: string
  gender: string
  dateOfBirth: string
  status: string
  lastLoginAt?: string
  branchName: string
  branchId: number
  totalEnrollments: number
  activeEnrollments: number
  completedEnrollments: number
  firstEnrollmentDate?: string
  lastEnrollmentDate?: string
  currentClasses: StudentActiveClassDTO[]
}

export interface StudentActiveClassDTO {
  id: number
  classCode: string
  className: string
  courseName: string
  startDate: string
  plannedEndDate: string
  status: string
  attendanceRate: number
  averageScore?: number
}

export interface StudentEnrollmentHistoryDTO {
  id: number
  studentId: number
  studentCode: string
  studentName: string
  classId: number
  classCode: string
  className: string
  courseName: string
  branchName: string
  status: string
  enrolledAt: string
  leftAt?: string
  enrolledByName: string
  classStartDate: string
  classEndDate: string
  modality: string
  totalSessions: number
  attendedSessions: number
  attendanceRate: number
  averageScore?: number
}

export interface PaginationInfo {
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
}

export interface StudentListRequest {
  branchIds?: number[]
  search?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  courseId?: number
  page?: number
  size?: number
  sort?: string
  sortDir?: 'asc' | 'desc'
}

// Base query with auth
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

// Base query with token refresh logic
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
      result = await baseQuery(args, api, extraOptions)
    } else {
      api.dispatch({ type: 'auth/logout' })
    }
  }

  return result
}

export const studentApi = createApi({
  reducerPath: 'studentApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    // Get students list
    getStudents: builder.query<ApiResponse<PaginationInfo & { content: StudentListItemDTO[] }>, StudentListRequest>({
      query: (params) => ({
        url: '/students',
        method: 'GET',
        params: {
          branchIds: params.branchIds,
          search: params.search,
          status: params.status,
          courseId: params.courseId,
          page: params.page || 0,
          size: params.size || 20,
          sort: params.sort || 'fullName',
          sortDir: params.sortDir || 'asc',
        },
      }),
    }),

    // Get student detail
    getStudentDetail: builder.query<ApiResponse<StudentDetailDTO>, number>({
      query: (studentId) => ({
        url: `/students/${studentId}`,
        method: 'GET',
      }),
    }),

    // Get student enrollment history
    getStudentEnrollmentHistory: builder.query<ApiResponse<PaginationInfo & { content: StudentEnrollmentHistoryDTO[] }>, { studentId: number; branchIds?: number[]; page?: number; size?: number; sort?: string; sortDir?: string }>({
      query: ({ studentId, branchIds, page = 0, size = 20, sort = 'enrolledAt', sortDir = 'desc' }) => ({
        url: `/students/${studentId}/enrollments`,
        method: 'GET',
        params: { branchIds, page, size, sort, sortDir },
      }),
    }),
  }),
})

export const {
  useGetStudentsQuery,
  useGetStudentDetailQuery,
  useGetStudentEnrollmentHistoryQuery,
} = studentApi
