import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./authApi";

interface ResponseObject<T> {
    success: boolean;
    message: string;
    data: T;
}

export const enumApi = createApi({
    reducerPath: "enumApi",
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        getSkills: builder.query<string[], void>({
            query: () => "/enums/skills",
            transformResponse: (response: ResponseObject<string[]>) => response.data,
        }),
        getMaterialTypes: builder.query<string[], void>({
            query: () => "/enums/material-types",
            transformResponse: (response: ResponseObject<string[]>) => response.data,
        }),
    }),
});

export const { useGetSkillsQuery, useGetMaterialTypesQuery } = enumApi;
