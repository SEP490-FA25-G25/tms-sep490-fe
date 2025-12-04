import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./authApi";

// Types
export interface AvailabilityDTO {
    timeSlotTemplateId: number;
    dayOfWeek: number; // 1-7
    note?: string;
}

export interface TimeSlotTemplateDTO {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    displayName: string;
}

export interface CampaignInfo {
    id: number;
    name: string;
    deadline: string;
    isActive: boolean;
}

export interface TeacherAvailabilityResponse {
    teacherId: number;
    availabilities: AvailabilityDTO[];
    lockedSlots: {
        timeSlotId: number;
        dayOfWeek: number;
        reason: string;
    }[];
    timeSlots?: TimeSlotTemplateDTO[];
    activeCampaign?: CampaignInfo;
}

export interface UpdateAvailabilityRequest {
    availabilities: AvailabilityDTO[];
}

export interface AvailabilityCampaign {
    id: number;
    name: string;
    deadline: string;
    isActive: boolean;
    targetAudience: "ALL" | "FULL_TIME" | "PART_TIME";
    createdAt: string;
}

export interface CreateCampaignRequest {
    name: string;
    deadline: string;
    targetAudience: "ALL" | "FULL_TIME" | "PART_TIME";
}

export interface TeacherStatusDTO {
    teacherId: number;
    fullName: string;
    email: string;
    contractType: "FULL_TIME" | "PART_TIME";
    lastUpdated?: string;
    totalSlots: number;
    status: "UP_TO_DATE" | "OUTDATED";
}

export const teacherAvailabilityApi = createApi({
    reducerPath: "teacherAvailabilityApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Availability", "Campaign", "TeacherStatus"],
    endpoints: (builder) => ({
        // Teacher endpoints
        getMyAvailability: builder.query<TeacherAvailabilityResponse, number | void>({
            query: () => "/teacher/availability/me",
            providesTags: ["Availability"],
            // Force refetch when query arg (userId) changes
            keepUnusedDataFor: 0,
        }),

        updateMyAvailability: builder.mutation<void, UpdateAvailabilityRequest>({
            query: (body) => ({
                url: "/teacher/availability/me",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Availability"],
        }),

        // Academic Staff endpoints
        getAvailabilityCampaigns: builder.query<AvailabilityCampaign[], void>({
            query: () => "/academic/availability-campaigns",
            providesTags: ["Campaign"],
        }),

        createAvailabilityCampaign: builder.mutation<AvailabilityCampaign, CreateCampaignRequest>({
            query: (body) => ({
                url: "/academic/availability-campaigns",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Campaign", "TeacherStatus"],
        }),

        getTeacherAvailabilityStatus: builder.query<TeacherStatusDTO[], { campaignId?: number; branchId?: number } | void>({
            query: (params) => ({
                url: '/academic/availability-status',
                params: params || undefined,
            }),
            providesTags: ['TeacherStatus'],
        }),

        getTeacherAvailability: builder.query<TeacherAvailabilityResponse, number>({
            query: (teacherId) => `/academic/teacher-availability/${teacherId}`,
        }),

        exportTeacherAvailabilityStatus: builder.query<Blob, number | void>({
            query: (campaignId) => ({
                url: "/academic/availability-status/export",
                params: campaignId ? { campaignId } : undefined,
                responseHandler: (response) => response.blob(),
            }),
        }),

        sendReminder: builder.mutation<void, number>({
            query: (teacherId) => ({
                url: `/academic/availability-status/remind/${teacherId}`,
                method: "POST",
            }),
        }),

        sendBulkReminders: builder.mutation<void, number[]>({
            query: (teacherIds) => ({
                url: "/academic/availability-status/remind-bulk",
                method: "POST",
                body: teacherIds,
            }),
        }),
    }),
});

export const {
    useGetMyAvailabilityQuery,
    useUpdateMyAvailabilityMutation,
    useGetAvailabilityCampaignsQuery,
    useCreateAvailabilityCampaignMutation,
    useGetTeacherAvailabilityStatusQuery,
    useGetTeacherAvailabilityQuery,
    useLazyExportTeacherAvailabilityStatusQuery,
    useSendReminderMutation,
    useSendBulkRemindersMutation,
} = teacherAvailabilityApi;
