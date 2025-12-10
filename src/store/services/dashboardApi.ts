import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './authApi'

// Types cho Admin Dashboard
export interface DailyUserStats {
    date: string
    count: number
}

export interface AdminStatsDTO {
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    totalBranches: number
    usersByRole: Record<string, number>
    usersByBranch: Record<string, number>
    newUsersLast7Days: DailyUserStats[]
}

interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
}

export const dashboardApi = createApi({
    reducerPath: 'dashboardApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Dashboard'],
    endpoints: (builder) => ({
        // Lấy thống kê Admin Dashboard
        getAdminStats: builder.query<ApiResponse<AdminStatsDTO>, void>({
            query: () => '/admin/dashboard/stats',
            providesTags: ['Dashboard'],
        }),
    }),
})

export const { useGetAdminStatsQuery } = dashboardApi
