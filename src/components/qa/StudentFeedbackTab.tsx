"use client"

import { useState } from "react"
import { useGetClassFeedbacksQuery, useGetFeedbackDetailQuery, useGetPhasesByCourseIdQuery } from "@/store/services/qaApi"
import { skipToken } from "@reduxjs/toolkit/query"
import { Button } from "@/components/ui/button"
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
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import {
    MessageSquare,
    Loader2,
    AlertTriangle,
    Star,
    Search,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { DataTable } from "./feedback/DataTable"
import { feedbackColumns, type FeedbackItem } from "./feedback/columns"

const PAGE_SIZE = 10

interface StudentFeedbackTabProps {
    classId: number
    courseId: number
}

export function StudentFeedbackTab({ classId, courseId }: StudentFeedbackTabProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [phaseFilter, setPhaseFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [page, setPage] = useState(0)
    const [selectedFeedback, setSelectedFeedback] = useState<number | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Fetch phases for this course
    const { data: phases = [] } = useGetPhasesByCourseIdQuery(courseId)

    const handleOpenDialog = (feedbackId: number) => {
        setSelectedFeedback(feedbackId)
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setSelectedFeedback(null)
        setIsDialogOpen(false)
    }

    // Reset page when filters/search change
    const handleFilterChange = (setter: (value: string) => void, value: string) => {
        setter(value)
        setPage(0)
    }

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        setPage(0)
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

    const feedbacks = Array.isArray(feedbackData?.feedbacks) ? feedbackData.feedbacks : []

    const filteredFeedbacks: FeedbackItem[] = feedbacks.filter(feedback => {
        const phaseMatch = phaseFilter === "all" || feedback.phaseId?.toString() === phaseFilter
        const statusMatch = statusFilter === "all" ||
            (statusFilter === "submitted" && feedback.isFeedback) ||
            (statusFilter === "not_submitted" && !feedback.isFeedback)
        
        // Search filter (studentName)
        const searchLower = searchQuery.toLowerCase().trim()
        const searchMatch = !searchLower || 
            feedback.studentName?.toLowerCase().includes(searchLower)
        
        return phaseMatch && statusMatch && searchMatch
    })

    // Pagination calculations
    const totalItems = filteredFeedbacks.length
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
    const paginatedFeedbacks = filteredFeedbacks.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

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
        <div className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Search - Left */}
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo tên học viên..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-8 h-9"
                    />
                </div>
                {/* Filters - Right */}
                <div className="flex items-center gap-2 ml-auto">
                    <Select value={phaseFilter} onValueChange={(v) => handleFilterChange(setPhaseFilter, v)}>
                        <SelectTrigger className="h-9 w-auto min-w-[160px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Giai đoạn: Tất cả</SelectItem>
                            {[...phases].sort((a, b) => a.phaseNumber - b.phaseNumber).map((phase) => (
                                <SelectItem key={phase.id} value={phase.id.toString()}>
                                    {phase.name || `Phase ${phase.phaseNumber}`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={(v) => handleFilterChange(setStatusFilter, v)}>
                        <SelectTrigger className="h-9 w-auto min-w-[150px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Trạng thái: Tất cả</SelectItem>
                            <SelectItem value="submitted">Đã nộp</SelectItem>
                            <SelectItem value="not_submitted">Chưa nộp</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Feedback Table */}
            {paginatedFeedbacks.length > 0 ? (
                <DataTable
                    columns={feedbackColumns}
                    data={paginatedFeedbacks}
                    onViewDetail={handleOpenDialog}
                    isLoading={isLoading}
                />
            ) : (
                <div className="rounded-lg border">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">
                            {feedbacks.length === 0
                                ? "Chưa có phản hồi nào cho lớp học này."
                                : "Không có phản hồi nào phù hợp với bộ lọc đã chọn."
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <p className="text-muted-foreground">
                    Trang {page + 1} / {totalPages} · {totalItems} phản hồi
                </p>
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault()
                                    setPage((prev) => Math.max(prev - 1, 0))
                                }}
                                className={page === 0 ? 'pointer-events-none opacity-50' : ''}
                            />
                        </PaginationItem>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum = i
                            if (totalPages > 5 && page > 2) {
                                pageNum = Math.min(page - 2 + i, totalPages - 1)
                            }
                            return (
                                <PaginationItem key={pageNum}>
                                    <PaginationLink
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            setPage(pageNum)
                                        }}
                                        isActive={pageNum === page}
                                    >
                                        {pageNum + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            )
                        })}
                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault()
                                    setPage((prev) => Math.min(prev + 1, totalPages - 1))
                                }}
                                className={page + 1 >= totalPages ? 'pointer-events-none opacity-50' : ''}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
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
                            {feedbackDetail.rating !== undefined && feedbackDetail.rating !== null && (
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="font-medium">Đánh giá trung bình:</span>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`h-4 w-4 ${star <= Math.round(feedbackDetail.rating!)
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'text-muted-foreground/30'
                                                }`}
                                            />
                                        ))}
                                        <span className="ml-1 text-muted-foreground">
                                            ({feedbackDetail.rating.toFixed(1)}/5)
                                        </span>
                                    </div>
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
                                    <p className="text-sm font-medium text-foreground">Đánh giá theo tiêu chí</p>
                                    <div className="space-y-2">
                                        {feedbackDetail.detailedResponses.map((item) => {
                                            const rating = item.answerText ? parseInt(item.answerText) : 0
                                            return (
                                                <div key={item.questionId} className="rounded border p-3 text-sm">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="font-medium flex-1">{item.questionText}</p>
                                                        <div className="flex items-center gap-0.5 shrink-0">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <Star
                                                                    key={star}
                                                                    className={`h-4 w-4 ${star <= rating
                                                                        ? 'fill-amber-400 text-amber-400'
                                                                        : 'text-muted-foreground/30'
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
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
