import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./authApi";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type SessionStatus = "PLANNED" | "DONE" | "CANCELLED";
export type SessionType = "CLASS" | "MAKEUP" | "ASSESSMENT" | "WORKSHOP" | "EVENT";
export type ClassModality = "OFFLINE" | "ONLINE";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface TimeSlotDTO {
  id?: number;
  timeSlotTemplateId?: number;
  name?: string;
  displayName?: string;
  startTime: string;
  endTime: string;
}

export interface MakeupInfoDTO {
  isMakeup?: boolean;
  originalSessionId?: number;
  originalDate?: string;
  originalStartTime?: string;
  originalEndTime?: string;
  originalStatus?: SessionStatus;
  reason?: string;
  makeupDate?: string;
}

export interface TeacherSessionSummaryDTO {
  sessionId: number;
  date: string;
  dayOfWeek: DayOfWeek;
  timeSlotTemplateId: number;
  startTime: string;
  endTime: string;
  subjectId?: number;
  subjectName?: string;
  classCode: string;
  className: string;
  courseId: number;
  courseName: string;
  topic: string;
  sessionType: SessionType;
  sessionStatus: SessionStatus;
  modality: ClassModality;
  location: string | null;
  branchName: string;
  resourceType?: "ROOM" | "VIRTUAL" | string;
  resourceCode?: string | null;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  attendanceSubmitted: boolean;
  isMakeup: boolean;
  makeupInfo: MakeupInfoDTO | null;
}

export interface TeacherWeeklyScheduleData {
  weekStart: string;
  weekEnd: string;
  teacherId: number;
  teacherName: string;
  timeSlots: TimeSlotDTO[];
  schedule: Record<DayOfWeek, TeacherSessionSummaryDTO[]>;
}

export interface ClassInfoDTO {
  classId: number;
  classCode: string;
  className: string;
  courseId: number;
  courseName: string;
  teacherId: number;
  teacherName: string;
  branchId: number;
  branchName: string;
  modality: ClassModality;
}

export interface SessionInfoDTO {
  topic: string;
  description: string | null;
  sessionType: SessionType;
  sessionStatus: SessionStatus;
  location: string | null;
  onlineLink: string | null;
}

export interface MaterialDTO {
  materialId: number;
  fileName: string;
  fileUrl: string;
  uploadedAt?: string | null;
}

export interface ResourceDTO {
  resourceId: number;
  resourceCode: string;
  resourceName: string;
  resourceType: "ROOM" | "VIRTUAL" | string;
  capacity?: number | null;
  location?: string | null;
  onlineLink?: string | null;
}

export interface TeacherSessionDetailDTO {
  sessionId: number;
  date: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  timeSlotName: string;
  classInfo: ClassInfoDTO;
  sessionInfo: SessionInfoDTO;
  materials: MaterialDTO[];
  classroomResource: ResourceDTO | null;
  makeupInfo: MakeupInfoDTO | null;
  attendanceSummary: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    attendanceSubmitted: boolean;
  };
}

export interface WeeklyScheduleQuery {
  weekStart: string;
  classId?: number;
}

export const teacherScheduleApi = createApi({
  reducerPath: "teacherScheduleApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["WeeklySchedule", "SessionDetail"],
  endpoints: (builder) => ({
    getCurrentWeek: builder.query<ApiResponse<string>, void>({
      query: () => ({
        url: "/teacher/current-week",
      }),
    }),
    getWeeklySchedule: builder.query<
      ApiResponse<TeacherWeeklyScheduleData>,
      WeeklyScheduleQuery
    >({
      query: ({ weekStart, classId }) => ({
        url: "/teacher/schedule",
        params: {
          weekStart,
          ...(typeof classId === "number" ? { classId } : {}),
        },
      }),
      providesTags: (_result, _error, { weekStart, classId }) => [
        {
          type: "WeeklySchedule",
          id: classId ? `${weekStart}-${classId}` : weekStart,
        },
      ],
    }),
    getSessionDetail: builder.query<ApiResponse<TeacherSessionDetailDTO>, number>(
      {
        query: (sessionId) => ({
          url: `/teacher/sessions/${sessionId}`,
        }),
        providesTags: (_result, _error, sessionId) => [
          { type: "SessionDetail", id: sessionId },
        ],
      }
    ),
  }),
});

export const {
  useGetCurrentWeekQuery,
  useGetWeeklyScheduleQuery,
  useGetSessionDetailQuery,
} = teacherScheduleApi;


