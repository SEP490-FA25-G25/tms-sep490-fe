import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { QAReportStatus as QAReportStatusEnum, getQAReportStatusDisplayName } from "@/types/qa"

interface QAReportStatusBadgeProps {
    status: QAReportStatusEnum | string
    className?: string
}

export function QAReportStatusBadge({ status, className }: QAReportStatusBadgeProps) {
    const getStatusStyles = (status: string) => {
        if (!status) {
            return "bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200"
        }
        // Handle both UPPERCASE and lowercase values for backward compatibility
        const normalizedStatus = status.toUpperCase()
        switch (normalizedStatus) {
            case "DRAFT":
                return "bg-slate-100 text-slate-700 hover:bg-slate-100/80 border-slate-200"
            case "SUBMITTED":
                return "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200"
            default:
                return "bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200"
        }
    }

    const getStatusLabel = (status: string) => {
        if (!status) {
            return "Không xác định"
        }
        // Handle both UPPERCASE and lowercase values for backward compatibility
        const normalizedStatus = status.toUpperCase()

        // Use Vietnamese display utilities for known enum values
        if (normalizedStatus === QAReportStatusEnum.DRAFT || normalizedStatus === QAReportStatusEnum.SUBMITTED) {
            return getQAReportStatusDisplayName(normalizedStatus as QAReportStatusEnum)
        }

        // Default for unknown status
        return status
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
