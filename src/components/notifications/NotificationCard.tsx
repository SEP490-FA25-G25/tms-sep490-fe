import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CheckIcon,
  TrashIcon,
  MoreHorizontalIcon,
  ClockIcon,
} from "lucide-react"
import {
  useMarkAsReadMutation,
  useDeleteNotificationMutation,
  type Notification,
} from "@/store/services/notificationApi"
import { toast } from "sonner"
import { formatTimeAgo } from "@/lib/date-utils"
import {
  getNotificationTypeConfig,
  getPriorityConfig,
  isNotificationRead,
} from "@/lib/notification-utils"
import { cn } from "@/lib/utils"

interface NotificationCardProps {
  notification: Notification
}

export function NotificationCard({ notification }: NotificationCardProps) {
  const navigate = useNavigate()
  const [markAsRead] = useMarkAsReadMutation()
  const [deleteNotification] = useDeleteNotificationMutation()

  const isRead = isNotificationRead(notification)
  const typeConfig = getNotificationTypeConfig(notification.type)
  const priorityConfigValue = getPriorityConfig(notification.priority)
  const TypeIcon = typeConfig.icon

  const handleMarkAsRead = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await markAsRead(notification.id).unwrap()
      toast.success("Đã đánh dấu là đã đọc")
    } catch {
      toast.error("Không thể đánh dấu là đã đọc")
    }
  }

  const handleDelete = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await deleteNotification(notification.id).unwrap()
      toast.success("Đã xóa thông báo")
    } catch {
      toast.error("Không thể xóa thông báo")
    }
  }

  const handleCardClick = async () => {
    // Mark as read if unread
    if (!isRead) {
      try {
        await markAsRead(notification.id).unwrap()
      } catch {
        // Silently fail
      }
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }
  }

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 border-none shadow-sm hover:shadow-md",
        !isRead ? "bg-blue-50/40 dark:bg-blue-950/10" : "bg-card",
        "cursor-pointer"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4 flex gap-4">
        {/* Icon / Status Indicator */}
        <div className="flex-shrink-0 pt-1">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
            !isRead ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" : "bg-muted text-muted-foreground"
          )}>
            <TypeIcon className="h-5 w-5" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <h4 className={cn(
                "text-sm font-medium leading-none",
                !isRead ? "text-foreground font-semibold" : "text-muted-foreground"
              )}>
                {notification.title}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {notification.message}
              </p>
            </div>

            {/* Unread Dot */}
            {!isRead && (
              <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ClockIcon className="h-3 w-3" />
              <span>{formatTimeAgo(notification.createdAt)}</span>
            </div>

            {notification.priority !== 'LOW' && notification.priority !== 'MEDIUM' && (
              <Badge variant={priorityConfigValue.badgeVariant} className="text-[10px] h-5 px-1.5 font-normal">
                {priorityConfigValue.label}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground">
              {typeConfig.label}
            </Badge>
          </div>
        </div>

        {/* Actions (Hover only on desktop) */}
        <div className="flex-shrink-0 self-start opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Thao tác</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isRead && (
                <DropdownMenuItem onClick={handleMarkAsRead}>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Đánh dấu đã đọc
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Xóa thông báo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

