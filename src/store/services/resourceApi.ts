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
    createdBy?: number;
    createdAt: string;
    updatedAt: string;
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

export const resourceApi = createApi({
    reducerPath: "resourceApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Resource"],
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
    }),
});

export const {
    useGetResourcesQuery,
    useGetResourceByIdQuery,
    useCreateResourceMutation,
    useUpdateResourceMutation,
    useDeleteResourceMutation,
} = resourceApi;
