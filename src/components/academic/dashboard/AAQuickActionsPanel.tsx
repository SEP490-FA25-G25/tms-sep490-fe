"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
    UserPlus, 
    CalendarPlus,
    ClipboardCheck,
    FileText
} from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickAction {
    label: string
    description: string
    icon: typeof UserPlus
    onClick: () => void
    variant?: 'default' | 'secondary'
    iconClassName?: string
}

interface AAQuickActionsPanelProps {
    onEnrollStudent?: () => void
    onScheduleMakeup?: () => void
    onProcessConsultation?: () => void
    onViewReports?: () => void
}

export function AAQuickActionsPanel({
    onEnrollStudent,
    onScheduleMakeup,
    onProcessConsultation,
    onViewReports,
}: AAQuickActionsPanelProps) {
    const actions: QuickAction[] = [
        {
            label: "Ghi danh học viên",
            description: "Thêm học viên vào lớp",
            icon: UserPlus,
            onClick: onEnrollStudent ?? (() => {}),
            iconClassName: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        },
        {
            label: "Xếp lịch học bù",
            description: "Tạo buổi học bù mới",
            icon: CalendarPlus,
            onClick: onScheduleMakeup ?? (() => {}),
            iconClassName: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
        },
        {
            label: "Xử lý tư vấn",
            description: "Liên hệ đăng ký tư vấn",
            icon: ClipboardCheck,
            onClick: onProcessConsultation ?? (() => {}),
            iconClassName: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
        },
        {
            label: "Xem báo cáo",
            description: "Báo cáo hoạt động",
            icon: FileText,
            onClick: onViewReports ?? (() => {}),
            iconClassName: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
        },
    ]

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {actions.map((action) => {
                    const Icon = action.icon
                    return (
                        <Button
                            key={action.label}
                            variant="outline"
                            className="w-full justify-start h-auto py-3 px-3"
                            onClick={action.onClick}
                        >
                            <div className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg mr-3",
                                action.iconClassName
                            )}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-medium">{action.label}</p>
                                <p className="text-xs text-muted-foreground">{action.description}</p>
                            </div>
                        </Button>
                    )
                })}
            </CardContent>
        </Card>
    )
}
