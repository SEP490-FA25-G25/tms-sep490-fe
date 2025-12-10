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
  }),
});

export const { useGetMyProfileQuery } = teacherProfileApi;

