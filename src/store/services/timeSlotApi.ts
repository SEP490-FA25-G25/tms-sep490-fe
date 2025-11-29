import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./authApi";

// Types
export interface TimeSlotTemplate {
    id: number;
    branchId: number;
    branchName: string;
    name: string;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    createdAt: string;
    updatedAt: string;
}

export interface TimeSlotQueryParams {
    branchId?: number;
    search?: string;
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

export const timeSlotApi = createApi({
    reducerPath: "timeSlotApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["TimeSlot"],
    endpoints: (builder) => ({
        // Get all time slots with optional filters
        getTimeSlots: builder.query<TimeSlotTemplate[], TimeSlotQueryParams>({
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
        getTimeSlotById: builder.query<TimeSlotTemplate, number>({
            query: (id) => `/time-slots/${id}`,
            providesTags: (_result, _error, id) => [{ type: "TimeSlot", id }],
        }),

        // Create new time slot
        createTimeSlot: builder.mutation<TimeSlotTemplate, CreateTimeSlotRequest>({
            query: (body) => ({
                url: "/time-slots",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "TimeSlot", id: "LIST" }],
        }),

        // Update time slot
        updateTimeSlot: builder.mutation<TimeSlotTemplate, UpdateTimeSlotRequest>({
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
    }),
});

export const {
    useGetTimeSlotsQuery,
    useGetTimeSlotByIdQuery,
    useCreateTimeSlotMutation,
    useUpdateTimeSlotMutation,
    useDeleteTimeSlotMutation,
} = timeSlotApi;
