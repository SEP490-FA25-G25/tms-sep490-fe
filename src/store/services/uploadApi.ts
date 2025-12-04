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
        deleteFile: builder.mutation<void, string>({
            query: (fileUrl) => ({
                url: `/upload?url=${encodeURIComponent(fileUrl)}`,
                method: 'DELETE',
            }),
        }),
        // Delete material from database (also deletes S3 file if applicable)
        deleteMaterial: builder.mutation<void, number>({
            query: (materialId) => ({
                url: `/materials/${materialId}`,
                method: 'DELETE',
            }),
        }),
    }),
});

export const { useUploadFileMutation, useDeleteFileMutation, useDeleteMaterialMutation } = uploadApi;
