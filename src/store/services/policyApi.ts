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
  scope: string
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
  scope?: string
}

export interface UpdatePolicyRequest {
  newValue: string
  reason?: string
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
        if (params.scope) searchParams.append('scope', params.scope)

        const query = searchParams.toString()
        return {
          url: `/admin/policies${query ? `?${query}` : ''}`,
          method: 'GET',
        }
      },
      providesTags: ['Policy'],
    }),

    updatePolicy: builder.mutation<ApiResponse<Policy>, { id: number; body: UpdatePolicyRequest }>({
      query: ({ id, body }) => ({
        url: `/admin/policies/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Policy'],
    }),
  }),
})

export const { useGetPoliciesQuery, useUpdatePolicyMutation } = policyApi


