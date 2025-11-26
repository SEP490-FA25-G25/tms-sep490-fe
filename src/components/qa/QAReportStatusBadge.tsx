import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type QAReportStatus = "draft" | "submitted" | "reviewed" | "closed"

interface QAReportStatusBadgeProps {
    status: QAReportStatus | string
    className?: string
}

export function QAReportStatusBadge({ status, className }: QAReportStatusBadgeProps) {
    const getStatusStyles = (status: string) => {
        if (!status) {
            return "bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200"
        }
        switch (status.toLowerCase()) {
            case "draft":
                return "bg-slate-100 text-slate-700 hover:bg-slate-100/80 border-slate-200"
            case "submitted":
                return "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200"
            case "reviewed":
                return "bg-purple-100 text-purple-700 hover:bg-purple-100/80 border-purple-200"
            case "closed":
                return "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200"
            default:
                return "bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200"
        }
    }

    const getStatusLabel = (status: string) => {
        if (!status) {
            return "Không xác định"
        }
        switch (status.toLowerCase()) {
            case "draft":
                return "Nháp"
            case "submitted":
                return "Đã nộp"
            case "reviewed":
                return "Đã duyệt"
            case "closed":
                return "Đóng"
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
