import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './authApi'
import type { ApiResponse } from './authApi'

// Types
export interface BranchResponse {
  id: number
  centerId: number
  centerName?: string
  code: string
  name: string
  address?: string
  city?: string
  district?: string
  phone?: string
  email?: string
  status: string
  openingDate?: string
  createdAt?: string
  updatedAt?: string
}

export interface BranchRequest {
  centerId: number
  code: string
  name: string
  address?: string
  city?: string
  district?: string
  phone?: string
  email?: string
  status?: string
  openingDate?: string
}

export const branchApi = createApi({
  reducerPath: 'branchApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Branch'],
  endpoints: (builder) => ({
    getAllBranches: builder.query<ApiResponse<BranchResponse[]>, void>({
      query: () => '/branches',
      providesTags: ['Branch'],
    }),

    getBranchesByCenterId: builder.query<ApiResponse<BranchResponse[]>, number>({
      query: (centerId) => `/branches/center/${centerId}`,
      providesTags: (_result, _error, centerId) => [
        { type: 'Branch', id: `center-${centerId}` },
        'Branch',
      ],
    }),

    getBranchById: builder.query<ApiResponse<BranchResponse>, number>({
      query: (id) => `/branches/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Branch', id }],
    }),

    createBranch: builder.mutation<ApiResponse<BranchResponse>, BranchRequest>({
      query: (body) => ({
        url: '/branches',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Branch', id: `center-${arg.centerId}` },
        'Branch',
      ],
    }),

    updateBranch: builder.mutation<
      ApiResponse<BranchResponse>,
      { id: number; data: BranchRequest }
    >({
      query: ({ id, data }) => ({
        url: `/branches/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id, data }) => [
        { type: 'Branch', id },
        { type: 'Branch', id: `center-${data.centerId}` },
        'Branch',
      ],
    }),

    deleteBranch: builder.mutation<
      ApiResponse<void>,
      { id: number; centerId: number }
    >({
      query: ({ id }) => ({
        url: `/branches/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { centerId }) => [
        { type: 'Branch', id: `center-${centerId}` },
        'Branch',
      ],
    }),
  }),
})

export const {
  useGetAllBranchesQuery,
  useGetBranchesByCenterIdQuery,
  useGetBranchByIdQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} = branchApi

