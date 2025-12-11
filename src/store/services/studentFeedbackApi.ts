import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './authApi'

export interface PendingFeedback {
  feedbackId: number
  classId: number
  classCode: string
  className: string
  courseName: string
  phaseId?: number
  phaseName?: string
  createdAt?: string
}

export interface FeedbackResponseItem {
  questionId: number
  questionText: string
  rating: number
  displayOrder?: number
}

export interface StudentFeedbackItem {
  feedbackId: number
  classId: number
  classCode: string
  className: string
  courseName: string
  phaseId?: number
  phaseName?: string
  isFeedback: boolean        // true = submitted, false = pending
  submittedAt?: string
  averageRating?: number
  comment?: string
  responses?: FeedbackResponseItem[]  // detailed responses per question
  createdAt: string
}

export interface StudentFeedbacksParams {
  status?: 'PENDING' | 'SUBMITTED'
  classId?: number
  phaseId?: number
  search?: string
}

export interface FeedbackQuestion {
  id: number
  questionText: string
  questionType?: string
  options?: string[]
  displayOrder?: number
}

export interface StudentFeedbackSubmitRequest {
  responses: Array<{
    questionId: number
    rating: number
  }>
  comment?: string
}

export interface StudentFeedbackSubmitResponse {
  feedbackId: number
  isFeedback: boolean
  submittedAt?: string
  averageRating?: number
}

export const studentFeedbackApi = createApi({
  reducerPath: 'studentFeedbackApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['StudentFeedback'],
  endpoints: (builder) => ({
    getQuestions: builder.query<FeedbackQuestion[], void>({
      query: () => '/student/feedbacks/questions',
      transformResponse: (response: { data: FeedbackQuestion[] }) => response.data,
      providesTags: ['StudentFeedback'],
    }),
    // New: Get all feedbacks with filters
    getStudentFeedbacks: builder.query<StudentFeedbackItem[], StudentFeedbacksParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params?.status) searchParams.append('status', params.status)
        if (params?.classId) searchParams.append('classId', params.classId.toString())
        if (params?.phaseId) searchParams.append('phaseId', params.phaseId.toString())
        if (params?.search) searchParams.append('search', params.search)
        const queryString = searchParams.toString()
        return `/student/feedbacks${queryString ? `?${queryString}` : ''}`
      },
      transformResponse: (response: { data: StudentFeedbackItem[] }) => response.data,
      providesTags: ['StudentFeedback'],
    }),
    // New: Get single feedback detail
    getFeedbackDetail: builder.query<StudentFeedbackItem, number>({
      query: (feedbackId) => `/student/feedbacks/${feedbackId}`,
      transformResponse: (response: { data: StudentFeedbackItem }) => response.data,
      providesTags: ['StudentFeedback'],
    }),
    // Legacy: backward compatibility
    getPendingFeedbacks: builder.query<PendingFeedback[], void>({
      query: () => '/student/feedbacks/pending',
      transformResponse: (response: { data: PendingFeedback[] }) => response.data,
      providesTags: ['StudentFeedback'],
    }),
    getPendingCount: builder.query<number, void>({
      query: () => '/student/feedbacks/pending/count',
      transformResponse: (response: { data: number }) => response.data,
      providesTags: ['StudentFeedback'],
    }),
    submitFeedback: builder.mutation<
      StudentFeedbackSubmitResponse,
      { feedbackId: number; payload: StudentFeedbackSubmitRequest }
    >({
      query: ({ feedbackId, payload }) => ({
        url: `/student/feedbacks/${feedbackId}/submit`,
        method: 'POST',
        body: payload,
      }),
      transformResponse: (response: { data: StudentFeedbackSubmitResponse }) => response.data,
      invalidatesTags: ['StudentFeedback'],
    }),
  }),
})

export const {
  useGetQuestionsQuery,
  useGetStudentFeedbacksQuery,
  useGetFeedbackDetailQuery,
  useGetPendingFeedbacksQuery,
  useGetPendingCountQuery,
  useSubmitFeedbackMutation,
} = studentFeedbackApi
