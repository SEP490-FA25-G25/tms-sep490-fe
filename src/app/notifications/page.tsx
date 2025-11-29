import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BellIcon,
  CheckIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  XIcon,
} from 'lucide-react'
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useGetNotificationStatsQuery,
  type NotificationFilter,
} from '@/store/services/notificationApi'
import { useState } from 'react'
import { toast } from 'sonner'
import { NotificationCard, NotificationSkeleton } from '@/components/notifications'

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
  const totalElements = notificationsData?.totalElements || 0

  // Check if any filter is active
  const hasActiveFilters = filters.isRead !== undefined || filters.type !== undefined || filters.priority !== undefined

  const handleClearFilters = () => {
    setFilters({
      page: 0,
      size: 10,
    })
  }

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
                  {/* Header */}
                  <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                      <BellIcon className="h-8 w-8" aria-hidden="true" />
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
                            <BellIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
                            <div className="h-3 w-3 rounded-full bg-blue-600" aria-hidden="true" />
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
                            <div className="h-3 w-3 rounded-full bg-orange-500" aria-hidden="true" />
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
                            <div className="h-3 w-3 rounded-full bg-red-600" aria-hidden="true" />
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
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
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

                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearFilters}
                          className="h-9 px-2 text-muted-foreground hover:text-foreground"
                        >
                          <XIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                          Xóa bộ lọc
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isLoading}
                      >
                        <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                        Làm mới
                      </Button>

                      {stats && stats.unreadCount > 0 && (
                        <Button
                          onClick={handleMarkAllAsRead}
                          variant="default"
                        >
                          <CheckIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                          Đánh dấu tất cả đã đọc
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Results count */}
                  {!isLoading && notificationsData && (
                    <p className="text-sm text-muted-foreground">
                      Hiển thị {notificationsData.content.length} / {totalElements} thông báo
                      {hasActiveFilters && " (đã lọc)"}
                    </p>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="px-4 lg:px-6">
                {isLoading ? (
                  <NotificationSkeleton count={5} />
                ) : error ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <AlertTriangleIcon className="h-12 w-12 text-destructive mb-4" aria-hidden="true" />
                      <h3 className="text-lg font-semibold mb-2">Không thể tải thông báo</h3>
                      <p className="text-sm text-muted-foreground text-center mb-4">
                        Đã có lỗi xảy ra. Vui lòng thử lại.
                      </p>
                      <Button onClick={() => refetch()}>
                        <RefreshCwIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                        Thử lại
                      </Button>
                    </CardContent>
                  </Card>
                ) : !notificationsData?.content || notificationsData.content.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <BellIcon className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
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
                      <nav 
                        className="flex items-center justify-center gap-2 mt-6"
                        aria-label="Phân trang thông báo"
                      >
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
                                aria-label={`Trang ${pageNum + 1}`}
                                aria-current={currentPage === pageNum ? "page" : undefined}
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
                      </nav>
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
