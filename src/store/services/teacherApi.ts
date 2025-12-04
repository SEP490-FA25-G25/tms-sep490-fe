import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./authApi";
import type { ApiResponse } from "./authApi";
import type { TeacherProfile } from "./teacherProfileApi";
import type {
  TeacherWeeklyScheduleData,
} from "./teacherScheduleApi";

export interface ManagerTeacher {
  teacherId: number;
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  employeeCode?: string;
  status?: string;
  branchNames: string[];
}

export interface ManagerTeacherWeeklyScheduleQuery {
  teacherId: number;
  weekStart: string;
}

export const teacherApi = createApi({
  reducerPath: "teacherApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ManagerTeacher"],
  endpoints: (builder) => ({
    getManagerTeachers: builder.query<ApiResponse<ManagerTeacher[]>, void>({
      query: () => "/manager/teachers",
      providesTags: ["ManagerTeacher"],
    }),

    assignTeacherToBranch: builder.mutation<
      ApiResponse<void>,
      { teacherId: number; branchId: number }
    >({
      query: ({ teacherId, branchId }) => ({
        url: `/manager/teachers/${teacherId}/branches/${branchId}`,
        method: "POST",
      }),
      invalidatesTags: ["ManagerTeacher"],
    }),

    updateTeacherBranches: builder.mutation<
      ApiResponse<void>,
      { teacherId: number; branchIds: number[] }
    >({
      query: ({ teacherId, branchIds }) => ({
        url: `/manager/teachers/${teacherId}/branches`,
        method: "PUT",
        body: { branchIds },
      }),
      invalidatesTags: ["ManagerTeacher"],
    }),

    getManagerTeacherProfile: builder.query<
      ApiResponse<TeacherProfile>,
      number
    >({
      query: (teacherId) => `/manager/teachers/${teacherId}/profile`,
      providesTags: (_result, _error, teacherId) => [
        { type: "ManagerTeacher", id: `profile-${teacherId}` },
      ],
    }),

    getManagerTeacherWeeklySchedule: builder.query<
      ApiResponse<TeacherWeeklyScheduleData>,
      ManagerTeacherWeeklyScheduleQuery
    >({
      query: ({ teacherId, weekStart }) => ({
        url: `/manager/teachers/${teacherId}/schedule`,
        params: { weekStart },
      }),
      providesTags: (_result, _error, { teacherId, weekStart }) => [
        {
          type: "ManagerTeacher",
          id: `schedule-${teacherId}-${weekStart}`,
        },
      ],
    }),
  }),
});

export const {
  useGetManagerTeachersQuery,
  useAssignTeacherToBranchMutation,
  useUpdateTeacherBranchesMutation,
  useGetManagerTeacherProfileQuery,
  useGetManagerTeacherWeeklyScheduleQuery,
} = teacherApi;
