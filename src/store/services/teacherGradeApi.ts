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
  assessmentId: number;
  assessmentName: string;
  kind?: string;
  maxScore?: number;
  scheduledDate?: string;
}

export interface GradebookStudentDTO {
  studentId: number;
  studentCode: string;
  studentName: string;
  scores: Record<number, GradebookScoreDTO>; // assessmentId -> score
  averageScore?: number;
  gradedCount: number;
  totalAssessments: number;
}

export interface GradebookScoreDTO {
  score?: number;
  maxScore?: number;
  feedback?: string;
  isGraded: boolean;
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
  let result = await baseQuery(args, api, extraOptions);
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
      transformResponse: (response: any) => {
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
      ],
    }),

    // Get assessment scores
    getAssessmentScores: builder.query<StudentScoreDTO[], number>({
      query: (assessmentId) => ({
        url: `/teacher/grades/assessments/${assessmentId}/scores`,
      }),
      transformResponse: (response: { data: StudentScoreDTO[] }) => response.data,
      providesTags: (_result, _error, assessmentId) => [
        { type: "Scores", id: assessmentId },
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
      transformResponse: (response: any) => {
        // Handle both direct object and ResponseObject format
        if (response?.data) {
          return response.data;
        }
        return response;
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
      transformResponse: (response: any) => {
        // Handle both direct object and ResponseObject format
        if (response?.data) {
          return response.data;
        }
        return response;
      },
      invalidatesTags: (_result, _error, { assessmentId }) => [
        { type: "Scores", id: assessmentId },
        { type: "GradesSummary", id: "LIST" },
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
      transformResponse: (response: { data: StudentScoreDTO[] }) => response.data,
      invalidatesTags: (_result, _error, { assessmentId }) => [
        { type: "Scores", id: assessmentId },
        { type: "GradesSummary", id: "LIST" },
        { type: "Assessments", id: "LIST" },
      ],
    }),

    // Get class grades summary
    getClassGradesSummary: builder.query<ClassGradesSummaryDTO, number>({
      query: (classId) => ({
        url: `/teacher/grades/classes/${classId}/summary`,
      }),
      transformResponse: (response: any) => {
        // Handle both direct object and ResponseObject format
        if (response?.data) {
          return response.data;
        }
        return response;
      },
      providesTags: (_result, _error, classId) => [
        { type: "GradesSummary", id: classId },
      ],
    }),

    // Get class gradebook (matrix view)
    getClassGradebook: builder.query<GradebookDTO, number>({
      query: (classId) => ({
        url: `/teacher/grades/classes/${classId}/gradebook`,
      }),
      transformResponse: (response: any) => {
        if (response?.data) {
          return response.data;
        }
        return response;
      },
      providesTags: (_result, _error, classId) => [
        { type: "Gradebook", id: classId },
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

