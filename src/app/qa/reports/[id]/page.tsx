"use client"

import { useParams, Link } from "react-router-dom"
import { useGetQAReportDetailQuery } from "@/store/services/qaApi"
import { DashboardLayout } from "@/components/DashboardLayout"
import { QAReportStatusBadge } from "@/components/qa/QAReportStatusBadge"
import { QAReportStatus } from "@/types/qa"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Calendar, Edit, Loader2, AlertTriangle } from "lucide-react"

export default function QAReportDetailsPage() {
    const params = useParams()
    const reportId = parseInt(params.id as string)

    const { data: report, isLoading, error } = useGetQAReportDetailQuery(reportId)

    if (isLoading) {
        return (
            <DashboardLayout title="Đang tải..." description="Báo cáo QA">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Lỗi" description="Báo cáo QA">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Không thể tải thông tin báo cáo. Vui lòng thử lại.
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    if (!report) {
        return (
            <DashboardLayout title="Không tìm thấy" description="Báo cáo QA">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Báo cáo QA không tồn tại.
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title={`Báo Cáo QA #${report.id}`}
            description={report.reportType}
        >
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Back Button & Actions */}
                <div className="flex justify-between items-center">
                    <Link to="/qa/reports">
                        <Button variant="ghost" size="sm" className="gap-1 pl-0">
                            <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
                        </Button>
                    </Link>
                    {report.status === QAReportStatus.DRAFT && (
                        <Link to={`/qa/reports/${report.id}/edit`}>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Edit className="h-4 w-4" /> Chỉnh Sửa
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Report Details */}
                <div className="grid gap-6">
                    {/* Basic Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông Tin Chung</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Mã báo cáo</p>
                                    <p className="font-medium">#{report.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Trạng thái</p>
                                    <QAReportStatusBadge status={report.status} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Lớp học</p>
                                    <p className="font-medium">{report.classCode} - {report.className}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Người báo cáo</p>
                                    <p className="font-medium">{report.reportedByName}</p>
                                </div>
                                {report.sessionDate && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Buổi học</p>
                                        <p className="font-medium">
                                            {new Date(report.sessionDate).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                )}
                                {report.phaseName && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Giai đoạn</p>
                                        <p className="font-medium">{report.phaseName}</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ngày tạo</p>
                                        <p className="font-medium">
                                            {new Date(report.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                                {report.updatedAt && (
                                    <div className="flex items-center space-x-2">
                                        <Edit className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Cập nhật lần cuối</p>
                                            <p className="font-medium">
                                                {new Date(report.updatedAt).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Findings Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Kết Quả Tìm Thấy</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-sm max-w-none">
                                <p className="whitespace-pre-wrap">{report.findings}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Items Card */}
                    {report.actionItems && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Hành Động Đề Xuất</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm max-w-none">
                                    <p className="whitespace-pre-wrap">{report.actionItems}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}