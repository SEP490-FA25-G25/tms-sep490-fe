import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './authApi'
import type {
  CreateClassFormData,
  CreateClassResponse,
  GetClassSessionsResponse,
  AssignTimeSlotsRequest,
  AssignTimeSlotsResponse,
  AssignResourcesRequest,
  AssignResourcesResponse,
  AssignSessionResourceRequest,
  AssignSessionResourceResponse,
  SessionResourceSuggestionsResponse,
  GetTeacherAvailabilityResponse,
  GetTeachersAvailableByDayResponse,
  AssignTeacherRequest,
  AssignTeacherResponse,
  ValidateClassResponse,
  SubmitClassResponse,
  BranchOption,
  CourseOption,
  TimeSlotOption,
  ResourceOption,
  PreviewClassCodeRequest,
  PreviewClassCodeResponse,
} from '@/types/classCreation'

/**
 * RTK Query API service for Create Class workflow
 * Handles all 7 steps of class creation process
 */
export const classCreationApi = createApi({
  reducerPath: 'classCreationApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Class', 'ClassSessions', 'AvailableTeachers'],
  endpoints: (builder) => ({
    // ============ OPTIONS/LOOKUP ENDPOINTS ============

    /**
     * Get list of branches for dropdown
     */
    getBranches: builder.query<{ success: boolean; data: BranchOption[] }, void>({
      query: () => '/branches',
    }),

    /**
     * Get list of subjects for dropdown (previously called courses)
     */
    getCourses: builder.query<{ success: boolean; data: CourseOption[] }, void>({
      query: () => '/subjects',
    }),

    /**
     * Get time slot templates for dropdown
     */
    getTimeSlots: builder.query<{ success: boolean; data: TimeSlotOption[] }, { branchId: number }>({
      query: ({ branchId }) => `/branches/${branchId}/time-slot-templates`,
    }),

    /**
     * Get resources (rooms/online accounts) for dropdown
     * @param modality - Filter by class modality
     */
    getResources: builder.query<
      { success: boolean; data: ResourceOption[] },
      { classId: number; timeSlotId?: number; dayOfWeek?: number }
    >({
      query: ({ classId, timeSlotId, dayOfWeek }) => ({
        url: `/classes/${classId}/resources`,
        method: 'GET',
        params: {
          timeSlotId,
          dayOfWeek,
        },
      }),
    }),

    // ============ STEP 1: Create Class Basic Info ============

    /**
     * STEP 1: Create new class with basic information
     * Returns classId and auto-generated sessions
     */
    createClass: builder.mutation<CreateClassResponse, CreateClassFormData>({
      query: (data) => ({
        url: '/classes',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Class'],
    }),

    /**
     * Update existing class (DRAFT/REJECTED)
     */
    updateClass: builder.mutation<CreateClassResponse, { classId: number; data: CreateClassFormData }>({
      query: ({ classId, data }) => ({
        url: `/classes/${classId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Class'],
    }),

    /**
     * Preview class code before submission
     */
    previewClassCode: builder.mutation<PreviewClassCodeResponse, PreviewClassCodeRequest>({
      query: (params) => ({
        url: '/classes/preview-code',
        method: 'GET',
        params,
      }),
    }),

    /**
     * Check if class name already exists in a branch
     */
    checkClassName: builder.query<
      { success: boolean; message: string; data: { exists: boolean; branchId: number; name: string } },
      { branchId: number; name: string; excludeId?: number }
    >({
      query: ({ branchId, name, excludeId }) => ({
        url: '/classes/check-name',
        params: { branchId, name, ...(excludeId && { excludeId }) },
      }),
    }),

    // ============ STEP 2: Review Sessions (Optional) ============

    /**
     * STEP 2: Get generated sessions for review
     */
    getClassSessions: builder.query<GetClassSessionsResponse, number>({
      query: (classId) => `/classes/${classId}/sessions`,
      providesTags: ['ClassSessions'],
    }),

    validateClassStatus: builder.query<GetClassSessionsResponse, number>({
      query: (classId) => `/classes/${classId}/validate`,
    }),

    // ============ STEP 3: Assign Time Slots ============

    /**
     * STEP 3: Assign time slots to sessions using pattern
     * Bulk assignment based on day-of-week mapping
     */
    assignTimeSlots: builder.mutation<
      AssignTimeSlotsResponse,
      { classId: number; data: AssignTimeSlotsRequest }
    >({
      query: ({ classId, data }) => ({
        url: `/classes/${classId}/time-slots`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ClassSessions'],
    }),

    // ============ STEP 4: Assign Resources ============

    /**
     * STEP 4: Assign resources (rooms/online) to sessions
     * Returns conflicts if any resource is already booked
     */
    assignResources: builder.mutation<
      AssignResourcesResponse,
      { classId: number; data: AssignResourcesRequest }
    >({
      query: ({ classId, data }) => ({
        url: `/classes/${classId}/resources`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ClassSessions'],
    }),

    /**
     * STEP 4 Quick Fix: Get resource suggestions for a specific session
     */
    getSessionResourceSuggestions: builder.query<
      SessionResourceSuggestionsResponse,
      { classId: number; sessionId: number }
    >({
      query: ({ classId, sessionId }) => ({
        url: `/classes/${classId}/sessions/${sessionId}/resources`,
        method: 'GET',
      }),
    }),

    /**
     * STEP 4 Quick Fix: Assign resource to a specific session
     */
    assignSessionResource: builder.mutation<
      AssignSessionResourceResponse,
      { classId: number; sessionId: number; data: AssignSessionResourceRequest }
    >({
      query: ({ classId, sessionId, data }) => ({
        url: `/classes/${classId}/sessions/${sessionId}/resource`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ClassSessions'],
    }),

    // ============ STEP 5A: Teacher Availability ============

    /**
     * STEP 5A: Get teachers with availability analysis (split view)
     * includeConflictDetails=true returns detailed conflict payload
     */
    getTeacherAvailability: builder.query<
      GetTeacherAvailabilityResponse,
      { classId: number }
    >({
      query: ({ classId }) => ({
        url: `/classes/${classId}/available-teachers`,
        method: 'GET',
      }),
      providesTags: ['AvailableTeachers'],
    }),

    /**
     * STEP 5A (multi-teacher mode): Get teachers fully available for each day
     */
    getTeachersAvailableByDay: builder.query<
      GetTeachersAvailableByDayResponse,
      { classId: number }
    >({
      query: ({ classId }) => ({
        url: `/classes/${classId}/teachers/available-by-day`,
        method: 'GET',
      }),
      providesTags: ['AvailableTeachers'],
    }),

    // ============ STEP 5B: Assign Teacher ============

    /**
     * STEP 5B: Assign teacher to class sessions
     * Supports both full assignment and partial assignment
     */
    assignTeacher: builder.mutation<
      AssignTeacherResponse,
      { classId: number; data: AssignTeacherRequest }
    >({
      query: ({ classId, data }) => ({
        url: `/classes/${classId}/teachers`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ClassSessions', 'AvailableTeachers'],
    }),

    // ============ STEP 6: Validate Class ============

    /**
     * STEP 6: Validate class completeness
     * Checks if all sessions have time slots, resources, and teachers
     */
    validateClass: builder.mutation<ValidateClassResponse, number>({
      query: (classId) => ({
        url: `/classes/${classId}/validate`,
        method: 'POST',
      }),
    }),

    // ============ STEP 7: Submit for Approval ============

    /**
     * STEP 7: Submit class for approval
     * Changes status from DRAFT to SCHEDULED
     */
    submitClass: builder.mutation<SubmitClassResponse, number>({
      query: (classId) => ({
        url: `/classes/${classId}/submit`,
        method: 'POST',
      }),
      invalidatesTags: ['Class'],
    }),
  }),
})

// Export hooks for usage in components
export const {
  useGetBranchesQuery,
  useGetCoursesQuery,
  useGetTimeSlotsQuery,
  useGetResourcesQuery,
  useLazyGetResourcesQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  usePreviewClassCodeMutation,
  useCheckClassNameQuery,
  useLazyCheckClassNameQuery,
  useGetClassSessionsQuery,
  useAssignTimeSlotsMutation,
  useAssignResourcesMutation,
  useGetSessionResourceSuggestionsQuery,
  useLazyGetSessionResourceSuggestionsQuery,
  useAssignSessionResourceMutation,
  useGetTeacherAvailabilityQuery,
  useLazyGetTeacherAvailabilityQuery,
  useGetTeachersAvailableByDayQuery,
  useAssignTeacherMutation,
  useValidateClassMutation,
  useSubmitClassMutation,
} = classCreationApi
