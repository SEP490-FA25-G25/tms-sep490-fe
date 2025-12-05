import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type ClassStatus = "draft" | "scheduled" | "ongoing" | "completed" | "cancelled"

interface ClassStatusBadgeProps {
    status: ClassStatus | string
    className?: string
}

export function ClassStatusBadge({ status, className }: ClassStatusBadgeProps) {
    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case "draft":
                return "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
            case "scheduled":
                return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
            case "ongoing":
                return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200"
            case "completed":
                return "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200"
            case "cancelled":
                return "bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200"
            default:
                return "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status.toLowerCase()) {
            case "draft":
                return "Bản nháp"
            case "scheduled":
                return "Đã lên lịch"
            case "ongoing":
                return "Đang diễn ra"
            case "completed":
                return "Đã hoàn thành"
            case "cancelled":
                return "Đã hủy"
            default:
                return status
        }
    }

    return (
        <Badge
            variant="outline"
            className={cn("font-normal", getStatusStyles(status), className)}
        >
            {getStatusLabel(status)}
        </Badge>
    )
}
