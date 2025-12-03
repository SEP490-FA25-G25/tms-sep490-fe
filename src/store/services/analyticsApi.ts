import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQueryWithReauth, type ApiResponse } from "./authApi";

// ===== Admin analytics types (giữ nguyên cho Admin dashboard) =====

export interface SystemOverview {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeClasses: number;
  totalCourses: number;
  totalCenters: number;
  totalBranches: number;
  todaySessions: number;
  todayEnrollments: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingApprovals: number;
}

export interface UserGrowthPoint {
  month: string;
  count: number;
}

export interface UserAnalytics {
  usersByRole: Record<string, number>;
  userGrowth: UserGrowthPoint[];
  totalActiveUsers: number;
  totalInactiveUsers: number;
}

export interface ClassAnalytics {
  totalClasses: number;
  activeClasses: number;
  completedClasses: number;
  cancelledClasses: number;
  classesByStatus: Record<string, number>;
  averageEnrollmentRate: number;
  totalEnrollments: number;
  scheduledClasses?: number;
}

export interface BranchStat {
  branchId: number;
  branchName: string;
  centerId: number;
  centerName: string;
  studentCount: number;
  teacherCount: number;
  classCount: number;
  activeClassCount: number;
}

export interface BranchAnalytics {
  branchStats: BranchStat[];
}

export interface AnalyticsResponse {
  overview: SystemOverview;
  userAnalytics: UserAnalytics;
  classAnalytics: ClassAnalytics;
  branchAnalytics: BranchAnalytics;
}

// ===== Manager dashboard types (mới theo docs) =====

export type ManagerDashboardRangeType = "DAY" | "WEEK" | "MONTH" | "CUSTOM";

export interface ManagerBranchSummary {
  total: number;
  active: number;
  inactive: number;
}

export interface ManagerClassSummary {
  activeTotal: number;
  activeChangeVsPrevRangePercent: number;
}

export interface ManagerStudentSummary {
  activeTotal: number;
  newEnrollmentsInRange: number;
}

export interface ManagerTeacherSummary {
  total: number;
}

export interface ManagerPendingRequestSummary {
  totalPending: number;
}

export interface ManagerQAReportSummary {
  totalInRange: number;
  needManagerReview: number;
}

export interface ManagerSummary {
  branches: ManagerBranchSummary;
  classes: ManagerClassSummary;
  students: ManagerStudentSummary;
  teachers: ManagerTeacherSummary;
  pendingRequests: ManagerPendingRequestSummary;
  qaReports: ManagerQAReportSummary;
}

export interface ManagerClassesPerBranchItem {
  branchId: number;
  branchName: string;
  activeClasses: number;
  active: boolean;
}

export interface ManagerTeachingWorkload {
  totalTeachers: number;
  teachingTeachers: number;
  availableTeachers: number;
  teachingPercent: number;
  availablePercent: number;
  totalTeachingHoursInRange: number;
}

export interface ManagerAttendanceTrendPoint {
  date: string; // LocalDate ISO string
  attendanceRate: number; // 0–100 (BE đã convert)
}

export interface ManagerEnrollmentTrendPoint {
  label: string;
  startDate: string;
  endDate: string;
  enrollments: number;
}

export interface ManagerDashboardResponse {
  summary: ManagerSummary;
  classesPerBranch: ManagerClassesPerBranchItem[];
  teachingWorkload: ManagerTeachingWorkload;
  attendanceTrend: ManagerAttendanceTrendPoint[];
  enrollmentTrend: ManagerEnrollmentTrendPoint[];
}

export const analyticsApi = createApi({
  reducerPath: "analyticsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Analytics"],
  endpoints: (builder) => ({
    getAnalytics: builder.query<AnalyticsResponse, void>({
      query: () => "/admin/analytics",
      transformResponse: (response: ApiResponse<AnalyticsResponse>) =>
        response.data,
      providesTags: ["Analytics"],
    }),
    getManagerDashboard: builder.query<
      ManagerDashboardResponse,
      {
        rangeType?: ManagerDashboardRangeType;
        fromDate?: string;
        toDate?: string;
      } | void
    >({
      query: (paramsArg) => {
        const params: Record<string, string> = {};
        const cast = (paramsArg || {}) as {
          rangeType?: ManagerDashboardRangeType;
          fromDate?: string;
          toDate?: string;
        };
        if (cast.rangeType) params.rangeType = cast.rangeType;
        if (cast.fromDate) params.fromDate = cast.fromDate;
        if (cast.toDate) params.toDate = cast.toDate;

        return {
          url: "/manager/dashboard",
          method: "GET",
          params: Object.keys(params).length ? params : undefined,
        };
      },
      transformResponse: (response: ApiResponse<ManagerDashboardResponse>) =>
        response.data,
      providesTags: ["Analytics"],
    }),
  }),
});

export const { useGetAnalyticsQuery, useGetManagerDashboardQuery } =
  analyticsApi;
