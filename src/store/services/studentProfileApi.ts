import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface StudentProfile {
  studentId: number;
  studentCode: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  address?: string;
  gender: string;
  dateOfBirth: string;
  facebookUrl?: string;
  status: string;
  lastLoginAt: string;
  branchName: string;
  branchId: number;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  firstEnrollmentDate?: string;
  attendanceRate: number;
  averageScore: number;
  totalAbsences: number;
  totalSessions: number;
  primaryCourseType?: string;
  scoreScale?: string;
  enrollments: StudentActiveClass[];
}

export interface StudentActiveClass {
  classId: number;
  classCode: string;
  className: string;
  courseName: string;
  branchName: string;
  startDate: string;
  plannedEndDate: string;
  enrollmentStatus: string;
  enrolledAt: string;
}

export interface UpdateMyProfileRequest {
  phone?: string;
  facebookUrl?: string;
  address?: string;
  avatarUrl?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
}

export const studentProfileApi = createApi({
  reducerPath: 'studentProfileApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['StudentProfile'],
  endpoints: (builder) => ({
    getMyProfile: builder.query<StudentProfile, void>({
      query: () => '/students/me/profile',
      transformResponse: (response: { data: StudentProfile }) => response.data,
      providesTags: ['StudentProfile'],
    }),
    updateMyProfile: builder.mutation<StudentProfile, UpdateMyProfileRequest>({
      query: (data) => ({
        url: '/students/me/profile',
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: { data: StudentProfile }) => response.data,
      invalidatesTags: ['StudentProfile'],
    }),
  }),
});

export const { useGetMyProfileQuery, useUpdateMyProfileMutation } = studentProfileApi;