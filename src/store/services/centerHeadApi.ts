import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth, type ApiResponse } from "./authApi";

// ===== Center Head Dashboard Types =====

export interface CenterHeadClassSummary {
  activeTotal: number;
  upcomingThisWeek: number;
}

export interface CenterHeadStudentSummary {
  activeTotal: number;
  newEnrollmentsThisWeek: number;
}

export interface CenterHeadTeacherSummary {
  total: number;
  scheduleStatus: string; // e.g., "All schedules updated"
}

export interface CenterHeadPendingReportsSummary {
  totalPending: number;
  requiresAttention: number;
}

export interface CenterHeadSummary {
  classes: CenterHeadClassSummary;
  students: CenterHeadStudentSummary;
  teachers: CenterHeadTeacherSummary;
  pendingReports: CenterHeadPendingReportsSummary;
}

export interface ClassesPerDayItem {
  dayOfWeek: string; // e.g., "MONDAY", "TUESDAY", etc.
  classCount: number;
  roomUtilizationRate: number; // percentage
}

export interface TeacherWorkloadSummary {
  totalTeachers: number;
  teachingTeachers: number;
  availableTeachers: number;
  teachingPercent: number;
  availablePercent: number;
  totalTeachingHoursThisWeek: number;
}

export interface UpcomingClassItem {
  classId: number;
  className: string;
  courseCode: string;
  startDate: string; // ISO date
  teacherName: string;
  roomName: string;
}

export interface AttendanceSummary {
  todayRate: number; // percentage
  lowAttendanceClassCount: number; // classes < 70%
}

export interface CenterHeadDashboardResponse {
  summary: CenterHeadSummary;
  classesPerDay: ClassesPerDayItem[];
  teacherWorkload: TeacherWorkloadSummary;
  upcomingClasses: UpcomingClassItem[];
  attendance: AttendanceSummary;
}

// ===== Teacher Schedule Types =====

export interface TeacherScheduleItem {
  teacherId: number;
  teacherName: string;
  employeeCode: string;
  totalHoursThisWeek: number;
  classCount: number;
  sessionCount: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface TeacherScheduleParams {
  page?: number;
  size?: number;
  search?: string;
  weekStart?: string;
}

// ===== API Definition =====

export const centerHeadApi = createApi({
  reducerPath: "centerHeadApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["CenterHeadDashboard", "TeacherSchedules"],
  endpoints: (builder) => ({
    // Dashboard endpoint - Falls back to manager API since center head shares similar data
    getCenterHeadDashboard: builder.query<
      CenterHeadDashboardResponse,
      void
    >({
      query: () => ({
        url: "/center-head/dashboard",
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<CenterHeadDashboardResponse>) =>
        response.data,
      providesTags: ["CenterHeadDashboard"],
    }),

    // Teacher schedules for center head view
    getTeacherSchedules: builder.query<
      PageResponse<TeacherScheduleItem>,
      TeacherScheduleParams | void
    >({
      query: (params) => ({
        url: "/center-head/teacher-schedules",
        method: "GET",
        params: params || {},
      }),
      transformResponse: (
        response: ApiResponse<PageResponse<TeacherScheduleItem>>
      ) => response.data,
      providesTags: ["TeacherSchedules"],
    }),
  }),
});

export const {
  useGetCenterHeadDashboardQuery,
  useGetTeacherSchedulesQuery,
} = centerHeadApi;
