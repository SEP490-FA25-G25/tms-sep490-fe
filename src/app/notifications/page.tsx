import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  BellIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
} from 'lucide-react'
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useGetNotificationStatsQuery,
  type NotificationFilter,
} from '@/store/services/notificationApi'
import { useState } from 'react'
import { toast } from 'sonner'
import { NotificationList, NotificationFilters, NotificationSkeleton } from '@/components/notifications'

export default function NotificationsPage() {
  const [filters, setFilters] = useState<NotificationFilter>({
    page: 0,
    size: 20, // Increased page size for better grouping
  })

  const {
    data: notificationsData,
    isLoading,
    error,
    refetch,
  } = useGetNotificationsQuery(filters, {
    pollingInterval: 30000, // Poll every 30 seconds
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  })

  const {
    data: stats,
  } = useGetNotificationStatsQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  })

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

  const handleClearFilters = () => {
    setFilters({
      page: 0,
      size: 20,
    })
  }

  const totalPages = notificationsData?.totalPages || 0
  const currentPage = notificationsData?.number || 0
  const totalElements = notificationsData?.totalElements || 0
  const hasUnread = (stats?.unreadCount || 0) > 0

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
        <div className="flex flex-1 flex-col bg-muted/10">
          <div className="@container/main flex flex-1 flex-col max-w-4xl mx-auto w-full">
            <div className="flex flex-col gap-6 py-6 px-4 lg:px-8">

              {/* Header */}
              <div className="flex items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    Thông báo
                    {hasUnread && (
                      <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {stats?.unreadCount} mới
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Quản lý và xem lại các thông báo của bạn
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="h-8"
                >
                  <RefreshCwIcon className={`h-3.5 w-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
              </div>

              {/* Main Content */}
              <div className="flex flex-col gap-6">
                <NotificationFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  hasUnread={hasUnread}
                />

                {/* Notifications List */}
                <div className="min-h-[400px]">
                  {isLoading ? (
                    <NotificationSkeleton count={5} />
                  ) : error ? (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertTriangleIcon className="h-10 w-10 text-destructive/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-1">Không thể tải thông báo</h3>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                          Đã có lỗi xảy ra khi kết nối với máy chủ.
                        </p>
                        <Button onClick={() => refetch()} variant="outline">
                          Thử lại
                        </Button>
                      </CardContent>
                    </Card>
                  ) : !notificationsData?.content || notificationsData.content.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="bg-muted/50 p-4 rounded-full mb-4">
                        <BellIcon className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground">Không có thông báo</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                        {Object.keys(filters).length > 2
                          ? "Không tìm thấy thông báo nào phù hợp với bộ lọc hiện tại."
                          : "Bạn chưa có thông báo nào. Các cập nhật mới sẽ xuất hiện tại đây."
                        }
                      </p>
                      {Object.keys(filters).length > 2 && (
                        <Button
                          variant="link"
                          onClick={handleClearFilters}
                          className="mt-2"
                        >
                          Xóa bộ lọc
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <NotificationList notifications={notificationsData.content} />

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex flex-col items-center gap-2 mt-8 pb-8">
                          <p className="text-xs text-muted-foreground mb-2">
                            Hiển thị {notificationsData.content.length} / {totalElements} thông báo
                          </p>
                          <nav
                            className="flex items-center justify-center gap-1"
                            aria-label="Phân trang thông báo"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 0}
                              className="h-8 px-3"
                            >
                              Trước
                            </Button>

                            <div className="flex items-center gap-1 px-2">
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
                                    variant={currentPage === pageNum ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => handlePageChange(pageNum)}
                                    className="h-8 w-8 p-0"
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
                              className="h-8 px-3"
                            >
                              Sau
                            </Button>
                          </nav>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

