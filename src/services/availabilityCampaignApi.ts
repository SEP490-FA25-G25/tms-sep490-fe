import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/store';

export interface CreateCampaignRequest {
    title: string;
    deadline: string; // ISO string
}

export interface CampaignResponse {
    id: number;
    title: string;
    deadline: string;
    createdAt: string;
}

export interface TeacherStatusDTO {
    teacherId: number;
    fullName: string;
    email: string;
    contractType: string;
    status: 'UP_TO_DATE' | 'OUTDATED';
    lastUpdated: string | null;
    totalSlots: number;
}

export const availabilityCampaignApi = createApi({
    reducerPath: 'availabilityCampaignApi',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL + '/api/v1/availability-campaigns',
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.accessToken;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Campaign', 'TeacherStatus'],
    endpoints: (builder) => ({
        createCampaign: builder.mutation<CampaignResponse, CreateCampaignRequest>({
            query: (body) => ({
                url: '',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Campaign', 'TeacherStatus'],
        }),
        getLatestCampaign: builder.query<CampaignResponse, void>({
            query: () => '/latest',
            providesTags: ['Campaign'],
        }),
        getTeacherStatus: builder.query<TeacherStatusDTO[], number>({
            query: (id) => `/${id}/status`,
            providesTags: ['TeacherStatus'],
        }),
        sendReminders: builder.mutation<void, number>({
            query: (id) => ({
                url: `/${id}/remind`,
                method: 'POST',
            }),
        }),
    }),
});

export const {
    useCreateCampaignMutation,
    useGetLatestCampaignQuery,
    useGetTeacherStatusQuery,
    useSendRemindersMutation,
} = availabilityCampaignApi;
