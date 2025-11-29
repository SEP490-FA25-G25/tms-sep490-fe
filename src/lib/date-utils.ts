import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

/**
 * Format a date string to Vietnamese relative time
 * e.g., "Vừa xong", "5 phút trước", "2 giờ trước", "3 ngày trước"
 */
export function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Vừa xong"
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} ngày trước`

    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: vi
    })
  } catch {
    return "Không xác định"
  }
}

