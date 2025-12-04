import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./authApi";
import type { ApiResponse } from "./authApi";

export interface ManagerStaff {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  status?: string;
  branchNames: string[];
  role: string;
}

export const managerStaffApi = createApi({
  reducerPath: "managerStaffApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ManagerStaff"],
  endpoints: (builder) => ({
    getManagerStaff: builder.query<
      ApiResponse<ManagerStaff[]>,
      { role: "ACADEMIC_AFFAIR" | "QA" }
    >({
      query: ({ role }) => ({
        url: "/manager/staff",
        params: { role },
      }),
      providesTags: ["ManagerStaff"],
    }),

    updateStaffBranches: builder.mutation<
      ApiResponse<void>,
      { userId: number; branchIds: number[] }
    >({
      query: ({ userId, branchIds }) => ({
        url: `/manager/staff/${userId}/branches`,
        method: "PUT",
        body: branchIds,
      }),
      invalidatesTags: ["ManagerStaff"],
    }),
  }),
});

export const {
  useGetManagerStaffQuery,
  useUpdateStaffBranchesMutation,
} = managerStaffApi;


