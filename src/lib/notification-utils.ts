import {
  InfoIcon,
  AlertCircleIcon,
  BellIcon,
  MegaphoneIcon,
  type LucideIcon,
} from "lucide-react"
import type { Notification } from "@/store/services/notificationApi"

// Type config for notification icons and colors
export interface NotificationTypeConfig {
  icon: LucideIcon
  className: string
  bgClassName: string
  label: string
}

export const notificationTypeConfig: Record<Notification['type'], NotificationTypeConfig> = {
  SYSTEM: {
    icon: MegaphoneIcon,
    className: "text-purple-600",
    bgClassName: "bg-purple-100",
    label: "Hệ thống"
  },
  REQUEST: {
    icon: AlertCircleIcon,
    className: "text-blue-600",
    bgClassName: "bg-blue-100",
    label: "Yêu cầu"
  },
  REMINDER: {
    icon: BellIcon,
    className: "text-orange-600",
    bgClassName: "bg-orange-100",
    label: "Nhắc nhở"
  },
  NOTIFICATION: {
    icon: InfoIcon,
    className: "text-green-600",
    bgClassName: "bg-green-100",
    label: "Thông báo"
  },
}

/**
 * Get type config for a notification
 */
export function getNotificationTypeConfig(type: Notification['type']): NotificationTypeConfig {
  return notificationTypeConfig[type] || notificationTypeConfig.NOTIFICATION
}

/**
 * Check if notification is read
 */
export function isNotificationRead(notification: Notification): boolean {
  return notification.status === 'READ' || notification.status === 'ARCHIVED' || !notification.unread
}
