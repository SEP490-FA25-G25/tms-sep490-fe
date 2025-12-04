import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './authApi'
import type { ApiResponse } from './authApi'

// Types
export type ConsultationStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'NOT_INTERESTED'

export interface ConsultationRegistrationResponse {
  id: number
  fullName: string
  email: string
  phone: string
  message?: string
  branchId: number
  branchName: string
  courseId?: number
  courseName?: string
  courseCode?: string
  status: ConsultationStatus
  note?: string
  processedById?: number
  processedByName?: string
  processedAt?: string
  createdAt: string
  updatedAt?: string
}

export interface UpdateConsultationStatusRequest {
  status: ConsultationStatus
  note?: string
}

export interface PagedResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface GetRegistrationsParams {
  status?: ConsultationStatus
  page?: number
  size?: number
}

// AA Management API for Consultation Registrations
export const consultationApi = createApi({
  reducerPath: 'consultationApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['ConsultationRegistration'],
  endpoints: (builder) => ({
    // Get list of registrations (AA filtered by their branches)
    getRegistrations: builder.query<
      ApiResponse<PagedResponse<ConsultationRegistrationResponse>>,
      GetRegistrationsParams
    >({
      query: ({ status, page = 0, size = 10 }) => {
        const params = new URLSearchParams()
        if (status) params.append('status', status)
        params.append('page', page.toString())
        params.append('size', size.toString())
        return `/consultation-registrations?${params.toString()}`
      },
      providesTags: ['ConsultationRegistration'],
    }),

    // Get single registration detail
    getRegistrationById: builder.query<
      ApiResponse<ConsultationRegistrationResponse>,
      number
    >({
      query: (id) => `/consultation-registrations/${id}`,
      providesTags: (_result, _error, id) => [
        { type: 'ConsultationRegistration', id },
      ],
    }),

    // Update registration status
    updateRegistrationStatus: builder.mutation<
      ApiResponse<ConsultationRegistrationResponse>,
      { id: number; data: UpdateConsultationStatusRequest }
    >({
      query: ({ id, data }) => ({
        url: `/consultation-registrations/${id}/status`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ConsultationRegistration'],
    }),

    // Count NEW registrations (for badge)
    countNewRegistrations: builder.query<ApiResponse<number>, void>({
      query: () => '/consultation-registrations/count-new',
      providesTags: ['ConsultationRegistration'],
    }),
  }),
})

export const {
  useGetRegistrationsQuery,
  useGetRegistrationByIdQuery,
  useUpdateRegistrationStatusMutation,
  useCountNewRegistrationsQuery,
} = consultationApi
