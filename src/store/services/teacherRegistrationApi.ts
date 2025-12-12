import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./authApi";
import type { ApiResponse } from "./authApi";

// ==================== TYPES ====================

export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

// Lớp có thể đăng ký dạy
export interface AvailableClassDTO {
  classId: number;
  classCode: string;
  className: string;
  subjectName: string;
  branchName: string;
  modality: "ONLINE" | "OFFLINE";
  startDate: string;
  plannedEndDate: string;
  scheduleDays: number[];
  maxCapacity: number;
  registrationOpenDate: string;
  registrationCloseDate: string;
  totalRegistrations: number;
  alreadyRegistered: boolean;
}

// Đăng ký của giáo viên
export interface MyRegistrationDTO {
  id: number;
  classId: number;
  classCode: string;
  className: string;
  subjectName: string;
  branchName: string;
  modality: string;
  startDate: string;
  plannedEndDate: string;
  scheduleDays: number[];
  status: RegistrationStatus;
  note: string | null;
  registeredAt: string;
  registrationCloseDate: string;
  rejectionReason: string | null;
  canCancel: boolean;
}

// Response sau khi đăng ký
export interface TeacherRegistrationResponse {
  id: number;
  classId: number;
  classCode: string;
  className: string;
  status: string;
  note: string | null;
  registeredAt: string;
}

// Request đăng ký dạy lớp
export interface TeacherRegistrationRequest {
  classId: number;
  note?: string;
}

// Thông tin kỹ năng giáo viên (cho AA review)
export interface TeacherSkillDTO {
  skill: string;
  specialization: string;
  language: string;
  level: number;
}

// Chi tiết đăng ký (cho AA xem)
export interface RegistrationDetailDTO {
  registrationId: number;
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  employeeCode: string;
  contractType: string;
  note: string | null;
  registeredAt: string;
  status: RegistrationStatus;
  currentClassCount: number;
  skills: TeacherSkillDTO[];
}

// Tổng hợp đăng ký của 1 lớp (cho AA review)
export interface ClassRegistrationSummaryDTO {
  classId: number;
  classCode: string;
  className: string;
  subjectName: string;
  modality: string;
  startDate: string;
  scheduleDays: number[];
  registrationCloseDate: string;
  pendingCount: number;
  registrations: RegistrationDetailDTO[];
  assignedTeacherId: number | null;
  assignedTeacherName: string | null;
}

// Request mở đăng ký
export interface OpenRegistrationRequest {
  classId: number;
  registrationOpenDate: string;
  registrationCloseDate: string;
}

// Request duyệt đăng ký
export interface ApproveRegistrationRequest {
  registrationId: number;
}

// Request gán trực tiếp
export interface DirectAssignRequest {
  classId: number;
  teacherId: number;
  reason: string;
}

// ==================== API ====================

export const teacherRegistrationApi = createApi({
  reducerPath: "teacherRegistrationApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["AvailableClasses", "MyRegistrations", "ClassRegistrations"],
  endpoints: (builder) => ({
    // ==================== TEACHER ENDPOINTS ====================

    // Lấy danh sách lớp có thể đăng ký
    getAvailableClasses: builder.query<ApiResponse<AvailableClassDTO[]>, void>({
      query: () => "/teacher-registrations/available-classes",
      providesTags: ["AvailableClasses"],
    }),

    // Đăng ký dạy lớp
    registerForClass: builder.mutation<
      ApiResponse<TeacherRegistrationResponse>,
      TeacherRegistrationRequest
    >({
      query: (body) => ({
        url: "/teacher-registrations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AvailableClasses", "MyRegistrations"],
    }),

    // Lấy danh sách đăng ký của tôi
    getMyRegistrations: builder.query<ApiResponse<MyRegistrationDTO[]>, void>({
      query: () => "/teacher-registrations/me",
      providesTags: ["MyRegistrations"],
    }),

    // Hủy đăng ký
    cancelRegistration: builder.mutation<ApiResponse<void>, number>({
      query: (registrationId) => ({
        url: `/teacher-registrations/${registrationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AvailableClasses", "MyRegistrations"],
    }),

    // ==================== ACADEMIC AFFAIRS ENDPOINTS ====================

    // Mở đăng ký cho lớp
    openRegistration: builder.mutation<ApiResponse<void>, OpenRegistrationRequest>({
      query: (body) => ({
        url: "/teacher-registrations/open-registration",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ClassRegistrations"],
    }),

    // Lấy danh sách lớp cần review
    getClassesNeedingReview: builder.query<
      ApiResponse<ClassRegistrationSummaryDTO[]>,
      void
    >({
      query: () => "/teacher-registrations/classes-needing-review",
      providesTags: ["ClassRegistrations"],
    }),

    // Lấy chi tiết đăng ký của 1 lớp
    getClassRegistrations: builder.query<
      ApiResponse<ClassRegistrationSummaryDTO>,
      number
    >({
      query: (classId) => `/teacher-registrations/classes/${classId}/registrations`,
      providesTags: (_result, _error, classId) => [
        { type: "ClassRegistrations", id: classId },
      ],
    }),

    // Duyệt chọn giáo viên
    approveRegistration: builder.mutation<
      ApiResponse<void>,
      ApproveRegistrationRequest
    >({
      query: (body) => ({
        url: "/teacher-registrations/approve",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ClassRegistrations", "AvailableClasses"],
    }),

    // Gán trực tiếp giáo viên
    directAssignTeacher: builder.mutation<ApiResponse<void>, DirectAssignRequest>({
      query: (body) => ({
        url: "/teacher-registrations/direct-assign",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ClassRegistrations", "AvailableClasses"],
    }),
  }),
});

export const {
  // Teacher hooks
  useGetAvailableClassesQuery,
  useRegisterForClassMutation,
  useGetMyRegistrationsQuery,
  useCancelRegistrationMutation,
  // AA hooks
  useOpenRegistrationMutation,
  useGetClassesNeedingReviewQuery,
  useGetClassRegistrationsQuery,
  useApproveRegistrationMutation,
  useDirectAssignTeacherMutation,
} = teacherRegistrationApi;
