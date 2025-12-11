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
  CoursePhaseDTO,
  TrendData,
  ClassComparisonData,
  CombinedTrendData,
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

    // Dashboard - Trend Data for specific class
    getClassTrendData: builder.query<TrendData, number>({
      query: (classId) => ({
        url: '/qa/dashboard/trend',
        params: { classId },
      }),
      transformResponse: (response: { data: TrendData }) => response.data,
      providesTags: (_result, _error, classId) => [{ type: 'QADashboard', id: `trend-${classId}` }],
    }),

    // Dashboard - Combined Trend Data (attendance + homework) for specific class
    getClassCombinedTrendData: builder.query<CombinedTrendData, number>({
      query: (classId) => ({
        url: '/qa/dashboard/combined-trend',
        params: { classId },
      }),
      transformResponse: (response: { data: CombinedTrendData }) => response.data,
      providesTags: (_result, _error, classId) => [{ type: 'QADashboard', id: `combined-trend-${classId}` }],
    }),

    // Dashboard - Class Comparison for specific course
    getClassComparison: builder.query<ClassComparisonData, { courseId: number; metricType?: string; sortBy?: string; status?: string }>({
      query: ({ courseId, metricType = 'ATTENDANCE', sortBy = 'VALUE_ASC', status }) => ({
        url: '/qa/dashboard/comparison',
        params: { courseId, metricType, sortBy, ...(status && { status }) },
      }),
      transformResponse: (response: { data: ClassComparisonData }) => response.data,
      providesTags: (_result, _error, { courseId }) => [{ type: 'QADashboard', id: `comparison-${courseId}` }],
    }),

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

    // QA Reports CRUD
    getQAReports: builder.query<{ data: QAReportListItemDTO[]; total: number; page: number; size: number }, QAReportFilters>({
      query: ({ classId, sessionId, phaseId, reportType, status, reportedBy, search, page = 0, size = 20, sort = 'createdAt', sortDir = 'desc' }) => ({
        url: '/qa/reports',
        params: { classId, sessionId, phaseId, reportType, status, reportedBy, search, page, size, sort, sortDir },
      }),
      transformResponse: (response: { data: { content: QAReportListItemDTO[]; page: { totalElements: number; number: number; size: number; totalPages: number } } }) => ({
        data: response.data.content,
        total: response.data.page.totalElements,
        page: response.data.page.number,
        size: response.data.page.size
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
      transformResponse: (response: { data: { statistics: StudentFeedbackListResponse['statistics']; feedbacks: { content: StudentFeedbackListResponse['feedbacks']; page: { size: number; number: number; totalElements: number; totalPages: number } } } }) => ({
        statistics: response.data.statistics,
        feedbacks: response.data.feedbacks.content, // Extract content array from paginated response
        total: response.data.feedbacks.page.totalElements,
        page: response.data.feedbacks.page.number,
        size: response.data.feedbacks.page.size
      }),
      providesTags: ['QAFeedback'],
    }),

    getFeedbackDetail: builder.query<StudentFeedbackDetailDTO, number>({
      query: (feedbackId) => `/feedbacks/${feedbackId}`,
      transformResponse: (response: { data: StudentFeedbackDetailDTO }) => response.data,
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
  useGetClassComparisonQuery,
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
  useGetClassTrendDataQuery,
  useGetClassCombinedTrendDataQuery,
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
  CoursePhaseDTO,
  TrendData,
  CombinedTrendData,
} from '@/types/qa';
