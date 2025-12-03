"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useGetQAReportsQuery } from "@/store/services/qaApi"
import type { QAReportListItemDTO } from "@/types/qa"
import { DashboardLayout } from "@/components/DashboardLayout"
import { QAReportStatusBadge } from "@/components/qa/QAReportStatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Plus, Search, Loader2, AlertTriangle, FileText, HelpCircle, RotateCcw } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { getQAReportTypeDisplayName, qaReportTypeOptions, QAReportStatus } from "@/types/qa"

export default function QAReportsListPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm, setSearchTerm] = useState("")
    const [reportTypeFilter, setReportTypeFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [page, setPage] = useState(0)
    const navigate = useNavigate()

    // Initialize state from URL parameters
    useEffect(() => {
        const search = searchParams.get('search') || ''
        const reportType = searchParams.get('reportType') || 'all'
        const status = searchParams.get('status') || 'all'
        const pageNum = parseInt(searchParams.get('page') || '0')

        setSearchTerm(search)
        setReportTypeFilter(reportType)
        setStatusFilter(status)
        setPage(pageNum)
    }, [searchParams])

    // Update URL parameters helper
    const updateUrlParams = (updates: Record<string, string | null>) => {
        const newParams = new URLSearchParams(searchParams.toString())
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === '' || value === 'all') {
                newParams.delete(key)
            } else {
                newParams.set(key, value)
            }
        })
        setSearchParams(newParams)
    }

    // Reset page to 0 when search term changes
    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        setPage(0)
        updateUrlParams({ search: value || null, page: '0' })
    }

    // Handle filter changes
    const handleReportTypeChange = (value: string) => {
        setReportTypeFilter(value)
        setPage(0)
        updateUrlParams({ reportType: value === 'all' ? null : value, page: '0' })
    }

    const handleStatusChange = (value: string) => {
        setStatusFilter(value)
        setPage(0)
        updateUrlParams({ status: value === 'all' ? null : value, page: '0' })
    }

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setPage(newPage)
        updateUrlParams({ page: newPage.toString() })
    }

    const { data: reportsData, isLoading, error } = useGetQAReportsQuery({
        search: searchTerm || undefined,
        reportType: reportTypeFilter === 'all' ? undefined : reportTypeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        size: 20,
        sort: 'createdAt',
        sortDir: 'desc',
    })

    const reports = reportsData?.data || []
    const totalCount = reportsData?.total || 0
    const totalPages = Math.ceil(totalCount / 20)

    // Helper function for report level badge - consistent with QAReportsListTab
    const getReportLevelBadge = (report: QAReportListItemDTO) => {
        if (report.sessionId) {
            return <Badge variant="outline" className="text-xs">Buổi học</Badge>
        } else if (report.phaseId) {
            return <Badge variant="outline" className="text-xs">Giai đoạn</Badge>
        } else {
            return <Badge variant="secondary" className="text-xs">Lớp học</Badge>
        }
    }

    // Helper function for scope info display as tooltip text
    const getScopeTooltipText = (report: QAReportListItemDTO) => {
        if (report.sessionDate) {
            return new Date(report.sessionDate).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            })
        }
        if (report.phaseName) {
            return report.phaseName
        }
        return null
    }

    // Clear all filters
    const handleClearFilters = () => {
        setSearchTerm("")
        setReportTypeFilter("all")
        setStatusFilter("all")
        setPage(0)
        setSearchParams(new URLSearchParams())
    }

    // Check if any filter is active
    const hasActiveFilters = searchTerm !== "" || reportTypeFilter !== "all" || statusFilter !== "all"

    const headerActions = (
        <Button asChild>
            <Link to="/qa/reports/create">
                <Plus className="h-4 w-4 mr-2" />
                Tạo Báo Cáo
            </Link>
        </Button>
    )

    if (isLoading) {
        return (
            <DashboardLayout
                title="Danh Sách Báo Cáo QA"
                description="Quản lý và theo dõi các báo cáo đảm bảo chất lượng."
                actions={headerActions}
            >
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout
                title="Danh Sách Báo Cáo QA"
                description="Quản lý và theo dõi các báo cáo đảm bảo chất lượng."
                actions={headerActions}
            >
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Không thể tải danh sách báo cáo QA. Vui lòng thử lại.
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Danh Sách Báo Cáo QA"
            description="Quản lý và theo dõi các báo cáo đảm bảo chất lượng."
            actions={headerActions}
        >
            <div className="space-y-6">
                {/* Search & Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Search - Left */}
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm theo mã lớp, người báo cáo..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-8 h-9"
                        />
                    </div>

                    {/* Filters - Right */}
                    <div className="flex items-center gap-2 ml-auto">
                        <Select value={reportTypeFilter} onValueChange={handleReportTypeChange}>
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

                        <Select value={statusFilter} onValueChange={handleStatusChange}>
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
                <div className="rounded-lg border overflow-hidden bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold">Loại Báo Cáo</TableHead>
                                <TableHead className="font-semibold">Lớp</TableHead>
                                <TableHead className="font-semibold">Phạm vi</TableHead>
                                <TableHead className="font-semibold">Người Báo Cáo</TableHead>
                                <TableHead className="font-semibold">Trạng Thái</TableHead>
                                <TableHead className="font-semibold">Ngày Tạo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.length > 0 ? (
                                reports.map((report: QAReportListItemDTO) => (
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
                                            </div>
                                        </TableCell>
                                        <TableCell>{report.classCode}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                {getReportLevelBadge(report)}
                                                {getScopeTooltipText(report) && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{getScopeTooltipText(report)}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{report.reportedByName}</TableCell>
                                        <TableCell>
                                            <QAReportStatusBadge status={report.status} />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(report.createdAt).toLocaleDateString('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                            <p className="text-muted-foreground">
                                                {searchTerm || reportTypeFilter !== 'all' || statusFilter !== 'all'
                                                    ? "Không có báo cáo nào phù hợp với bộ lọc đã chọn."
                                                    : "Chưa có báo cáo QA nào."
                                                }
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                    <p className="text-muted-foreground">
                        Trang {page + 1} / {Math.max(totalPages, 1)} · {totalCount} báo cáo
                    </p>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious 
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        if (page > 0) handlePageChange(page - 1)
                                    }}
                                    className={page === 0 ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                            {Array.from({ length: Math.min(Math.max(totalPages, 1), 5) }, (_, i) => {
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
                                                handlePageChange(pageNum)
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
                                        if (page < totalPages - 1) handlePageChange(page + 1)
                                    }}
                                    className={page >= totalPages - 1 ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        </DashboardLayout>
    )
}
