import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './authApi'
import type { ApiResponse } from './authApi'

// Types
export interface CenterResponse {
  id: number
  code: string
  name: string
  description?: string
  phone?: string
  email?: string
  address?: string
  createdAt?: string
  updatedAt?: string
}

export interface CenterRequest {
  code: string
  name: string
  description?: string
  phone?: string
  email?: string
  address?: string
}

export interface PageableResponse<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      sorted: boolean
      unsorted: boolean
    }
  }
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
  size: number
  number: number
  numberOfElements: number
  empty: boolean
}

export const centerApi = createApi({
  reducerPath: 'centerApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Center'],
  endpoints: (builder) => ({
    getCenters: builder.query<ApiResponse<PageableResponse<CenterResponse>>, { page?: number; size?: number; sort?: string }>({
      query: ({ page = 0, size = 20, sort = 'createdAt,desc' }) => ({
        url: '/centers',
        params: { page, size, sort },
      }),
      providesTags: ['Center'],
    }),

    getCenterById: builder.query<ApiResponse<CenterResponse>, number>({
      query: (id) => `/centers/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Center', id }],
    }),

    createCenter: builder.mutation<ApiResponse<CenterResponse>, CenterRequest>({
      query: (body) => ({
        url: '/centers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Center'],
    }),

    updateCenter: builder.mutation<ApiResponse<CenterResponse>, { id: number; data: CenterRequest }>({
      query: ({ id, data }) => ({
        url: `/centers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Center', id }, 'Center'],
    }),

    deleteCenter: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/centers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Center'],
    }),
  }),
})

export const {
  useGetCentersQuery,
  useGetCenterByIdQuery,
  useCreateCenterMutation,
  useUpdateCenterMutation,
  useDeleteCenterMutation,
} = centerApi

