import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query'
import { classApi } from './classApi' // Import classApi to invalidate its tags

// Enrollment types based on backend DTOs
export interface StudentEnrollmentData {
  fullName: string
  email: string
  phone: string
  facebookUrl: string
  address: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  dob: string
  status: 'FOUND' | 'CREATE' | 'DUPLICATE' | 'ERROR'
  resolvedStudentId?: number
  errorMessage?: string
}

export interface EnrollmentRecommendation {
  type: 'PROCEED' | 'PARTIAL' | 'OVERFLOW' | 'BLOCKED'
  message: string
  suggestedEnrollCount?: number
}

export interface ClassEnrollmentImportPreview {
  classId: number
  className: string
  totalStudents: number
  totalValid: number
  errorCount: number
  currentEnrolled: number
  maxCapacity: number
  availableSlots: number
  students: StudentEnrollmentData[]
  recommendation: EnrollmentRecommendation
  warnings: string[]
  errors: string[]
}

export type EnrollmentStrategy = 'ALL' | 'PARTIAL' | 'OVERRIDE'

export interface ClassEnrollmentImportExecuteRequest {
  classId: number
  strategy: EnrollmentStrategy
  selectedStudentIds?: number[]
  overrideReason?: string
  students: StudentEnrollmentData[]
}

export interface EnrollmentResult {
  classId: number
  className: string
  totalAttempted: number
  successfulEnrollments: number
  failedEnrollments: number
  capacityOverride: boolean
  enrolledBy: number
  enrolledAt: string
}

// Enroll existing students request
export interface EnrollExistingStudentsRequest {
  classId: number
  studentIds: number[]
  overrideCapacity?: boolean
  overrideReason?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
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

export const enrollmentApi = createApi({
  reducerPath: 'enrollmentApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: [], // No tags - we invalidate classApi tags via onQueryStarted
  endpoints: (builder) => ({
    // Download generic Excel template
    downloadEnrollmentTemplate: builder.query<Blob, void>({
      query: () => ({
        url: '/enrollments/template',
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Download class-specific Excel template
    downloadClassEnrollmentTemplate: builder.query<Blob, { classId: number }>({
      query: ({ classId }) => ({
        url: `/enrollments/classes/${classId}/template`,
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Preview Excel import for class enrollment
    previewClassEnrollmentImport: builder.mutation<ApiResponse<ClassEnrollmentImportPreview>, { classId: number; file: File }>({
      query: ({ classId, file }) => {
        const formData = new FormData()
        formData.append('file', file)

        return {
          url: `/enrollments/classes/${classId}/import/preview`,
          method: 'POST',
          body: formData,
        }
      },
    }),

    // Execute enrollment import
    executeClassEnrollmentImport: builder.mutation<ApiResponse<EnrollmentResult>, ClassEnrollmentImportExecuteRequest>({
      query: (request) => ({
        url: `/enrollments/classes/${request.classId}/import/execute`,
        method: 'POST',
        body: request,
      }),
      // Invalidate classApi tags after successful enrollment
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          // Invalidate both ClassStudents and AvailableStudents in classApi
          dispatch(classApi.util.invalidateTags(['ClassStudents', 'AvailableStudents']))
        } catch {
          // Do nothing on error
        }
      },
    }),

    // Enroll existing students (Tab 1: Select Existing Students)
    enrollExistingStudents: builder.mutation<ApiResponse<EnrollmentResult>, EnrollExistingStudentsRequest>({
      query: (request) => ({
        url: `/enrollments/classes/${request.classId}/students`,
        method: 'POST',
        body: request,
      }),
      // Invalidate classApi tags after successful enrollment
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          // Invalidate both ClassStudents and AvailableStudents in classApi
          dispatch(classApi.util.invalidateTags(['ClassStudents', 'AvailableStudents']))
        } catch {
          // Do nothing on error
        }
      },
    }),
  }),
})

export const {
  useDownloadEnrollmentTemplateQuery,
  useDownloadClassEnrollmentTemplateQuery,
  usePreviewClassEnrollmentImportMutation,
  useExecuteClassEnrollmentImportMutation,
  useEnrollExistingStudentsMutation,
} = enrollmentApi
