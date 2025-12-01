"use client"

import { useState } from "react"
import { useGetAllPhasesQuery, useGetClassFeedbacksQuery, useGetFeedbackDetailQuery } from "@/store/services/qaApi"
import { skipToken } from "@reduxjs/toolkit/query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Users,
    CheckCircle,
    MessageSquare,
    Calendar,
    TrendingUp,
    Loader2,
    AlertTriangle,
} from "lucide-react"

interface StudentFeedbackTabProps {
    classId: number
}

export function StudentFeedbackTab({ classId }: StudentFeedbackTabProps) {
    const [phaseFilter, setPhaseFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [selectedFeedback, setSelectedFeedback] = useState<number | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const { data: phases } = useGetAllPhasesQuery()

    const handleOpenDialog = (feedbackId: number) => {
        setSelectedFeedback(feedbackId)
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setSelectedFeedback(null)
        setIsDialogOpen(false)
    }

    const { data: feedbackData, isLoading, error } = useGetClassFeedbacksQuery({
        classId,
        filters: {
            phaseId: phaseFilter === "all" ? undefined : parseInt(phaseFilter),
            isFeedback: statusFilter === "all" ? undefined : statusFilter === "submitted",
        },
    })

    // Fetch feedback detail when dialog is opened
    const { data: feedbackDetail, isLoading: isDetailLoading } = useGetFeedbackDetailQuery(
        selectedFeedback ? selectedFeedback : skipToken
    )

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
                    Không thể tải dữ liệu phản hồi. Vui lòng thử lại.
                </AlertDescription>
            </Alert>
        )
    }

    const statistics = feedbackData?.statistics
    const feedbacks = Array.isArray(feedbackData?.feedbacks) ? feedbackData.feedbacks : []

    const filteredFeedbacks = feedbacks.filter(feedback => {
        const phaseMatch = phaseFilter === "all" || feedback.phaseId?.toString() === phaseFilter
        const statusMatch = statusFilter === "all" ||
            (statusFilter === "submitted" && feedback.isFeedback) ||
            (statusFilter === "not_submitted" && !feedback.isFeedback)
        return phaseMatch && statusMatch
    })

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "Chưa nộp"
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
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium">Tổng số học viên</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">{statistics?.totalStudents || 0}</p>
                </div>

                <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Đã nộp phản hồi</span>
                    </div>
                    <p className="text-lg font-semibold text-green-600">
                        {statistics?.submittedCount || 0}/{statistics?.totalStudents || 0}
                    </p>
                </div>

                <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Chưa nộp</span>
                    </div>
                    <p className="text-lg font-semibold text-amber-600">{statistics?.notSubmittedCount || 0}</p>
                </div>

                <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">Tỷ lệ phản hồi</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-foreground">{statistics?.submissionRate?.toFixed(1) || 0}%</p>
                        <Progress value={statistics?.submissionRate || 0} className="h-2 flex-1" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Giai đoạn:</span>
                        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Chọn giai đoạn" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả giai đoạn</SelectItem>
                                {[...(phases || [])].sort((a, b) => a.phaseNumber - b.phaseNumber).map((phase) => (
                                    <SelectItem key={phase.id} value={phase.id.toString()}>
                                        {phase.name || `Phase ${phase.phaseNumber}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Trạng thái:</span>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="submitted">Đã nộp</SelectItem>
                                <SelectItem value="not_submitted">Chưa nộp</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="text-sm text-muted-foreground">
                    Hiển thị {filteredFeedbacks.length} / {feedbacks.length} phản hồi
                </div>
            </div>

            {/* Feedback List */}
            <div className="rounded-lg border">
                {filteredFeedbacks.length > 0 ? (
                    <div className="divide-y">
                        {filteredFeedbacks.map((feedback) => (
                            <div 
                                key={feedback.feedbackId} 
                                className="p-4 space-y-3 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-semibold">{feedback.studentName}</h4>
                                        <p className="text-sm text-muted-foreground">{feedback.phaseName}</p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={`flex items-center gap-1 ${feedback.isFeedback ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80' : 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100/80'}`}
                                    >
                                        {feedback.isFeedback ? (
                                            <>
                                                <CheckCircle className="h-3 w-3" />
                                                <span>Đã nộp</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle className="h-3 w-3" />
                                                <span>Chưa nộp</span>
                                            </>
                                        )}
                                    </Badge>
                                </div>

                                {feedback.isFeedback ? (
                                    <div className="flex items-end justify-between gap-4">
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4 shrink-0" />
                                                <span>{formatDate(feedback.submittedAt)}</span>
                                            </div>
                                            {feedback.responsePreview && (
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {feedback.responsePreview}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="shrink-0"
                                            onClick={() => handleOpenDialog(feedback.feedbackId)}
                                        >
                                            Xem chi tiết
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Học viên này chưa nộp phản hồi.
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">
                            {feedbacks.length === 0
                                ? "Chưa có phản hồi nào cho lớp học này."
                                : "Không có phản hồi nào phù hợp với bộ lọc đã chọn."
                            }
                        </p>
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Chi tiết phản hồi</DialogTitle>
                        <DialogDescription>
                            Thông tin phản hồi của học viên cho lớp/phase hiện tại.
                        </DialogDescription>
                    </DialogHeader>
                    {isDetailLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : feedbackDetail ? (
                        <div className="space-y-4">
                            <div className="flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
                                <span><strong>Học viên:</strong> {feedbackDetail.studentName}</span>
                                <span><strong>Giai đoạn:</strong> {feedbackDetail.phaseName || "N/A"}</span>
                                <span><strong>Thời gian nộp:</strong> {formatDate(feedbackDetail.submittedAt || undefined)}</span>
                            </div>
                            {feedbackDetail.rating !== undefined && (
                                <div className="flex items-center space-x-2 text-sm">
                                    <span className="font-semibold">Đánh giá:</span>
                                    <span>{feedbackDetail.rating?.toFixed(1)}/5</span>
                                    {feedbackDetail.sentiment && (
                                        <Badge variant="outline">
                                            {feedbackDetail.sentiment === "positive"
                                                ? "Tích cực"
                                                : feedbackDetail.sentiment === "negative"
                                                    ? "Tiêu cực"
                                                    : "Trung bình"}
                                        </Badge>
                                    )}
                                </div>
                            )}
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Nội dung</p>
                                <div className="rounded-md border p-3 text-sm whitespace-pre-line">
                                    {feedbackDetail.response || "Không có nội dung"}
                                </div>
                            </div>
                            {feedbackDetail.detailedResponses?.length ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Câu hỏi chi tiết</p>
                                    <div className="space-y-2">
                                        {feedbackDetail.detailedResponses.map((item) => (
                                            <div key={item.questionId} className="rounded border p-3 text-sm">
                                                <p className="font-semibold">{item.questionText}</p>
                                                <p className="text-muted-foreground">{item.answerText || "Không có câu trả lời"}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            <div className="flex justify-end">
                                <Button variant="outline" onClick={handleCloseDialog}>Đóng</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-sm text-muted-foreground py-6">Không tìm thấy chi tiết phản hồi.</div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
