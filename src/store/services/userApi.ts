import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './authApi'

// Types based on backend DTOs
export interface UserResponse {
  id: number
  email: string
  fullName: string
  phone?: string
  facebookUrl?: string
  dob?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  address?: string
  avatarUrl?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  roles: string[]
  branches: string[]
}

export interface CreateUserRequest {
  email: string
  password: string
  fullName: string
  phone?: string
  facebookUrl?: string
  dob?: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  address?: string
  avatarUrl?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  roleIds: number[]
  branchIds?: number[]
}

export interface UpdateUserStatusRequest {
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

export interface UpdateUserRequest {
  fullName?: string
  phone?: string
  facebookUrl?: string
  dob?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  address?: string
  avatarUrl?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  roleIds?: number[]
  branchIds?: number[]
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
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface GetUsersParams {
  page?: number
  size?: number
  sort?: string
  search?: string
  role?: string
  status?: string
  branch?: number
}

/**
 * RTK Query API service for User Management
 */
export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    /**
     * Get all users with pagination and filters
     * GET /api/v1/users?page=0&size=20&sort=id,desc
     */
    getUsers: builder.query<ApiResponse<PageableResponse<UserResponse>>, GetUsersParams>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params.page !== undefined) searchParams.append('page', params.page.toString())
        if (params.size !== undefined) searchParams.append('size', params.size.toString())
        if (params.sort) searchParams.append('sort', params.sort)
        if (params.search) searchParams.append('search', params.search)
        if (params.role) searchParams.append('role', params.role)
        if (params.status) searchParams.append('status', params.status)
        if (params.branch) searchParams.append('branch', params.branch.toString())
        const query = searchParams.toString()
        return {
          url: `/users${query ? `?${query}` : ''}`,
          method: 'GET',
        }
      },
      providesTags: ['User'],
    }),

    /**
     * Get user by ID
     * GET /api/v1/users/{id}
     */
    getUserById: builder.query<ApiResponse<UserResponse>, number>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),

    /**
     * Get user by email
     * GET /api/v1/users/email/{email}
     */
    getUserByEmail: builder.query<ApiResponse<UserResponse>, string>({
      query: (email) => `/users/email/${email}`,
      providesTags: (result) => [{ type: 'User', id: result?.data?.id ?? 'LIST' }],
    }),

    /**
     * Create new user (ADMIN only)
     * POST /api/v1/users
     */
    createUser: builder.mutation<ApiResponse<UserResponse>, CreateUserRequest>({
      query: (data) => ({
        url: '/users',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    /**
     * Update user status
     * PATCH /api/v1/users/{id}/status?status=ACTIVE
     */
    updateUserStatus: builder.mutation<ApiResponse<UserResponse>, { id: number; status: string }>({
      query: ({ id, status }) => ({
        url: `/users/${id}/status`,
        method: 'PATCH',
        params: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
    }),

    /**
     * Update user (ADMIN only)
     * PUT /api/v1/users/{id}
     */
    updateUser: builder.mutation<ApiResponse<UserResponse>, { id: number; data: UpdateUserRequest }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
    }),

    /**
     * Check if email exists
     * GET /api/v1/users/check/email/{email}
     */
    checkEmailExists: builder.query<ApiResponse<boolean>, string>({
      query: (email) => `/users/check/email/${email}`,
    }),

    /**
     * Check if phone exists
     * GET /api/v1/users/check/phone/{phone}
     */
    checkPhoneExists: builder.query<ApiResponse<boolean>, string>({
      query: (phone) => `/users/check/phone/${phone}`,
    }),
    /**
     * Download User Import Template
     * GET /api/v1/admin/users/import/template
     */
    downloadUserImportTemplate: builder.query<void, void>({
      query: () => ({
        url: '/admin/users/import/template',
        responseHandler: async (response) => {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', 'user_import_template.xlsx')
          document.body.appendChild(link)
          link.click()
          link.parentNode?.removeChild(link)
        },
      }),
    }),

    /**
     * Preview User Import
     * POST /api/v1/admin/users/import/preview
     */
    previewUserImport: builder.mutation<ApiResponse<UserImportPreview>, FormData>({
      query: (formData) => ({
        url: '/admin/users/import/preview',
        method: 'POST',
        body: formData,
      }),
    }),

    /**
     * Execute User Import
     * POST /api/v1/admin/users/import/execute
     */
    executeUserImport: builder.mutation<ApiResponse<number>, UserImportData[]>({
      query: (data) => ({
        url: '/admin/users/import/execute',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetUserByEmailQuery,
  useCreateUserMutation,
  useUpdateUserStatusMutation,
  useUpdateUserMutation,
  useCheckEmailExistsQuery,
  useCheckPhoneExistsQuery,
  useLazyGetUsersQuery,
  useLazyDownloadUserImportTemplateQuery,
  usePreviewUserImportMutation,
  useExecuteUserImportMutation,
} = userApi

// Types for Import
export interface UserImportData {
  fullName: string
  email: string
  phone?: string
  role: string
  branchCode?: string
  status: string
  errorMessage?: string
  valid: boolean
}

export interface UserImportPreview {
  users: UserImportData[]
  totalCount: number
  validCount: number
  errorCount: number
}

