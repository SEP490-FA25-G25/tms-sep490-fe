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
  QASessionListResponse,
  QAExportRequest,
  CoursePhaseDTO
} from '@/types/qa';

export const qaApi = createApi({
  reducerPath: 'qaApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['QADashboard', 'QAClass', 'QAReport', 'QASession', 'QAFeedback', 'CoursePhase'],
  endpoints: (builder) => ({
    // Course Phases
    getAllPhases: builder.query<CoursePhaseDTO[], void>({
      query: () => '/phases',
      transformResponse: (response: { data: CoursePhaseDTO[] }) => response.data,
      providesTags: ['CoursePhase'],
    }),

    getPhasesByCourseId: builder.query<CoursePhaseDTO[], number>({
      query: (courseId) => `/phases/course/${courseId}`,
      transformResponse: (response: { data: CoursePhaseDTO[] }) => response.data,
      providesTags: (_result, _error, courseId) => [{ type: 'CoursePhase', id: courseId }],
    }),

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
      transformResponse: (response: { data: SessionDetailDTO }) => response.data,
      providesTags: (_result, _error, sessionId) => [{ type: 'QASession', id: sessionId }],
    }),

    // QA Rereports CRUD
    getQAReports: builder.query<{ data: QAReportListItemDTO[]; total: number; page: number; size: number }, QAReportFilters>({
      query: ({ classId, sessionId, phaseId, reportType, status, reportedBy, search, page = 0, size = 20, sort = 'createdAt', sortDir = 'desc' }) => ({
        url: '/qa/reports',
        params: { classId, sessionId, phaseId, reportType, status, reportedBy, search, page, size, sort, sortDir },
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
      transformResponse: (response: { data: QAReportDetailDTO }) => response.data,
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
      transformResponse: (response: { data: StudentFeedbackListResponse }) => ({
        statistics: response.data.statistics,
        feedbacks: response.data.feedbacks,
        total: response.data.total,
        page: response.data.page,
        size: response.data.size
      }),
      providesTags: ['QAFeedback'],
    }),

    getFeedbackDetail: builder.query<StudentFeedbackDetailDTO, number>({
      query: (feedbackId) => `/feedbacks/${feedbackId}`,
      providesTags: (_result, _error, feedbackId) => [{ type: 'QAFeedback', id: feedbackId }],
    }),

    // QA Export
    exportQAData: builder.mutation<Blob, QAExportRequest>({
      query: (data) => ({
        url: '/qa/export',
        method: 'POST',
        body: data,
        responseHandler: async (response) => {
          // Get filename from Content-Disposition header
          const contentDisposition = response.headers.get('content-disposition')
          let filename = 'qa-dashboard-export.xlsx'
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
            if (filenameMatch) {
              filename = filenameMatch[1]
            }
          }

          // Create blob from response
          const blob = await response.blob()

          // Create download link and trigger download
          const downloadUrl = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(downloadUrl)

          return blob
        },
      }),
      invalidatesTags: [], // Export doesn't invalidate any caches
    }),
  }),
});

// Export hooks
export const {
  useGetAllPhasesQuery,
  useGetPhasesByCourseIdQuery,
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
  useExportQADataMutation,
} = qaApi;

// Export types for external use
export type {
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
  QASessionListResponse,
  QAExportRequest,
  CoursePhaseDTO
} from '@/types/qa';
