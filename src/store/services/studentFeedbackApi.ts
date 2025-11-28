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
  useGetPendingFeedbacksQuery,
  useGetPendingCountQuery,
  useSubmitFeedbackMutation,
} = studentFeedbackApi
