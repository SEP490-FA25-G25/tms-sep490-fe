import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./authApi";

// Types
export type ResourceType = "ROOM" | "VIRTUAL";

export interface Resource {
    id: number;
    branchId: number;
    branchName: string;
    resourceType: ResourceType;
    code: string;
    name: string;
    description?: string;
    capacity?: number;
    capacityOverride?: number;
    equipment?: string;
    // For VIRTUAL resources
    meetingUrl?: string;
    meetingId?: string;
    meetingPasscode?: string;
    accountEmail?: string;
    accountPassword?: string;
    licenseType?: string;
    expiryDate?: string;
    renewalDate?: string;
    // Statistics
    activeClassesCount?: number;
    totalSessionsCount?: number;
    nextSessionInfo?: string;
    // Flags for UI actions
    hasAnySessions?: boolean; // Can't delete if true
    hasFutureSessions?: boolean; // Can't deactivate if true
    createdBy?: number;
    createdAt: string;
    updatedAt: string;
    status: "ACTIVE" | "INACTIVE";
}

export interface ResourcesQueryParams {
    branchId?: number;
    resourceType?: ResourceType;
    search?: string;
}

export interface CreateResourceRequest {
    branchId: number;
    resourceType: ResourceType;
    code: string;
    name: string;
    description?: string;
    capacity?: number;
    capacityOverride?: number;
    equipment?: string;
    meetingUrl?: string;
    meetingId?: string;
    meetingPasscode?: string;
    accountEmail?: string;
    accountPassword?: string;
    licenseType?: string;
    expiryDate?: string;
    renewalDate?: string;
}

export interface UpdateResourceRequest extends Partial<CreateResourceRequest> {
    id: number;
}

export interface TimeSlot {
    id: number;
    branchId: number;
    branchName: string;
    name: string;
    startTime: string;
    endTime: string;
    createdAt: string;
    updatedAt: string;
    status: "ACTIVE" | "INACTIVE";
    // Statistics
    activeClassesCount?: number;
    totalSessionsCount?: number;
    // Flags for UI actions
    hasAnySessions?: boolean; // Can't delete if true
    hasFutureSessions?: boolean; // Can't deactivate if true
}

export interface CreateTimeSlotRequest {
    branchId: number;
    name: string;
    startTime: string;
    endTime: string;
}

export interface UpdateTimeSlotRequest extends Partial<CreateTimeSlotRequest> {
    id: number;
}

export const resourceApi = createApi({
    reducerPath: "resourceApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Resource", "TimeSlot"],
    endpoints: (builder) => ({
        // Get all resources with optional filters
        getResources: builder.query<Resource[], ResourcesQueryParams>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params.branchId) searchParams.append("branchId", params.branchId.toString());
                if (params.resourceType) searchParams.append("resourceType", params.resourceType);
                if (params.search) searchParams.append("search", params.search);

                const queryString = searchParams.toString();
                return `/resources${queryString ? `?${queryString}` : ""}`;
            },
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: "Resource" as const, id })),
                        { type: "Resource", id: "LIST" },
                    ]
                    : [{ type: "Resource", id: "LIST" }],
        }),

        // Get resource by ID
        getResourceById: builder.query<Resource, number>({
            query: (id) => `/resources/${id}`,
            providesTags: (_result, _error, id) => [{ type: "Resource", id }],
        }),

        // Create new resource
        createResource: builder.mutation<Resource, CreateResourceRequest>({
            query: (body) => ({
                url: "/resources",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Resource", id: "LIST" }],
        }),

        // Update resource
        updateResource: builder.mutation<Resource, UpdateResourceRequest>({
            query: ({ id, ...body }) => ({
                url: `/resources/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Resource", id },
                { type: "Resource", id: "LIST" },
            ],
        }),

        // Delete resource
        deleteResource: builder.mutation<void, number>({
            query: (id) => ({
                url: `/resources/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: "Resource", id },
                { type: "Resource", id: "LIST" },
            ],
        }),

        // Update resource status
        updateResourceStatus: builder.mutation<Resource, { id: number; status: "ACTIVE" | "INACTIVE" }>({
            query: ({ id, status }) => ({
                url: `/resources/${id}/status`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Resource", id },
                { type: "Resource", id: "LIST" },
            ],
        }),

        // ==================== TIME SLOTS ====================

        // Get all time slots
        getTimeSlots: builder.query<TimeSlot[], ResourcesQueryParams>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params.branchId) searchParams.append("branchId", params.branchId.toString());
                if (params.search) searchParams.append("search", params.search);

                const queryString = searchParams.toString();
                return `/time-slots${queryString ? `?${queryString}` : ""}`;
            },
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: "TimeSlot" as const, id })),
                        { type: "TimeSlot", id: "LIST" },
                    ]
                    : [{ type: "TimeSlot", id: "LIST" }],
        }),

        // Get time slot by ID
        getTimeSlotById: builder.query<TimeSlot, number>({
            query: (id) => `/time-slots/${id}`,
            providesTags: (_result, _error, id) => [{ type: "TimeSlot", id }],
        }),

        // Create new time slot
        createTimeSlot: builder.mutation<TimeSlot, CreateTimeSlotRequest>({
            query: (body) => ({
                url: "/time-slots",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "TimeSlot", id: "LIST" }],
        }),

        // Update time slot
        updateTimeSlot: builder.mutation<TimeSlot, UpdateTimeSlotRequest>({
            query: ({ id, ...body }) => ({
                url: `/time-slots/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "TimeSlot", id },
                { type: "TimeSlot", id: "LIST" },
            ],
        }),

        // Delete time slot
        deleteTimeSlot: builder.mutation<void, number>({
            query: (id) => ({
                url: `/time-slots/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: "TimeSlot", id },
                { type: "TimeSlot", id: "LIST" },
            ],
        }),

        // Update time slot status
        updateTimeSlotStatus: builder.mutation<TimeSlot, { id: number; status: "ACTIVE" | "INACTIVE" }>({
            query: ({ id, status }) => ({
                url: `/time-slots/${id}/status`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "TimeSlot", id },
                { type: "TimeSlot", id: "LIST" },
            ],
        }),
    }),
});

export interface ResourceSession {
    id: number;
    classId: number;
    classCode: string;
    className: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    type: string;
}

export const resourceApiWithSessions = resourceApi.injectEndpoints({
    endpoints: (builder) => ({
        getSessionsByResourceId: builder.query<ResourceSession[], number>({
            query: (id) => `/resources/${id}/sessions`,
        }),
        getSessionsByTimeSlotId: builder.query<ResourceSession[], number>({
            query: (id) => `/time-slots/${id}/sessions`,
        }),
    }),
});

export const {
    useGetResourcesQuery,
    useGetResourceByIdQuery,
    useCreateResourceMutation,
    useUpdateResourceMutation,
    useDeleteResourceMutation,
    useUpdateResourceStatusMutation,
    useGetTimeSlotsQuery,
    useGetTimeSlotByIdQuery,
    useCreateTimeSlotMutation,
    useUpdateTimeSlotMutation,
    useDeleteTimeSlotMutation,
    useUpdateTimeSlotStatusMutation,
    useGetSessionsByResourceIdQuery,
    useGetSessionsByTimeSlotIdQuery,
} = resourceApiWithSessions;

