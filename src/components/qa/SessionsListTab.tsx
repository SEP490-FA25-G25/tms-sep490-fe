"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useGetQASessionListQuery } from "@/store/services/qaApi"
import { SessionStatus, getSessionStatusDisplayName, sessionStatusOptions } from "@/types/qa"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
    Calendar,
    Clock,
    Users,
    CheckCircle,
    XCircle,
    BookOpen,
    Loader2,
    AlertTriangle,
} from "lucide-react"

interface SessionsListTabProps {
    classId: number
}

export function SessionsListTab({ classId }: SessionsListTabProps) {
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const navigate = useNavigate()

    const { data: sessionListData, isLoading, error } = useGetQASessionListQuery(classId)

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
        if (statusFilter === "all") return true
        return session.status === statusFilter
    })

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
        // Use display function for consistent Vietnamese labels
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

    const completedCount = sessions.filter(s => s.status === "DONE").length
    const plannedCount = sessions.filter(s => s.status === "PLANNED").length
    const cancelledCount = sessions.filter(s => s.status === "CANCELLED").length

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">Tổng số buổi</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">{sessionListData.totalSessions}</p>
                </div>

                <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Đã hoàn thành</span>
                    </div>
                    <p className="text-lg font-semibold text-green-600">{completedCount}</p>
                </div>

                <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Sắp tới</span>
                    </div>
                    <p className="text-lg font-semibold text-blue-600">{plannedCount}</p>
                </div>

                <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Đã hủy</span>
                    </div>
                    <p className="text-lg font-semibold text-red-600">{cancelledCount}</p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                <div className="text-sm text-muted-foreground">
                    Hiển thị {filteredSessions.length} / {sessions.length} buổi học
                </div>
            </div>

            {/* Sessions Table */}
            <div className="rounded-lg border overflow-hidden bg-card">
                {filteredSessions.length > 0 ? (
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
                            {filteredSessions.map((session) => (
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
        </div>
    )
}