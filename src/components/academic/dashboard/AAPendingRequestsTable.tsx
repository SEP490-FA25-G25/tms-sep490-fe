"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { 
    UserX, 
    CalendarPlus, 
    ArrowRightLeft, 
    UserCog, 
    Clock,
    CalendarClock,
    Monitor,
    ChevronRight,
    Eye
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"

export type RequestType = 
    | 'ABSENCE' 
    | 'MAKEUP' 
    | 'TRANSFER' 
    | 'REPLACEMENT' 
    | 'RESCHEDULE' 
    | 'MODALITY_CHANGE'

export interface PendingRequestItem {
    id: number
    type: RequestType
    requesterName: string
    requesterRole: 'STUDENT' | 'TEACHER'
    className: string
    createdAt: string
    isUrgent: boolean
    summary: string
}

interface AAPendingRequestsTableProps {
    requests?: PendingRequestItem[]
    isLoading?: boolean
    onViewAll?: () => void
    /** Callback khi click vào request - dùng để mở modal chi tiết */
    onViewRequest?: (request: PendingRequestItem) => void
}

const requestTypeConfig: Record<RequestType, { 
    label: string
    icon: typeof UserX
    badgeClassName: string
}> = {
    ABSENCE: {
        label: "Nghỉ phép",
        icon: UserX,
        badgeClassName: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
    },
    MAKEUP: {
        label: "Học bù",
        icon: CalendarPlus,
        badgeClassName: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
    },
    TRANSFER: {
        label: "Chuyển lớp",
        icon: ArrowRightLeft,
        badgeClassName: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
    },
    REPLACEMENT: {
        label: "GV thay thế",
        icon: UserCog,
        badgeClassName: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
    },
    RESCHEDULE: {
        label: "Đổi lịch",
        icon: CalendarClock,
        badgeClassName: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
    },
    MODALITY_CHANGE: {
        label: "Đổi hình thức",
        icon: Monitor,
        badgeClassName: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
    }
}

function RequestRow({ 
    request, 
    onView 
}: { 
    request: PendingRequestItem
    onView?: () => void 
}) {
    const config = requestTypeConfig[request.type]
    const Icon = config.icon

    return (
        <div className={cn(
            "flex items-center justify-between py-3 px-3 rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
            request.isUrgent && "bg-red-50/50 dark:bg-red-900/10 border-l-2 border-l-red-500"
        )}>
            <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    config.badgeClassName.split(' ')[0]
                )}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                            variant="secondary" 
                            className={cn("text-xs font-medium", config.badgeClassName)}
                        >
                            {config.label}
                        </Badge>
                        {request.isUrgent && (
                            <Badge variant="destructive" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Khẩn
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm font-medium mt-1 truncate">
                        {request.requesterName}
                        <span className="text-muted-foreground font-normal"> • {request.className}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {request.summary}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 ml-3 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(request.createdAt), { 
                        addSuffix: true, 
                        locale: vi 
                    })}
                </span>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={onView}
                >
                    <Eye className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

export function AAPendingRequestsTable({ 
    requests, 
    isLoading, 
    onViewAll,
    onViewRequest 
}: AAPendingRequestsTableProps) {
    if (isLoading) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64 mt-1" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    const urgentRequests = requests?.filter(r => r.isUrgent) ?? []
    const normalRequests = requests?.filter(r => !r.isUrgent) ?? []
    const sortedRequests = [...urgentRequests, ...normalRequests]

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Yêu cầu chờ xử lý</CardTitle>
                        <CardDescription className="mt-1">
                            {requests?.length ?? 0} yêu cầu đang chờ duyệt
                            {urgentRequests.length > 0 && (
                                <span className="text-red-500 font-medium">
                                    {" "}• {urgentRequests.length} khẩn cấp
                                </span>
                            )}
                        </CardDescription>
                    </div>
                    {onViewAll && (
                        <Button variant="ghost" size="sm" onClick={onViewAll}>
                            Xem tất cả
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
                {sortedRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                            <ClipboardList className="h-6 w-6 text-green-600" />
                        </div>
                        <p className="text-sm font-medium">Không có yêu cầu chờ xử lý</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Tất cả yêu cầu đã được xử lý
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-[340px] pr-3">
                        <div className="space-y-1">
                            {sortedRequests.map((request) => (
                                <RequestRow 
                                    key={`${request.type}-${request.id}`}
                                    request={request}
                                    onView={() => onViewRequest?.(request)}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}

// Import for empty state icon
import { ClipboardList } from "lucide-react"
