import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface UserProfile {
    id: number;
    email: string;
    fullName: string;
    phone: string | null;
    facebookUrl: string | null;
    dob: string | null;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
    address: string | null;
    avatarUrl: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    roles: string[];
    branches: string[];
}

export interface UpdateProfileRequest {
    phone?: string;
    facebookUrl?: string;
    dob?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    address?: string;
    avatarUrl?: string;
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export const userProfileApi = createApi({
    reducerPath: 'userProfileApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['UserProfile'],
    endpoints: (builder) => ({
        getMyProfile: builder.query<UserProfile, void>({
            query: () => '/users/me/profile',
            transformResponse: (response: ApiResponse<UserProfile>) => response.data,
            providesTags: ['UserProfile'],
        }),
        updateMyProfile: builder.mutation<UserProfile, UpdateProfileRequest>({
            query: (data) => ({
                url: '/users/me/profile',
                method: 'PUT',
                body: data,
            }),
            transformResponse: (response: ApiResponse<UserProfile>) => response.data,
            invalidatesTags: ['UserProfile'],
        }),
    }),
});

export const { useGetMyProfileQuery, useUpdateMyProfileMutation } = userProfileApi;
