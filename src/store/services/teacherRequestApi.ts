import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../index";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query";

// Types based on backend API
export type RequestType = "MODALITY_CHANGE" | "RESCHEDULE" | "SWAP";
export type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "WAITING_CONFIRM";

export interface TeacherRequestDTO {
  id: number;
  requestType: RequestType;
  status: RequestStatus;
  sessionId: number;
  sessionDate: string;
  sessionStartTime: string;
  sessionEndTime: string;
  className: string;
  courseName: string;
  classCode?: string;
  sessionTopic?: string;
  teacherId?: number;
  teacherName?: string;
  teacherEmail?: string;
  classInfo?: {
    id?: number;
    classCode?: string;
    name?: string;
    courseName?: string;
    branchName?: string;
    [key: string]: unknown;
  };
  session?: {
    id?: number;
    date?: string;
    startTime?: string;
    endTime?: string;
    className?: string;
    courseName?: string;
    [key: string]: unknown;
  };
  currentModality?: string;
  newModality?: string;
  currentResourceName?: string;
  newResourceName?: string;
  newResourceId?: number;
  newResource?: {
    id?: number;
    name?: string;
    type?: string;
    capacity?: number;
    [key: string]: unknown;
  };
  newDate?: string;
  newSessionDate?: string;
  newSessionStartTime?: string;
  newSessionEndTime?: string;
  newTimeSlotId?: number;
  newTimeSlotLabel?: string;
  newTimeSlotName?: string;
  newTimeSlotStartTime?: string;
  newTimeSlotEndTime?: string;
  newStartTime?: string;
  newEndTime?: string;
  newSlot?: {
    id?: number;
    startTime?: string;
    endTime?: string;
    label?: string;
    name?: string;
    displayName?: string;
    [key: string]: unknown;
  };
  newTimeSlot?: {
    id?: number;
    timeSlotId?: number;
    startTime?: string;
    endTime?: string;
    startAt?: string;
    endAt?: string;
    label?: string;
    name?: string;
    displayLabel?: string;
    [key: string]: unknown;
  };
  newSession?: {
    id?: number;
    date?: string;
    startTime?: string;
    endTime?: string;
    timeSlotLabel?: string;
    timeSlot?: {
      id?: number;
      startTime?: string;
      endTime?: string;
      label?: string;
      name?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  replacementTeacherId?: number;
  replacementTeacherName?: string;
  replacementTeacherEmail?: string;
  replacementTeacherPhone?: string;
  replacementTeacher?: {
    id?: number;
    fullName?: string;
    email?: string;
    phone?: string;
    specialization?: string;
    matchScore?: number;
    skills?: Array<string | Record<string, unknown>>;
    [key: string]: unknown;
  };
  replacementTeacherSpecialization?: string;
  replacementTeacherNote?: string;
  reason: string;
  requestReason?: string;
  submittedAt: string;
  submittedBy: string;
  decidedAt?: string;
  decidedBy?: string;
  decidedById?: number;
  decidedByName?: string;
  decidedByEmail?: string;
  note?: string;
}

export interface MySessionDTO {
  id?: number; // For backward compatibility
  sessionId: number; // API returns sessionId
  date: string;
  startTime: string;
  endTime: string;
  className: string;
  courseName: string;
  topic?: string;
  requestStatus?: RequestStatus;
  hasPendingRequest: boolean;
}

export interface ResourceDTO {
  id?: number; // API may return either id or resourceId
  resourceId?: number;
  name: string;
  type?: string; // May not be present if resourceType is used
  resourceType?: string; // API may return resourceType instead of type
  capacity: number;
  currentResource?: boolean;
  branchId?: number;
}

export interface RescheduleSlotDTO {
  id?: number;
  timeSlotId?: number;
  startTime?: string;
  endTime?: string;
  startAt?: string;
  endAt?: string;
  label?: string;
  displayLabel?: string;
  name?: string;
  title?: string;
  timeRange?: string;
  timeSlotName?: string;
  timeSlotLabel?: string;
  description?: string;
  timeSlot?: {
    id?: number;
    startTime?: string;
    endTime?: string;
    label?: string;
    name?: string;
    displayName?: string;
  };
  available?: boolean;
  conflictReason?: string | null;
  conflict?: string | null;
  conflictNote?: string | null;
}

export interface RescheduleSlotsResponse {
  success: boolean;
  message: string;
  data: RescheduleSlotDTO[];
}

export interface RescheduleResourceDTO extends ResourceDTO {
  available?: boolean;
  status?: string;
  conflictReason?: string | null;
}

export interface RescheduleResourcesResponse {
  success: boolean;
  message: string;
  data: RescheduleResourceDTO[];
}

export interface SwapCandidateSkillDTO {
  id?: number;
  name?: string;
  skillName?: string;
  skill?: string | { name?: string; code?: string };
  level?: string | number;
  skillLevel?: string | number;
  proficiency?: string | number;
  description?: string;
}

export interface SwapCandidateDTO {
  teacherId?: number;
  teacherName?: string;
  fullName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  level?: string;
  matchScore?: number;
  availability?: string;
  availabilityStatus?: string;
  specialization?: string;
  note?: string;
  tags?: string[];
  skillSummary?: string;
  skillsDescription?: string;
  teacherSkills?: Array<string | SwapCandidateSkillDTO>;
  skills?: SwapCandidateSkillDTO[];
}

export interface SwapCandidatesResponse {
  success: boolean;
  message: string;
  data: SwapCandidateDTO[];
}

export interface CreateRequestRequest {
  sessionId: number;
  requestType: RequestType;
  newResourceId?: number;
  newDate?: string;
  newTimeSlotId?: number;
  replacementTeacherId?: number;
  reason: string;
}

export interface ApproveRequestRequest {
  newResourceId?: number;
  note?: string;
  replacementTeacherId?: number;
}

export interface RejectRequestRequest {
  reason: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface TeacherRequestListResponse {
  success: boolean;
  message: string;
  data: TeacherRequestDTO[];
}

export interface MySessionsResponse {
  success: boolean;
  message: string;
  data: MySessionDTO[];
}

export interface ResourcesResponse {
  success: boolean;
  message: string;
  data: ResourceDTO[];
}

export interface TeacherRequestDetailResponse {
  success: boolean;
  message: string;
  data: TeacherRequestDTO;
}

// Base query with token injection
const baseQuery = fetchBaseQuery({
  baseUrl: "/api/v1",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Base query with token refresh logic
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 Unauthorized - try to refresh token
  if (result.error && result.error.status === 401) {
    const refreshResult = await baseQuery(
      {
        url: "/auth/refresh",
        method: "POST",
        body: {
          refreshToken: (api.getState() as RootState).auth.refreshToken,
        },
      },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Update auth state with new tokens
      const authData = refreshResult.data as {
        data?: {
          accessToken: string;
          refreshToken: string;
          userId: number;
          email: string;
          fullName: string;
          roles: string[];
        };
      };
      if (authData?.data) {
        api.dispatch({
          type: "auth/setCredentials",
          payload: {
            accessToken: authData.data.accessToken,
            refreshToken: authData.data.refreshToken,
            user: {
              id: authData.data.userId,
              email: authData.data.email,
              fullName: authData.data.fullName,
              roles: authData.data.roles,
            },
          },
        });
      }

      // Retry the original request with new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed, logout user
      api.dispatch({ type: "auth/logout" });
    }
  }

  return result;
};

export const teacherRequestApi = createApi({
  reducerPath: "teacherRequestApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["TeacherRequest"],
  endpoints: (builder) => ({
    // Get teacher's requests
    getMyRequests: builder.query<TeacherRequestListResponse, void>({
      query: () => ({
        url: "/teacher-requests/me",
        method: "GET",
      }),
      providesTags: ["TeacherRequest"],
    }),

    // Get teacher's sessions (for creating request)
    getMySessions: builder.query<MySessionsResponse, { date?: string }>({
      query: ({ date }) => ({
        url: "/teacher-requests/my-sessions",
        method: "GET",
        params: date ? { date } : {},
      }),
    }),

    // Get available resources for modality change
    // Supports both requestId (for existing requests) and sessionId (for new requests)
    getModalityResources: builder.query<
      ResourcesResponse,
      { requestId?: number; sessionId?: number }
    >({
      query: ({ requestId, sessionId }) => {
        if (requestId) {
          return {
            url: `/teacher-requests/${requestId}/modality/resources`,
            method: "GET",
          };
        }
        if (sessionId) {
          return {
            url: `/teacher-requests/${sessionId}/modality/resources`,
            method: "GET",
          };
        }
        throw new Error("Either requestId or sessionId must be provided");
      },
    }),

    // Get available slots for reschedule (for teachers only)
    // Note: API for staff (requestId) has been removed from backend
    getRescheduleSlots: builder.query<
      RescheduleSlotsResponse,
      { sessionId: number; date: string }
    >({
      query: ({ sessionId, date }) => ({
        url: `/teacher-requests/${sessionId}/reschedule/slots`,
        method: "GET",
        params: { date },
      }),
    }),

    // Get resource suggestions for reschedule
    // For requestId: backend will use newDate and newTimeSlot from the request
    // For sessionId: need to provide date and timeSlotId
    getRescheduleResources: builder.query<
      RescheduleResourcesResponse,
      { requestId?: number; sessionId?: number; date?: string; timeSlotId?: number }
    >({
      query: ({ requestId, sessionId, date, timeSlotId }) => {
        if (requestId) {
          // For existing requests, backend uses newDate and newTimeSlot from request
          return {
            url: `/teacher-requests/${requestId}/reschedule/suggestions`,
            method: "GET",
          };
        }
        if (sessionId) {
          // For new requests, need to provide date and timeSlotId
          if (!date || timeSlotId === undefined) {
            throw new Error("date and timeSlotId are required when using sessionId");
          }
          return {
            url: `/teacher-requests/${sessionId}/reschedule/suggestions`,
            method: "GET",
            params: {
              date,
              timeSlotId,
            },
          };
        }
        throw new Error("Either requestId or sessionId must be provided");
      },
    }),

    // Get swap candidates for substitute request
    // Supports both requestId (for existing requests) and sessionId (for new requests)
    getSwapCandidates: builder.query<
      SwapCandidatesResponse,
      { requestId?: number; sessionId?: number }
    >({
      query: ({ requestId, sessionId }) => {
        if (requestId) {
          return {
            url: `/teacher-requests/${requestId}/swap/candidates`,
            method: "GET",
          };
        }
        if (sessionId) {
          return {
            url: `/teacher-requests/${sessionId}/swap/candidates`,
            method: "GET",
          };
        }
        throw new Error("Either requestId or sessionId must be provided");
      },
    }),

    // Get request detail
    getRequestById: builder.query<TeacherRequestDetailResponse, number>({
      query: (id) => ({
        url: `/teacher-requests/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "TeacherRequest", id }],
    }),

    // Create request
    createRequest: builder.mutation<
      TeacherRequestDetailResponse,
      CreateRequestRequest
    >({
      query: (body) => ({
        url: "/teacher-requests",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TeacherRequest"],
    }),

    // Staff: Get all requests
    getStaffRequests: builder.query<
      TeacherRequestListResponse,
      { status?: RequestStatus }
    >({
      query: ({ status }) => ({
        url: "/teacher-requests/staff",
        method: "GET",
        params: status ? { status } : {},
      }),
      providesTags: ["TeacherRequest"],
    }),

    // Staff: Approve request
    approveRequest: builder.mutation<
      TeacherRequestDetailResponse,
      { id: number; body: ApproveRequestRequest }
    >({
      query: ({ id, body }) => ({
        url: `/teacher-requests/${id}/approve`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "TeacherRequest", id },
        "TeacherRequest",
      ],
    }),

    // Staff: Reject request
    rejectRequest: builder.mutation<
      TeacherRequestDetailResponse,
      { id: number; body: RejectRequestRequest }
    >({
      query: ({ id, body }) => ({
        url: `/teacher-requests/${id}/reject`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "TeacherRequest", id },
        "TeacherRequest",
      ],
    }),

    // Teacher: Confirm swap request
    confirmSwapRequest: builder.mutation<
      TeacherRequestDetailResponse,
      { id: number; body?: { note?: string } }
    >({
      query: ({ id, body }) => ({
        url: `/teacher-requests/${id}/confirm`,
        method: "PATCH",
        body: body || {},
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "TeacherRequest", id },
        "TeacherRequest",
      ],
    }),

    // Teacher: Reject swap request (decline)
    rejectSwapRequest: builder.mutation<
      TeacherRequestDetailResponse,
      { id: number; body: RejectRequestRequest }
    >({
      query: ({ id, body }) => ({
        url: `/teacher-requests/${id}/decline`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "TeacherRequest", id },
        "TeacherRequest",
      ],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetMyRequestsQuery,
  useGetMySessionsQuery,
  useGetModalityResourcesQuery,
  useGetRescheduleSlotsQuery,
  useGetRescheduleResourcesQuery,
  useGetSwapCandidatesQuery,
  useGetRequestByIdQuery,
  useCreateRequestMutation,
  useGetStaffRequestsQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
  useConfirmSwapRequestMutation,
  useRejectSwapRequestMutation,
} = teacherRequestApi;
