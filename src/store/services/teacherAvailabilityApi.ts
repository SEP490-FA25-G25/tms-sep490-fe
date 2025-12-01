import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./authApi";

// Types
export interface AvailabilityDTO {
    timeSlotId: number;
    dayOfWeek: number; // 1-7
    note?: string;
}

export interface TeacherAvailabilityResponse {
    teacherId: number;
    availabilities: AvailabilityDTO[];
    lockedSlots: {
        timeSlotId: number;
        dayOfWeek: number;
        reason: string;
    }[];
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
        getMyAvailability: builder.query<TeacherAvailabilityResponse, void>({
            query: () => "/teacher/availability/me",
            providesTags: ["Availability"],
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

        getTeacherAvailabilityStatus: builder.query<TeacherStatusDTO[], void>({
            query: () => "/academic/availability-status",
            providesTags: ["TeacherStatus"],
        }),
    }),
});

export const {
    useGetMyAvailabilityQuery,
    useUpdateMyAvailabilityMutation,
    useGetAvailabilityCampaignsQuery,
    useCreateAvailabilityCampaignMutation,
    useGetTeacherAvailabilityStatusQuery,
} = teacherAvailabilityApi;
