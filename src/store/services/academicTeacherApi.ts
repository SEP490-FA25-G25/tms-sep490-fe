import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'

// Types based on backend DTOs
export type Skill = 'GENERAL' | 'READING' | 'WRITING' | 'SPEAKING' | 'LISTENING' | 'VOCABULARY' | 'GRAMMAR' | 'KANJI'

export interface TeacherSkillDTO {
  skill: Skill
  specialization: string
  language: string
  level: number | null
}

export interface AcademicTeacherListItemDTO {
  teacherId: number
  fullName: string
  email: string
  phone: string
  employeeCode: string
  avatarUrl: string | null
  status: string
  hasSkills: boolean
  totalSkills: number
  specializations: string[]
}

export interface AcademicTeacherDetailDTO {
  teacherId: number
  userId: number
  fullName: string
  email: string
  phone: string
  employeeCode: string
  avatarUrl: string | null
  status: string
  address: string | null
  facebookUrl: string | null
  dob: string | null
  gender: string | null
  hireDate: string | null
  contractType: string | null
  note: string | null
  branchId: number | null
  branchName: string | null
  skills: TeacherSkillDTO[]
}

export interface UpdateTeacherSkillsRequest {
  skills: TeacherSkillDTO[]
}

// API Response wrapper
interface ResponseObject<T> {
  success: boolean
  message: string
  data: T
}

export const academicTeacherApi = createApi({
  reducerPath: 'academicTeacherApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['AcademicTeacher', 'TeacherSkills'],
  endpoints: (builder) => ({
    // Lấy danh sách giáo viên
    getTeachers: builder.query<
      AcademicTeacherListItemDTO[],
      { search?: string; hasSkills?: boolean; branchId?: number }
    >({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params.search) searchParams.append('search', params.search)
        if (params.hasSkills !== undefined) {
          searchParams.append('hasSkills', String(params.hasSkills))
        }
        if (params.branchId) {
          searchParams.append('branchId', String(params.branchId))
        }
        return {
          url: `/academic/teachers?${searchParams.toString()}`,
          method: 'GET',
        }
      },
      transformResponse: (response: ResponseObject<AcademicTeacherListItemDTO[]>) => {
        return response.data
      },
      providesTags: ['AcademicTeacher'],
    }),

    // Lấy chi tiết giáo viên
    getTeacherDetail: builder.query<AcademicTeacherDetailDTO, number>({
      query: (teacherId) => `/academic/teachers/${teacherId}`,
      transformResponse: (response: ResponseObject<AcademicTeacherDetailDTO>) => {
        return response.data
      },
      providesTags: (_result, _error, teacherId) => [
        { type: 'AcademicTeacher', id: teacherId },
        'TeacherSkills',
      ],
    }),

    // Lấy danh sách skills của giáo viên
    getTeacherSkills: builder.query<TeacherSkillDTO[], number>({
      query: (teacherId) => `/academic/teachers/${teacherId}/skills`,
      transformResponse: (response: ResponseObject<TeacherSkillDTO[]>) => {
        return response.data
      },
      providesTags: (_result, _error, teacherId) => [
        { type: 'TeacherSkills', id: teacherId },
      ],
    }),

    // Cập nhật skills của giáo viên
    updateTeacherSkills: builder.mutation<
      TeacherSkillDTO[],
      { teacherId: number; request: UpdateTeacherSkillsRequest }
    >({
      query: ({ teacherId, request }) => ({
        url: `/academic/teachers/${teacherId}/skills`,
        method: 'POST',
        body: request,
      }),
      transformResponse: (response: ResponseObject<TeacherSkillDTO[]>) => {
        return response.data
      },
      invalidatesTags: (_result, _error, { teacherId }) => [
        { type: 'TeacherSkills', id: teacherId },
        { type: 'AcademicTeacher', id: teacherId },
        'AcademicTeacher',
      ],
    }),

    // Xóa skills theo specialization
    deleteTeacherSkillsBySpecialization: builder.mutation<
      void,
      { teacherId: number; specialization: string }
    >({
      query: ({ teacherId, specialization }) => ({
        url: `/academic/teachers/${teacherId}/skills?specialization=${encodeURIComponent(specialization)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { teacherId }) => [
        { type: 'TeacherSkills', id: teacherId },
        { type: 'AcademicTeacher', id: teacherId },
        'AcademicTeacher',
      ],
    }),
  }),
})

export const {
  useGetTeachersQuery,
  useGetTeacherDetailQuery,
  useGetTeacherSkillsQuery,
  useUpdateTeacherSkillsMutation,
  useDeleteTeacherSkillsBySpecializationMutation,
} = academicTeacherApi

