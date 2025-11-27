import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';
import type {
  QADashboardDTO,
  QAClassListItemDTO,
  QAClassDetailDTO,
  SessionDetailDTO,
  QAReportListItemDTO,
  QAReportDetailDTO,
  CreateQAReportRequest,
  UpdateQAReportRequest,
  ChangeQAReportStatusRequest,
  StudentFeedbackListResponse,
  StudentFeedbackDetailDTO,
  QAListParams,
  QAReportFilters,
  FeedbackFilters,
  QASessionListResponse
} from '@/types/qa';

export const qaApi = createApi({
  reducerPath: 'qaApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['QADashboard', 'QAClass', 'QAReport', 'QASession', 'QAFeedback'],
  endpoints: (builder) => ({
    // Dashboard
    getQADashboard: builder.query<QADashboardDTO, { branchIds?: number[]; dateFrom?: string; dateTo?: string }>({
      query: ({ branchIds, dateFrom, dateTo }) => ({
        url: '/qa/dashboard',
        params: { branchIds, dateFrom, dateTo },
      }),
      transformResponse: (response: { data: QADashboardDTO }) => response.data,
      providesTags: ['QADashboard'],
    }),

    // Classes
    getQAClasses: builder.query<{ data: QAClassListItemDTO[]; total: number; page: number; size: number }, QAListParams>({
      query: ({ branchIds, status, search, page = 0, size = 20, sort = 'startDate', sortDir = 'desc' }) => ({
        url: '/qa/classes',
        params: { branchIds, status, search, page, size, sort, sortDir },
      }),
      transformResponse: (response: { data: { content: QAClassListItemDTO[]; totalElements: number; number: number; size: number } }) => ({
        data: response.data.content,
        total: response.data.totalElements,
        page: response.data.number,
        size: response.data.size
      }),
      providesTags: ['QAClass'],
    }),

    getQAClassDetail: builder.query<QAClassDetailDTO, number>({
      query: (classId) => `/qa/classes/${classId}`,
      transformResponse: (response: { data: QAClassDetailDTO }) => response.data,
      providesTags: (_result, _error, classId) => [{ type: 'QAClass', id: classId }],
    }),

    getQASessionList: builder.query<QASessionListResponse, number>({
      query: (classId) => `/qa/classes/${classId}/sessions`,
      transformResponse: (response: { data: QASessionListResponse }) => response.data,
      providesTags: (_result, _error, classId) => [{ type: 'QASession', id: classId }],
    }),

    // Session Detail
    getSessionDetail: builder.query<SessionDetailDTO, number>({
      query: (sessionId) => `/qa/sessions/${sessionId}`,
      providesTags: (_result, _error, sessionId) => [{ type: 'QASession', id: sessionId }],
    }),

    // QA Rereports CRUD
    getQAReports: builder.query<{ data: QAReportListItemDTO[]; total: number; page: number; size: number }, QAReportFilters>({
      query: ({ classId, sessionId, phaseId, reportType, status, reportedBy, page = 0, size = 20, sort = 'createdAt', sortDir = 'desc' }) => ({
        url: '/qa/reports',
        params: { classId, sessionId, phaseId, reportType, status, reportedBy, page, size, sort, sortDir },
      }),
      transformResponse: (response: { data: { content: QAReportListItemDTO[]; totalElements: number; number: number; size: number } }) => ({
        data: response.data.content,
        total: response.data.totalElements,
        page: response.data.number,
        size: response.data.size
      }),
      providesTags: ['QAReport'],
    }),

    getQAReportDetail: builder.query<QAReportDetailDTO, number>({
      query: (reportId) => `/qa/reports/${reportId}`,
      providesTags: (_result, _error, reportId) => [{ type: 'QAReport', id: reportId }],
    }),

    createQAReport: builder.mutation<QAReportDetailDTO, CreateQAReportRequest>({
      query: (data) => ({
        url: '/qa/reports',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['QAReport', 'QAClass', 'QADashboard'],
    }),

    updateQAReport: builder.mutation<QAReportDetailDTO, { id: number; data: UpdateQAReportRequest }>({
      query: ({ id, data }) => ({
        url: `/qa/reports/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'QAReport', id }],
    }),

    changeQAReportStatus: builder.mutation<QAReportDetailDTO, { id: number; data: ChangeQAReportStatusRequest }>({
      query: ({ id, data }) => ({
        url: `/qa/reports/${id}/status`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'QAReport', id }],
    }),

    deleteQAReport: builder.mutation<void, number>({
      query: (id) => ({
        url: `/qa/reports/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['QAReport', 'QAClass', 'QADashboard'],
    }),

    // Student Feedback
    getClassFeedbacks: builder.query<StudentFeedbackListResponse, { classId: number; filters?: FeedbackFilters }>({
      query: ({ classId, filters }) => ({
        url: `/classes/${classId}/feedbacks`,
        params: filters,
      }),
      providesTags: ['QAFeedback'],
    }),

    getFeedbackDetail: builder.query<StudentFeedbackDetailDTO, number>({
      query: (feedbackId) => `/feedbacks/${feedbackId}`,
      providesTags: (_result, _error, feedbackId) => [{ type: 'QAFeedback', id: feedbackId }],
    }),
  }),
});

// Export hooks
export const {
  useGetQADashboardQuery,
  useGetQAClassesQuery,
  useGetQAClassDetailQuery,
  useGetQASessionListQuery,
  useGetSessionDetailQuery,
  useGetQAReportsQuery,
  useGetQAReportDetailQuery,
  useCreateQAReportMutation,
  useUpdateQAReportMutation,
  useChangeQAReportStatusMutation,
  useDeleteQAReportMutation,
  useGetClassFeedbacksQuery,
  useGetFeedbackDetailQuery,
} = qaApi;