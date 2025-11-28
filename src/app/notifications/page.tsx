import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BellIcon,
  CheckIcon,
  RefreshCwIcon,
  TrashIcon,
  ExternalLinkIcon,
  ClockIcon,
  AlertTriangleIcon,
  InfoIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  MegaphoneIcon,
} from 'lucide-react'
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useGetNotificationStatsQuery,
  type Notification,
  type NotificationFilter,
} from '@/store/services/notificationApi'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'

// Type mapping for icons and colors (same as NotificationBell)
const notificationTypeConfig = {
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

const priorityConfig = {
  LOW: {
    className: "border-gray-200",
    badgeVariant: "secondary" as const,
    label: "Thấp"
  },
  MEDIUM: {
    className: "border-blue-200",
    badgeVariant: "default" as const,
    label: "Trung bình"
  },
  HIGH: {
    className: "border-orange-200",
    badgeVariant: "destructive" as const,
    label: "Cao"
  },
  URGENT: {
    className: "border-red-200",
    badgeVariant: "destructive" as const,
    label: "Khẩn cấp"
  },
}

function NotificationCard({ notification }: { notification: Notification }) {
  const navigate = useNavigate()
  const [markAsRead] = useMarkAsReadMutation()
  const [deleteNotification] = useDeleteNotificationMutation()
  const isRead = notification.isRead ?? (notification.status === 'READ' || notification.unread === false)
  const actionText = notification.actionText || "Xem chi tiết"

  const typeConfig = notificationTypeConfig[notification.type as keyof typeof notificationTypeConfig]
  const priorityConfigValue = priorityConfig[notification.priority as keyof typeof priorityConfig]
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Bạn có chắc chắn muốn xóa thông báo này?")) {
      try {
        await deleteNotification(notification.id).unwrap()
        toast.success("Đã xóa thông báo")
      } catch {
        toast.error("Không thể xóa thông báo")
      }
    }
  }

  const handleCardClick = async () => {
    // Mark as read if unread
    if (!isRead) {
      await handleMarkAsRead({ stopPropagation: () => {} } as React.MouseEvent)
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }
  }

  const formatTimeAgo = (dateString: string) => {
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

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        !isRead ? 'bg-muted/30 border-primary/50' : ''
      } ${priorityConfigValue.className}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-full ${typeConfig.bgClassName} flex-shrink-0`}>
              <TypeIcon className={`h-4 w-4 ${typeConfig.className}`} />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className={`text-base truncate ${
                  !isRead ? 'font-semibold' : ''
                }`}>
                  {notification.title}
                </CardTitle>
                {!isRead && (
                  <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0"></div>
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
              <ClockIcon className="h-3 w-3" />
              {formatTimeAgo(notification.createdAt)}
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
                <CheckIcon className="h-3 w-3 mr-1" />
                Đánh dấu đã đọc
              </Button>
            )}

            {notification.actionUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                <ExternalLinkIcon className="h-3 w-3 mr-1" />
                {actionText}
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 px-3 text-xs text-destructive hover:text-destructive"
          >
            <TrashIcon className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-3" />
            <div className="flex justify-between">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function NotificationsPage() {
  const [filters, setFilters] = useState<NotificationFilter>({
    page: 0,
    size: 10,
  })

  const {
    data: notificationsData,
    isLoading,
    error,
    refetch,
  } = useGetNotificationsQuery(filters)

  const {
    data: stats,
    isLoading: statsLoading,
  } = useGetNotificationStatsQuery()

  const [markAllAsRead] = useMarkAllAsReadMutation()

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap()
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc")
      refetch()
    } catch {
      toast.error("Không thể đánh dấu tất cả là đã đọc")
    }
  }

  const handleFilterChange = (key: keyof NotificationFilter, value: string | number | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 0, // Reset to first page when filters change
    }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage,
    }))
  }

  const totalPages = notificationsData?.totalPages || 0
  const currentPage = notificationsData?.number || 0

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                      <BellIcon className="h-8 w-8" />
                      Thông báo
                    </h1>
                    <p className="text-muted-foreground">
                      Quản lý tất cả thông báo của bạn
                    </p>
                  </div>

                  {/* Stats Cards */}
                  {!statsLoading && stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <BellIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-2xl font-bold">{stats.totalNotifications}</p>
                              <p className="text-xs text-muted-foreground">Tổng số</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                            <div>
                              <p className="text-2xl font-bold">{stats.unreadCount}</p>
                              <p className="text-xs text-muted-foreground">Chưa đọc</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                            <div>
                              <p className="text-2xl font-bold">{stats.highPriorityCount}</p>
                              <p className="text-xs text-muted-foreground">Ưu tiên cao</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-600"></div>
                            <div>
                              <p className="text-2xl font-bold">{stats.urgentCount}</p>
                              <p className="text-xs text-muted-foreground">Khẩn cấp</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Filters and Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <Select
                        value={filters.isRead?.toString() || "all"}
                        onValueChange={(value: string) =>
                          handleFilterChange("isRead", value === "all" ? undefined : value === "true")
                        }
                      >
                        <SelectTrigger className="w-full sm:w-[140px]">
                          <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="false">Chưa đọc</SelectItem>
                          <SelectItem value="true">Đã đọc</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={filters.type || "all"}
                        onValueChange={(value: string) =>
                          handleFilterChange("type", value === "all" ? undefined : value)
                        }
                      >
                        <SelectTrigger className="w-full sm:w-[140px]">
                          <SelectValue placeholder="Loại" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="INFO">Thông tin</SelectItem>
                          <SelectItem value="SUCCESS">Thành công</SelectItem>
                          <SelectItem value="WARNING">Cảnh báo</SelectItem>
                          <SelectItem value="ERROR">Lỗi</SelectItem>
                          <SelectItem value="URGENT">Khẩn cấp</SelectItem>
                          <SelectItem value="SYSTEM">Hệ thống</SelectItem>
                          <SelectItem value="ANNOUNCEMENT">Thông báo</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={filters.priority || "all"}
                        onValueChange={(value: string) =>
                          handleFilterChange("priority", value === "all" ? undefined : value)
                        }
                      >
                        <SelectTrigger className="w-full sm:w-[140px]">
                          <SelectValue placeholder="Ưu tiên" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="LOW">Thấp</SelectItem>
                          <SelectItem value="MEDIUM">Trung bình</SelectItem>
                          <SelectItem value="HIGH">Cao</SelectItem>
                          <SelectItem value="URGENT">Khẩn cấp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isLoading}
                      >
                        <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Làm mới
                      </Button>

                      {stats && stats.unreadCount > 0 && (
                        <Button
                          onClick={handleMarkAllAsRead}
                          variant="default"
                        >
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Đánh dấu tất cả đã đọc
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="px-4 lg:px-6">
                {isLoading ? (
                  <NotificationsSkeleton />
                ) : error ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <AlertTriangleIcon className="h-12 w-12 text-destructive mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Không thể tải thông báo</h3>
                      <p className="text-sm text-muted-foreground text-center mb-4">
                        Đã có lỗi xảy ra. Vui lòng thử lại.
                      </p>
                      <Button onClick={() => refetch()}>
                        <RefreshCwIcon className="h-4 w-4 mr-2" />
                        Thử lại
                      </Button>
                    </CardContent>
                  </Card>
                ) : !notificationsData?.content || notificationsData.content.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <BellIcon className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Không có thông báo</h3>
                      <p className="text-sm text-muted-foreground text-center">
                        {Object.keys(filters).length > 2
                          ? "Không có thông báo nào phù hợp với bộ lọc đã chọn."
                          : "Bạn chưa có thông báo nào."
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="space-y-4">
                      {notificationsData.content.map((notification) => (
                        <NotificationCard key={notification.id} notification={notification} />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 0}
                        >
                          Trang trước
                        </Button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum = i
                            if (totalPages > 5) {
                              if (currentPage < 2) {
                                pageNum = i
                              } else if (currentPage > totalPages - 3) {
                                pageNum = totalPages - 5 + i
                              } else {
                                pageNum = currentPage - 2 + i
                              }
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum + 1}
                              </Button>
                            )
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages - 1}
                        >
                          Trang sau
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
