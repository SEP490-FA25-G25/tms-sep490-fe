import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth, type ApiResponse } from './authApi'

export type SubjectStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE'

export interface SubjectSummary {
  id: number
  code: string
  name: string
  description?: string
  status: SubjectStatus
  createdAt?: string
  updatedAt?: string
  ownerName?: string
  levelCount: number
  courseCount: number
  pendingCourseCount: number
  approvedCourseCount: number
  draftCourseCount: number
}

export interface LevelSummary {
  id: number
  code: string
  name: string
  description?: string
  expectedDurationHours?: number
  sortOrder?: number
  courseCount: number
}

export interface CourseSummary {
  id: number
  code: string
  name: string
  status: string
  approvalStatus: string
  levelName?: string
  scoreScale?: string
  createdAt?: string
  decidedAt?: string
}

export interface SubjectDetail {
  summary: SubjectSummary
  levels: LevelSummary[]
  courses: CourseSummary[]
}

export const subjectAdminApi = createApi({
  reducerPath: 'subjectAdminApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Subjects'],
  endpoints: (builder) => ({
    getSubjectSummaries: builder.query<SubjectSummary[], { status?: SubjectStatus; search?: string } | void>({
      query: (params) => ({
        url: '/admin/subjects',
        params,
      }),
      transformResponse: (response: ApiResponse<SubjectSummary[]>) => response.data,
      providesTags: ['Subjects'],
    }),

    getSubjectDetail: builder.query<SubjectDetail, number>({
      query: (subjectId) => `/admin/subjects/${subjectId}`,
      transformResponse: (response: ApiResponse<SubjectDetail>) => response.data,
      providesTags: (result, error, id) => [{ type: 'Subjects', id }],
    }),
  }),
})

export const { useGetSubjectSummariesQuery, useGetSubjectDetailQuery } = subjectAdminApi

