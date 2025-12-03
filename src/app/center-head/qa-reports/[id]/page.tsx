"use client"

import { useParams, Link } from "react-router-dom"
import { useGetQAReportDetailQuery } from "@/store/services/qaApi"
import { DashboardLayout } from "@/components/DashboardLayout"
import { QAReportStatusBadge } from "@/components/qa/QAReportStatusBadge"
import { getQAReportTypeDisplayName } from "@/types/qa"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CenterHeadQAReportDetailPage() {
    const params = useParams()
    const reportId = parseInt(params.id as string)

    const { data: report, isLoading, error } = useGetQAReportDetailQuery(reportId)

    if (isLoading) {
        return (
            <DashboardLayout title="Đang tải..." description="Chi tiết báo cáo QA">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout title="Lỗi" description="Chi tiết báo cáo QA">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Không thể tải thông tin báo cáo. Vui lòng thử lại.
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        )
    }

    if (!report) {
        return (
            <DashboardLayout title="Không tìm thấy" description="Chi tiết báo cáo QA">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Báo cáo QA không tồn tại.
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        )
    }

    // Header actions - Back button only (read-only view)
    const headerActions = (
        <Button variant="outline" asChild>
            <Link to="/center-head/qa-reports">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
            </Link>
        </Button>
    )

    // Description with badge
    const headerDescription = (
        <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{getQAReportTypeDisplayName(report.reportType)}</Badge>
            <span>·</span>
            <span>{report.classCode}</span>
        </div>
    )

    return (
        <DashboardLayout
            title={`Báo Cáo #${report.id}`}
            description={headerDescription}
            actions={headerActions}
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    <Card className="py-0 gap-0">
                        <CardHeader className="py-3">
                            <CardTitle>Nội Dung Báo Cáo</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                    {report.content}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Report Info */}
                <div>
                    <Card className="py-0 gap-0">
                        <CardHeader className="py-3">
                            <CardTitle>Thông Tin</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pb-4">
                            {/* Status */}
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Trạng thái</span>
                                <QAReportStatusBadge status={report.status} />
                            </div>

                            {/* Class */}
                            <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground">Lớp học</span>
                                <span className="text-sm font-medium text-right">
                                    {report.classCode}
                                </span>
                            </div>

                            {/* Session Date */}
                            {report.sessionDate && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Buổi học</span>
                                    <span className="text-sm font-medium">
                                        {new Date(report.sessionDate).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            )}

                            {/* Phase */}
                            {report.phaseName && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Giai đoạn</span>
                                    <span className="text-sm font-medium">{report.phaseName}</span>
                                </div>
                            )}

                            <div className="border-t pt-4 space-y-4">
                                {/* Reporter */}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Người báo cáo</span>
                                    <span className="text-sm font-medium">{report.reportedByName}</span>
                                </div>

                                {/* Created At */}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Ngày tạo</span>
                                    <span className="text-sm font-medium">
                                        {new Date(report.createdAt).toLocaleDateString('vi-VN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>

                                {/* Updated At */}
                                {report.updatedAt && report.updatedAt !== report.createdAt && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Cập nhật</span>
                                        <span className="text-sm font-medium">
                                            {new Date(report.updatedAt).toLocaleDateString('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
