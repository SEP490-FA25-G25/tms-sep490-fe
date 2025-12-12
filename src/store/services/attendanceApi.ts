import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../index";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

export interface AttendanceSessionDTO {
  sessionId: number;
  classId: number;
  classCode?: string;
  subjectCode?: string;
  subjectName: string;
  date: string;
  startTime: string;
  endTime: string;
  status?: string;
  attendanceSubmitted: boolean;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  className?: string;
  topic?: string;
  modality?: string;
  resourceName?: string;
}

export interface AttendanceSessionsResponse {
  data: AttendanceSessionDTO[];
  message?: string;
}

export interface AttendanceStudentDTO {
  studentId: number;
  studentCode?: string;
  fullName: string;
  email?: string;
  attendanceStatus?: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  attendanceId?: number;
  homeworkStatus?: string | null;
  note?: string | null;
  makeup?: boolean;
  makeupSessionId?: number | null;
}

export interface AttendanceSessionDetailDTO {
  sessionId: number;
  classId: number;
  classCode?: string;
  subjectCode?: string;
  subjectName: string;
  date: string;
  timeSlotName?: string;
  sessionStartTime?: string;
  sessionEndTime?: string;
  sessionTopic?: string;
  teacherName?: string;
  teacherNote?: string | null;
  hasHomework?: boolean;
  summary: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
  };
  students: AttendanceStudentDTO[];
}

export interface AttendanceStudentsResponse {
  success?: boolean;
  message?: string;
  data: AttendanceSessionDetailDTO;
}

export interface AttendanceReportDTO {
  sessionId: number;
  classId: number;
  classCode?: string;
  subjectCode?: string;
  subjectName: string;
  date: string;
  timeSlotName?: string;
  sessionStartTime?: string;
  sessionEndTime?: string;
  sessionTopic?: string;
  teacherName?: string;
  teacherNote?: string | null;
  summary: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
  };
}

export interface AttendanceReportResponse {
  success?: boolean;
  message?: string;
  data: AttendanceReportDTO;
}

export interface AttendanceClassDTO {
  id: number;
  code: string;
  name: string;
  subjectName?: string;
  subjectCode?: string;
  curriculumName?: string;
  branchName: string;
  branchCode: string;
  modality: "ONLINE" | "OFFLINE";
  startDate: string;
  plannedEndDate: string;
  status: string;
  totalSessions?: number;
  attendanceRate?: number; // rate as decimal (0-1), e.g., 0.7747 = 77.47%
}

export interface AttendanceClassesResponse {
  success?: boolean;
  message?: string;
  data: AttendanceClassDTO[];
}

export interface StudentAttendanceOverviewClassDTO {
  classId: number;
  classCode: string;
  className: string;
  courseId?: number;
  courseCode?: string;
  courseName?: string;
  subjectId?: number;
  subjectCode?: string;
  subjectName?: string;
  curriculumName?: string;
   startDate: string;
   actualEndDate: string | null;
  totalSessions: number;
  attended: number;
  absent: number;
  excused?: number;
  upcoming: number;
  status: string;
  enrollmentStatus?: string;
  lastUpdated: string | null;
}

export interface StudentAttendanceOverviewResponse {
  success?: boolean;
  message?: string;
  data: {
    classes: StudentAttendanceOverviewClassDTO[];
  };
}

export interface StudentAttendanceReportMakeupInfo {
  sessionId: number;
  classId: number;
  classCode?: string;
  date: string;
  attended?: boolean;
}

export interface StudentAttendanceReportSessionDTO {
  sessionId: number;
  sessionNumber?: number;
  date: string;
  startTime?: string;
  endTime?: string;
  classroomName?: string;
  teacherName?: string;
  topic?: string;
  attendanceStatus?:
    | "PRESENT"
    | "ABSENT"
    | "LATE"
    | "EXCUSED"
    | "PLANNED"
    | "UNKNOWN";
  note?: string | null;
  isMakeup?: boolean;
  makeupSessionInfo?: StudentAttendanceReportMakeupInfo | null;
}

