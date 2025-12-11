import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./authApi";
import type { ApiResponse } from "./authApi";

export interface BranchResponse {
  id: number;
  centerId: number;
  centerName?: string | null;
  code: string;
  name: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  status?: string;
  openingDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BranchRequest {
  centerId: number;
  code: string;
  name: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  status?: string;
  openingDate?: string;
  centerHeadUserId?: number | null;
}

export interface ManagerBranchStatus {
  total: number;
  active: number;
  inactive: number;
}

export interface ManagerBranchCenterHead {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ManagerBranchOverview {
  id: number;
  centerId: number | null;
  centerName?: string | null;
  code: string;
  name: string;
  address?: string;
  district?: string;
  city?: string;
  phone?: string;
  email?: string;
  status?: string;
  updatedAt?: string;
  centerHead?: ManagerBranchCenterHead | null;
  classStatus: ManagerBranchStatus;
  teacherStatus: ManagerBranchStatus;
  resourceStatus: ManagerBranchStatus;
}

export interface ManagerBranchTeacher {
  teacherId: number;
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  employeeCode?: string;
  contractType?: string;
  status?: string;
  totalClasses: number;
  activeClasses: number;
}

export const branchApi = createApi({
  reducerPath: "branchApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Branch", "ManagerBranch"],
  endpoints: (builder) => ({
    getAllBranches: builder.query<ApiResponse<BranchResponse[]>, void>({
      query: () => "/branches",
      providesTags: ["Branch"],
    }),

    getMyBranches: builder.query<ApiResponse<BranchResponse[]>, void>({
      query: () => "/branches/my-branches",
      providesTags: ["Branch"],
    }),

    getBranchesByCenterId: builder.query<ApiResponse<BranchResponse[]>, number>({
      query: (centerId) => `/branches/center/${centerId}`,
      providesTags: (_result, _error, centerId) => [
        { type: "Branch", id: `center-${centerId}` },
        "Branch",
      ],
    }),

    getBranchById: builder.query<ApiResponse<BranchResponse>, number>({
      query: (id) => `/branches/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Branch", id }],
    }),

    createBranch: builder.mutation<ApiResponse<BranchResponse>, BranchRequest>({
      query: (body) => ({
        url: "/branches",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Branch", id: `center-${arg.centerId}` },
        "Branch",
        "ManagerBranch",
      ],
    }),

    updateBranch: builder.mutation<
      ApiResponse<BranchResponse>,
      { id: number; data: BranchRequest }
    >({
      query: ({ id, data }) => ({
        url: `/branches/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id, data }) => [
        { type: "Branch", id },
        { type: "Branch", id: `center-${data.centerId}` },
        "Branch",
        "ManagerBranch",
      ],
    }),

    deleteBranch: builder.mutation<
      ApiResponse<void>,
      { id: number; centerId?: number }
    >({
      query: ({ id }) => ({
        url: `/branches/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { centerId }) => [
        { type: "Branch", id: `center-${centerId}` },
        "Branch",
        "ManagerBranch",
      ],
    }),

    getManagerBranches: builder.query<ApiResponse<ManagerBranchOverview[]>, void>({
      query: () => "/manager/branches",
      providesTags: ["ManagerBranch"],
    }),

    getManagerBranchById: builder.query<ApiResponse<ManagerBranchOverview>, number>({
      query: (id) => `/manager/branches/${id}`,
      providesTags: (_result, _error, id) => [{ type: "ManagerBranch", id }],
    }),

    createManagerBranch: builder.mutation<
      ApiResponse<ManagerBranchOverview>,
      BranchRequest
    >({
      query: (body) => ({
        url: "/manager/branches",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ManagerBranch", "Branch"],
    }),

    updateManagerBranch: builder.mutation<
      ApiResponse<ManagerBranchOverview>,
      { id: number; data: BranchRequest }
    >({
      query: ({ id, data }) => ({
        url: `/manager/branches/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ManagerBranch", id },
        "ManagerBranch",
        "Branch",
      ],
    }),

    deleteManagerBranch: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/manager/branches/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ManagerBranch", "Branch"],
    }),

    getManagerBranchTeachers: builder.query<
      ApiResponse<ManagerBranchTeacher[]>,
      number
    >({
      query: (id) => `/manager/branches/${id}/teachers`,
      providesTags: (_result, _error, id) => [
        { type: "ManagerBranch", id: `teachers-${id}` },
      ],
    }),

    checkBranchEmailExists: builder.query<
      ApiResponse<boolean>,
      { email: string; excludeId?: number }
    >({
      query: ({ email, excludeId }) => {
        const params = new URLSearchParams({ email });
        if (excludeId) params.append("excludeId", excludeId.toString());
        return `/manager/branches/check-email?${params.toString()}`;
      },
    }),
  }),
});

export const {
  useGetAllBranchesQuery,
  useGetMyBranchesQuery,
  useGetBranchesByCenterIdQuery,
  useGetBranchByIdQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
  useGetManagerBranchesQuery,
  useGetManagerBranchByIdQuery,
  useCreateManagerBranchMutation,
  useUpdateManagerBranchMutation,
  useDeleteManagerBranchMutation,
  useGetManagerBranchTeachersQuery,
  useCheckBranchEmailExistsQuery,
} = branchApi;


