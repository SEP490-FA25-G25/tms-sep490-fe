import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query'

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export type SessionStatus = 'PLANNED' | 'DONE' | 'CANCELLED'
export type SessionType = 'CLASS' | 'MAKEUP' | 'ASSESSMENT' | 'WORKSHOP' | 'EVENT'
export type ClassModality = 'OFFLINE' | 'ONLINE' | 'HYBRID'
export type AttendanceStatus = 'PLANNED' | 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'MAKEUP'
export type HomeworkStatus = 'COMPLETED' | 'INCOMPLETE' | 'NO_HOMEWORK'
export type ResourceType = 'ROOM' | 'VIRTUAL' | string

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
}

export interface TimeSlotDTO {
  id?: number
  timeSlotTemplateId?: number
  name?: string
  displayName?: string
  startTime: string
  endTime: string
}

export interface MakeupInfoDTO {
  isMakeup?: boolean
  originalSessionId?: number
  originalDate?: string
  originalStatus?: SessionStatus
  reason?: string
  makeupDate?: string
}

export interface SessionSummaryDTO {
  sessionId: number
  studentSessionId: number
  date: string
  dayOfWeek: DayOfWeek
  timeSlotTemplateId: number
  startTime: string
  endTime: string
  classCode: string
  className: string
  courseId: number
  courseName: string
  topic: string
  sessionType: SessionType
  sessionStatus: SessionStatus
  modality: ClassModality
  location: string | null
  branchName: string
  attendanceStatus: AttendanceStatus
  isMakeup: boolean
  makeupInfo: MakeupInfoDTO | null
}

export interface WeeklyScheduleData {
  weekStart: string
  weekEnd: string
  studentId: number
  studentName: string
  timeSlots: TimeSlotDTO[]
  schedule: Record<DayOfWeek, SessionSummaryDTO[]>
}

export interface ClassInfoDTO {
  classId: number
  classCode: string
  className: string
  courseId: number
  courseName: string
  teacherId: number
  teacherName: string
  branchId: number
  branchName: string
  modality: ClassModality
}

export interface SessionInfoDTO {
  topic: string
  description: string | null
  sessionType: SessionType
  sessionStatus: SessionStatus
  location: string | null
  onlineLink: string | null
}

export interface StudentStatusDTO {
  attendanceStatus: AttendanceStatus
  homeworkStatus: HomeworkStatus
  homeworkDueDate: string | null
  homeworkDescription: string | null
}

export interface MaterialDTO {
  materialId: number
  fileName: string
  fileUrl: string
  uploadedAt?: string | null
}

export interface ResourceDTO {
  resourceId: number
  resourceCode: string
  resourceName: string
  resourceType: ResourceType
  capacity?: number | null
  location?: string | null
  onlineLink?: string | null
}

export interface SessionDetailDTO {
  sessionId: number
  studentSessionId: number
  date: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  timeSlotName: string
  classInfo: ClassInfoDTO
  sessionInfo: SessionInfoDTO
  studentStatus: StudentStatusDTO
  materials: MaterialDTO[]
  classroomResource: ResourceDTO | null
  makeupInfo: MakeupInfoDTO | null
}

export interface WeeklyScheduleQuery {
  weekStart: string
  classId?: number
}

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
      const authData = refreshResult.data as {
        data?: {
          accessToken: string
          refreshToken: string
          userId: number
          email: string
          fullName: string
          roles: string[]
        }
      }

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

        result = await baseQuery(args, api, extraOptions)
      } else {
        api.dispatch({ type: 'auth/logout' })
      }
    } else {
      api.dispatch({ type: 'auth/logout' })
    }
  }

  return result
}

export const studentScheduleApi = createApi({
  reducerPath: 'studentScheduleApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['WeeklySchedule', 'SessionDetail'],
  endpoints: (builder) => ({
    getCurrentWeek: builder.query<ApiResponse<string>, void>({
      query: () => ({
        url: '/students/me/current-week',
      }),
    }),
    getWeeklySchedule: builder.query<ApiResponse<WeeklyScheduleData>, WeeklyScheduleQuery>({
      query: ({ weekStart, classId }) => ({
        url: '/students/me/schedule',
        params: {
          weekStart,
          ...(typeof classId === 'number' ? { classId } : {}),
        },
      }),
      providesTags: (_result, _error, { weekStart, classId }) => [
        { type: 'WeeklySchedule', id: classId ? `${weekStart}-${classId}` : weekStart },
      ],
    }),
    getSessionDetail: builder.query<ApiResponse<SessionDetailDTO>, number>({
      query: (sessionId) => ({
        url: `/students/me/sessions/${sessionId}`,
      }),
      providesTags: (_result, _error, sessionId) => [{ type: 'SessionDetail', id: sessionId }],
    }),
  }),
})

export const {
  useGetCurrentWeekQuery,
  useGetWeeklyScheduleQuery,
  useGetSessionDetailQuery,
} = studentScheduleApi
