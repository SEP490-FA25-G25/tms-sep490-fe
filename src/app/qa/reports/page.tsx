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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Search, Eye, Loader2, AlertTriangle } from "lucide-react"
import { Link } from "react-router-dom"

export default function QAReportsListPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(0)

    // Initialize state from URL parameters
    useEffect(() => {
        const search = searchParams.get('search') || ''
        const pageNum = parseInt(searchParams.get('page') || '0')

        setSearchTerm(search)
        setPage(pageNum)
    }, [searchParams])

    // Reset page to 0 when search term changes
    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        setPage(0)

        // Update URL parameters
        const newParams = new URLSearchParams(searchParams.toString())
        if (value.trim()) {
            newParams.set('search', value)
            newParams.set('page', '0')
        } else {
            newParams.delete('search')
            newParams.set('page', '0')
        }
        setSearchParams(newParams)
    }

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setPage(newPage)

        // Update URL parameters
        const newParams = new URLSearchParams(searchParams.toString())
        newParams.set('page', newPage.toString())
        setSearchParams(newParams)
    }

    const { data: reportsData, isLoading, error } = useGetQAReportsQuery({
        search: searchTerm,
        page,
        size: 20,
        sort: 'createdAt',
        sortDir: 'desc',
    })

    const reports = reportsData?.data || []
    const totalCount = reportsData?.total || 0
    const totalPages = Math.ceil(totalCount / 20)

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
                <div className="flex items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm báo cáo QA..."
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

                {/* Reports Table */}
                <div className="rounded-lg border overflow-hidden bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Loại Báo Cáo</TableHead>
                                <TableHead>Lớp</TableHead>
                                <TableHead>Buổi Học</TableHead>
                                <TableHead>Người Báo Cáo</TableHead>
                                <TableHead>Trạng Thái</TableHead>
                                <TableHead>Ngày Tạo</TableHead>
                                <TableHead className="text-right">Hành Động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.length > 0 ? (
                                reports.map((report: QAReportListItemDTO) => (
                                    <TableRow key={report.id} className="hover:bg-muted/50">
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{report.reportType}</p>
                                                <Badge variant="outline" className="text-xs">
                                                    {report.reportLevel}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>{report.classCode}</TableCell>
                                        <TableCell>
                                            {report.sessionDate ? (
                                                new Date(report.sessionDate).toLocaleDateString('vi-VN')
                                            ) : report.phaseName ? (
                                                <span>{report.phaseName}</span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{report.reportedByName}</TableCell>
                                        <TableCell>
                                            <QAReportStatusBadge status={report.status} />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center space-x-2 justify-end">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link to={`/qa/reports/${report.id}`}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Xem
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        Không tìm thấy báo cáo QA nào.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalCount > 20 && (
                    <div className="flex items-center justify-center space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 0}
                        >
                            Trang trước
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Trang {page + 1} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= totalPages - 1 || reports.length === 0}
                        >
                            Trang tiếp
                        </Button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
