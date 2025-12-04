import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Types
export interface BranchPublicDTO {
  id: number
  name: string
  address?: string
}

export interface CoursePublicDTO {
  id: number
  name: string
  code: string
}

export interface ConsultationRegistrationRequest {
  fullName: string
  email: string
  phone: string
  branchId: number
  courseId?: number
  message?: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

// Public API - No authentication required
export const publicApi = createApi({
  reducerPath: 'publicApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1/public',
  }),
  tagTypes: ['PublicBranch', 'PublicCourse'],
  endpoints: (builder) => ({
    // Get public branches for dropdown
    getPublicBranches: builder.query<ApiResponse<BranchPublicDTO[]>, void>({
      query: () => '/branches',
      providesTags: ['PublicBranch'],
    }),

    // Get public courses for dropdown
    getPublicCourses: builder.query<ApiResponse<CoursePublicDTO[]>, void>({
      query: () => '/courses',
      providesTags: ['PublicCourse'],
    }),

    // Submit consultation registration
    submitConsultationRegistration: builder.mutation<
      ApiResponse<void>,
      ConsultationRegistrationRequest
    >({
      query: (body) => ({
        url: '/consultation-registrations',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const {
  useGetPublicBranchesQuery,
  useGetPublicCoursesQuery,
  useSubmitConsultationRegistrationMutation,
} = publicApi
