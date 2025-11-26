"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCreateQAReportMutation } from "@/store/services/qaApi"
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
import { ArrowLeft, Save, Send, Loader2, AlertTriangle } from "lucide-react"
import { Link } from "react-router-dom"
import { QAReportType, QAReportStatus } from "@/types/qa"

export default function CreateQAReportPage() {
    const navigate = useNavigate()
    const [createReport, { isLoading, error }] = useCreateQAReportMutation()

    const [formData, setFormData] = useState({
        classId: 0,
        sessionId: undefined as number | undefined,
        phaseId: undefined as number | undefined,
        reportType: QAReportType.CLASSROOM_OBSERVATION as QAReportType,
        findings: "",
        actionItems: "",
        status: QAReportStatus.DRAFT as QAReportStatus,
    })

    const handleSubmit = async (isDraft: boolean = true) => {
        try {
            const reportData = {
                ...formData,
                status: isDraft ? QAReportStatus.DRAFT : QAReportStatus.SUBMITTED,
                // Ensure required fields are valid
                classId: formData.classId || 1, // Default class ID for demo
            }

            const result = await createReport(reportData).unwrap()

            // Show success message and redirect
            navigate(`/qa/reports/${result.id}`)
        } catch (err) {
            console.error('Failed to create report:', err)
        }
    }

    const handleInputChange = (field: string, value: any) => {
        // Handle special cases for select values
        if (field === 'sessionId' || field === 'phaseId') {
            value = value === "none" ? undefined : (value ? parseInt(value) : undefined)
        }

        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    return (
        <DashboardLayout
            title="Tạo Báo Cáo QA Mới"
            description="Lập báo cáo đánh giá chất lượng giảng dạy và học tập."
        >
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Back Button */}
                <div>
                    <Link to="/qa/reports">
                        <Button variant="ghost" size="sm" className="gap-1 pl-0">
                            <ArrowLeft className="h-4 w-4" /> Hủy và quay lại
                        </Button>
                    </Link>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Không thể tạo báo cáo. Vui lòng kiểm tra lại thông tin và thử lại.
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Thông Tin Báo Cáo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="classId">Lớp học *</Label>
                                <Select
                                    value={formData.classId.toString()}
                                    onValueChange={(value) => handleInputChange('classId', parseInt(value))}
                                >
                                    <SelectTrigger id="classId">
                                        <SelectValue placeholder="Chọn lớp học" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">CH-A1-001 - Chinese A1</SelectItem>
                                        <SelectItem value="2">EN-B2-003 - English B2</SelectItem>
                                        <SelectItem value="3">JP-N3-002 - Japanese N3</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

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

                            <div className="space-y-2">
                                <Label htmlFor="sessionId">Buổi học (nếu có)</Label>
                                <Select
                                    value={formData.sessionId?.toString() || "none"}
                                    onValueChange={(value) => handleInputChange('sessionId', value)}
                                >
                                    <SelectTrigger id="sessionId">
                                        <SelectValue placeholder="Chọn buổi học" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Không áp dụng</SelectItem>
                                        <SelectItem value="1">Session 1 - 2025-10-01</SelectItem>
                                        <SelectItem value="2">Session 2 - 2025-10-08</SelectItem>
                                        <SelectItem value="3">Session 3 - 2025-10-15</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phaseId">Giai đoạn (nếu có)</Label>
                                <Select
                                    value={formData.phaseId?.toString() || "none"}
                                    onValueChange={(value) => handleInputChange('phaseId', value)}
                                >
                                    <SelectTrigger id="phaseId">
                                        <SelectValue placeholder="Chọn giai đoạn" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Không áp dụng</SelectItem>
                                        <SelectItem value="1">Phase 1</SelectItem>
                                        <SelectItem value="2">Phase 2</SelectItem>
                                        <SelectItem value="3">Phase 3</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="findings">Kết quả tìm thấy *</Label>
                            <Textarea
                                id="findings"
                                placeholder="Mô tả chi tiết các kết quả quan sát, đánh giá được..."
                                value={formData.findings}
                                onChange={(e) => handleInputChange('findings', e.target.value)}
                                rows={6}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="actionItems">Hành động đề xuất</Label>
                            <Textarea
                                id="actionItems"
                                placeholder="Đề xuất các hành động cải thiện cụ thể..."
                                value={formData.actionItems}
                                onChange={(e) => handleInputChange('actionItems', e.target.value)}
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Trạng thái</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => handleInputChange('status', value)}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={QAReportStatus.DRAFT}>
                                        Nháp (Draft) - Lưu lại để chỉnh sửa sau
                                    </SelectItem>
                                    <SelectItem value={QAReportStatus.SUBMITTED}>
                                        Nộp báo cáo (Submitted) - Gửi đi phê duyệt
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => handleSubmit(true)}
                        disabled={isLoading || !formData.classId || !formData.findings}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Lưu Nháp
                    </Button>
                    <Button
                        onClick={() => handleSubmit(false)}
                        disabled={isLoading || !formData.classId || !formData.findings}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4 mr-2" />
                        )}
                        Nộp Báo Cáo
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    )
}