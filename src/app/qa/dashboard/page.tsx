"use client"

import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { useGetQADashboardQuery } from "@/store/services/qaApi"
import { DashboardLayout } from "@/components/DashboardLayout"
import { QAStatsCard } from "@/components/qa/QAStatsCard"
import { QAReportStatusBadge } from "@/components/qa/QAReportStatusBadge"
import { QAExportButton } from "@/components/qa/QAExportButton"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    FileText,
    Users,
    ClipboardCheck,
    ArrowRight,
    AlertTriangle,
    TrendingUp,
    Loader2,
} from "lucide-react"
import { Link } from "react-router-dom"

export default function QADashboardPage() {
    const [searchParams, setSearchParams] = useSearchParams()

    // Get date range from URL parameters
    const dateFromParam = searchParams.get('dateFrom')
    const dateToParam = searchParams.get('dateTo')

    // Parse URL dates or use undefined
    const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined
    const dateTo = dateToParam ? new Date(dateToParam) : undefined

    const initialDateRange = React.useMemo(() => {
        if (dateFrom && dateTo) {
            return { from: dateFrom, to: dateTo }
        }
        return undefined
    }, [dateFrom, dateTo])

    const handleDateRangeChange = React.useCallback((range: { from: Date; to: Date } | undefined) => {
        if (range) {
            const newParams = new URLSearchParams(searchParams)
            newParams.set('dateFrom', range.from.toISOString().split('T')[0])
            newParams.set('dateTo', range.to.toISOString().split('T')[0])
            setSearchParams(newParams)
        } else {
            const newParams = new URLSearchParams(searchParams)
            newParams.delete('dateFrom')
            newParams.delete('dateTo')
            setSearchParams(newParams)
        }
    }, [searchParams, setSearchParams])

    const { data: dashboard, isLoading, error } = useGetQADashboardQuery({
        dateFrom: dateFrom ? dateFrom.toISOString().split('T')[0] : undefined,
        dateTo: dateTo ? dateTo.toISOString().split('T')[0] : undefined,
    })

    if (isLoading) {
        return (
            <DashboardLayout
                title="Quản Lý Chất Lượng Đào Tạo"
                description="Tổng quan về chất lượng giảng dạy và học tập."
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
                title="Quản Lý Chất Lượng Đào Tạo"
                description="Tổng quan về chất lượng giảng dạy và học tập."
            >
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Không thể tải dữ liệu dashboard. Vui lòng thử lại.
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    if (!dashboard) {
        return (
            <DashboardLayout
                title="Quản Lý Chất Lượng Đào Tạo"
                description="Tổng quan về chất lượng giảng dạy và học tập."
            >
                <div className="text-center text-muted-foreground">
                    Không có dữ liệu để hiển thị.
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Quản Lý Chất Lượng Đào Tạo"
            description="Tổng quan về chất lượng giảng dạy và học tập."
        >
            <div className="space-y-8">
                {/* Date Range Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold">Phân tích Khoảng Thời Gian</h1>
                        {dashboard?.dateRangeInfo && !dashboard.dateRangeInfo.isDefaultRange && (
                            <span className="text-sm text-muted-foreground">
                                {dashboard.dateRangeInfo.displayText}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <QAExportButton variant="outline" size="sm" />
                        <DateRangePicker
                            value={initialDateRange}
                            onChange={handleDateRangeChange}
                            placeholder="Chọn khoảng thời gian"
                            className="w-full sm:w-80"
                        />
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <QAStatsCard
                        title="Lớp đang diễn ra"
                        value={dashboard.kpiMetrics.ongoingClassesCount}
                        subtitle="Đang giảng dạy"
                        icon={Users}
                    />
                    <QAStatsCard
                        title="Báo cáo QA tháng này"
                        value={dashboard.kpiMetrics.qaReportsCreatedThisMonth}
                        subtitle="Đã tạo"
                        icon={FileText}
                    />
                    <QAStatsCard
                        title="Tỷ lệ điểm danh"
                        value={`${dashboard.kpiMetrics.averageAttendanceRate.toFixed(1)}%`}
                        subtitle="Trung bình"
                        icon={TrendingUp}
                    />
                    <QAStatsCard
                        title="Tỷ lệ hoàn thành BT"
                        value={`${dashboard.kpiMetrics.averageHomeworkCompletionRate.toFixed(1)}%`}
                        subtitle="Bài tập về nhà"
                        icon={ClipboardCheck}
                    />
                </div>

                {dashboard.classesRequiringAttention.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Classes Requiring Attention */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold tracking-tight">Lớp Cần Chú Ý</h2>
                            <Link to="/qa/classes">
                                <Button variant="ghost" size="sm" className="gap-1">
                                    Xem tất cả <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Mã Lớp</TableHead>
                                        <TableHead>Khóa Học</TableHead>
                                        <TableHead>Chi Nhánh</TableHead>
                                        <TableHead className="text-center">Điểm Danh</TableHead>
                                        <TableHead className="text-center">Báo Cáo</TableHead>
                                        <TableHead className="text-right">Hành Động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dashboard.classesRequiringAttention.map((cls) => (
                                        <TableRow key={cls.classId}>
                                            <TableCell className="font-medium">{cls.classCode}</TableCell>
                                            <TableCell>{cls.courseName}</TableCell>
                                            <TableCell>{cls.branchName}</TableCell>
                                            <TableCell className="text-center">
                                                <span
                                                    className={
                                                        cls.attendanceRate < 80
                                                            ? "text-red-600 font-medium"
                                                            : "text-yellow-600 font-medium"
                                                    }
                                                >
                                                    {cls.attendanceRate.toFixed(1)}%
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">{cls.qaReportCount}</TableCell>
                                            <TableCell className="text-right">
                                                <Link to={`/qa/classes/${cls.classId}`}>
                                                    <Button variant="outline" size="sm">
                                                        Chi Tiết
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Recent QA Reports */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold tracking-tight">Báo Cáo Gần Đây</h2>
                            <Link to="/qa/reports">
                                <Button variant="ghost" size="sm" className="gap-1">
                                    Xem tất cả <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {dashboard.recentQAReports.map((report) => (
                                <div
                                    key={report.reportId}
                                    className="rounded-lg border bg-card p-4 flex flex-col gap-3 shadow-sm"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="font-medium text-sm">{report.reportType}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {report.classCode} - {report.sessionDate}
                                            </p>
                                        </div>
                                        <QAReportStatusBadge status={report.status} />
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                        <Link to={`/qa/reports/${report.reportId}`}>
                                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                                                Xem
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                )}

                {/* Show warning if no classes need attention */}
                {dashboard.classesRequiringAttention.length === 0 && dashboard.recentQAReports.length === 0 && (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Hiện tại không có lớp nào cần chú ý và không có báo cáo QA nào gần đây.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </DashboardLayout>
    )
}
