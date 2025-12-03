"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useGetQAReportDetailQuery, useUpdateQAReportMutation } from "@/store/services/qaApi"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Save, Send, Loader2, AlertTriangle, Info } from "lucide-react"
import { QAReportType, QAReportStatus } from "@/types/qa"

// Business rules for report types (same as create page)
const REPORT_TYPE_CONFIG: Record<QAReportType, {
    label: string;
    description: string;
    requiresSession: boolean;
    requiresPhase: boolean;
    level: 'session' | 'phase' | 'class' | 'session_or_phase';
}> = {
    [QAReportType.CLASSROOM_OBSERVATION]: {
        label: "Quan sát lớp học",
        description: "Quan sát trực tiếp một buổi học cụ thể, đánh giá hoạt động giảng dạy và học tập.",
        requiresSession: true,
        requiresPhase: false,
        level: 'session'
    },
    [QAReportType.PHASE_REVIEW]: {
        label: "Đánh giá giai đoạn",
        description: "Tổng hợp đánh giá sau khi kết thúc một giai đoạn học.",
        requiresSession: false,
        requiresPhase: true,
        level: 'phase'
    },
    [QAReportType.CLO_ACHIEVEMENT_ANALYSIS]: {
        label: "Phân tích mức độ đạt CLO",
        description: "Phân tích mức độ đạt được các chuẩn đầu ra của giai đoạn học.",
        requiresSession: false,
        requiresPhase: true,
        level: 'phase'
    },
    [QAReportType.STUDENT_FEEDBACK_ANALYSIS]: {
        label: "Phân tích phản hồi học viên",
        description: "Tổng hợp và phân tích phản hồi từ học viên sau giai đoạn học.",
        requiresSession: false,
        requiresPhase: true,
        level: 'phase'
    },
    [QAReportType.ATTENDANCE_ENGAGEMENT_REVIEW]: {
        label: "Đánh giá chuyên cần và tham gia",
        description: "Đánh giá tỷ lệ tham gia và mức độ hoàn thành bài tập.",
        requiresSession: false,
        requiresPhase: false,
        level: 'session_or_phase'
    },
    [QAReportType.TEACHING_QUALITY_ASSESSMENT]: {
        label: "Đánh giá chất lượng giảng dạy",
        description: "Đánh giá tổng thể chất lượng giảng dạy của lớp học.",
        requiresSession: false,
        requiresPhase: false,
        level: 'class'
    }
}

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

    // Get current report type config
    const currentReportConfig = REPORT_TYPE_CONFIG[formData.reportType]

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

    // Validation
    const isFormValid = formData.content.length >= 50
    const getValidationMessage = (): string | null => {
        if (formData.content.length < 50) return `Nội dung cần thêm ${50 - formData.content.length} ký tự`
        return null
    }
    const validationMessage = getValidationMessage()

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
            title="Chỉnh sửa báo cáo"
            description="Cập nhật thông tin báo cáo đánh giá chất lượng"
        >
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Không thể cập nhật báo cáo. Vui lòng kiểm tra lại thông tin và thử lại.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Form Layout: Sidebar config + Main content area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Configuration Panel */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base">Thông tin báo cáo</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Class (Read-only) */}
                                <div className="space-y-2">
                                    <Label>Lớp học</Label>
                                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                                        {report.classCode} - {report.className}
                                    </div>
                                </div>

                                {/* Report Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="reportType">Loại báo cáo *</Label>
                                    <Select
                                        value={formData.reportType}
                                        onValueChange={(value) => handleInputChange('reportType', value)}
                                    >
                                        <SelectTrigger id="reportType" className="w-full">
                                            <SelectValue placeholder="Chọn loại báo cáo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(REPORT_TYPE_CONFIG).map(([value, config]) => (
                                                <SelectItem key={value} value={value}>
                                                    {config.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        {currentReportConfig.description}
                                    </p>
                                </div>

                                {/* Session (Read-only, conditional) */}
                                {report.sessionDate && (
                                    <div className="space-y-2">
                                        <Label>Buổi học</Label>
                                        <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                                            {new Date(report.sessionDate).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                )}

                                {/* Phase (Read-only, conditional) */}
                                {report.phaseName && (
                                    <div className="space-y-2">
                                        <Label>Giai đoạn</Label>
                                        <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                                            {report.phaseName}
                                        </div>
                                    </div>
                                )}

                                {/* Reporter (Read-only) */}
                                <div className="space-y-2">
                                    <Label>Người báo cáo</Label>
                                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                                        {report.reportedByName}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Validation Status */}
                        {validationMessage && (
                            <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                                <Info className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-amber-700 dark:text-amber-400">
                                    {validationMessage}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Right: Content Editor */}
                    <div className="lg:col-span-2">
                        <Card className="h-full flex flex-col">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Nội dung báo cáo</CardTitle>
                                    <span className="text-sm text-muted-foreground">
                                        {formData.content.length} ký tự
                                        {formData.content.length < 50 && (
                                            <span className="text-amber-600 ml-1">
                                                (tối thiểu 50)
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                <Textarea
                                    id="content"
                                    placeholder={"Mô tả chi tiết các quan sát, đánh giá, và nhận xét của bạn...\n\nVí dụ nội dung có thể bao gồm:\n• Tình hình tham gia của học viên\n• Chất lượng giảng dạy của giáo viên\n• Những điểm mạnh và điểm cần cải thiện\n• Đề xuất và kiến nghị"}
                                    value={formData.content}
                                    onChange={(e) => handleInputChange('content', e.target.value)}
                                    className="flex-1 min-h-[400px] lg:min-h-[500px] resize-none text-base leading-relaxed whitespace-pre-wrap"
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Action Buttons - Sticky on mobile */}
                <div className="sticky bottom-0 bg-background/95 backdrop-blur py-4 -mx-4 px-4 border-t lg:relative lg:bg-transparent lg:backdrop-blur-none lg:py-0 lg:mx-0 lg:px-0 lg:border-0">
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handleSubmit(true)}
                            disabled={updating || !isFormValid}
                        >
                            {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Lưu nháp
                        </Button>
                        <Button
                            onClick={() => handleSubmit(false)}
                            disabled={updating || !isFormValid}
                        >
                            {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                            Nộp báo cáo
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
