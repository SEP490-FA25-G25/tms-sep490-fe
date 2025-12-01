"use client"

import { useState } from "react"
import { useGetQAReportsQuery } from "@/store/services/qaApi"
import { QAReportStatusBadge } from "@/components/qa/QAReportStatusBadge"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getQAReportTypeDisplayName, type QAReportListItemDTO } from "@/types/qa"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    FileText,
    Loader2,
    AlertTriangle,
    FileCheck,
    FilePen,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

interface QAReportsListTabProps {
    classId: number
}

export function QAReportsListTab({ classId }: QAReportsListTabProps) {
    const [reportTypeFilter, setReportTypeFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const navigate = useNavigate()
  
    const { data: reportsData, isLoading, error } = useGetQAReportsQuery({
        classId,
        reportType: reportTypeFilter === "all" ? undefined : reportTypeFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Không thể tải danh sách báo cáo QA. Vui lòng thử lại.
                </AlertDescription>
            </Alert>
        )
    }

    const reports = reportsData?.data || []

    const filteredReports = reports.filter(report => {
        const typeMatch = reportTypeFilter === "all" || report.reportType === reportTypeFilter
        const statusMatch = statusFilter === "all" || report.status === statusFilter
        return typeMatch && statusMatch
    })

    // Stats
    const draftCount = reports.filter(r => r.status === "DRAFT").length
    const submittedCount = reports.filter(r => r.status === "SUBMITTED").length

    const getReportLevelBadge = (report: QAReportListItemDTO) => {
        if (report.sessionId) {
            return <Badge variant="outline" className="text-xs">Buổi học</Badge>
        } else if (report.phaseId) {
            return <Badge variant="outline" className="text-xs">Giai đoạn</Badge>
        } else {
            return <Badge variant="secondary" className="text-xs">Lớp học</Badge>
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        })
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="rounded-lg border bg-card shadow-sm p-2.5 sm:p-3 space-y-0.5 sm:space-y-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                        <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span className="text-xs sm:text-sm font-medium">Tổng báo cáo</span>
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-foreground">{reports.length}</p>
                </div>

                <div className="rounded-lg border bg-card shadow-sm p-2.5 sm:p-3 space-y-0.5 sm:space-y-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                        <FileCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span className="text-xs sm:text-sm font-medium">Đã nộp</span>
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-green-600">{submittedCount}</p>
                </div>

                <div className="rounded-lg border bg-card shadow-sm p-2.5 sm:p-3 space-y-0.5 sm:space-y-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                        <FilePen className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span className="text-xs sm:text-sm font-medium">Bản nháp</span>
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-amber-600">{draftCount}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Loại:</span>
                        <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                            <SelectTrigger className="w-[220px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả loại báo cáo</SelectItem>
                                <SelectItem value="CLASSROOM_OBSERVATION">Quan sát lớp học</SelectItem>
                                <SelectItem value="PHASE_REVIEW">Đánh giá giai đoạn</SelectItem>
                                <SelectItem value="CLO_ACHIEVEMENT_ANALYSIS">Phân tích kết quả CLO</SelectItem>
                                <SelectItem value="STUDENT_FEEDBACK_ANALYSIS">Phân tích phản hồi HV</SelectItem>
                                <SelectItem value="ATTENDANCE_ENGAGEMENT_REVIEW">Đánh giá chuyên cần</SelectItem>
                                <SelectItem value="TEACHING_QUALITY_ASSESSMENT">Đánh giá chất lượng GD</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Trạng thái:</span>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="DRAFT">Bản nháp</SelectItem>
                                <SelectItem value="SUBMITTED">Đã nộp</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="text-sm text-muted-foreground">
                    Hiển thị {filteredReports.length} / {reports.length} báo cáo
                </div>
            </div>

            {/* Reports Table */}
            <div className="rounded-lg border">
                {filteredReports.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold w-[30%]">Loại báo cáo</TableHead>
                                <TableHead className="font-semibold w-[15%]">Phạm vi</TableHead>
                                <TableHead className="font-semibold w-[20%]">Ngày tạo</TableHead>
                                <TableHead className="font-semibold w-[20%]">Người tạo</TableHead>
                                <TableHead className="font-semibold w-[15%]">Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReports.map((report) => (
                                <TableRow 
                                    key={report.id} 
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => navigate(`/qa/reports/${report.id}`)}
                                >
                                    <TableCell>
                                        <div className="space-y-1">
                                            <p className="font-medium">
                                                {getQAReportTypeDisplayName(report.reportType)}
                                            </p>
                                            {report.findingsPreview && (
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {report.findingsPreview}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            {getReportLevelBadge(report)}
                                            {report.sessionDate && (
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(report.sessionDate)}
                                                </p>
                                            )}
                                            {report.phaseName && (
                                                <p className="text-xs text-muted-foreground">
                                                    {report.phaseName}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {formatDateTime(report.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {report.reportedByName}
                                    </TableCell>
                                    <TableCell>
                                        <QAReportStatusBadge status={report.status} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">
                            {reports.length === 0
                                ? "Chưa có báo cáo QA nào cho lớp học này."
                                : "Không có báo cáo nào phù hợp với bộ lọc đã chọn."
                            }
                        </p>
                        {reports.length === 0 && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Sử dụng nút "Tạo Báo Cáo QA" ở trên để tạo báo cáo đầu tiên.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
