import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

// Notification interfaces based on backend API
export interface Notification {
  id: number;
  userId: number;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'URGENT' | 'SYSTEM' | 'ANNOUNCEMENT';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  isRead: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdBy?: number;
  createdAt: string;
  readAt?: string;
}

export interface NotificationFilter {
  isRead?: boolean;
  type?: Notification['type'];
  priority?: Notification['priority'];
  page?: number;
  size?: number;
}

export interface NotificationResponse {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface NotificationStats {
  totalNotifications: number;
  unreadCount: number;
  urgentCount: number;
  highPriorityCount: number;
}

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Notification'],
  endpoints: (builder) => ({
    // Get notifications with pagination and filters
    getNotifications: builder.query<NotificationResponse, NotificationFilter>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters.isRead !== undefined) {
          params.append('isRead', filters.isRead.toString());
        }
        if (filters.type) {
          params.append('type', filters.type);
        }
        if (filters.priority) {
          params.append('priority', filters.priority);
        }
        if (filters.page !== undefined) {
          params.append('page', filters.page.toString());
        }
        if (filters.size !== undefined) {
          params.append('size', filters.size.toString());
        }

        const queryString = params.toString();
        return `/notifications${queryString ? `?${queryString}` : ''}`;
      },
      transformResponse: (response: { data: NotificationResponse }) => response.data,
      providesTags: ['Notification'],
    }),

    // Get recent unread notifications (for dropdown)
    getRecentNotifications: builder.query<Notification[], void>({
      query: () => '/notifications?isRead=false&size=5',
      transformResponse: (response: { data: NotificationResponse }) => response.data.content,
      providesTags: ['Notification'],
    }),

    // Get notification statistics
    getNotificationStats: builder.query<NotificationStats, void>({
      query: () => '/notifications/stats',
      transformResponse: (response: { data: NotificationStats }) => response.data,
      providesTags: ['Notification'],
    }),

    // Mark notification as read
    markAsRead: builder.mutation<void, number>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),

    // Mark multiple notifications as read
    markMultipleAsRead: builder.mutation<void, number[]>({
      query: (ids) => ({
        url: '/notifications/mark-read',
        method: 'PUT',
        body: ids,
      }),
      invalidatesTags: ['Notification'],
    }),

    // Mark all notifications as read
    markAllAsRead: builder.mutation<void, void>({
      query: () => ({
        url: '/notifications/mark-all-read',
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),

    // Delete notification
    deleteNotification: builder.mutation<void, number>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),

    // Create notification (for admin/system use)
    createNotification: builder.mutation<Notification, Partial<Notification> & {
      userId?: number;
      title: string;
      message: string;
      type?: Notification['type'];
      priority?: Notification['priority'];
    }>({
      query: (notification) => ({
        url: '/notifications',
        method: 'POST',
        body: notification,
      }),
      transformResponse: (response: { data: Notification }) => response.data,
      invalidatesTags: ['Notification'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetNotificationsQuery,
  useGetRecentNotificationsQuery,
  useGetNotificationStatsQuery,
  useMarkAsReadMutation,
  useMarkMultipleAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useCreateNotificationMutation,
} = notificationApi;