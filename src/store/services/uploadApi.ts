import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';
import type { ApiResponse } from './authApi';

export interface UploadResponse {
    url: string;
}

export const uploadApi = createApi({
    reducerPath: 'uploadApi',
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        uploadFile: builder.mutation<UploadResponse, File>({
            query: (file) => {
                const formData = new FormData();
                formData.append('file', file);
                return {
                    url: '/upload',
                    method: 'POST',
                    body: formData,
                };
            },
            transformResponse: (response: ApiResponse<UploadResponse>) => response.data,
        }),
    }),
});

export const { useUploadFileMutation } = uploadApi;
