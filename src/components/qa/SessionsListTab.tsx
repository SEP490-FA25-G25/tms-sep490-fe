"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useGetQASessionListQuery } from "@/store/services/qaApi"
import { SessionStatus, getSessionStatusDisplayName, sessionStatusOptions } from "@/types/qa"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
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
    Users,
    BookOpen,
    Loader2,
    AlertTriangle,
    Search,
} from "lucide-react"

const PAGE_SIZE = 10

interface SessionsListTabProps {
    classId: number
}

export function SessionsListTab({ classId }: SessionsListTabProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [page, setPage] = useState(0)
    const navigate = useNavigate()

    const { data: sessionListData, isLoading, error } = useGetQASessionListQuery(classId)

    // Reset page when filter/search changes
    const handleFilterChange = (value: string) => {
        setStatusFilter(value)
        setPage(0)
    }

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        setPage(0)
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Không thể tải danh sách buổi học. Vui lòng thử lại.
                </AlertDescription>
            </Alert>
        )
    }

    if (!sessionListData) {
        return (
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Không có dữ liệu buổi học cho lớp này.
                </AlertDescription>
            </Alert>
        )
    }

    const sessions = sessionListData.sessions || []
    const filteredSessions = sessions.filter(session => {
        // Status filter
        const statusMatch = statusFilter === "all" || session.status === statusFilter
        
        // Search filter (topic, teacherName)
        const searchLower = searchQuery.toLowerCase().trim()
        const searchMatch = !searchLower || 
            session.topic?.toLowerCase().includes(searchLower) ||
            session.teacherName?.toLowerCase().includes(searchLower)
        
        return statusMatch && searchMatch
    })

    // Pagination calculations
    const totalItems = filteredSessions.length
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
    const paginatedSessions = filteredSessions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

    const getAttendanceColor = (rate: number) => {
        if (rate >= 90) return "text-green-600"
        if (rate >= 80) return "text-yellow-600"
        return "text-red-600"
    }

    const getHomeworkColor = (rate: number) => {
        if (rate >= 85) return "text-green-600"
        if (rate >= 70) return "text-yellow-600"
        return "text-red-600"
    }

    const getStatusBadge = (status: string) => {
        const displayStatus = getSessionStatusDisplayName(status)

        switch (status) {
            case SessionStatus.DONE:
                return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80">{displayStatus}</Badge>
            case SessionStatus.PLANNED:
                return <Badge variant="outline" className="bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100/80">{displayStatus}</Badge>
            case SessionStatus.CANCELLED:
                return <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100/80">{displayStatus}</Badge>
            default:
                return <Badge variant="outline">{displayStatus}</Badge>
        }
    }

    return (
        <div className="space-y-4">
            {/* Search & Filter */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo chủ đề, giáo viên..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-8 h-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={handleFilterChange}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        {sessionStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Sessions Table */}
            <div className="rounded-lg border overflow-hidden bg-card">
                {paginatedSessions.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold">Ngày</TableHead>
                                <TableHead className="font-semibold">Thời gian</TableHead>
                                <TableHead className="font-semibold">Chủ đề</TableHead>
                                <TableHead className="font-semibold">Giáo viên</TableHead>
                                <TableHead className="font-semibold">Trạng thái</TableHead>
                                <TableHead className="text-center font-semibold">Điểm danh</TableHead>
                                <TableHead className="text-center font-semibold">Bài tập</TableHead>
                                <TableHead className="text-center font-semibold">Báo cáo QA</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedSessions.map((session) => (
                                <TableRow 
                                    key={session.sessionId}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => navigate(`/qa/sessions/${session.sessionId}`)}
                                >
                                    <TableCell>
                                        {new Date(session.date).toLocaleDateString('vi-VN')}
                                    </TableCell>
                                    <TableCell>{session.timeSlot}</TableCell>
                                    <TableCell className="max-w-xs truncate" title={session.topic}>
                                        {session.topic}
                                    </TableCell>
                                    <TableCell>{session.teacherName}</TableCell>
                                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center space-x-1">
                                            <Users className="h-4 w-4" />
                                            <span className={getAttendanceColor(session.attendanceRate)}>
                                                {session.presentCount}/{session.totalStudents}
                                            </span>
                                            <span className={`text-xs ${getAttendanceColor(session.attendanceRate)}`}>
                                                ({session.attendanceRate.toFixed(1)}%)
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center space-x-1">
                                            <BookOpen className="h-4 w-4" />
                                            <span className={getHomeworkColor(session.homeworkCompletionRate)}>
                                                {session.homeworkCompletedCount}
                                            </span>
                                            <span className={`text-xs ${getHomeworkColor(session.homeworkCompletionRate)}`}>
                                                ({session.homeworkCompletionRate.toFixed(1)}%)
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center space-x-1">
                                            {session.hasQAReport ? (
                                                <Badge variant="default" className="bg-sky-100 text-sky-700">
                                                    Có ({session.qaReportCount})
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">Chưa có</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">
                            Không có buổi học nào phù hợp với bộ lọc.
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <p className="text-muted-foreground">
                    Trang {page + 1} / {totalPages} · {totalItems} buổi học
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
