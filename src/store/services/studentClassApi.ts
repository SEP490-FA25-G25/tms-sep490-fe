import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';
import type {
  ApiResponse,
  PaginatedResponse,
  StudentClassDTO,
  ClassDetailDTO,
  ClassSessionsResponseDTO,
  AssessmentDTO,
  StudentAssessmentScoreDTO,
  ClassmateDTO,
  GetStudentClassesRequest,
  GetClassSessionsRequest,
  GetStudentScoresRequest
} from '@/types/studentClass';

export const studentClassApi = createApi({
  reducerPath: 'studentClassApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['StudentClass', 'ClassDetail', 'ClassSessions', 'ClassAssessments', 'StudentScores', 'Classmates'],
  endpoints: (builder) => ({
    // Get student's enrolled classes with filtering and pagination
    getStudentClasses: builder.query<
      ApiResponse<PaginatedResponse<StudentClassDTO>>,
      GetStudentClassesRequest
    >({
      query: ({ studentId, status, branchId, courseId, modality, page = 0, size = 20, sort = 'enrollmentDate', direction = 'desc' }) => ({
        url: `/students/${studentId}/classes`,
        params: {
          status,
          branchId,
          courseId,
          modality,
          page,
          size,
          sort,
          direction
        },
      }),
      providesTags: ['StudentClass'],
    }),

    // Get detailed information about a specific class
    getClassDetail: builder.query<
      ApiResponse<ClassDetailDTO>,
      { classId: number }
    >({
      query: ({ classId }) => ({
        url: `/student-portal/classes/${classId}`,
      }),
      providesTags: ['ClassDetail'],
    }),

    // Get sessions for a class including student attendance data
    getClassSessions: builder.query<
      ApiResponse<ClassSessionsResponseDTO>,
      GetClassSessionsRequest
    >({
      query: ({ classId, studentId }) => ({
        url: `/student-portal/classes/${classId}/sessions`,
        params: { studentId },
      }),
      providesTags: ['ClassSessions'],
    }),

    // Get assessments for a class
    getClassAssessments: builder.query<
      ApiResponse<AssessmentDTO[]>,
      { classId: number }
    >({
      query: ({ classId }) => ({
        url: `/student-portal/classes/${classId}/assessments`,
      }),
      providesTags: ['ClassAssessments'],
    }),

    // Get assessment scores for a specific student in a class
    getStudentAssessmentScores: builder.query<
      ApiResponse<StudentAssessmentScoreDTO[]>,
      GetStudentScoresRequest
    >({
      query: ({ classId, studentId }) => ({
        url: `/student-portal/classes/${classId}/students/${studentId}/assessment-scores`,
      }),
      providesTags: ['StudentScores'],
    }),

    // Get classmates for a class
    getClassmates: builder.query<
      ApiResponse<ClassmateDTO[]>,
      { classId: number }
    >({
      query: ({ classId }) => ({
        url: `/student-portal/classes/${classId}/classmates`,
      }),
      providesTags: ['Classmates'],
    }),
  }),
});

// Export hooks for components to use
export const {
  useGetStudentClassesQuery,
  useGetClassDetailQuery,
  useGetClassSessionsQuery,
  useGetClassAssessmentsQuery,
  useGetStudentAssessmentScoresQuery,
  useGetClassmatesQuery,
} = studentClassApi;