import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/store';

export interface AvailabilityDTO {
    timeSlotId: number;
    dayOfWeek: number;
    status: 'AVAILABLE' | 'BUSY';
}

export interface TimeSlotTemplate {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
}

export interface AvailabilityMatrixDTO {
    timeSlots: TimeSlotTemplate[];
    matrix: Record<number, Record<number, 'AVAILABLE' | 'BUSY' | 'LOCKED'>>;
    lockReasons: Record<number, Record<number, string>>;
    lastUpdated: string | null;
}

export interface UpdateAvailabilityRequest {
    availability: AvailabilityDTO[];
}

export const teacherAvailabilityApi = createApi({
    reducerPath: 'teacherAvailabilityApi',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.accessToken;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Availability'],
    endpoints: (builder) => ({
        getAvailability: builder.query<AvailabilityMatrixDTO, void>({
            query: () => '/teacher/availability',
            transformResponse: (response: { data: AvailabilityMatrixDTO }) => response.data,
            providesTags: ['Availability'],
        }),
        updateAvailability: builder.mutation<void, AvailabilityDTO[]>({
            query: (availability) => ({
                url: '/teacher/availability',
                method: 'POST',
                body: availability,
            }),
            invalidatesTags: ['Availability'],
        }),
    }),
});

export const { useGetAvailabilityQuery, useUpdateAvailabilityMutation } = teacherAvailabilityApi;
