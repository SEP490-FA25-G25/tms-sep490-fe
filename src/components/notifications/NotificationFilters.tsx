import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { XIcon, CheckIcon, FilterIcon } from 'lucide-react'
import { type NotificationFilter } from '@/store/services/notificationApi'

interface NotificationFiltersProps {
    filters: NotificationFilter
    onFilterChange: (key: keyof NotificationFilter, value: string | number | boolean | undefined) => void
    onClearFilters: () => void
    onMarkAllAsRead: () => void
    hasUnread: boolean
}

export function NotificationFilters({
    filters,
    onFilterChange,
    onClearFilters,
    onMarkAllAsRead,
    hasUnread,
}: NotificationFiltersProps) {
    const hasActiveFilters = filters.type !== undefined || filters.status !== undefined

    return (
        <div className="flex flex-col gap-4 border-b pb-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                {/* Primary Filter (Tabs) */}
                <Tabs
                    value={filters.status === undefined ? "all" : filters.status === "READ" ? "read" : "unread"}
                    onValueChange={(value) => {
                        if (value === "all") onFilterChange("status", undefined)
                        else if (value === "unread") onFilterChange("status", "UNREAD")
                        else if (value === "read") onFilterChange("status", "READ")
                    }}
                    className="w-full sm:w-auto"
                >
                    <TabsList>
                        <TabsTrigger value="all">Tất cả</TabsTrigger>
                        <TabsTrigger value="unread">Chưa đọc</TabsTrigger>
                        <TabsTrigger value="read">Đã đọc</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {hasUnread && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onMarkAllAsRead}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                            <CheckIcon className="h-4 w-4 mr-2" />
                            Đánh dấu tất cả đã đọc
                        </Button>
                    )}
                </div>
            </div>

            {/* Secondary Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                    <FilterIcon className="h-4 w-4" />
                    <span>Lọc theo:</span>
                </div>

                <Select
                    value={filters.type || "all"}
                    onValueChange={(value) =>
                        onFilterChange("type", value === "all" ? undefined : value)
                    }
                >
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue placeholder="Loại thông báo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả loại</SelectItem>
                        <SelectItem value="SYSTEM">Hệ thống</SelectItem>
                        <SelectItem value="REQUEST">Yêu cầu</SelectItem>
                        <SelectItem value="REMINDER">Nhắc nhở</SelectItem>
                        <SelectItem value="NOTIFICATION">Thông báo</SelectItem>
                    </SelectContent>
                </Select>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground ml-auto sm:ml-0"
                    >
                        <XIcon className="h-3 w-3 mr-1" />
                        Xóa bộ lọc
                    </Button>
                )}
            </div>
        </div>
    )
}
