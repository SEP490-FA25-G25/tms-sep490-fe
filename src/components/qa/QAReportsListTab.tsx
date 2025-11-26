"use client"

import { useState } from "react"
import { useGetQAReportsQuery } from "@/store/services/qaApi"
import { QAReportStatusBadge } from "@/components/qa/QAReportStatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getQAReportTypeDisplayName } from "@/types/qa"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    FileText,
    Plus,
    Eye,
    Edit,
    Loader2,
    AlertTriangle,
    Calendar,
} from "lucide-react"
import { Link } from "react-router-dom"

interface QAReportsListTabProps {
    classId: number
    onNavigateToCreate?: () => void
}

export function QAReportsListTab({ classId, onNavigateToCreate }: QAReportsListTabProps) {
    const [reportTypeFilter, setReportTypeFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
  
    const { data: reportsData, isLoading, error } = useGetQAReportsQuery({
        classId,
        reportType: reportTypeFilter === "all" ? undefined : reportTypeFilter as any,
        status: statusFilter === "all" ? undefined : statusFilter as any,
    })

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
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

    const reports = Array.isArray(reportsData) ? reportsData : []

    const filteredReports = reports.filter(report => {
        const typeMatch = reportTypeFilter === "all" || report.reportType === reportTypeFilter
        const statusMatch = statusFilter === "all" || report.status === statusFilter
        return typeMatch && statusMatch
    })

    const getReportLevelBadge = (report: any) => {
        if (report.sessionId) {
            return <Badge variant="outline">Buổi học</Badge>
        } else if (report.phaseId) {
            return <Badge variant="outline">Giai đoạn</Badge>
        } else {
            return <Badge variant="default">Lớp học</Badge>
        }
    }

    const formatDate = (dateString: string) => {
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
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Báo Cáo QA</h3>
                    <p className="text-sm text-muted-foreground">
                        {filteredReports.length} báo cáo
                    </p>
                </div>
                <Button onClick={onNavigateToCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo Báo Cáo Mới
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
                <div>
                    <label className="text-sm font-medium">Loại báo cáo:</label>
                    <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                        <SelectTrigger className="w-[250px] mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả loại báo cáo</SelectItem>
                            <SelectItem value="CLASSROOM_OBSERVATION">Quan sát lớp học</SelectItem>
                            <SelectItem value="PHASE_REVIEW">Đánh giá giai đoạn</SelectItem>
                            <SelectItem value="CLO_ACHIEVEMENT_ANALYSIS">Phân tích kết quả CLO</SelectItem>
                            <SelectItem value="STUDENT_FEEDBACK_ANALYSIS">Phân tích phản hồi học viên</SelectItem>
                            <SelectItem value="ATTENDANCE_ENGAGEMENT_REVIEW">Đánh giá chuyên cần & tham gia</SelectItem>
                            <SelectItem value="TEACHING_QUALITY_ASSESSMENT">Đánh giá chất lượng giảng dạy</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="text-sm font-medium">Trạng thái:</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="DRAFT">Bản nháp</SelectItem>
                            <SelectItem value="SUBMITTED">Đã nộp</SelectItem>
                            <SelectItem value="REVIEWED">Đã duyệt</SelectItem>
                            <SelectItem value="CLOSED">Đã đóng</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Reports List */}
            {filteredReports.length > 0 ? (
                <div className="space-y-4">
                    {filteredReports.map((report) => (
                        <Card key={report.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-2">
                                        {/* Header */}
                                        <div className="flex items-center space-x-3">
                                            <h4 className="font-semibold text-lg">
                                                {getQAReportTypeDisplayName(report.reportType as any)}
                                            </h4>
                                            {getReportLevelBadge(report)}
                                            <QAReportStatusBadge status={report.status} />
                                        </div>

                                        {/* Metadata */}
                                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="h-4 w-4" />
                                                <span>{formatDate(report.createdAt)}</span>
                                            </div>
                                            <div>
                                                <span>Tạo bởi: </span>
                                                <span className="font-medium">{report.reportedByName}</span>
                                            </div>
                                        </div>

                                        {/* Context Info */}
                                        <div className="flex items-center space-x-4 text-sm">
                                            <span className="font-medium">{report.classCode}</span>
                                            {report.sessionDate && (
                                                <>
                                                    <span className="text-muted-foreground">•</span>
                                                    <span>Buổi {new Date(report.sessionDate).toLocaleDateString('vi-VN')}</span>
                                                </>
                                            )}
                                            {report.phaseName && (
                                                <>
                                                    <span className="text-muted-foreground">•</span>
                                                    <span>{report.phaseName}</span>
                                                </>
                                            )}
                                        </div>

                                        {/* Findings Preview */}
                                        {report.findingsPreview && (
                                            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                                <p className="text-sm text-gray-700 line-clamp-3">
                                                    {report.findingsPreview}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center space-x-2 ml-4">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link to={`/qa/reports/${report.id}`}>
                                                <Eye className="h-4 w-4 mr-1" />
                                                Xem
                                            </Link>
                                        </Button>
                                        {report.status === "DRAFT" && (
                                            <Button variant="outline" size="sm" asChild>
                                                <Link to={`/qa/reports/${report.id}/edit`}>
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Chỉnh sửa
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                        {reports.length === 0
                            ? "Chưa có báo cáo QA nào cho lớp học này."
                            : "Không có báo cáo nào phù hợp với bộ lọc đã chọn."
                        }
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}