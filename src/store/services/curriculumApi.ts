import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query'

// Curriculum types
export interface LevelDTO {
  id: number
  code: string
  name: string
  description: string
  durationHours: number
  sortOrder: number
  subjectName?: string
  subjectCode?: string
}

export interface SubjectWithLevelsDTO {
  id: number
  code: string
  name: string
  description: string
  status: string
  createdAt: string
  levels: LevelDTO[]
}

export interface CreateSubjectRequest {
  code: string
  name: string
  description?: string
}

export interface CreateLevelRequest {
  subjectId: number
  code: string
  name: string
  description?: string
  durationHours?: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
}

// Base query with auth
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
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

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

    if (refreshResult.data) {
      const authData = refreshResult.data as { data?: { accessToken: string; refreshToken: string; userId: number; email: string; fullName: string; roles: string[] } }
      if (authData?.data) {
        api.dispatch({
          type: 'auth/setCredentials',
          payload: {
            accessToken: authData.data.accessToken,
            refreshToken: authData.data.refreshToken,
            user: {
              id: authData.data.userId,
              email: authData.data.email,
              fullName: authData.data.fullName,
              roles: authData.data.roles,
            },
          },
        })
      }
      result = await baseQuery(args, api, extraOptions)
    } else {
      api.dispatch({ type: 'auth/logout' })
    }
  }

  return result
}

export const curriculumApi = createApi({
  reducerPath: 'curriculumApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Curriculum'],
  endpoints: (builder) => ({
    // Get subjects with their levels
    getSubjectsWithLevels: builder.query<ApiResponse<SubjectWithLevelsDTO[]>, void>({
      query: () => ({
        url: '/curriculum/subjects-with-levels',
        method: 'GET',
      }),
      providesTags: ['Curriculum'],
    }),
    // Create new subject
    createSubject: builder.mutation<ApiResponse<SubjectWithLevelsDTO>, CreateSubjectRequest>({
      query: (body) => ({
        url: '/curriculum/subjects',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Curriculum'],
    }),
    // Create new level
    createLevel: builder.mutation<ApiResponse<LevelDTO>, CreateLevelRequest>({
      query: (body) => ({
        url: '/curriculum/levels',
        method: 'POST',
        body,
      }),
    }),
    // Get levels (optionally filtered by subject)
    getLevels: builder.query<ApiResponse<LevelDTO[]>, number | undefined>({
      query: (subjectId) => ({
        url: '/curriculum/levels',
        method: 'GET',
        params: subjectId ? { subjectId } : undefined,
      }),
      providesTags: ['Curriculum'],
    }),
    // Get standard timeslot duration
    getTimeslotDuration: builder.query<ApiResponse<number>, void>({
      query: () => ({
        url: '/curriculum/timeslot-duration',
        method: 'GET',
      }),
    }),
  }),
})

export const {
  useGetSubjectsWithLevelsQuery,
  useCreateSubjectMutation,
  useCreateLevelMutation,
  useGetLevelsQuery,
  useGetTimeslotDurationQuery,
} = curriculumApi
