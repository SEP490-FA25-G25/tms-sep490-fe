import {
  InfoIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  XCircleIcon,
  AlertCircleIcon,
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
  INFO: {
    icon: InfoIcon,
    className: "text-blue-600",
    bgClassName: "bg-blue-100",
    label: "Thông tin"
  },
  SUCCESS: {
    icon: CheckCircleIcon,
    className: "text-green-600",
    bgClassName: "bg-green-100",
    label: "Thành công"
  },
  WARNING: {
    icon: AlertTriangleIcon,
    className: "text-yellow-600",
    bgClassName: "bg-yellow-100",
    label: "Cảnh báo"
  },
  ERROR: {
    icon: XCircleIcon,
    className: "text-red-600",
    bgClassName: "bg-red-100",
    label: "Lỗi"
  },
  URGENT: {
    icon: AlertCircleIcon,
    className: "text-red-600",
    bgClassName: "bg-red-100",
    label: "Khẩn cấp"
  },
  SYSTEM: {
    icon: MegaphoneIcon,
    className: "text-purple-600",
    bgClassName: "bg-purple-100",
    label: "Hệ thống"
  },
  ANNOUNCEMENT: {
    icon: MegaphoneIcon,
    className: "text-indigo-600",
    bgClassName: "bg-indigo-100",
    label: "Thông báo"
  },
}

// Priority config for notification styling
export interface PriorityConfig {
  className: string
  badgeVariant: "default" | "secondary" | "destructive" | "outline"
  label: string
}

export const priorityConfig: Record<Notification['priority'], PriorityConfig> = {
  LOW: {
    className: "border-gray-200",
    badgeVariant: "secondary",
    label: "Thấp"
  },
  MEDIUM: {
    className: "border-blue-200",
    badgeVariant: "default",
    label: "Trung bình"
  },
  HIGH: {
    className: "border-orange-200",
    badgeVariant: "destructive",
    label: "Cao"
  },
  URGENT: {
    className: "border-red-200",
    badgeVariant: "destructive",
    label: "Khẩn cấp"
  },
}

/**
 * Get type config for a notification
 */
export function getNotificationTypeConfig(type: Notification['type']): NotificationTypeConfig {
  return notificationTypeConfig[type] || notificationTypeConfig.INFO
}

/**
 * Get priority config for a notification
 */
export function getPriorityConfig(priority: Notification['priority']): PriorityConfig {
  return priorityConfig[priority] || priorityConfig.MEDIUM
}

/**
 * Check if notification is read
 */
export function isNotificationRead(notification: Notification): boolean {
  return notification.isRead ?? (notification.status === 'READ' || notification.unread === false)
}

