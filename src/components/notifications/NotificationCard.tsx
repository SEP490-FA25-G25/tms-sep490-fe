import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  CheckIcon,
  TrashIcon,
  ExternalLinkIcon,
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

interface NotificationCardProps {
  notification: Notification
}

export function NotificationCard({ notification }: NotificationCardProps) {
  const navigate = useNavigate()
  const [markAsRead] = useMarkAsReadMutation()
  const [deleteNotification] = useDeleteNotificationMutation()

  const isRead = isNotificationRead(notification)
  const actionText = notification.actionText || "Xem chi tiết"
  const typeConfig = getNotificationTypeConfig(notification.type)
  const priorityConfigValue = getPriorityConfig(notification.priority)
  const TypeIcon = typeConfig.icon

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await markAsRead(notification.id).unwrap()
      toast.success("Đã đánh dấu là đã đọc")
    } catch {
      toast.error("Không thể đánh dấu là đã đọc")
    }
  }

  const handleDelete = async () => {
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
      className={`cursor-pointer transition-all hover:shadow-md ${
        !isRead ? 'bg-muted/30 border-primary/50' : ''
      } ${priorityConfigValue.className}`}
      onClick={handleCardClick}
      role="article"
      aria-label={`Thông báo: ${notification.title}${!isRead ? ' - Chưa đọc' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-full ${typeConfig.bgClassName} flex-shrink-0`}>
              <TypeIcon className={`h-4 w-4 ${typeConfig.className}`} aria-hidden="true" />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className={`text-base truncate ${!isRead ? 'font-semibold' : ''}`}>
                  {notification.title}
                </CardTitle>
                {!isRead && (
                  <div 
                    className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0"
                    aria-label="Chưa đọc"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {typeConfig.label}
                </Badge>
                <Badge variant={priorityConfigValue.badgeVariant} className="text-xs">
                  {priorityConfigValue.label}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ClockIcon className="h-3 w-3" aria-hidden="true" />
              <time dateTime={notification.createdAt}>
                {formatTimeAgo(notification.createdAt)}
              </time>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription className="text-sm mb-3 line-clamp-3">
          {notification.message}
        </CardDescription>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!isRead && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsRead}
                className="h-8 px-3 text-xs"
              >
                <CheckIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                Đánh dấu đã đọc
              </Button>
            )}

            {notification.actionUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                <ExternalLinkIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                {actionText}
              </Button>
            )}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="h-8 px-3 text-xs text-destructive hover:text-destructive"
                aria-label="Xóa thông báo"
              >
                <TrashIcon className="h-3 w-3" aria-hidden="true" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa thông báo</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Xóa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

