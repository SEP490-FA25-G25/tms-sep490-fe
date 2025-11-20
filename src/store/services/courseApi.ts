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
  subjectName?: string;
  levelName?: string;
  logicalCourseCode?: string;
  version?: number;
  totalHours?: number;
  durationWeeks?: number;
  sessionPerWeek?: number;
  hoursPerSession?: number;
  scoreScale?: string;
  prerequisites?: string;
  targetAudience?: string;
  teachingMethods?: string;
  effectiveDate?: string;
  status: string;
  approvalStatus: string;
  phases?: CoursePhase[];
  materials?: CourseMaterial[];
  clos?: CourseCLO[];
  assessments?: CourseAssessment[];
  totalSessions?: number;
  totalMaterials?: number;
}

export interface CoursePhase {
  id: number;
  phaseNumber: number;
  name: string;
  description?: string;
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
  description?: string;
  objectives?: string;
  skillSets?: string[];
  materials?: CourseMaterial[];
  totalMaterials?: number;
  isCompleted?: boolean;
}

export interface CourseMaterial {
  id: number;
  title: string;
  description?: string;
  materialType?: string;
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
  weight: number;
  maxScore: number;
  duration?: string;
  sessionIds?: number[];
  cloMappings?: string[];
  isCompleted?: boolean;
  achievedScore?: number;
  completedAt?: string;
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
  weight: number;
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
} = courseApi;