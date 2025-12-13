import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import type { Notification } from "@/store/services/notificationApi";
import { BellIcon } from "lucide-react";
import {
  useGetRecentNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
} from "@/store/services/notificationApi";
import { useNavigate } from "react-router-dom";
import { formatTimeAgo } from "@/lib/date-utils";

interface NotificationBellProps {
  /**
   * Variant của component:
   * - "header": Hiển thị như icon button ở header
   * - "sidebar": Hiển thị như menu item trong sidebar
   */
  variant?: "header" | "sidebar";
}

export function NotificationBell({
  variant = "sidebar",
}: NotificationBellProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  // Always call hook unconditionally, then check variant
  const sidebar = useSidebar();
  const isMobile = variant === "sidebar" ? sidebar.isMobile : false;

  // Luôn fetch unread count để hiển thị badge
  // Polling every 30 seconds to get realtime notification updates
  const { data: unreadCount = 0, refetch: refetchUnreadCount } =
    useGetUnreadCountQuery(undefined, {
      pollingInterval: 30000, // 30 seconds
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    });

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useGetRecentNotificationsQuery(undefined, {
    skip: !isOpen, // Only fetch when dropdown is open
    refetchOnMountOrArgChange: true,
  });

  const [markAsRead] = useMarkAsReadMutation();

  // Refetch unread count when dropdown opens
  React.useEffect(() => {
    if (isOpen) {
      refetchUnreadCount();
    }
  }, [isOpen, refetchUnreadCount]);

  const handleMarkAsRead = async (
    notificationId: number,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    try {
      await markAsRead(notificationId).unwrap();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleNotificationClick = async (
    notification: Notification,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    // Mark as read if unread
    if (notification.unread) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type (frontend routing logic)
    const getRoute = (type: Notification["type"]): string | null => {
      switch (type) {
        case "REQUEST":
          return "/student-requests";
        case "REMINDER":
          return "/my-classes";
        case "SYSTEM":
        case "NOTIFICATION":
          return "/notifications";
        default:
          return null;
      }
    };

    const route = getRoute(notification.type);
    if (route) {
      navigate(route);
      setIsOpen(false);
    }
  };

  // Render trigger based on variant
  const renderTrigger = () => {
    if (variant === "header") {
      return (
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Thông báo"
          }
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center"
              aria-hidden="true"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      );
    }

    // Sidebar variant
    return (
      <SidebarMenuButton
        className="relative"
        aria-label={
          unreadCount > 0 ? `Thông báo - ${unreadCount} chưa đọc` : "Thông báo"
        }
      >
        <BellIcon className="h-4 w-4" />
        <span>Thông báo</span>
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="ml-auto h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </SidebarMenuButton>
    );
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>{renderTrigger()}</DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 rounded-lg"
        side={
          variant === "sidebar" && isMobile
            ? "bottom"
            : variant === "sidebar"
            ? "right"
            : undefined
        }
        align="end"
        sideOffset={variant === "header" ? 8 : 4}
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
              <p className="text-sm text-muted-foreground mt-2">
                Đang tải thông báo...
              </p>
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-destructive">
                Không thể tải thông báo
              </p>
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
              <p className="text-sm text-muted-foreground">
                Chưa có thông báo nào
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const isUnread = notification.unread;
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-0 cursor-pointer transition-colors ${
                    isUnread
                      ? "bg-blue-50/50 dark:bg-blue-950/20"
                      : "opacity-75 hover:opacity-100"
                  }`}
                  onClick={(e) => handleNotificationClick(notification, e)}
                >
                  <div className="w-full px-4 py-3 border-b last:border-b-0">
                    <div className="flex items-start gap-3">
                      {/* Unread indicator dot */}
                      <div className="flex-shrink-0 pt-1.5">
                        {isUnread ? (
                          <div
                            className="h-2 w-2 rounded-full bg-blue-600"
                            aria-label="Chưa đọc"
                          />
                        ) : (
                          <div className="h-2 w-2" /> // Spacer for alignment
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-sm truncate ${
                              isUnread
                                ? "font-semibold text-foreground"
                                : "font-normal text-muted-foreground"
                            }`}
                          >
                            {notification.title}
                          </p>
                        </div>

                        <p
                          className={`text-xs line-clamp-2 ${
                            isUnread
                              ? "text-muted-foreground"
                              : "text-muted-foreground/70"
                          }`}
                        >
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                          <div
                            className={`flex items-center gap-1 text-xs ${
                              isUnread
                                ? "text-muted-foreground"
                                : "text-muted-foreground/70"
                            }`}
                          >
                            {formatTimeAgo(notification.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        {/* Always show "View all" link */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => {
            navigate("/notifications");
            setIsOpen(false);
          }}
        >
          <span className="text-sm text-center w-full text-primary hover:text-primary/80">
            Xem tất cả thông báo
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Export alias for backwards compatibility
export { NotificationBell as HeaderNotificationBell };
