import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface SubjectDTO {
  id: number;
  code: string;
  name: string;
  status: string;
  approvalStatus?: string | null;
  rejectionReason?: string | null;
  effectiveDate?: string;
  submittedAt?: string;
  decidedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const subjectApi = createApi({
  reducerPath: 'subjectApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Subject'],
  endpoints: (builder) => ({
    getAllSubjects: builder.query<SubjectDTO[], { curriculumId?: number; levelId?: number } | void>({
      query: (params) => ({
        url: '/subjects',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiResponse<SubjectDTO[]>) => response.data,
      providesTags: ['Subject'],
    }),
  }),
});

export const {
  useGetAllSubjectsQuery,
} = subjectApi;
