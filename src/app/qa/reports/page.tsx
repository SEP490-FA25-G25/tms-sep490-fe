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
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination"
import { Plus, Search, Loader2, AlertTriangle, FileText } from "lucide-react"
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

    // Helper function for scope info display
    const getScopeInfo = (report: QAReportListItemDTO) => {
        if (report.sessionDate) {
            return (
                <p className="text-xs text-muted-foreground">
                    {new Date(report.sessionDate).toLocaleDateString('vi-VN')}
                </p>
            )
        }
        if (report.phaseName) {
            return (
                <p className="text-xs text-muted-foreground">
                    {report.phaseName}
                </p>
            )
        }
        return null
    }

    if (isLoading) {
        return (
            <DashboardLayout
                title="Danh Sách Báo Cáo QA"
                description="Quản lý và theo dõi các báo cáo đảm bảo chất lượng."
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
        >
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm theo mã lớp, người báo cáo, nội dung..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Button asChild>
                        <Link to="/qa/reports/create">
                            <Plus className="h-4 w-4 mr-2" />
                            Tạo Báo Cáo Mới
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <Select value={reportTypeFilter} onValueChange={handleReportTypeChange}>
                            <SelectTrigger className="w-[220px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả loại báo cáo</SelectItem>
                                {qaReportTypeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                <SelectItem value={QAReportStatus.DRAFT}>Bản nháp</SelectItem>
                                <SelectItem value={QAReportStatus.SUBMITTED}>Đã nộp</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="text-sm text-muted-foreground">
                        Hiển thị {reports.length} / {totalCount} báo cáo
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
                                            <div className="space-y-1">
                                                {getReportLevelBadge(report)}
                                                {getScopeInfo(report)}
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
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious 
                                onClick={() => page > 0 && handlePageChange(page - 1)}
                                disabled={page === 0}
                            />
                        </PaginationItem>

                        {/* First page - always show at least page 1 */}
                        <PaginationItem>
                            <PaginationLink
                                onClick={() => handlePageChange(0)}
                                isActive={page === 0}
                            >
                                1
                            </PaginationLink>
                        </PaginationItem>

                        {/* Ellipsis before current */}
                        {page > 2 && totalPages > 4 && (
                            <PaginationItem>
                                <PaginationEllipsis />
                            </PaginationItem>
                        )}

                        {/* Pages around current */}
                        {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i)
                            .filter(i => i !== 0 && i !== Math.max(totalPages, 1) - 1 && Math.abs(i - page) <= 1)
                            .map(i => (
                                <PaginationItem key={i}>
                                    <PaginationLink
                                        onClick={() => handlePageChange(i)}
                                        isActive={page === i}
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))
                        }

                        {/* Ellipsis after current */}
                        {page < totalPages - 3 && totalPages > 4 && (
                            <PaginationItem>
                                <PaginationEllipsis />
                            </PaginationItem>
                        )}

                        {/* Last page */}
                        {totalPages > 1 && (
                            <PaginationItem>
                                <PaginationLink
                                    onClick={() => handlePageChange(totalPages - 1)}
                                    isActive={page === totalPages - 1}
                                >
                                    {totalPages}
                                </PaginationLink>
                            </PaginationItem>
                        )}

                        <PaginationItem>
                            <PaginationNext 
                                onClick={() => page < totalPages - 1 && handlePageChange(page + 1)}
                                disabled={page >= totalPages - 1 || totalPages <= 1}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </DashboardLayout>
    )
}
