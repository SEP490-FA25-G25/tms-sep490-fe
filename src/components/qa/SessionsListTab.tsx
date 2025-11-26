"use client"

import { useState } from "react"
import { useGetQASessionListQuery } from "@/store/services/qaApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
    Eye,
    Calendar,
    Clock,
    Users,
    CheckCircle,
    XCircle,
    BookOpen,
    Loader2,
    AlertTriangle,
} from "lucide-react"
import { Link } from "react-router-dom"

interface SessionsListTabProps {
    classId: number
}

export function SessionsListTab({ classId }: SessionsListTabProps) {
    const [statusFilter, setStatusFilter] = useState<string>("all")

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
        switch (status.toLowerCase()) {
            case "done":
                return <Badge variant="default" className="bg-green-100 text-green-700">Đã hoàn thành</Badge>
            case "planned":
                return <Badge variant="outline">Đã lên lịch</Badge>
            case "cancelled":
                return <Badge variant="destructive">Đã hủy</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Tổng số buổi</p>
                                <p className="text-2xl font-bold">{sessionListData.totalSessions}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Đã hoàn thành</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {sessions.filter(s => s.status === "done").length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Sắp tới</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {sessions.filter(s => s.status === "planned").length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Đã hủy</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {sessions.filter(s => s.status === "cancelled").length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium">Lọc theo trạng thái:</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="done">Đã hoàn thành</SelectItem>
                            <SelectItem value="planned">Đã lên lịch</SelectItem>
                            <SelectItem value="cancelled">Đã hủy</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                    Hiển thị {filteredSessions.length} / {sessions.length} buổi học
                </div>
            </div>

            {/* Sessions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh Sách Buổi Học</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredSessions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Buổi</TableHead>
                                    <TableHead>Ngày</TableHead>
                                    <TableHead>Thời gian</TableHead>
                                    <TableHead>Chủ đề</TableHead>
                                    <TableHead>Giáo viên</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-center">Điểm danh</TableHead>
                                    <TableHead className="text-center">Bài tập</TableHead>
                                    <TableHead className="text-center">Báo cáo QA</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSessions.map((session) => (
                                    <TableRow key={session.sessionId}>
                                        <TableCell className="font-medium">
                                            #{session.sequenceNumber || session.sessionId}
                                        </TableCell>
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
                                                    <Badge variant="default" className="bg-blue-100 text-blue-700">
                                                        Có ({session.qaReportCount})
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">Chưa có</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link to={`/qa/sessions/${session.sessionId}`}>
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Chi tiết
                                                </Link>
                                            </Button>
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
                </CardContent>
            </Card>
        </div>
    )
}