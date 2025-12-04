import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

// TypeScript interfaces based on backend DTOs
export interface StudentCourse {
  id: number;
  code: string;
  name: string;
  description?: string;
  subjectName?: string;
  levelName?: string;
  logicalCourseCode?: string;
  totalHours?: number;
  durationWeeks?: number;
  sessionPerWeek?: number;
  targetAudience?: string;
  teachingMethods?: string;
  effectiveDate?: string;
  status: string;
  approvalStatus: string;
  classId: number;
  classCode: string;
  centerName?: string;
  roomName?: string;
  modality?: string;
  classStartDate?: string;
  classEndDate?: string;
  teacherName?: string;
  enrollmentStatus: string;
  enrolledAt?: string;
  progressPercentage?: number;
  completedSessions?: number;
  totalSessions?: number;
  attendanceRate: string;
}

export interface CourseDetail {
  id: number;
  code: string;
  name: string;
  description?: string;
  subjectId?: number;
  subjectName?: string;
  levelId?: number;
  levelName?: string;
  logicalCourseCode?: string;
  version?: number;
  totalHours?: number;
  numberOfSessions?: number; // From course.number_of_sessions
  totalDurationWeeks?: number; // Computed sum from phase durations
  hoursPerSession?: number;
  scoreScale?: string;
  prerequisites?: string;
  targetAudience?: string;
  teachingMethods?: string;
  effectiveDate?: string;
  thumbnailUrl?: string;
  status: string;
  approvalStatus: string;
  rejectionReason?: string;
  phases?: CoursePhase[];
  materials?: CourseMaterial[];
  clos?: CourseCLO[];
  assessments?: CourseAssessment[];
  totalSessions?: number; // Actual count from phases
  totalMaterials?: number;
  progressPercentage?: number;
  completedSessions?: number;
  basicInfo?: {
    subjectId: number;
    levelId?: number;
    name: string;
    code: string;
    description?: string;
    prerequisites?: string;
    durationHours?: number;
    scoreScale?: string;
    targetAudience?: string;
    teachingMethods?: string;
    effectiveDate?: string;
    numberOfSessions?: number;
    hoursPerSession?: number;
    thumbnailUrl?: string;
  };
}

export interface CoursePhase {
  id: number;
  phaseNumber: number;
  name: string;
  durationWeeks?: number; // Duration of this phase in weeks
  learningFocus?: string; // Learning focus for this phase
  description?: string; // Alias for learningFocus (compatibility)
  sequenceNo?: number;
  sessions?: CourseSession[];
  materials?: CourseMaterial[];
  totalSessions?: number;
  totalMaterials?: number;
}

export interface CourseSession {
  id: number;
  sequenceNo: number;
  topic: string;
  studentTask?: string;
  description?: string; // Alias for studentTask (compatibility)
  objectives?: string;
  skill?: string;
  mappedCLOs?: string[]; // List of CLO codes mapped to this session
  materials?: CourseMaterial[];
  totalMaterials?: number;
  isCompleted?: boolean;
}

