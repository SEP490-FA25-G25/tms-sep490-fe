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
                return "bg-slate-100 text-slate-700 hover:bg-slate-100/80 border-slate-200"
            case "scheduled":
                return "bg-sky-100 text-sky-700 hover:bg-sky-100/80 border-sky-200"
            case "ongoing":
                return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200"
            case "completed":
                return "bg-violet-100 text-violet-700 hover:bg-violet-100/80 border-violet-200"
            case "cancelled":
                return "bg-rose-100 text-rose-700 hover:bg-rose-100/80 border-rose-200"
            default:
                return "bg-slate-100 text-slate-700 hover:bg-slate-100/80 border-slate-200"
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
