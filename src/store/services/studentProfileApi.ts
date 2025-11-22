import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface StudentProfile {
  studentId: number;
  studentCode: string;
  fullName: string;
  email: string;
  phone: string;
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
  }),
});

export const { useGetMyProfileQuery } = studentProfileApi;