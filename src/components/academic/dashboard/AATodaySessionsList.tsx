"use client"
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
// ScrollArea removed - using native overflow
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { 
    Clock, 
    MapPin, 
    User,
    AlertCircle,
    ChevronRight,
    CheckCircle2
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"

export interface TodaySessionItem {
    id: number
    className: string
    classCode: string
    startTime: string
    endTime: string
    room: string
    teacherName: string
    status: 'NORMAL' | 'NEEDS_SUBSTITUTE' | 'SUBSTITUTE_ASSIGNED' | 'CANCELLED'
    substituteTeacherName?: string
}

interface AATodaySessionsListProps {
    sessions?: TodaySessionItem[]
    isLoading?: boolean
    onViewSchedule?: () => void
    onAssignSubstitute?: (sessionId: number) => void
}

const statusConfig: Record<TodaySessionItem['status'], {
    label: string
    badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'
    icon: typeof CheckCircle2
    className: string
}> = {
    NORMAL: {
        label: "Bình thường",
        badgeVariant: 'secondary',
        icon: CheckCircle2,
        className: "text-green-600 bg-green-100 dark:bg-green-900/30"
    },
    NEEDS_SUBSTITUTE: {
        label: "Cần GV thay",
        badgeVariant: 'destructive',
        icon: AlertCircle,
        className: "text-red-600 bg-red-100 dark:bg-red-900/30"
    },
    SUBSTITUTE_ASSIGNED: {
        label: "Đã có GV thay",
        badgeVariant: 'outline',
        icon: User,
        className: "text-blue-600 bg-blue-100 dark:bg-blue-900/30"
    },
    CANCELLED: {
        label: "Đã huỷ",
        badgeVariant: 'secondary',
        icon: AlertCircle,
        className: "text-slate-500 bg-slate-100 dark:bg-slate-800"
    }
}

function SessionTimelineItem({ 
    session, 
    onAssignSubstitute,
    isNext 
}: { 
    session: TodaySessionItem
    onAssignSubstitute?: () => void
    isNext?: boolean
}) {
    const config = statusConfig[session.status]
    const StatusIcon = config.icon
    const startTime = format(parseISO(`2024-01-01T${session.startTime}`), 'HH:mm')
    const endTime = format(parseISO(`2024-01-01T${session.endTime}`), 'HH:mm')

    return (
        <div className={cn(
            "relative pl-6 pb-4 border-l-2 border-slate-200 dark:border-slate-700 last:border-l-transparent last:pb-0",
            session.status === 'NEEDS_SUBSTITUTE' && "border-l-red-300 dark:border-l-red-800"
        )}>
            {/* Timeline dot */}
            <div className={cn(
                "absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900",
                session.status === 'NEEDS_SUBSTITUTE' 
                    ? "bg-red-500" 
                    : isNext 
                        ? "bg-blue-500" 
                        : "bg-slate-300 dark:bg-slate-600"
            )} />

            <div className={cn(
                "p-3 rounded-lg transition-colors",
                session.status === 'NEEDS_SUBSTITUTE' 
                    ? "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50"
                    : isNext
                        ? "bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50"
                        : "bg-slate-50 dark:bg-slate-800/30"
            )}>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{session.className}</span>
                            <Badge variant="outline" className="text-xs">
                                {session.classCode}
                            </Badge>
                            {isNext && (
                                <Badge className="text-xs bg-blue-500">Tiếp theo</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {startTime} - {endTime}
                            </span>
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {session.room}
                            </span>
                            <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {session.status === 'SUBSTITUTE_ASSIGNED' 
                                    ? session.substituteTeacherName 
                                    : session.teacherName
                                }
                                {session.status === 'SUBSTITUTE_ASSIGNED' && (
                                    <span className="text-blue-500">(thay)</span>
                                )}
                            </span>
                        </div>
                    </div>
                    <div className="shrink-0">
                        {session.status === 'NEEDS_SUBSTITUTE' ? (
                            <Button 
                                size="sm" 
                                variant="destructive"
                                className="h-7 text-xs"
                                onClick={onAssignSubstitute}
                            >
                                Phân GV
                            </Button>
                        ) : (
                            <Badge className={cn("text-xs", config.className)} variant="secondary">
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {config.label}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function AATodaySessionsList({ 
    sessions, 
    isLoading, 
    onViewSchedule,
    onAssignSubstitute 
}: AATodaySessionsListProps) {
    if (isLoading) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-56 mt-1" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    const needsSubstituteCount = sessions?.filter(s => s.status === 'NEEDS_SUBSTITUTE').length ?? 0
    const today = format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi })

    // Find next session (first session that hasn't started yet, or ongoing)
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
    
    let nextSessionId: number | null = null
    if (sessions && sessions.length > 0) {
        const upcomingSession = sessions.find(s => s.startTime >= currentTimeStr && s.status !== 'CANCELLED')
        if (upcomingSession) {
            nextSessionId = upcomingSession.id
        }
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Buổi học hôm nay</CardTitle>
                        <CardDescription className="mt-1 capitalize">
                            {today}
                            {needsSubstituteCount > 0 && (
                                <span className="text-red-500 font-medium">
                                    {" "}• {needsSubstituteCount} buổi cần GV thay
                                </span>
                            )}
                        </CardDescription>
                    </div>
                    {onViewSchedule && (
                        <Button variant="ghost" size="sm" onClick={onViewSchedule}>
                            Lịch tuần
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
                {!sessions || sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                            <Clock className="h-6 w-6 text-slate-500" />
                        </div>
                        <p className="text-sm font-medium">Không có buổi học hôm nay</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Hãy kiểm tra lịch tuần để xem các buổi học sắp tới
                        </p>
                    </div>
                ) : (
                    <div className="space-y-0 max-h-[350px] overflow-y-auto pr-2">
                        {sessions.map((session) => (
                            <SessionTimelineItem 
                                key={session.id}
                                session={session}
                                isNext={session.id === nextSessionId}
                                onAssignSubstitute={() => onAssignSubstitute?.(session.id)}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