export interface StudentAttendanceReportDTO {
  classId: number;
  classCode: string;
  className: string;
  courseId?: number;
  courseCode?: string;
  courseName?: string;
  startDate?: string;
  actualEndDate?: string | null;
  status?: string;
  summary: {
    totalSessions: number;
    attended: number;
    absent: number;
    excused?: number;
    upcoming: number;
    attendanceRate?: number; // rate as decimal (0-1)
  };
  sessions: StudentAttendanceReportSessionDTO[];
}

export interface StudentAttendanceReportResponse {
  success?: boolean;
  message?: string;
  data: StudentAttendanceReportDTO;
}

export interface AttendanceMatrixStudentDTO {
  studentId: number;
  studentCode?: string;
  fullName: string;
  email?: string;
  attendanceRate: number; // rate as decimal (0-1), e.g., 0.7747 = 77.47%
}

export interface AttendanceMatrixSessionDTO {
  sessionId: number;
  date: string;
  startTime?: string;
  endTime?: string;
  timeSlotName?: string;
  sessionStartTime?: string; // Deprecated: use startTime instead
  sessionEndTime?: string; // Deprecated: use endTime instead
  sessionTopic?: string;
  status?: string;
}

export interface AttendanceMatrixCellDTO {
  sessionId: number;
  attendanceStatus: "PRESENT" | "ABSENT" | "EXCUSED" | null;
  makeup?: boolean;
  homeworkStatus?: "COMPLETED" | "INCOMPLETE" | "NO_HOMEWORK" | null;
}

export interface AttendanceMatrixStudentResponseDTO {
  studentId: number;
  studentCode?: string;
  fullName: string;
  email?: string;
  attendanceRate?: number; // rate as decimal (0-1)
  cells: AttendanceMatrixCellDTO[];
}

export interface AttendanceMatrixResponseDTO {
  classId?: number;
  classCode?: string;
  subjectCode?: string;
  subjectName?: string;
  className?: string;
  attendanceRate?: number; // rate as decimal (0-1), tỷ lệ chuyên cần của cả lớp
  summary?: {
    totalSessions: number;
    averageAttendanceRate?: number; // rate as decimal (0-1)
  };
  students: AttendanceMatrixStudentResponseDTO[];
  sessions?: AttendanceMatrixSessionDTO[];
}

export interface AttendanceMatrixDTO {
  classId: number;
  classCode?: string;
  subjectCode?: string;
  className: string;
  summary: {
    totalSessions: number;
    averageAttendanceRate: number; // rate as decimal (0-1), e.g., 0.7747 = 77.47%
  };
  students: AttendanceMatrixStudentDTO[];
  sessions: AttendanceMatrixSessionDTO[];
  matrix: Record<
    number,
    Record<number, "P" | "A" | "E" | "-">
  >; // { studentId: { sessionId: status } }
  homeworkMatrix: Record<
    number,
    Record<number, "DONE" | "NOT_DONE" | "NONE">
  >; // { studentId: { sessionId: homeworkStatus } }
}

export interface AttendanceMatrixResponse {
  success?: boolean;
  message?: string;
  data: AttendanceMatrixResponseDTO | AttendanceMatrixDTO;
}

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

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
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
      const refreshData = refreshResult.data as {
        accessToken: string;
        refreshToken: string;
      };
      // Update tokens in store
      api.dispatch({
        type: "auth/setTokens",
        payload: {
          accessToken: refreshData.accessToken,
          refreshToken: refreshData.refreshToken,
        },
      });

      // Retry original query with new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed, logout user
      api.dispatch({ type: "auth/logout" });
    }
  }

  return result;
};

