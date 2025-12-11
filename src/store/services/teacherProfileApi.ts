import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface TeacherProfile {
  teacherId: number;
  teacherCode: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string;
  facebookUrl?: string;
  avatarUrl?: string;
  status: string;
  lastLoginAt?: string;
  branchName?: string;
  branchId?: number;
  totalClasses: number;
  activeClasses: number;
  completedClasses: number;
  firstClassDate?: string;
  classes: TeacherClassInfo[];
}

export interface TeacherClassInfo {
  classId: number;
  classCode: string;
  className: string;
  subjectName: string;
  branchName: string;
  startDate: string;
  plannedEndDate: string;
  status: string;
  assignedAt: string;
}

export interface UpdateTeacherProfileRequest {
  phone?: string;
  address?: string;
  facebookUrl?: string;
  avatarUrl?: string;
  gender?: string;
  dob?: string;
}

export const teacherProfileApi = createApi({
  reducerPath: 'teacherProfileApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['TeacherProfile'],
  endpoints: (builder) => ({
    getMyProfile: builder.query<TeacherProfile, void>({
      query: () => '/teacher/me/profile',
      transformResponse: (response: { data: TeacherProfile }) => response.data,
      providesTags: ['TeacherProfile'],
    }),
    updateMyProfile: builder.mutation<TeacherProfile, UpdateTeacherProfileRequest>({
      query: (body) => ({
        url: '/teacher/me/profile',
        method: 'PUT',
        body,
      }),
      transformResponse: (response: { data: TeacherProfile }) => response.data,
      invalidatesTags: ['TeacherProfile'],
    }),
  }),
});

export const { useGetMyProfileQuery, useUpdateMyProfileMutation } = teacherProfileApi;
