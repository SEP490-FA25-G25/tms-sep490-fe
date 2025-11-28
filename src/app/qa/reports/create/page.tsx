"use client"

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { skipToken } from '@reduxjs/toolkit/query'
import { useCreateQAReportMutation, useGetQAClassesQuery, useGetQASessionListQuery } from "@/store/services/qaApi"
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
import { QAReportType, QAReportStatus, qaReportTypeOptions, isValidQAReportType } from "@/types/qa"

export default function CreateQAReportPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
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

    // Fetch real data from APIs
    const { data: classesData } = useGetQAClassesQuery({ page: 0, size: 100 })
    const { data: sessionsData } = useGetQASessionListQuery(
        formData.classId ? formData.classId : skipToken
    )

    useEffect(() => {
        // Parse query parameters
        const classIdParam = searchParams.get('classId')
        const sessionIdParam = searchParams.get('sessionId')
        const phaseIdParam = searchParams.get('phaseId')
        const reportTypeParam = searchParams.get('reportType')

        setFormData(prev => ({
            ...prev,
            classId: classIdParam ? parseInt(classIdParam) : 0,
            sessionId: sessionIdParam ? parseInt(sessionIdParam) : undefined,
            phaseId: phaseIdParam ? parseInt(phaseIdParam) : undefined,
            reportType: reportTypeParam && isValidQAReportType(reportTypeParam)
                ? reportTypeParam as QAReportType
                : QAReportType.CLASSROOM_OBSERVATION,
        }))
    }, [searchParams])


    const handleSubmit = async (isDraft: boolean = true) => {
        // Validation
        if (!formData.classId) {
            return // Required field validation handled by button disabled state
        }

        if (formData.findings.length < 50) {
            alert('Kết quả đánh giá phải có ít nhất 50 ký tự')
            return
        }

        try {
            const reportData = {
                ...formData,
                status: isDraft ? QAReportStatus.DRAFT : QAReportStatus.SUBMITTED,
                classId: formData.classId,
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
                                    value={formData.classId ? formData.classId.toString() : ""}
                                    onValueChange={(value) => handleInputChange('classId', parseInt(value))}
                                >
                                    <SelectTrigger id="classId">
                                        <SelectValue placeholder="Chọn lớp học" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classesData?.data && classesData.data.length > 0 ? (
                                            classesData.data.map((cls) => (
                                                <SelectItem key={cls.classId} value={cls.classId.toString()}>
                                                    {cls.classCode} - {cls.className}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="" disabled>Không có lớp học nào</SelectItem>
                                        )}
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
                                        {qaReportTypeOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sessionId">Buổi học (nếu có)</Label>
                                <Select
                                    value={formData.sessionId?.toString() || "none"}
                                    onValueChange={(value) => handleInputChange('sessionId', value)}
                                    disabled={!formData.classId}
                                >
                                    <SelectTrigger id="sessionId">
                                        <SelectValue placeholder={formData.classId ? "Chọn buổi học" : "Chọn lớp học trước"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Không áp dụng</SelectItem>
                                        {sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
                                            sessionsData.sessions.map((session) => (
                                                <SelectItem key={session.sessionId} value={session.sessionId.toString()}>
                                                    Buổi {session.sequenceNumber || session.sessionId} - {new Date(session.date).toLocaleDateString('vi-VN')} ({session.topic})
                                                </SelectItem>
                                            ))
                                        ) : formData.classId ? (
                                            <SelectItem value="" disabled>Không có buổi học nào</SelectItem>
                                        ) : null}
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
                            <Label htmlFor="findings">Kết quả tìm thấy * (tối thiểu 50 ký tự)</Label>
                            <Textarea
                                id="findings"
                                placeholder="Mô tả chi tiết các kết quả quan sát, đánh giá được..."
                                value={formData.findings}
                                onChange={(e) => handleInputChange('findings', e.target.value)}
                                rows={6}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                {formData.findings.length}/50 ký tự tối thiểu
                                {formData.findings.length < 50 && formData.findings.length > 0 && (
                                    <span className="text-red-500 ml-2">
                                        (Còn thiếu {50 - formData.findings.length} ký tự)
                                    </span>
                                )}
                            </p>
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
                        disabled={isLoading || !formData.classId || !formData.findings || formData.findings.length < 50}
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
                        disabled={isLoading || !formData.classId || !formData.findings || formData.findings.length < 50}
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