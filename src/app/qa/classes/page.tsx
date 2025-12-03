"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useGetQAClassesQuery } from "@/store/services/qaApi"
import { useGetMyBranchesQuery } from "@/store/services/branchApi"
import type { QAClassListItemDTO } from "@/types/qa"
import { DashboardLayout } from "@/components/DashboardLayout"
import { ClassStatusBadge } from "@/components/qa/ClassStatusBadge"
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
} from "@/components/ui/pagination"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Search, Loader2, AlertTriangle, GraduationCap } from "lucide-react"

// Status options
const classStatusOptions = [
    { value: "SCHEDULED", label: "Đã lên lịch" },
    { value: "ONGOING", label: "Đang diễn ra" },
    { value: "COMPLETED", label: "Đã hoàn thành" },
    { value: "CANCELLED", label: "Đã hủy" },
]

// Modality options
const modalityOptions = [
    { value: "ONLINE", label: "Trực tuyến" },
    { value: "OFFLINE", label: "Trực tiếp" },
    { value: "HYBRID", label: "Kết hợp" },
]

export default function QAClassesListPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [modalityFilter, setModalityFilter] = useState<string>("all")
    const [branchFilter, setBranchFilter] = useState<string>("all")
    const [page, setPage] = useState(0)

    // Fetch branches assigned to current user for filter dropdown
    const { data: branchesResponse } = useGetMyBranchesQuery()
    const branches = branchesResponse?.data || []

    // Initialize state from URL parameters
    useEffect(() => {
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || 'all'
        const modality = searchParams.get('modality') || 'all'
        const branch = searchParams.get('branch') || 'all'
        const pageNum = parseInt(searchParams.get('page') || '0')

        setSearchTerm(search)
        setStatusFilter(status)
        setModalityFilter(modality)
        setBranchFilter(branch)
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

    // Handle search change
    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        setPage(0)
        updateUrlParams({ search: value || null, page: '0' })
    }

    // Handle filter changes
    const handleStatusChange = (value: string) => {
        setStatusFilter(value)
        setPage(0)
        updateUrlParams({ status: value === 'all' ? null : value, page: '0' })
    }

    const handleModalityChange = (value: string) => {
        setModalityFilter(value)
        setPage(0)
        updateUrlParams({ modality: value === 'all' ? null : value, page: '0' })
    }

    const handleBranchChange = (value: string) => {
        setBranchFilter(value)
        setPage(0)
        updateUrlParams({ branch: value === 'all' ? null : value, page: '0' })
    }

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setPage(newPage)
        updateUrlParams({ page: newPage.toString() })
    }

    const { data: classesData, isLoading, error } = useGetQAClassesQuery({
        branchIds: branchFilter === 'all' ? undefined : [parseInt(branchFilter)],
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        size: 20,
        sort: 'startDate',
        sortDir: 'desc',
    })

    const classes = classesData?.data || []
    const totalCount = classesData?.total || 0
    const totalPages = Math.ceil(totalCount / 20)

    // Helper: Get progress bar color
    const getProgressColor = (rate: number) => {
        if (rate >= 90) return "text-green-600"
        if (rate >= 70) return "text-yellow-600"
        return "text-red-600"
    }

    // Helper: Format modality
    const getModalityLabel = (modality: string) => {
        switch (modality) {
            case 'ONLINE': return 'Trực tuyến'
            case 'OFFLINE': return 'Trực tiếp'
            case 'HYBRID': return 'Kết hợp'
            default: return modality
        }
    }

    if (isLoading) {
        return (
            <DashboardLayout
                title="Danh Sách Lớp Học"
                description="Quản lý và theo dõi chất lượng các lớp học."
            >
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout
                title="Danh Sách Lớp Học"
                description="Quản lý và theo dõi chất lượng các lớp học."
            >
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Không thể tải danh sách lớp học. Vui lòng thử lại.
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout
            title="Danh Sách Lớp Học"
            description="Quản lý và theo dõi chất lượng các lớp học."
        >
            <div className="space-y-6">
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm theo mã lớp, tên khóa học..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Select value={branchFilter} onValueChange={handleBranchChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Chi nhánh" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                                {branches.map((branch) => (
                                    <SelectItem key={branch.id} value={branch.id.toString()}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                {classStatusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={modalityFilter} onValueChange={handleModalityChange}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả hình thức</SelectItem>
                                {modalityOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Classes Table */}
                <div className="rounded-lg border overflow-hidden bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold min-w-[120px]">Mã Lớp</TableHead>
                                <TableHead className="font-semibold">Trạng Thái</TableHead>
                                <TableHead className="font-semibold min-w-[140px]">Khóa Học</TableHead>
                                <TableHead className="font-semibold">Chi Nhánh</TableHead>
                                <TableHead className="font-semibold">Hình Thức</TableHead>
                                <TableHead className="font-semibold text-center">Tiến Độ</TableHead>
                                <TableHead className="font-semibold text-center">Điểm Danh</TableHead>
                                <TableHead className="font-semibold text-center">Hoàn Thành BT</TableHead>
                                <TableHead className="font-semibold text-center">Báo Cáo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classes.length > 0 ? (
                                classes.map((classItem: QAClassListItemDTO) => (
                                    <TableRow
                                        key={classItem.classId}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => navigate(`/qa/classes/${classItem.classId}`)}
                                    >
                                        <TableCell>
                                            <p className="font-medium">{classItem.classCode}</p>
                                        </TableCell>
                                        <TableCell>
                                            <ClassStatusBadge status={classItem.status} />
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm">{classItem.courseName}</p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm">{classItem.branchName}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {getModalityLabel(classItem.modality)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="text-sm font-medium">
                                                            {classItem.completedSessions}/{classItem.totalSessions}
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{classItem.completedSessions} buổi đã hoàn thành / {classItem.totalSessions} tổng buổi</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`text-sm font-medium ${getProgressColor(classItem.attendanceRate)}`}>
                                                {classItem.attendanceRate.toFixed(0)}%
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`text-sm font-medium ${getProgressColor(classItem.homeworkCompletionRate)}`}>
                                                {classItem.homeworkCompletionRate.toFixed(0)}%
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="text-xs">
                                                {classItem.qaReportCount}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-32">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <GraduationCap className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                            <p className="text-muted-foreground">
                                                {searchTerm || statusFilter !== 'all' || modalityFilter !== 'all' || branchFilter !== 'all'
                                                    ? "Không có lớp học nào phù hợp với bộ lọc đã chọn."
                                                    : "Chưa có lớp học nào."
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
                        Trang {page + 1} / {Math.max(totalPages, 1)} · {totalCount} lớp học
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