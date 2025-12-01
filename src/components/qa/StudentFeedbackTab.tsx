"use client"

import { useState } from "react"
import { useGetAllPhasesQuery, useGetClassFeedbacksQuery, useGetFeedbackDetailQuery } from "@/store/services/qaApi"
import { skipToken } from "@reduxjs/toolkit/query"
import { QAStatsCard } from "@/components/qa/QAStatsCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
    Plus,
    Loader2,
    AlertTriangle,
} from "lucide-react"
import { Link } from "react-router-dom"

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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardContent className="flex items-center justify-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="h-8 bg-muted rounded animate-pulse" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <p className="text-red-700">Không thể tải dữ liệu phản hồi. Vui lòng thử lại.</p>
                    </div>
                </div>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <QAStatsCard
                    title="Tổng số học viên"
                    value={statistics?.totalStudents || 0}
                    subtitle="Trong lớp học"
                    icon={Users}
                />

                <QAStatsCard
                    title="Đã nộp phản hồi"
                    value={`${statistics?.submittedCount || 0}/${statistics?.totalStudents || 0}`}
                    subtitle={`${statistics?.submissionRate?.toFixed(1) || 0}% tỷ lệ`}
                    icon={CheckCircle}
                />

                <QAStatsCard
                    title="Chưa nộp phản hồi"
                    value={statistics?.notSubmittedCount || 0}
                    subtitle="Học viên chưa phản hồi"
                    icon={TrendingUp}
                />

                <QAStatsCard
                    title="Tổng phản hồi"
                    value={statistics?.submittedCount || 0}
                    subtitle="Phản hồi đã nhận"
                    icon={MessageSquare}
                />
            </div>

            {/* Progress Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Tỷ Lệ Phản Hồi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Đã nộp phản hồi</span>
                                <span className="font-medium">{statistics?.submissionRate?.toFixed(1) || 0}%</span>
                            </div>
                            <Progress value={statistics?.submissionRate || 0} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-green-600">
                                    {statistics?.submittedCount || 0}
                                </div>
                                <p className="text-xs text-muted-foreground">Đã nộp</p>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-600">
                                    {statistics?.notSubmittedCount || 0}
                                </div>
                                <p className="text-xs text-muted-foreground">Chưa nộp</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Bộ Lọc</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium mb-2 block">Giai đoạn</label>
                            <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                                <SelectTrigger>
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

                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium mb-2 block">Trạng thái</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    <SelectItem value="submitted">Đã nộp</SelectItem>
                                    <SelectItem value="not_submitted">Chưa nộp</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Feedback List */}
            <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Danh Sách Phản Hồi ({filteredFeedbacks.length})</CardTitle>
                                <Button asChild>
                                    <Link to={`/qa/reports/create?classId=${classId}&reportType=STUDENT_FEEDBACK_ANALYSIS`}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Tạo Báo Cáo QA
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredFeedbacks.length > 0 ? (
                            filteredFeedbacks.map((feedback) => (
                                <div key={feedback.feedbackId} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div>
                                                    <h4 className="font-semibold">{feedback.studentName}</h4>
                                                    <p className="text-sm text-muted-foreground">{feedback.phaseName}</p>
                                                </div>
                                                {feedback.isFeedback && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenDialog(feedback.feedbackId)}
                                                    >
                                                        Xem chi tiết
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <Badge
                                            variant={feedback.isFeedback ? "default" : "secondary"}
                                            className="flex items-center space-x-1"
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
                                        <>
                                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                <div className="flex items-center space-x-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{formatDate(feedback.submittedAt)}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-sm text-gray-700 line-clamp-3">
                                                    {feedback.responsePreview}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-sm text-muted-foreground">
                                            Học viên này chưa nộp phản hồi.
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                    {feedbacks.length === 0
                                        ? "Chưa có phản hồi nào cho lớp học này."
                                        : "Không có phản hồi nào phù hợp với bộ lọc đã chọn."
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

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
