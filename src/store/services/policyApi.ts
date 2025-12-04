import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './authApi'
import type { ApiResponse, PageableResponse } from './userApi'

export interface Policy {
  id: number
  policyKey: string
  policyCategory: string
  policyName: string
  description?: string
  valueType: string
  defaultValue: string
  currentValue: string
  minValue?: string
  maxValue?: string
  unit?: string
  branchId?: number
  courseId?: number
  classId?: number
  active: boolean
  version: number
  createdAt?: string
  updatedAt?: string
}

export interface GetPoliciesParams {
  page?: number
  size?: number
  search?: string
  category?: string
}

export interface UpdatePolicyRequest {
  newValue: string
  reason?: string
}

export interface PolicyHistory {
  id: number
  policyId: number | null
  policyKey?: string | null
  policyName?: string | null
  policyCategory?: string | null
  oldValue?: string | null
  newValue: string
  changedBy?: number | null
  changedByName?: string | null
  changedAt?: string | null
  reason?: string | null
  version: number
  changeType?: string | null
}

export const policyApi = createApi({
  reducerPath: 'policyApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Policy'],
  endpoints: (builder) => ({
    getPolicies: builder.query<ApiResponse<PageableResponse<Policy>>, GetPoliciesParams>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params.page !== undefined) searchParams.append('page', params.page.toString())
        if (params.size !== undefined) searchParams.append('size', params.size.toString())
        if (params.search) searchParams.append('search', params.search)
        if (params.category) searchParams.append('category', params.category)

        const query = searchParams.toString()
        return {
          url: `/manager/policies${query ? `?${query}` : ''}`,
          method: 'GET',
        }
      },
      providesTags: ['Policy'],
    }),

    updatePolicy: builder.mutation<ApiResponse<Policy>, { id: number; body: UpdatePolicyRequest }>({
      query: ({ id, body }) => ({
        url: `/manager/policies/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Policy'],
    }),

    getPolicyHistory: builder.query<
      ApiResponse<PageableResponse<PolicyHistory>>,
      { page?: number; size?: number; search?: string; category?: string }
    >({
      query: ({ page, size, search, category }) => {
        const searchParams = new URLSearchParams()
        if (page !== undefined) searchParams.append('page', page.toString())
        if (size !== undefined) searchParams.append('size', size.toString())
        if (search) searchParams.append('search', search)
        if (category) searchParams.append('category', category)

        const query = searchParams.toString()
        return {
          url: `/manager/policies/history${query ? `?${query}` : ''}`,
          method: 'GET',
        }
      },
    }),
  }),
})

export const { useGetPoliciesQuery, useUpdatePolicyMutation, useGetPolicyHistoryQuery } = policyApi


