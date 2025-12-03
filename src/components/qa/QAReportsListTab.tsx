"use client"

import { useState } from "react"
import { useGetQAReportsQuery } from "@/store/services/qaApi"
import { QAReportStatusBadge } from "@/components/qa/QAReportStatusBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { getQAReportTypeDisplayName, qaReportTypeOptions, QAReportStatus, type QAReportListItemDTO } from "@/types/qa"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import {
    FileText,
    Loader2,
    AlertTriangle,
    Search,
    RotateCcw,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

const PAGE_SIZE = 10

interface QAReportsListTabProps {
    classId: number
}

export function QAReportsListTab({ classId }: QAReportsListTabProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [reportTypeFilter, setReportTypeFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [page, setPage] = useState(0)
    const navigate = useNavigate()
  
    // API already handles filtering - pass page/size for server-side pagination
    const { data: reportsData, isLoading, error } = useGetQAReportsQuery({
        classId,
        reportType: reportTypeFilter === "all" ? undefined : reportTypeFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchQuery || undefined,
        page,
        size: PAGE_SIZE,
        sort: 'createdAt',
        sortDir: 'desc',
    })

    // Reset page when filters/search change
    const handleFilterChange = (setter: (value: string) => void, value: string) => {
        setter(value)
        setPage(0)
    }

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        setPage(0)
    }

    // Clear all filters
    const handleClearFilters = () => {
        setSearchQuery("")
        setReportTypeFilter("all")
        setStatusFilter("all")
        setPage(0)
    }

    // Check if any filter is active
    const hasActiveFilters = searchQuery !== "" || reportTypeFilter !== "all" || statusFilter !== "all"

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
                    Không thể tải danh sách báo cáo QA. Vui lòng thử lại.
                </AlertDescription>
            </Alert>
        )
    }

    // Use API response directly - no client-side filtering needed
    const reports = reportsData?.data || []
    const totalItems = reportsData?.total || 0
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

    const getReportLevelBadge = (report: QAReportListItemDTO) => {
        if (report.sessionId) {
            return <Badge variant="outline" className="text-xs">Buổi học</Badge>
        } else if (report.phaseId) {
            return <Badge variant="outline" className="text-xs">Giai đoạn</Badge>
        } else {
            return <Badge variant="secondary" className="text-xs">Lớp học</Badge>
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        })
    }

    const formatDateTime = (dateString: string) => {
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
                        placeholder="Tìm theo người tạo, nội dung..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-8 h-9"
                    />
                </div>
                {/* Filters - Right */}
                <div className="flex items-center gap-2 ml-auto">
                    <Select value={reportTypeFilter} onValueChange={(v) => handleFilterChange(setReportTypeFilter, v)}>
                        <SelectTrigger className="h-9 w-auto min-w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Loại: Tất cả</SelectItem>
                            {qaReportTypeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={(v) => handleFilterChange(setStatusFilter, v)}>
                        <SelectTrigger className="h-9 w-auto min-w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Trạng thái: Tất cả</SelectItem>
                            <SelectItem value={QAReportStatus.DRAFT}>Bản nháp</SelectItem>
                            <SelectItem value={QAReportStatus.SUBMITTED}>Đã nộp</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleClearFilters}
                        disabled={!hasActiveFilters}
                        title="Xóa bộ lọc"
                        className="h-9 w-9 shrink-0"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Reports Table */}
            <div className="rounded-lg border">
                {reports.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold w-[30%]">Loại báo cáo</TableHead>
                                <TableHead className="font-semibold w-[15%]">Phạm vi</TableHead>
                                <TableHead className="font-semibold w-[20%]">Ngày tạo</TableHead>
                                <TableHead className="font-semibold w-[20%]">Người tạo</TableHead>
                                <TableHead className="font-semibold w-[15%]">Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.map((report) => (
                                <TableRow 
                                    key={report.id} 
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => navigate(`/qa/reports/${report.id}`)}
                                >
                                    <TableCell>
                                        <div className="space-y-1">
                                            <p className="font-medium">
                                                {getQAReportTypeDisplayName(report.reportType)}
                                            </p>
                                            {report.contentPreview && (
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {report.contentPreview}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            {getReportLevelBadge(report)}
                                            {report.sessionDate && (
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(report.sessionDate)}
                                                </p>
                                            )}
                                            {report.phaseName && (
                                                <p className="text-xs text-muted-foreground">
                                                    {report.phaseName}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {formatDateTime(report.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {report.reportedByName}
                                    </TableCell>
                                    <TableCell>
                                        <QAReportStatusBadge status={report.status} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">
                            {hasActiveFilters
                                ? "Không có báo cáo nào phù hợp với bộ lọc đã chọn."
                                : "Chưa có báo cáo QA nào cho lớp học này."
                            }
                        </p>
                        {!hasActiveFilters && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Sử dụng nút "Tạo báo cáo" ở trên để tạo báo cáo đầu tiên.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <p className="text-muted-foreground">
                    Trang {page + 1} / {totalPages} · {totalItems} báo cáo
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
        </div>
    )
}
