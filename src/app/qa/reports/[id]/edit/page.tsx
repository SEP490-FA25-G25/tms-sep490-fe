"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useGetQAReportDetailQuery, useUpdateQAReportMutation } from "@/store/services/qaApi"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, Send, Loader2, AlertTriangle } from "lucide-react"
import { QAReportType, QAReportStatus } from "@/types/qa"

export default function EditQAReportPage() {
    const params = useParams()
    const navigate = useNavigate()
    const reportId = parseInt(params.id as string)

    const { data: report, isLoading: loadingReport } = useGetQAReportDetailQuery(reportId)
    const [updateReport, { isLoading: updating, error }] = useUpdateQAReportMutation()

    const [formData, setFormData] = useState({
        reportType: QAReportType.CLASSROOM_OBSERVATION as QAReportType,
        content: "",
        status: QAReportStatus.DRAFT as QAReportStatus,
    })

    // Update form data when report is loaded
    useEffect(() => {
        if (report) {
            setFormData({
                reportType: report.reportType as QAReportType,
                content: report.content,
                status: report.status as QAReportStatus,
            })
        }
    }, [report])

    const handleSubmit = async (isDraft: boolean = true) => {
        try {
            const reportData = {
                ...formData,
                status: isDraft ? QAReportStatus.DRAFT : QAReportStatus.SUBMITTED,
            }

            const result = await updateReport({ id: reportId, data: reportData }).unwrap()

            // Show success message and redirect
            navigate(`/qa/reports/${result.id}`)
        } catch (err) {
            console.error('Failed to update report:', err)
        }
    }

    const handleInputChange = (field: string, value: string | QAReportType | QAReportStatus) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    if (loadingReport) {
        return (
            <DashboardLayout title="Đang tải..." description="Chỉnh sửa báo cáo QA">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (!report) {
        return (
            <DashboardLayout title="Không tìm thấy" description="Chỉnh sửa báo cáo QA">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Báo cáo QA không tồn tại.
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    // Don't allow editing submitted reports
    if (report.status === QAReportStatus.SUBMITTED) {
        return (
            <DashboardLayout title="Không thể chỉnh sửa" description="Chỉnh sửa báo cáo QA">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Báo cáo đã được nộp và không thể chỉnh sửa. Vui lòng liên hệ quản trị viên nếu cần thay đổi.
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title={`Chỉnh Sửa Báo Cáo QA #${report.id}`}
            description="Cập nhật thông tin báo cáo."
        >
            <div className="max-w-3xl mx-auto space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Không thể cập nhật báo cáo. Vui lòng kiểm tra lại thông tin và thử lại.
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Thông Tin Báo Cáo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="reportType">Loại báo cáo *</Label>
                            <Select
                                value={formData.reportType}
                                onValueChange={(value) => handleInputChange('reportType', value)}
                            >
                                <SelectTrigger id="reportType">
                                    <SelectValue placeholder="Chọn loại báo cáo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={QAReportType.CLASSROOM_OBSERVATION}>
                                        Classroom Observation
                                    </SelectItem>
                                    <SelectItem value={QAReportType.PHASE_REVIEW}>
                                        Phase Review
                                    </SelectItem>
                                    <SelectItem value={QAReportType.CLO_ACHIEVEMENT_ANALYSIS}>
                                        CLO Achievement Analysis
                                    </SelectItem>
                                    <SelectItem value={QAReportType.STUDENT_FEEDBACK_ANALYSIS}>
                                        Student Feedback Analysis
                                    </SelectItem>
                                    <SelectItem value={QAReportType.ATTENDANCE_ENGAGEMENT_REVIEW}>
                                        Attendance & Engagement Review
                                    </SelectItem>
                                    <SelectItem value={QAReportType.TEACHING_QUALITY_ASSESSMENT}>
                                        Teaching Quality Assessment
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Read-only fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Lớp học</Label>
                                <Input value={`${report.classCode} - ${report.className}`} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Người báo cáo</Label>
                                <Input value={report.reportedByName} disabled />
                            </div>
                        </div>

                        {report.sessionDate && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Buổi học</Label>
                                    <Input value={new Date(report.sessionDate).toLocaleDateString('vi-VN')} disabled />
                                </div>
                                {report.phaseName && (
                                    <div className="space-y-2">
                                        <Label>Giai đoạn</Label>
                                        <Input value={report.phaseName} disabled />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="content">Nội dung báo cáo * (tối thiểu 50 ký tự)</Label>
                            <Textarea
                                id="content"
                                placeholder="Mô tả chi tiết các kết quả quan sát, đánh giá được..."
                                value={formData.content}
                                onChange={(e) => handleInputChange('content', e.target.value)}
                                rows={8}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                {formData.content.length}/50 ký tự tối thiểu
                                {formData.content.length < 50 && formData.content.length > 0 && (
                                    <span className="text-red-500 ml-2">
                                        (Còn thiếu {50 - formData.content.length} ký tự)
                                    </span>
                                )}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => handleSubmit(true)}
                        disabled={updating || !formData.content || formData.content.length < 50}
                    >
                        {updating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Lưu Nháp
                    </Button>
                    <Button
                        onClick={() => handleSubmit(false)}
                        disabled={updating || !formData.content || formData.content.length < 50}
                    >
                        {updating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4 mr-2" />
                        )}
                        Cập Nhật Báo Cáo
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    )
}