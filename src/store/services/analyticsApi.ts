import { createApi } from '@reduxjs/toolkit/query/react'

import { baseQueryWithReauth, type ApiResponse } from './authApi'

export interface SystemOverview {
  totalUsers: number
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  activeClasses: number
  totalCourses: number
  totalCenters: number
  totalBranches: number
  todaySessions: number
  todayEnrollments: number
  activeUsers: number
  inactiveUsers: number
  pendingApprovals: number
}

export interface UserGrowthPoint {
  month: string
  count: number
}

export interface UserAnalytics {
  usersByRole: Record<string, number>
  userGrowth: UserGrowthPoint[]
  totalActiveUsers: number
  totalInactiveUsers: number
}

export interface ClassAnalytics {
  totalClasses: number
  activeClasses: number
  completedClasses: number
  cancelledClasses: number
  classesByStatus: Record<string, number>
  averageEnrollmentRate: number
  totalEnrollments: number
}

export interface BranchStat {
  branchId: number
  branchName: string
  centerId: number
  centerName: string
  studentCount: number
  teacherCount: number
  classCount: number
  activeClassCount: number
}

export interface BranchAnalytics {
  branchStats: BranchStat[]
}

export interface AnalyticsResponse {
  overview: SystemOverview
  userAnalytics: UserAnalytics
  classAnalytics: ClassAnalytics
  branchAnalytics: BranchAnalytics
}

export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Analytics'],
  endpoints: (builder) => ({
    getAnalytics: builder.query<AnalyticsResponse, void>({
      query: () => '/admin/analytics',
      transformResponse: (response: ApiResponse<AnalyticsResponse>) => response.data,
      providesTags: ['Analytics'],
    }),
    getManagerAnalytics: builder.query<AnalyticsResponse, void>({
      query: () => '/manager/analytics',
      transformResponse: (response: ApiResponse<AnalyticsResponse>) => response.data,
      providesTags: ['Analytics'],
    }),
  }),
})

export const { useGetAnalyticsQuery, useGetManagerAnalyticsQuery } = analyticsApi


