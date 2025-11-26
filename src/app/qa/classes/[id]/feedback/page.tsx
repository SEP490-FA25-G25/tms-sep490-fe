"use client"

import { useState } from "react"
import { useParams } from "react-router-dom"
import { useGetClassFeedbacksQuery } from "@/store/services/qaApi"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    ArrowLeft,
    Users,
    CheckCircle,
    XCircle,
    MessageSquare,
    TrendingUp,
    FileText,
    Plus,
    Eye,
    Loader2,
    AlertTriangle,
} from "lucide-react"
import { Link } from "react-router-dom"

interface StudentFeedbackTabProps {
    classId: number
}

export function StudentFeedbackTab({ classId }: StudentFeedbackTabProps) {
    const [phaseFilter, setPhaseFilter] = useState<string>("all")
    const [submissionFilter, setSubmissionFilter] = useState<string>("all")
    const [selectedFeedback, setSelectedFeedback] = useState<any>(null)

    const { data: feedbackData, isLoading, error } = useGetClassFeedbacksQuery({
        classId,
        filters: {
            phaseId: phaseFilter === "all" ? undefined : parseInt(phaseFilter),
            isFeedback: submissionFilter === "all" ? undefined : submissionFilter === "submitted",
        }
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Không thể tải dữ liệu phản hồi học viên. Vui lòng thử lại.
                </AlertDescription>
            </Alert>
        )
    }

    if (!feedbackData) {
        return (
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Không có dữ liệu phản hồi học viên cho lớp này.
                </AlertDescription>
            </Alert>
        )
    }

    const { statistics, feedbacks } = feedbackData

    const getSubmissionRateColor = (rate: number) => {
        if (rate >= 90) return "text-green-600"
        if (rate >= 75) return "text-yellow-600"
        return "text-red-600"
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

    const FeedbackDetailModal = ({ feedback }: { feedback: any }) => (
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Phản Hồi Chi Tiết</DialogTitle>
                <DialogDescription>
                    Phản hồi từ {feedback.studentName} {feedback.phaseName && `- ${feedback.phaseName}`}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
                {/* Student Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Học viên</p>
                        <p className="font-medium">{feedback.studentName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Thời gian phản hồi</p>
                        <p className="font-medium">{formatDate(feedback.submittedAt)}</p>
                    </div>
                </div>

                {/* Detailed Responses */}
                <div className="space-y-4">
                    <h4 className="font-medium">Câu trả lời chi tiết</h4>
                    <div className="space-y-3">
                        {feedback.detailedResponses?.map((response: any) => (
                            <div key={response.questionId} className="p-4 border rounded-lg">
                                <p className="font-medium mb-2">{response.questionText}</p>
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                    {response.answerText}
                                </p>
                            </div>
                        )) || (
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Không có câu trả lời chi tiết.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
                        Đóng
                    </Button>
                    <Button>
                        <FileText className="h-4 w-4 mr-2" />
                        Tạo Báo Cáo QA
                    </Button>
                </div>
            </div>
        </DialogContent>
    )

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Tổng số học viên</p>
                                <p className="text-2xl font-bold">{statistics.totalStudents}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Đã phản hồi</p>
                                <p className="text-2xl font-bold text-green-600">{statistics.submittedCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Chưa phản hồi</p>
                                <p className="text-2xl font-bold text-red-600">{statistics.notSubmittedCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Tỷ lệ phản hồi</p>
                                <p className={`text-2xl font-bold ${getSubmissionRateColor(statistics.submissionRate)}`}>
                                    {statistics.submissionRate.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Bar */}
            <div className="p-6 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Tiến độ phản hồi</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {statistics.submittedCount}/{statistics.totalStudents} học viên
                    </span>
                </div>
                <Progress
                    value={statistics.submissionRate}
                    className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                    {statistics.submissionRate >= 90
                        ? "Tuyệt vời! Đa số học viên đã phản hồi."
                        : statistics.submissionRate >= 75
                        ? "Khá tốt. Cần khuyến khích thêm học viên phản hồi."
                        : "Cần cải thiện. Tỷ lệ phản hồi còn thấp."
                    }
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
                <div>
                    <label className="text-sm font-medium">Giai đoạn:</label>
                    <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                        <SelectTrigger className="w-[200px] mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả giai đoạn</SelectItem>
                            <SelectItem value="1">Phase 1</SelectItem>
                            <SelectItem value="2">Phase 2</SelectItem>
                            <SelectItem value="3">Phase 3</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="text-sm font-medium">Trạng thái:</label>
                    <Select value={submissionFilter} onValueChange={setSubmissionFilter}>
                        <SelectTrigger className="w-[200px] mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="submitted">Đã phản hồi</SelectItem>
                            <SelectItem value="not_submitted">Chưa phản hồi</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="text-sm text-muted-foreground flex items-center">
                    Hiển thị {feedbacks.length} phản hồi
                </div>
            </div>

            {/* Feedbacks List */}
            {feedbacks.length > 0 ? (
                <div className="space-y-4">
                    {feedbacks.map((feedback) => (
                        <Card key={feedback.feedbackId} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-2">
                                        {/* Header */}
                                        <div className="flex items-center space-x-3">
                                            <h4 className="font-semibold text-lg">{feedback.studentName}</h4>
                                            {feedback.isFeedback ? (
                                                <Badge variant="default" className="bg-green-100 text-green-700">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Đã phản hồi
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    <XCircle className="h-3 w-3 mr-1" />
                                                    Chưa phản hồi
                                                </Badge>
                                            )}
                                            {feedback.phaseName && (
                                                <Badge variant="secondary">{feedback.phaseName}</Badge>
                                            )}
                                        </div>

                                        {/* Submission Info */}
                                        {feedback.submittedAt && (
                                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                <div className="flex items-center space-x-1">
                                                    <MessageSquare className="h-4 w-4" />
                                                    <span>Phản hồi lúc: {formatDate(feedback.submittedAt)}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Response Preview */}
                                        {feedback.responsePreview && (
                                            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                                <p className="text-sm text-gray-700 line-clamp-2">
                                                    {feedback.responsePreview}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center space-x-2 ml-4">
                                        {feedback.isFeedback ? (
                                            <Dialog open={selectedFeedback?.feedbackId === feedback.feedbackId} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" onClick={() => setSelectedFeedback(feedback)}>
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        Xem chi tiết
                                                    </Button>
                                                </DialogTrigger>
                                                {selectedFeedback && <FeedbackDetailModal feedback={selectedFeedback} />}
                                            </Dialog>
                                        ) : (
                                            <Alert className="p-3">
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertDescription className="text-xs">
                                                    Học viên chưa phản hồi
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Alert>
                    <MessageSquare className="h-4 w-4" />
                    <AlertDescription>
                        {statistics.totalStudents === 0
                            ? "Chưa có học viên nào trong lớp này."
                            : "Không có phản hồi nào phù hợp với bộ lọc đã chọn."
                        }
                    </AlertDescription>
                </Alert>
            )}

            {/* Action Button */}
            <div className="flex justify-end">
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    <FileText className="h-4 w-4 mr-2" />
                    Tạo Báo Cáo QA từ Phản Hồi
                </Button>
            </div>
        </div>
    )
}

export default function StudentFeedbackPage() {
    const params = useParams()
    const classId = parseInt(params.id as string)

    return (
        <DashboardLayout
            title="Phản Hồi Học Viên"
            description="Phân tích phản hồi của học viên về chất lượng giảng dạy và học tập."
        >
            <div className="space-y-6">
                {/* Back Button */}
                <div>
                    <Link to={`/qa/classes/${classId}`}>
                        <Button variant="ghost" size="sm" className="gap-1 pl-0">
                            <ArrowLeft className="h-4 w-4" /> Quay lại chi tiết lớp
                        </Button>
                    </Link>
                </div>

                {/* Main Content */}
                <StudentFeedbackTab classId={classId} />
            </div>
        </DashboardLayout>
    )
}