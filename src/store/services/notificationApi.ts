import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

// Notification interfaces based on backend API
export interface Notification {
  id: number;
  recipientId: number;
  recipientName?: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'URGENT' | 'SYSTEM' | 'ANNOUNCEMENT';
  typeDisplayName?: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  priorityDisplayName?: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  statusDisplayName?: string;
  actionUrl?: string;
  referenceType?: string;
  referenceId?: number;
  metadata?: string;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  readAt?: string;
  expired: boolean;
  unread: boolean; // true = chưa đọc, false = đã đọc
}

export interface NotificationFilter {
  status?: 'UNREAD' | 'READ' | 'ARCHIVED';
  type?: Notification['type'];
  priority?: Notification['priority'];
  search?: string;
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
        if (filters.status) {
          params.append('status', filters.status);
        }
        if (filters.type) {
          params.append('type', filters.type);
        }
        if (filters.priority) {
          params.append('priority', filters.priority);
        }
        if (filters.search) {
          params.append('search', filters.search);
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
      query: () => '/notifications?status=UNREAD&size=5',
      transformResponse: (response: { data: NotificationResponse }) => response.data.content,
      providesTags: ['Notification'],
    }),

    // Get notification statistics
    getNotificationStats: builder.query<NotificationStats, void>({
      query: () => '/notifications/stats',
      transformResponse: (response: { data: NotificationStats }) => response.data,
      providesTags: ['Notification'],
    }),

    // Get unread notification count (for badge display)
    getUnreadCount: builder.query<number, void>({
      query: () => '/notifications/unread-count',
      transformResponse: (response: { data: number }) => response.data,
      providesTags: ['Notification'],
    }),

    // Mark notification as read
    markAsRead: builder.mutation<void, number>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PUT',
      }),
      // Optimistic update: cập nhật cache ngay lập tức trước khi API response
      async onQueryStarted(notificationId, { dispatch, queryFulfilled }) {
        // Update getRecentNotifications cache
        const patchRecentResult = dispatch(
          notificationApi.util.updateQueryData('getRecentNotifications', undefined, (draft) => {
            const notification = draft.find((n) => n.id === notificationId);
            if (notification) {
              notification.unread = false; // false = đã đọc
              notification.status = 'READ';
              notification.readAt = new Date().toISOString();
            }
          })
        );

        // Update getUnreadCount cache (decrement by 1)
        const patchUnreadCountResult = dispatch(
          notificationApi.util.updateQueryData('getUnreadCount', undefined, (draft) => {
            // draft is a number, return new value
            return Math.max(0, (draft as number) - 1);
          })
        );

        try {
          await queryFulfilled;
        } catch {
          // Rollback optimistic update on error
          patchRecentResult.undo();
          patchUnreadCountResult.undo();
        }
      },
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
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkMultipleAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useCreateNotificationMutation,
} = notificationApi;