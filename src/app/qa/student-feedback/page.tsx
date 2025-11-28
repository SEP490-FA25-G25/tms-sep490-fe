"use client"

import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { skipToken } from "@reduxjs/toolkit/query"
import {
    BarChart3Icon,
    UsersIcon,
    MessageSquareIcon,
    CalendarIcon,
    TrendingUpIcon,
    CheckCircleIcon,
    AlertCircleIcon,
    Loader2,
    AlertTriangle
} from "lucide-react"

import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QAReportStatus } from "@/types/qa"
import {
    useGetClassFeedbacksQuery,
    useGetQAClassesQuery,
    useGetAllPhasesQuery,
    useGetPhasesByCourseIdQuery,
    useGetQAClassDetailQuery
} from "@/store/services/qaApi"

export default function StudentFeedbackPage() {
    const [searchParams, setSearchParams] = useSearchParams()

    // Get classId from URL params or state
    const urlClassId = searchParams.get('classId')
    const [selectedClassId, setSelectedClassId] = useState<number | null>(
        urlClassId ? parseInt(urlClassId) : null
    )

    const [selectedPhase, setSelectedPhase] = useState<string>("all")
    const [selectedStatus, setSelectedStatus] = useState<string>("all")

    // Fetch available classes
    const { data: classesData, isLoading: classesLoading } = useGetQAClassesQuery({
        page: 0,
        size: 100,
        sort: 'startDate',
        sortDir: 'desc'
    })

    // Fetch phases - use all phases for dropdown, or course-specific if class is selected
    const { data: allPhases } = useGetAllPhasesQuery()
    const { data: classDetail } = useGetQAClassDetailQuery(
        selectedClassId ? selectedClassId : skipToken,
        { skip: !selectedClassId }
    )

    const courseId = classDetail?.courseId

    const { data: coursePhases } = useGetPhasesByCourseIdQuery(
        courseId ? courseId : skipToken
    )

    // Use course-specific phases if class is selected, otherwise use all phases
    const availablePhases = selectedClassId ? (coursePhases || allPhases || []) : (allPhases || [])

    // Fetch feedback data for selected class
    const { data: feedbackData, isLoading: feedbackLoading, error: feedbackError } = useGetClassFeedbacksQuery(
        {
            classId: selectedClassId!,
            filters: {
                phaseId: selectedPhase !== "all" ? parseInt(selectedPhase) : undefined,
                isFeedback: selectedStatus === "not_submitted" ? false :
                           selectedStatus === QAReportStatus.SUBMITTED ? true : undefined,
                page: 0,
                size: 100
            }
        },
        { skip: !selectedClassId }
    )

    const feedbacks = feedbackData?.feedbacks || []
    const {
        totalStudents = 0,
        submittedCount = 0,
        notSubmittedCount = 0,
        submissionRate = 0,
        averageRating = 0,
        positiveFeedbackCount = 0,
        negativeFeedbackCount = 0,
    } = feedbackData?.statistics || {}

    const neutralFeedbackCount = Math.max(0, submittedCount - positiveFeedbackCount - negativeFeedbackCount)
    const positiveFeedbackRate = submittedCount > 0
        ? ((positiveFeedbackCount / submittedCount) * 100)
        : 0

    const filteredFeedbacks = feedbacks.filter(feedback => {
        const phaseMatch = selectedPhase === "all" ||
                          (feedback.phaseId !== undefined && feedback.phaseId?.toString() === selectedPhase)
        const statusMatch = selectedStatus === "all" ||
            (selectedStatus === QAReportStatus.SUBMITTED && feedback.isFeedback) ||
            (selectedStatus === "not_submitted" && !feedback.isFeedback)
        return phaseMatch && statusMatch
    })

    const handleClassSelect = (classId: string) => {
        const id = parseInt(classId)
        setSelectedClassId(id)
        if (id) {
            setSearchParams({ classId: id.toString() })
        } else {
            setSearchParams({})
        }
    }

    const getSentimentIcon = (sentiment: string) => {
        switch (sentiment) {
            case "positive":
                return <CheckCircleIcon className="h-4 w-4 text-green-500" />
            case "negative":
                return <AlertCircleIcon className="h-4 w-4 text-red-500" />
            default:
                return <MessageSquareIcon className="h-4 w-4 text-yellow-500" />
        }
    }

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case "positive":
                return "text-green-700 bg-green-50 border-green-200"
            case "negative":
                return "text-red-700 bg-red-50 border-red-200"
            default:
                return "text-yellow-700 bg-yellow-50 border-yellow-200"
        }
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Chưa nộp"
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const getRatingStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-300"}>
                ★
            </span>
        ))
    }

    // Loading state
    if (classesLoading) {
        return (
            <DashboardLayout
                title="Phản Hồi Học Viên"
                description="Phân tích phản hồi từ học viên để cải thiện chất lượng giảng dạy"
            >
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Phản Hồi Học Viên"
            description="Phân tích phản hồi từ học viên để cải thiện chất lượng giảng dạy"
        >
            <div className="space-y-6">
                {/* Class Selector */}
                <Card>
                    <CardHeader>
                        <CardTitle>Chọn lớp học</CardTitle>
                        <CardDescription>
                            Chọn lớp học để xem phản hồi của học viên
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex-1 min-w-[300px]">
                            <Select value={selectedClassId?.toString() || ""} onValueChange={handleClassSelect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn lớp học để xem phản hồi" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classesData?.data.map((classItem) => (
                                        <SelectItem key={classItem.classId} value={classItem.classId.toString()}>
                                            {classItem.classCode} - {classItem.className} ({classItem.courseName})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Show content only when class is selected */}
                {selectedClassId ? (
                    <>
                        {feedbackLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : feedbackError ? (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Không thể tải phản hồi của học viên. Vui lòng thử lại.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <>
                                {/* Statistics Cards */}
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Tổng số học viên</CardTitle>
                                            <UsersIcon className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{totalStudents}</div>
                                            <p className="text-xs text-muted-foreground">
                                                Trong lớp học
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Đã nộp phản hồi</CardTitle>
                                            <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{submittedCount}/{totalStudents}</div>
                                            <p className="text-xs text-muted-foreground">
                                                Tỷ lệ {submissionRate.toFixed(1)}%
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Đánh giá trung bình</CardTitle>
                                            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{averageRating.toFixed(1)}/5.0</div>
                                            <p className="text-xs text-muted-foreground">
                                                {getRatingStars(Math.round(averageRating))}
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Phản hồi tích cực</CardTitle>
                                            <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{positiveFeedbackCount}</div>
                                            <p className="text-xs text-muted-foreground">
                                                {submittedCount > 0 ? positiveFeedbackRate.toFixed(1) : '0'}% tổng phản hồi
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Progress Overview */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Tỷ lệ phản hồi</CardTitle>
                                        <CardDescription>
                                            Tiến độ nộp phản hồi của học viên
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>Đã nộp</span>
                                                    <span>{submissionRate.toFixed(1)}%</span>
                                                </div>
                                                <Progress value={submissionRate} className="h-2" />
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                                <div>
                                                    <div className="text-2xl font-bold text-green-600">{positiveFeedbackCount}</div>
                                                    <p className="text-xs text-muted-foreground">Tích cực</p>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold text-yellow-600">{neutralFeedbackCount}</div>
                                                    <p className="text-xs text-muted-foreground">Trung bình</p>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold text-red-600">{negativeFeedbackCount}</div>
                                                    <p className="text-xs text-muted-foreground">Tiêu cực</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Filters */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Bộ lọc</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex-1 min-w-[200px]">
                                                <label className="text-sm font-medium mb-2 block">Giai đoạn</label>
                                                <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn giai đoạn" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Tất cả giai đoạn</SelectItem>
                                                        {[...availablePhases]
                                                            .sort((a, b) => a.phaseNumber - b.phaseNumber)
                                                            .map((phase) => (
                                                                <SelectItem key={phase.id} value={phase.id.toString()}>
                                                                    {phase.name || `Phase ${phase.phaseNumber}`}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex-1 min-w-[200px]">
                                                <label className="text-sm font-medium mb-2 block">Trạng thái</label>
                                                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn trạng thái" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                                        <SelectItem value={QAReportStatus.SUBMITTED}>Đã nộp</SelectItem>
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
                                        <CardTitle>Danh sách phản hồi ({filteredFeedbacks.length})</CardTitle>
                                        <CardDescription>
                                            Xem chi tiết phản hồi từ học viên
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {filteredFeedbacks.length === 0 ? (
                                            <div className="text-center py-8">
                                                <MessageSquareIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                <p className="text-muted-foreground">Không có phản hồi nào phù hợp với bộ lọc.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {filteredFeedbacks.map((feedback) => (
                                                    <div key={feedback.feedbackId} className="border rounded-lg p-4 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <div>
                                                                    <h4 className="font-semibold">{feedback.studentName}</h4>
                                                                    <p className="text-sm text-muted-foreground">{feedback.phaseName || 'Chưa xác định'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Badge
                                                                    variant={feedback.isFeedback ? "default" : "secondary"}
                                                                    className="flex items-center space-x-1"
                                                                >
                                                                    {feedback.isFeedback ? (
                                                                        <>
                                                                            <CheckCircleIcon className="h-3 w-3" />
                                                                            <span>Đã nộp</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <AlertCircleIcon className="h-3 w-3" />
                                                                            <span>Chưa nộp</span>
                                                                        </>
                                                                    )}
                                                                </Badge>
                                                                {feedback.isFeedback && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={getSentimentColor(feedback.sentiment)}
                                                                    >
                                                                        <span className="flex items-center space-x-1">
                                                                            {getSentimentIcon(feedback.sentiment)}
                                                                            <span>{feedback.sentiment === "positive" ? "Tích cực" : feedback.sentiment === "negative" ? "Tiêu cực" : "Trung bình"}</span>
                                                                        </span>
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {feedback.isFeedback ? (
                                                            <>
                                                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                                    <div className="flex items-center space-x-1">
                                                                        <CalendarIcon className="h-4 w-4" />
                                                                        <span>{formatDate(feedback.submittedAt || null)}</span>
                                                                    </div>
                                                                    <div className="flex items-center space-x-1">
                                                                        <span>Đánh giá:</span>
                                                                        <div className="flex items-center">
                                                                            {getRatingStars(feedback.rating)}
                                                                            <span className="ml-2 font-medium">{feedback.rating}.0</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <p className="text-sm text-gray-700 line-clamp-2">
                                                                        {feedback.responsePreview}
                                                                    </p>
                                                                    <Button variant="link" className="p-0 h-auto text-sm">
                                                                        Xem chi tiết phản hồi
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="text-sm text-muted-foreground">
                                                                Chưa có phản hồi từ học viên này
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <MessageSquareIcon className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Chọn lớp học để bắt đầu</h3>
                            <p className="text-sm text-muted-foreground text-center max-w-md">
                                Vui lòng chọn một lớp học từ danh sách bên trên để xem phân tích phản hồi của học viên.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    )
}
