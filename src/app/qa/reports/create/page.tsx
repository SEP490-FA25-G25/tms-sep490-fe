"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { skipToken } from '@reduxjs/toolkit/query'
import { useCreateQAReportMutation, useGetQAClassesQuery, useGetQASessionListQuery, useGetPhasesByCourseIdQuery, useGetQAClassDetailQuery } from "@/store/services/qaApi"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Save, Send, Loader2, AlertTriangle, Check, ChevronsUpDown, Info } from "lucide-react"
import { QAReportType, QAReportStatus, isValidQAReportType } from "@/types/qa"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

// Business rules for report types
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
        label: "Phân tích đạt CLO",
        description: "Phân tích mức độ đạt được các chuẩn đầu ra của buổi/giai đoạn.",
        requiresSession: false,
        requiresPhase: false,
        level: 'session_or_phase'
    },
    [QAReportType.STUDENT_FEEDBACK_ANALYSIS]: {
        label: "Phân tích phản hồi học viên",
        description: "Tổng hợp và phân tích phản hồi từ học viên sau buổi/giai đoạn.",
        requiresSession: false,
        requiresPhase: false,
        level: 'session_or_phase'
    },
    [QAReportType.ATTENDANCE_ENGAGEMENT_REVIEW]: {
        label: "Đánh giá chuyên cần",
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

type ReportFormState = {
    classId: number;
    sessionId?: number;
    phaseId?: number;
    reportType: QAReportType;
    content: string;
    status: QAReportStatus;
}

export default function CreateQAReportPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [createReport, { isLoading, error }] = useCreateQAReportMutation()

    const [formData, setFormData] = useState<ReportFormState>({
        classId: 0,
        sessionId: undefined,
        phaseId: undefined,
        reportType: QAReportType.CLASSROOM_OBSERVATION,
        content: "",
        status: QAReportStatus.DRAFT,
    })

    const [openClassCombobox, setOpenClassCombobox] = useState(false)
    const [classSearchTerm, setClassSearchTerm] = useState("")

    // Get current report type config
    const currentReportConfig = REPORT_TYPE_CONFIG[formData.reportType]

    // Fetch real data from APIs
    const { data: classesData } = useGetQAClassesQuery({
        page: 0,
        size: 100,
        search: classSearchTerm || undefined
    })
    const { data: sessionsData } = useGetQASessionListQuery(
        formData.classId ? formData.classId : skipToken
    )

    const { data: classDetail } = useGetQAClassDetailQuery(
        formData.classId ? formData.classId : skipToken,
        { skip: !formData.classId }
    )

    const courseId = classDetail?.courseId

    // Fetch phases for selected class's course
    const { data: coursePhases } = useGetPhasesByCourseIdQuery(
        courseId ? courseId : skipToken
    )

    // Only show phases when class is selected and has course phases
    const availablePhases = coursePhases || []

    // Parse URL params on mount
    useEffect(() => {
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

    // Clear session/phase when report type changes (to enforce business rules)
    const handleReportTypeChange = (newType: QAReportType) => {
        const config = REPORT_TYPE_CONFIG[newType]
        setFormData(prev => ({
            ...prev,
            reportType: newType,
            // Clear fields that are not relevant for this report type
            sessionId: config.level === 'class' || config.level === 'phase' ? undefined : prev.sessionId,
            phaseId: config.level === 'class' || config.level === 'session' ? undefined : prev.phaseId,
        }))
    }

    // Validation based on business rules
    const isFormValid = useMemo(() => {
        if (!formData.classId || formData.content.length < 50) return false

        const config = currentReportConfig
        switch (config.level) {
            case 'session':
                return !!formData.sessionId
            case 'phase':
                return !!formData.phaseId
            case 'session_or_phase':
                return !!formData.sessionId || !!formData.phaseId
            case 'class':
                return true
            default:
                return true
        }
    }, [formData, currentReportConfig])

    // Get validation message
    const getValidationMessage = (): string | null => {
        if (!formData.classId) return "Vui lòng chọn lớp học"
        if (formData.content.length < 50) return `Nội dung cần thêm ${50 - formData.content.length} ký tự`

        const config = currentReportConfig
        switch (config.level) {
            case 'session':
                if (!formData.sessionId) return "Loại báo cáo này yêu cầu chọn buổi học"
                break
            case 'phase':
                if (!formData.phaseId) return "Loại báo cáo này yêu cầu chọn giai đoạn"
                break
            case 'session_or_phase':
                if (!formData.sessionId && !formData.phaseId) return "Loại báo cáo này yêu cầu chọn buổi học hoặc giai đoạn"
                break
        }
        return null
    }

    const handleSubmit = async (isDraft: boolean = true) => {
        if (!isFormValid && !isDraft) return

        try {
            const reportData = {
                ...formData,
                status: isDraft ? QAReportStatus.DRAFT : QAReportStatus.SUBMITTED,
            }

            const result = await createReport(reportData).unwrap()
            navigate(`/qa/reports/${result.id}`)
        } catch (err) {
            console.error('Failed to create report:', err)
        }
    }

    const handleInputChange = <K extends keyof ReportFormState>(
        field: K,
        value: ReportFormState[K] | string
    ) => {
        if (field === 'sessionId' || field === 'phaseId') {
            const parsedValue = value === "none" ? undefined : value ? parseInt(value as string, 10) : undefined
            setFormData(prev => ({ ...prev, [field]: parsedValue }))
            return
        }
        setFormData(prev => ({ ...prev, [field]: value as ReportFormState[K] }))
    }

    const selectedClass = classesData?.data?.find(c => c.classId === formData.classId)
    const validationMessage = getValidationMessage()

    // Filter completed sessions only (business rule: only DONE sessions can have QA reports)
    const completedSessions = useMemo(() => {
        return sessionsData?.sessions?.filter(s => s.status === 'DONE') || []
    }, [sessionsData])

    // Determine if session/phase fields should be shown based on report type
    const showSessionField = currentReportConfig.level === 'session' || currentReportConfig.level === 'session_or_phase'
    const showPhaseField = currentReportConfig.level === 'phase' || currentReportConfig.level === 'session_or_phase'

    // Get label suffix based on requirements
    const getFieldLabel = (field: 'session' | 'phase') => {
        const config = currentReportConfig
        if (field === 'session') {
            if (config.level === 'session') return "Buổi học *"
            if (config.level === 'session_or_phase') return "Buổi học (hoặc chọn giai đoạn)"
        }
        if (field === 'phase') {
            if (config.level === 'phase') return "Giai đoạn *"
            if (config.level === 'session_or_phase') return "Giai đoạn (hoặc chọn buổi học)"
        }
        return field === 'session' ? "Buổi học" : "Giai đoạn"
    }

    return (
        <DashboardLayout
            title="Tạo Báo Cáo QA"
            description="Lập báo cáo đánh giá chất lượng giảng dạy và học tập"
        >
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Không thể tạo báo cáo. Vui lòng kiểm tra lại thông tin và thử lại.
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
                                {/* Class Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="classId">Lớp học *</Label>
                                    <Popover open={openClassCombobox} onOpenChange={setOpenClassCombobox}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openClassCombobox}
                                                className="w-full justify-between font-normal h-auto min-h-10 py-2"
                                            >
                                                {selectedClass ? (
                                                    <div className="flex flex-col items-start text-left">
                                                        <span className="font-medium">{selectedClass.classCode}</span>
                                                        <span className="text-xs text-muted-foreground">{selectedClass.className}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">Chọn lớp học...</span>
                                                )}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[320px] p-0" align="start">
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder="Tìm theo mã hoặc tên lớp..."
                                                    value={classSearchTerm}
                                                    onValueChange={setClassSearchTerm}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>Không tìm thấy lớp học.</CommandEmpty>
                                                    <CommandGroup>
                                                        {classesData?.data?.map((cls) => (
                                                            <CommandItem
                                                                key={cls.classId}
                                                                value={cls.classId.toString()}
                                                                onSelect={(currentValue) => {
                                                                    handleInputChange('classId', parseInt(currentValue))
                                                                    setOpenClassCombobox(false)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        formData.classId === cls.classId ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{cls.classCode}</span>
                                                                    <span className="text-xs text-muted-foreground">{cls.className}</span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Report Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="reportType">Loại báo cáo *</Label>
                                    <Select
                                        value={formData.reportType}
                                        onValueChange={(value) => handleReportTypeChange(value as QAReportType)}
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

                                {/* Session (conditional) */}
                                {showSessionField && (
                                    <div className="space-y-2">
                                        <Label htmlFor="sessionId">{getFieldLabel('session')}</Label>
                                        <Select
                                            value={formData.sessionId?.toString() || "none"}
                                            onValueChange={(value) => handleInputChange('sessionId', value)}
                                            disabled={!formData.classId}
                                        >
                                            <SelectTrigger id="sessionId" className="w-full">
                                                <SelectValue placeholder={formData.classId ? "Chọn buổi học" : "Chọn lớp trước"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">-- Không chọn --</SelectItem>
                                                {completedSessions.length > 0 ? (
                                                    completedSessions.map((session) => (
                                                        <SelectItem key={session.sessionId} value={session.sessionId.toString()}>
                                                            Buổi {session.sequenceNumber || session.sessionId} - {new Date(session.date).toLocaleDateString('vi-VN')}
                                                        </SelectItem>
                                                    ))
                                                ) : formData.classId ? (
                                                    <SelectItem value="no-session" disabled>Chưa có buổi hoàn thành</SelectItem>
                                                ) : null}
                                            </SelectContent>
                                        </Select>
                                        {formData.classId && completedSessions.length === 0 && (
                                            <p className="text-xs text-amber-600">Lớp chưa có buổi học nào hoàn thành</p>
                                        )}
                                    </div>
                                )}

                                {/* Phase (conditional) */}
                                {showPhaseField && (
                                    <div className="space-y-2">
                                        <Label htmlFor="phaseId">{getFieldLabel('phase')}</Label>
                                        <Select
                                            value={formData.phaseId?.toString() || "none"}
                                            onValueChange={(value) => handleInputChange('phaseId', value)}
                                            disabled={!formData.classId}
                                        >
                                            <SelectTrigger id="phaseId" className="w-full">
                                                <SelectValue placeholder={formData.classId ? "Chọn giai đoạn" : "Chọn lớp trước"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">-- Không chọn --</SelectItem>
                                                {availablePhases.length > 0 ? (
                                                    [...availablePhases]
                                                        .sort((a, b) => a.phaseNumber - b.phaseNumber)
                                                        .map((phase) => (
                                                            <SelectItem key={phase.id} value={phase.id.toString()}>
                                                                {phase.name || `Giai đoạn ${phase.phaseNumber}`}
                                                            </SelectItem>
                                                        ))
                                                ) : formData.classId ? (
                                                    <SelectItem value="no-phase" disabled>Khóa học chưa có giai đoạn</SelectItem>
                                                ) : null}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
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
                            disabled={isLoading || !formData.classId || formData.content.length < 50}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Lưu nháp
                        </Button>
                        <Button
                            onClick={() => handleSubmit(false)}
                            disabled={isLoading || !isFormValid}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                            Nộp báo cáo
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
