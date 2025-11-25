"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar"
import type { Notification } from "@/store/services/notificationApi"
import {
  BellIcon,
  ExternalLinkIcon,
  ClockIcon,
} from "lucide-react"
import { useGetRecentNotificationsQuery, useMarkAsReadMutation } from "@/store/services/notificationApi"
import { useNavigate } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

export function NotificationBell() {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()

  // Skip fetching until dropdown opens
  const [isOpen, setIsOpen] = React.useState(false)

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useGetRecentNotificationsQuery(undefined, {
    skip: !isOpen, // Only fetch when dropdown is open
  })

  const [markAsRead] = useMarkAsReadMutation()

  const handleMarkAsRead = async (notificationId: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await markAsRead(notificationId).unwrap()
      // Refetch to update the list
      refetch()
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const handleNotificationClick = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation()

    // Mark as read if unread
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id)
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
      setIsOpen(false) // Close dropdown
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

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton className="relative">
          <BellIcon className="h-4 w-4" />
          <span>Thông báo</span>
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-auto h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Thông báo</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount} chưa đọc
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Đang tải thông báo...</p>
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-destructive">Không thể tải thông báo</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => refetch()}
              >
                Thử lại
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <BellIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Không có thông báo mới</p>
            </div>
          ) : (
            notifications.map((notification) => {
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="p-0 cursor-pointer"
                  onClick={(e) => handleNotificationClick(notification, e)}
                >
                  <div className="w-full px-4 py-3 border-b last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-medium truncate ${!notification.isRead ? 'font-semibold' : ''
                            }`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0"></div>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ClockIcon className="h-3 w-3" />
                            {formatTimeAgo(notification.createdAt)}
                          </div>

                          {notification.actionUrl && (
                            <ExternalLinkIcon className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              )
            })
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                navigate("/notifications")
                setIsOpen(false)
              }}
            >
              <span className="text-sm text-center w-full">Xem tất cả thông báo</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}