import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query'
import { classApi } from './classApi' // Import classApi to invalidate its tags

// Student types based on backend DTOs
export interface StudentListItemDTO {
  id: number
  studentCode: string
  fullName: string
  email: string
  phone: string
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | null
  branchName: string
  branchId: number
  activeEnrollments: number
  lastEnrollmentDate?: string
  canEnroll: boolean
}

export interface StudentDetailDTO {
  id: number
  studentCode: string
  fullName: string
  email: string
  phone: string
  address: string
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null
  dateOfBirth: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | null
  facebookUrl?: string
  avatarUrl?: string
  createdAt?: string
  lastLoginAt?: string
  branchName: string
  branchId: number
  totalEnrollments: number
  activeEnrollments: number
  completedEnrollments: number
  firstEnrollmentDate?: string
  lastEnrollmentDate?: string
  currentClasses: StudentActiveClassDTO[]
  skillAssessments?: SkillAssessmentDetailDTO[]
}

export interface SkillAssessmentDetailDTO {
  id: number
  skill: string
  levelCode: string
  levelName: string
  rawScore?: number
  scaledScore?: number
  scoreScale?: string
  assessmentCategory?: string
  assessmentDate: string
  assessmentType?: string
  note?: string
  assessedBy: {
    userId: number
    fullName: string
  }
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

// Student Transcript DTO
export interface StudentTranscriptDTO {
  classId: number
  classCode: string
  className: string
  courseName: string
  teacherName: string
  status: string
  averageScore?: number
  componentScores: Record<string, number>
  completedDate?: string
  totalSessions: number
  completedSessions: number
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

// Spring Boot Page response structure
export interface PageInfo {
  size: number
  number: number  // current page number (0-based)
  totalElements: number
  totalPages: number
}

export interface PageResponse<T> {
  content: T[]
  page: PageInfo
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
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  courseId?: number
  page?: number
  size?: number
  sort?: string
  sortDir?: 'asc' | 'desc'
}

// Create Student types
export interface SkillAssessmentInput {
  skill: 'GENERAL' | 'READING' | 'WRITING' | 'SPEAKING' | 'LISTENING' | 'VOCABULARY' | 'GRAMMAR' | 'KANJI'
  levelId: number
  rawScore?: number // Optional - raw score from test (e.g., 32 out of 40)
  scaledScore?: number // Optional but recommended - standardized score (e.g., 7.5 for IELTS)
  scoreScale?: string // Optional - score scale type (e.g., '0-9', '0-990', 'N1-N5')
  assessmentCategory?: string // Optional - e.g., 'PLACEMENT', 'MOCK', 'OFFICIAL', 'PRACTICE'
  note?: string
}

export interface CreateStudentRequest {
  email: string
  fullName: string
  phone?: string
  facebookUrl?: string
  address?: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  dob?: string
  branchId: number
  skillAssessments?: SkillAssessmentInput[]
}

export interface CreateStudentResponse {
  studentId: number
  studentCode: string
  userAccountId: number
  email: string
  fullName: string
  phone?: string
  gender: string
  dob?: string
  branchId: number
  branchName: string
  status: string
  defaultPassword: string
  skillAssessmentCount: number // Fixed: changed from skillAssessmentsCreated to match API response
  createdAt: string
  createdBy: {
    userId: number
    fullName: string
  }
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
  tagTypes: ['Student', 'Transcript'],
  endpoints: (builder) => ({
    // Get students list
    getStudents: builder.query<ApiResponse<PageResponse<StudentListItemDTO>>, StudentListRequest>({
      query: (params) => ({
        url: '/students',
        method: 'GET',
        params: {
          branchIds: params.branchIds,
          search: params.search,
          status: params.status,
          gender: params.gender,
          courseId: params.courseId,
          page: params.page || 0,
          size: params.size || 20,
          sort: params.sort || 'fullName',
          sortDir: params.sortDir || 'asc',
        },
      }),
      providesTags: ['Student'],
    }),

    // Get student detail
    getStudentDetail: builder.query<ApiResponse<StudentDetailDTO>, number>({
      query: (studentId) => ({
        url: `/students/${studentId}`,
        method: 'GET',
      }),
      providesTags: ['Student'],
    }),

    // Get student enrollment history
    getStudentEnrollmentHistory: builder.query<ApiResponse<PageResponse<StudentEnrollmentHistoryDTO>>, { studentId: number; branchIds?: number[]; page?: number; size?: number; sort?: string; sortDir?: string }>({
      query: ({ studentId, branchIds, page = 0, size = 20, sort = 'enrolledAt', sortDir = 'desc' }) => ({
        url: `/students/${studentId}/enrollments`,
        method: 'GET',
        params: { branchIds, page, size, sort, sortDir },
      }),
    }),

    // Create student
    createStudent: builder.mutation<ApiResponse<CreateStudentResponse>, CreateStudentRequest>({
      query: (body) => ({
        url: '/students',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Student'],
      // When student is created, available students list in ALL classes should be updated
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          // Invalidate AvailableStudents in classApi after successful student creation
          dispatch(classApi.util.invalidateTags(['AvailableStudents']))
        } catch {
          // Do nothing on error
        }
      },
    }),

    // Get student transcript
    getStudentTranscript: builder.query<ApiResponse<StudentTranscriptDTO[]>, { studentId: number }>({
      query: ({ studentId }) => ({
        url: `/students/${studentId}/transcript`,
        method: 'GET',
      }),
      providesTags: ['Transcript'],
    }),
  }),
})

export const {
  useGetStudentsQuery,
  useGetStudentDetailQuery,
  useGetStudentEnrollmentHistoryQuery,
  useCreateStudentMutation,
  useGetStudentTranscriptQuery,
} = studentApi
