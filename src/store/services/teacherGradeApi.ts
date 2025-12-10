import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../index";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

// Types for teacher grade management
export interface TeacherAssessmentDTO {
  id: number;
  classId: number;
  courseAssessmentId?: number;
  name: string;
  description?: string;
  kind?: string;
  maxScore?: number;
  durationMinutes?: number;
  scheduledDate: string;
  actualDate?: string;
  gradedCount: number;
  totalStudents: number;
  allGraded: boolean;
}

export interface TeacherStudentScoreDTO {
  scoreId?: number;
  studentId: number;
  studentCode?: string;
  studentName: string;
  score?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  maxScore?: number;
  scorePercentage?: number;
  isGraded: boolean;
}

// Alias for backward compatibility
export type StudentScoreDTO = TeacherStudentScoreDTO;

export interface ScoreInputDTO {
  studentId: number;
  score: number;
  feedback?: string;
}

export interface BatchScoreInputDTO {
  scores: ScoreInputDTO[];
}

export interface ClassGradesSummaryDTO {
  classId: number;
  className: string;
  totalAssessments: number;
  totalStudents: number;
  averageScore?: number;
  highestScore?: number;
  lowestScore?: number;
  scoreDistribution?: Record<string, number>;
  topStudents?: StudentGradeSummaryDTO[];
  bottomStudents?: StudentGradeSummaryDTO[];
}

export interface StudentGradeSummaryDTO {
  studentId: number;
  studentCode?: string;
  studentName: string;
  averageScore?: number;
  gradedCount: number;
}

export interface GradebookDTO {
  classId: number;
  className: string;
  classCode?: string;
  assessments: GradebookAssessmentDTO[];
  students: GradebookStudentDTO[];
}

export interface GradebookAssessmentDTO {
  id: number;
  name: string;
  kind?: string;
  maxScore?: number;
  scheduledDate?: string;
}

export interface GradebookStudentDTO {
  studentId: number;
  studentCode: string;
  studentName: string;
  scores: GradebookStudentScoreDTO[];
  averageScore?: number;
  gradedCount?: number;
  totalAssessments?: number;
  attendedSessions?: number;
  totalSessions?: number;
  attendanceRate?: number;
  attendanceScore?: number;
  attendanceFinalized?: boolean;
}

export interface GradebookStudentScoreDTO {
  assessmentId: number;
  score?: number;
  scorePercentage?: number;
  maxScore?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
}

// Base query with auth
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  prepareHeaders: (headers, { getState }) => {
    const authState = (getState() as RootState).auth;
    const token = authState.accessToken;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    // Handle token refresh if needed
  }
  return result;
};

