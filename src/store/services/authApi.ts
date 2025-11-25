import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query'
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '@/features/auth/types'

// Types based on backend API documentation
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginData {
  accessToken: string
  refreshToken: string
  tokenType: string
  userId: number
  email: string
  fullName: string
  roles: string[]
}

export interface LoginResponse {
  success: boolean
  message: string
  data: LoginData
}

export interface RefreshRequest {
  refreshToken: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
}

// Base query with token injection
const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

// Base query with token refresh logic
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  // Handle 401 Unauthorized - try to refresh token
  if (result.error && result.error.status === 401) {

    const refreshResult = await baseQuery(
      {
        url: '/auth/refresh',
        method: 'POST',
        body: {
          refreshToken: (api.getState() as RootState).auth.refreshToken,
        },
      },
      api,
      extraOptions
    )

    const refreshData = refreshResult.data as LoginResponse | undefined
    if (!refreshData || !refreshData.success || !refreshData.data) {
      // Refresh failed => token hết hạn/không hợp lệ -> đăng xuất và trả lỗi
      api.dispatch({ type: 'auth/logout' })
      return result
    }

    // Refresh thành công -> cập nhật token rồi retry request gốc với token mới
    const nextAccessToken = refreshData.data.accessToken

    api.dispatch({
      type: 'auth/setCredentials',
      payload: {
        accessToken: nextAccessToken,
        refreshToken: refreshData.data.refreshToken,
        user: {
          id: refreshData.data.userId,
          email: refreshData.data.email,
          fullName: refreshData.data.fullName,
          roles: refreshData.data.roles,
        },
      },
    })

    // Bảo hiểm: ép header Authorization dùng token mới khi retry
    if (typeof args === 'string') {
      result = await baseQuery(
        {
          url: args,
          headers: { authorization: `Bearer ${nextAccessToken}` },
        },
        api,
        extraOptions
      )
    } else {
      result = await baseQuery(
        {
          ...args,
          headers: {
            ...(args.headers || {}),
            authorization: `Bearer ${nextAccessToken}`,
          },
        },
        api,
        extraOptions
      )
    }

    // Nếu retry vẫn 401 thì buộc đăng xuất để tránh lặp 401
    if (result.error && result.error.status === 401) {
      api.dispatch({ type: 'auth/logout' })
    }
  }

  return result
}

// Export baseQueryWithReauth for use in other API services


export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    refreshToken: builder.mutation<LoginResponse, RefreshRequest>({
      query: ({ refreshToken }) => ({
        url: '/auth/refresh',
        method: 'POST',
        body: { refreshToken },
      }),
    }),
    logout: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    forgotPassword: builder.mutation<ApiResponse<ForgotPasswordResponse>, ForgotPasswordRequest>({
      query: (request) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: request,
      }),
    }),
    resetPassword: builder.mutation<ApiResponse<ResetPasswordResponse>, ResetPasswordRequest>({
      query: (request) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: {
          token: request.token,
          newPassword: request.newPassword,
          confirmPassword: request.confirmPassword,
        },
      }),
    }),
  }),
})

// Export hooks for usage in components
export const {
  useLoginMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi
