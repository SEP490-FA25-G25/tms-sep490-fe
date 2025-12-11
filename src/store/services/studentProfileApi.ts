import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

// Match StudentDetailDTO from backend
export interface StudentProfile {
  id: number; // Backend uses 'id', not 'studentId'
  studentCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl?: string;
  address?: string;
  gender: string | null;
  dateOfBirth: string | null; // LocalDate from backend
  facebookUrl?: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string | null;
  branchName: string | null;
  branchId: number | null;
  currentClasses: StudentActiveClass[]; // Backend uses 'currentClasses', not 'enrollments'
  skillAssessments?: SkillAssessmentDetail[];
}

// Match StudentActiveClassDTO from backend
export interface StudentActiveClass {
  id: number; // Backend uses 'id', not 'classId'
  classCode: string;
  className: string;
  courseName: string;
  branchName: string;
  startDate: string;
  plannedEndDate: string;
  status: string; // Class status (IN_PROGRESS, COMPLETED, etc.)
  attendanceRate?: number;
  averageScore?: number;
}

export interface SkillAssessmentDetail {
  id: number;
  skill: string;
  levelCode: string;
  levelName: string;
  score: string;
  assessmentDate: string;
  assessmentType: string;
  note?: string;
  assessedBy?: {
    userId: number;
    fullName: string;
  };
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