export const teacherGradeApi = createApi({
  reducerPath: "teacherGradeApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Assessments", "Scores", "GradesSummary", "Gradebook"],
  endpoints: (builder) => ({
    // Get class assessments
    getClassAssessments: builder.query<
      TeacherAssessmentDTO[],
      { classId: number; filter?: string }
    >({
      query: ({ classId, filter = "all" }) => ({
        url: `/teacher/grades/classes/${classId}/assessments`,
        params: { filter },
      }),
      transformResponse: (
        response: { data?: TeacherAssessmentDTO[] } | TeacherAssessmentDTO[]
      ) => {
        // Handle both direct array and ResponseObject format
        if (Array.isArray(response)) {
          return response;
        }
        if (response?.data) {
          return Array.isArray(response.data) ? response.data : [];
        }
        return [];
      },
      providesTags: (_result, _error, { classId }) => [
        { type: "Assessments", id: classId },
        { type: "Assessments", id: "LIST" },
      ],
    }),

    // Get assessment scores
    getAssessmentScores: builder.query<StudentScoreDTO[], number>({
      query: (assessmentId) => ({
        url: `/teacher/grades/assessments/${assessmentId}/scores`,
      }),
      transformResponse: (response: { data: StudentScoreDTO[] }) =>
        response.data,
      providesTags: (_result, _error, assessmentId) => [
        { type: "Scores", id: assessmentId },
        { type: "Scores", id: "LIST" },
      ],
    }),

    // Get student score
    getStudentScore: builder.query<
      StudentScoreDTO,
      { assessmentId: number; studentId: number }
    >({
      query: ({ assessmentId, studentId }) => ({
        url: `/teacher/grades/assessments/${assessmentId}/scores/${studentId}`,
      }),
      transformResponse: (
        response: { data?: StudentScoreDTO } | StudentScoreDTO
      ): StudentScoreDTO => {
        // Handle both direct object and ResponseObject format
        if (response && "data" in response && response.data) {
          return response.data;
        }
        return response as StudentScoreDTO;
      },
      providesTags: (_result, _error, { assessmentId, studentId }) => [
        { type: "Scores", id: `${assessmentId}-${studentId}` },
      ],
    }),

    // Save or update score
    saveOrUpdateScore: builder.mutation<
      StudentScoreDTO,
      { assessmentId: number; scoreInput: ScoreInputDTO }
    >({
      query: ({ assessmentId, scoreInput }) => ({
        url: `/teacher/grades/assessments/${assessmentId}/scores`,
        method: "POST",
        body: scoreInput,
      }),
      transformResponse: (
        response: { data?: StudentScoreDTO } | StudentScoreDTO
      ): StudentScoreDTO => {
        // Handle both direct object and ResponseObject format
        if (response && "data" in response && response.data) {
          return response.data;
        }
        return response as StudentScoreDTO;
      },
      // Invalidate toàn bộ dữ liệu liên quan để cập nhật "đã nhập" và bảng điểm
      invalidatesTags: (_result, _error, { assessmentId }) => [
        { type: "Scores", id: assessmentId },
        { type: "Scores", id: "LIST" },
        { type: "Assessments", id: "LIST" },
        { type: "GradesSummary", id: "LIST" },
        { type: "Gradebook", id: "LIST" },
      ],
    }),

    // Batch save or update scores
    batchSaveOrUpdateScores: builder.mutation<
      StudentScoreDTO[],
      { assessmentId: number; batchInput: BatchScoreInputDTO }
    >({
      query: ({ assessmentId, batchInput }) => ({
        url: `/teacher/grades/assessments/${assessmentId}/scores/batch`,
        method: "POST",
        body: batchInput,
      }),
      transformResponse: (response: { data: StudentScoreDTO[] }) =>
        response.data,
      // Invalidate toàn bộ dữ liệu liên quan để cập nhật "đã nhập" và bảng điểm
      invalidatesTags: (_result, _error, { assessmentId }) => [
        { type: "Scores", id: assessmentId },
        { type: "Scores", id: "LIST" },
        { type: "Assessments", id: "LIST" },
        { type: "GradesSummary", id: "LIST" },
        { type: "Gradebook", id: "LIST" },
      ],
    }),

    // Get class grades summary
    getClassGradesSummary: builder.query<ClassGradesSummaryDTO, number>({
      query: (classId) => ({
        url: `/teacher/grades/classes/${classId}/summary`,
      }),
      transformResponse: (
        response: { data?: ClassGradesSummaryDTO } | ClassGradesSummaryDTO
      ): ClassGradesSummaryDTO => {
        // Handle both direct object and ResponseObject format
        if (response && "data" in response && response.data) {
          return response.data;
        }
        return response as ClassGradesSummaryDTO;
      },
      providesTags: (_result, _error, classId) => [
        { type: "GradesSummary", id: classId },
        { type: "GradesSummary", id: "LIST" },
      ],
    }),

    // Get class gradebook (matrix view)
    getClassGradebook: builder.query<GradebookDTO, number>({
      query: (classId) => ({
        url: `/teacher/grades/classes/${classId}/gradebook`,
      }),
      transformResponse: (
        response: { data?: GradebookDTO } | GradebookDTO
      ): GradebookDTO => {
        if (response && "data" in response && response.data) {
          return response.data;
        }
        return response as GradebookDTO;
      },
      providesTags: (_result, _error, classId) => [
        { type: "Gradebook", id: classId },
        { type: "Gradebook", id: "LIST" },
        { type: "Scores", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetClassAssessmentsQuery,
  useGetAssessmentScoresQuery,
  useGetStudentScoreQuery,
  useSaveOrUpdateScoreMutation,
  useBatchSaveOrUpdateScoresMutation,
  useGetClassGradesSummaryQuery,
  useGetClassGradebookQuery,
} = teacherGradeApi;