export const attendanceApi = createApi({
  reducerPath: "attendanceApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["AttendanceSession"],
  endpoints: (builder) => ({
    // Get today's sessions for attendance
    getTodaySessions: builder.query<AttendanceSessionsResponse, void>({
      query: () => ({
        url: "/attendance/sessions/today",
        method: "GET",
      }),
      providesTags: ["AttendanceSession"],
    }),
    getSessionsForDate: builder.query<AttendanceSessionsResponse, string>({
      query: (date) => ({
        url: `/attendance/sessions/today?date=${date}`,
        method: "GET",
      }),
      providesTags: ["AttendanceSession"],
    }),
    getSessionStudents: builder.query<
      AttendanceStudentsResponse,
      number
    >({
      query: (sessionId) => ({
        url: `/attendance/sessions/${sessionId}/students`,
        method: "GET",
      }),
      providesTags: (_result, _error, sessionId) => [
        { type: "AttendanceSession", id: sessionId },
      ],
    }),
    getSessionReport: builder.query<AttendanceReportResponse, number>({
      query: (sessionId) => ({
        url: `/attendance/sessions/${sessionId}/report`,
        method: "GET",
      }),
      providesTags: (_result, _error, sessionId) => [
        { type: "AttendanceSession", id: sessionId },
      ],
    }),
    submitAttendance: builder.mutation<
      { success: boolean; message?: string },
      {
        sessionId: number;
        attendanceRecords: Array<{
          studentId: number;
          attendanceStatus: "PRESENT" | "ABSENT";
          homeworkStatus?: "COMPLETED" | "INCOMPLETE";
          note?: string;
        }>;
      }
    >({
      query: ({ sessionId, attendanceRecords }) => ({
        url: `/attendance/sessions/${sessionId}/save`,
        method: "POST",
        body: {
          records: attendanceRecords,
        },
      }),
      invalidatesTags: (_result, _error, { sessionId }) => [
        { type: "AttendanceSession", id: sessionId },
        "AttendanceSession",
      ],
    }),
    submitReport: builder.mutation<
      { success: boolean; message?: string },
      {
        sessionId: number;
        teacherNote: string;
      }
    >({
      query: ({ sessionId, teacherNote }) => ({
        url: `/attendance/sessions/${sessionId}/report`,
        method: "POST",
        body: {
          teacherNote,
        },
      }),
      invalidatesTags: (_result, _error, { sessionId }) => [
        { type: "AttendanceSession", id: sessionId },
        "AttendanceSession",
      ],
    }),
    getAttendanceClasses: builder.query<AttendanceClassesResponse, void>({
      query: () => ({
        url: "/teacher/classes",
        method: "GET",
      }),
      providesTags: ["AttendanceSession"],
    }),
    getStudentAttendanceOverview: builder.query<
      StudentAttendanceOverviewResponse,
      void
    >({
      query: () => ({
        url: "/students/attendance/overview",
        method: "GET",
      }),
    }),
    getStudentAttendanceReport: builder.query<
      StudentAttendanceReportResponse,
      { classId: number }
    >({
      query: ({ classId }) => ({
        url: "/students/attendance/report",
        method: "GET",
        params: { classId },
      }),
    }),
    getClassAttendanceMatrix: builder.query<
      AttendanceMatrixResponse,
      {
        classId: number;
        startDate?: string;
        endDate?: string;
      }
    >({
      query: ({ classId, startDate, endDate }) => {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return {
          url: `/teacher/classes/${classId}/matrix`,
          method: "GET",
          params: Object.keys(params).length > 0 ? params : undefined,
        };
      },
      providesTags: (_result, _error, { classId }) => [
        { type: "AttendanceSession", id: `class-${classId}` },
      ],
    }),
    getTeacherClassSessionsMetrics: builder.query<
      {
        success: boolean;
        message: string;
        data: import("@/types/qa").QASessionListResponse;
      },
      number
    >({
      query: (classId) => ({
        url: `/teacher/classes/${classId}/sessions/metrics`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useGetTodaySessionsQuery,
  useGetSessionsForDateQuery,
  useGetSessionStudentsQuery,
  useGetSessionReportQuery,
  useSubmitAttendanceMutation,
  useSubmitReportMutation,
  useGetAttendanceClassesQuery,
  useGetClassAttendanceMatrixQuery,
  useGetStudentAttendanceOverviewQuery,
  useGetStudentAttendanceReportQuery,
  useGetTeacherClassSessionsMetricsQuery,
} = attendanceApi;