export interface CourseMaterial {
  id: number;
  title: string;
  name?: string; // Alias for title
  description?: string;
  materialType?: string;
  type?: string; // Alias for materialType
  scope?: string; // e.g. 'COURSE', 'PHASE', 'SESSION'
  url?: string; // Alias for fileUrl
  fileName?: string;
  filePath?: string;
  fileUrl?: string;
  fileSize?: number;
  level: 'COURSE' | 'PHASE' | 'SESSION';
  phaseId?: number;
  sessionId?: number;
  sequenceNo?: number;
  isAccessible: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseCLO {
  id: number;
  code: string;
  description: string;
  competencyLevel?: string;
  relatedPLOs?: CoursePLO[];
  mappedPLOs?: string[];
  isAchieved?: boolean;
  achievementRate?: number;
}

export interface CoursePLO {
  id: number;
  code: string;
  description: string;
  programName?: string;
}

export interface CourseAssessment {
  id: number;
  name: string;
  description?: string;
  assessmentType: string;
  type?: string; // Alias for assessmentType if needed, or specific type
  maxScore?: number;
  duration?: string;
  sessionIds?: number[];
  cloMappings?: string[];
  mappedCLOs?: string[];
}

export interface CourseProgress {
  courseId: number;
  studentId: number;
  totalSessions: number;
  completedSessions: number;
  totalMaterials: number;
  accessibleMaterials: number;
  progressPercentage: number;
  attendanceRate: number;
  cloProgress?: CLOProgress[];
  assessmentProgress?: AssessmentProgress[];
  currentPhase?: string;
  nextSession?: string;
  estimatedCompletionDate?: number;
}

export interface CLOProgress {
  cloId: number;
  cloCode: string;
  description: string;
  achievementRate: number;
  isAchieved: boolean;
  totalAssessments: number;
  completedAssessments: number;
  averageScore: number;
}

export interface AssessmentProgress {
  assessmentId: number;
  name: string;
  assessmentType: string;
  maxScore: number;
  achievedScore: number;
  isCompleted: boolean;
  completedAt?: string;
  percentageScore: number;
}

export interface MaterialHierarchy {
  courseLevel: CourseMaterial[];
  phases: PhaseMaterial[];
  totalMaterials: number;
  accessibleMaterials: number;
}

export interface PhaseMaterial {
  id: number;
  phaseNumber: number;
  name: string;
  materials: CourseMaterial[];
  sessions: SessionMaterial[];
  totalMaterials: number;
}

export interface SessionMaterial {
  id: number;
  sequenceNo: number;
  topic: string;
  materials: CourseMaterial[];
  totalMaterials: number;
}

export interface CourseDTO {
  id: number;
  code: string;
  name: string;
  status?: string;
  approvalStatus?: string;
  requesterName?: string;
  rejectionReason?: string;
  submittedAt?: string;
  decidedAt?: string;
  effectiveDate?: string;
  createdAt?: string;
  updatedAt?: string;
  subjectName?: string;
  levelName?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface CreateCourseRequest {
  basicInfo: {
    subjectId: number;
    levelId?: number;
    code: string;
    name: string;
    description?: string;
    prerequisites?: string;
    durationHours?: number;
    durationWeeks?: number;
    numberOfSessions?: number;
    scoreScale?: string;
    targetAudience?: string;
    teachingMethods?: string;
    effectiveDate?: string;
    sessionPerWeek?: number;
    hoursPerSession?: number;
  };
  clos?: {
    code: string;
    description: string;
    mappedPLOs?: string[];
  }[];
  structure?: {
    phases: {
      id?: number | null;
      name: string;
      description?: string;
      sessions?: {
        id?: number | null;
        topic: string;
        studentTask?: string;
        skills?: string[];
        mappedCLOs?: string[];
        materials?: {
          id?: number | null;
          title: string;
          materialType: string;
          scope?: string;
          url: string;
          phaseId?: number | null;
          sessionId?: number | null;
        }[];
      }[];
      materials?: {
        id?: number | null;
        title: string;
        materialType: string;
        scope?: string;
        url: string;
        phaseId?: number | null;
        sessionId?: number | null;
      }[];
    }[];
  };
  assessments?: {
    id?: number | null;
    name: string;
    type: string;
    weight?: number;
    durationMinutes?: number;
    skills?: string[];
    description?: string;
    note?: string;
    mappedCLOs?: string[];
  }[];
  materials?: {
    id?: number | null;
    title: string;
    materialType: string;
    scope?: string;
    url: string;
    phaseId?: number | null;
    sessionId?: number | null;
  }[];
  status?: string;
}

export const courseApi = createApi({
  reducerPath: 'courseApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Course', 'Material', 'Progress'],
  endpoints: (builder) => ({
    // Student's enrolled courses
    getStudentCourses: builder.query<StudentCourse[], number>({
      query: (studentId) => `/courses/student/${studentId}`,
      transformResponse: (response: { data: StudentCourse[] }) => response.data,
      providesTags: ['Course'],
    }),

    // Course detail information
    getCourseDetail: builder.query<CourseDetail, number>({
      query: (courseId) => `/courses/${courseId}/detail`,
      transformResponse: (response: { data: CourseDetail }) => response.data,
      providesTags: ['Course'],
    }),

    // Course syllabus
    getCourseSyllabus: builder.query<CourseDetail, number>({
      query: (courseId) => `/courses/${courseId}/syllabus`,
      transformResponse: (response: { data: CourseDetail }) => response.data,
      providesTags: ['Course'],
    }),

    // Course materials hierarchy
    getCourseMaterials: builder.query<MaterialHierarchy, { courseId: number; studentId?: number }>({
      query: ({ courseId, studentId }) => ({
        url: `/courses/${courseId}/materials`,
        params: studentId ? { studentId } : undefined,
      }),
      transformResponse: (response: { data: MaterialHierarchy }) => response.data,
      providesTags: ['Material'],
    }),

    // Course PLOs
    getCoursePLOs: builder.query<CoursePLO[], number>({
      query: (courseId) => `/courses/${courseId}/plos`,
      transformResponse: (response: { data: CoursePLO[] }) => response.data,
      providesTags: ['Course'],
    }),

    // Course CLOs
    getCourseCLOs: builder.query<CourseCLO[], number>({
      query: (courseId) => `/courses/${courseId}/clos`,
      transformResponse: (response: { data: CourseCLO[] }) => response.data,
      providesTags: ['Course'],
    }),

    // Student course progress
    getStudentCourseProgress: builder.query<CourseProgress, { studentId: number; courseId: number }>({
      query: ({ studentId, courseId }) => ({
        url: `/courses/student/${studentId}/progress`,
        params: { courseId },
      }),
      transformResponse: (response: { data: CourseProgress }) => response.data,
      providesTags: ['Progress'],
    }),

    // Check material access
    checkMaterialAccess: builder.query<boolean, { courseId: number; materialId: number; studentId: number }>({
      query: ({ courseId, materialId, studentId }) => ({
        url: `/courses/${courseId}/materials/${materialId}/accessible`,
        params: { studentId },
      }),
      transformResponse: (response: { data: boolean }) => response.data,
    }),

    // Create new course
    createCourse: builder.mutation<CourseDetail, CreateCourseRequest>({
      query: (body) => ({
        url: '/courses',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: CourseDetail }) => response.data,
      invalidatesTags: ['Course'],
    }),
    updateCourse: builder.mutation<CourseDetail, { id: number; data: CreateCourseRequest }>({
      query: ({ id, data }) => ({
        url: `/courses/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: { data: CourseDetail }) => response.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Course', id }],
    }),
    deactivateCourse: builder.mutation<void, number>({
      query: (id) => ({
        url: `/courses/${id}/deactivate`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Course', id }],
    }),
    reactivateCourse: builder.mutation<void, number>({
      query: (id) => ({
        url: `/courses/${id}/reactivate`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Course', id }],
    }),
    getCourseDetails: builder.query<ApiResponse<CourseDetail>, number>({
      query: (id) => `/courses/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Course', id }],
    }),
    // Get all courses (optionally filtered)
    getAllCourses: builder.query<CourseDTO[], { subjectId?: number; levelId?: number } | void>({
      query: (params) => ({
        url: '/courses',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: { data: CourseDTO[] }) => response.data,
      providesTags: ['Course'],
    }),
    submitCourse: builder.mutation<void, number>({
      query: (id) => ({
        url: `/courses/${id}/submit`,
        method: 'POST',
      }),
      invalidatesTags: ['Course'],
    }),
    approveCourse: builder.mutation<void, number>({
      query: (id) => ({
        url: `/courses/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Course'],
    }),
    rejectCourse: builder.mutation<void, { id: number; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/courses/${id}/reject`,
        method: 'POST',
        body: reason,
        headers: {
          'Content-Type': 'text/plain',
        },
      }),
      invalidatesTags: ['Course'],
    }),
    deleteCourse: builder.mutation<void, number>({
      query: (id) => ({
        url: `/courses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Course'],
    }),
    cloneCourse: builder.mutation<{ success: boolean; data: { id: number; name: string; code: string; status: string } }, number>({
      query: (id) => ({
        url: `/courses/${id}/clone`,
        method: 'POST',
      }),
      invalidatesTags: ['Course'],
    }),
    getNextVersion: builder.query<{ success: boolean; data: number }, { subjectCode: string; levelCode: string; year: number }>({
      query: ({ subjectCode, levelCode, year }) => ({
        url: `/courses/next-version`,
        params: { subjectCode, levelCode, year },
      }),
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetStudentCoursesQuery,
  useGetCourseDetailQuery,
  useGetCourseSyllabusQuery,
  useGetCourseMaterialsQuery,
  useGetCoursePLOsQuery,
  useGetCourseCLOsQuery,
  useGetStudentCourseProgressQuery,
  useCheckMaterialAccessQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useGetAllCoursesQuery,
  useGetCourseDetailsQuery,
  useDeactivateCourseMutation,
  useReactivateCourseMutation,
  useDeleteCourseMutation,
  useSubmitCourseMutation,
  useApproveCourseMutation,
  useRejectCourseMutation,
  useCloneCourseMutation,
  useGetNextVersionQuery,
  useLazyGetNextVersionQuery,
} = courseApi;
