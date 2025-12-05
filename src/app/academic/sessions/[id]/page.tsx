"use client"

import { useParams } from "react-router-dom"
import { useGetSessionDetailQuery } from "@/store/services/qaApi"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
    Loader2,
    AlertTriangle
} from "lucide-react"
import { getSessionStatusDisplayName, SessionStatus } from "@/types/qa"

/**
 * Academic Affairs - Session Detail Page
 * Cho phép AA xem chi tiết buổi học của một lớp
 * Route: /academic/sessions/:id
 */
export default function AcademicSessionDetailPage() {
    const params = useParams()
    const sessionId = parseInt(params.id as string)

    const { data: session, isLoading, error } = useGetSessionDetailQuery(sessionId)

    const getAttendanceStatusColor = (status?: string) => {
        const value = status?.toLowerCase() || 'unknown'
        switch (value) {
            case 'present':
                return 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30'
            case 'absent':
                return 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30'
            case 'late':
                return 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30'
            case 'excused':
                return 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30'
            default:
                return 'text-slate-700 bg-slate-50 dark:text-slate-400 dark:bg-slate-800/50'
        }
    }

    const getHomeworkStatusColor = (status?: string) => {
        const value = status?.toUpperCase() || 'UNKNOWN'
        switch (value) {
            case 'COMPLETED':
                return 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30'
            case 'INCOMPLETE':
                return 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30'
            case 'NO_HOMEWORK':
                return 'text-slate-700 bg-slate-50 dark:text-slate-400 dark:bg-slate-800/50'
            default:
                return 'text-slate-700 bg-slate-50 dark:text-slate-400 dark:bg-slate-800/50'
        }
    }

    const getAttendanceStatusBadge = (status?: string) => {
        const statusMap: Record<string, string> = {
            'present': 'Có mặt',
            'absent': 'Vắng mặt',
            'late': 'Đi muộn',
            'excused': 'Có phép'
        }
        return (
            <Badge className={getAttendanceStatusColor(status)}>
                {status ? statusMap[status.toLowerCase()] || status : 'Không xác định'}
            </Badge>
        )
    }

    const getHomeworkStatusBadge = (status?: string) => {
        const statusMap: Record<string, string> = {
            'COMPLETED': 'Đã hoàn thành',
            'INCOMPLETE': 'Chưa hoàn thành',
            'NO_HOMEWORK': 'Không có bài tập'
        }
        const normalizedStatus = status?.toUpperCase()
        return (
            <Badge className={getHomeworkStatusColor(status)}>
                {normalizedStatus ? statusMap[normalizedStatus] || status : 'Chưa cập nhật'}
            </Badge>
        )
    }

    if (isLoading) {
        return (
            <DashboardLayout title="Đang tải..." description="Chi tiết buổi học">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Lỗi" description="Chi tiết buổi học">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Không thể tải thông tin buổi học. Vui lòng thử lại.
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    if (!session) {
        return (
            <DashboardLayout title="Không tìm thấy" description="Chi tiết buổi học">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Buổi học không tồn tại.
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    // Helper for session status badge with Vietnamese text
    const getStatusBadge = (status: string) => {
        const displayStatus = getSessionStatusDisplayName(status)
        switch (status.toUpperCase()) {
            case SessionStatus.DONE:
                return <Badge variant="success">{displayStatus}</Badge>
            case SessionStatus.PLANNED:
                return <Badge variant="info">{displayStatus}</Badge>
            case SessionStatus.CANCELLED:
                return <Badge variant="destructive">{displayStatus}</Badge>
            default:
                return <Badge variant="outline">{displayStatus}</Badge>
        }
    }

    return (
        <DashboardLayout
            title={`Buổi #${session.sessionId} - ${session.classCode}`}
            description={session.courseName}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Session Information */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Thông Tin Buổi Học</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ngày học</p>
                                        <p className="font-medium">{new Date(session.date).toLocaleDateString('vi-VN')} ({new Date(session.date).toLocaleDateString('vi-VN', { weekday: 'long' })})</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Thời gian</p>
                                        <p className="font-medium">{session.timeSlot}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Lớp học</p>
                                        <p className="font-medium">{session.classCode} - {session.courseName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Giáo viên</p>
                                        <p className="font-medium">{session.teacherName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Chủ đề</p>
                                        <p className="font-medium">{session.topic}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Trạng thái</p>
                                        {getStatusBadge(session.status)}
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Ghi chú giáo viên</p>
                                    {session.teacherNote ? (
                                        <div className="p-3 bg-muted/50 rounded-lg">
                                            <p className="text-sm whitespace-pre-wrap">{session.teacherNote}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Chưa có ghi chú từ giáo viên</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Student Attendance */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Điểm danh học sinh</h3>
                            <div className="rounded-lg border overflow-hidden bg-card">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="font-semibold">Mã học sinh</TableHead>
                                            <TableHead className="font-semibold">Tên học sinh</TableHead>
                                            <TableHead className="font-semibold">Trạng thái</TableHead>
                                            <TableHead className="font-semibold">Bài tập</TableHead>
                                            <TableHead className="font-semibold">Ghi chú</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {session.students.map((student) => (
                                            <TableRow key={student.studentId}>
                                                <TableCell className="font-medium">{student.studentCode}</TableCell>
                                                <TableCell>{student.studentName}</TableCell>
                                                <TableCell>
                                                    {getAttendanceStatusBadge(student.attendanceStatus)}
                                                </TableCell>
                                                <TableCell>
                                                    {getHomeworkStatusBadge(student.homeworkStatus)}
                                                </TableCell>
                                                <TableCell>
                                                    {student.note || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Statistics */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Thống Kê</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Tỷ lệ điểm danh</span>
                                    <span className="font-medium">{session.attendanceStats.attendanceRate.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Sĩ số</span>
                                    <span className="font-medium">{session.attendanceStats.totalStudents}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Có mặt</span>
                                    <span className="font-medium text-emerald-600">{session.attendanceStats.presentCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Vắng mặt</span>
                                    <span className="font-medium text-rose-600">{session.attendanceStats.absentCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Hoàn thành BT</span>
                                    <span className="font-medium text-emerald-600">{session.attendanceStats.homeworkCompletedCount}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* CLO Covered */}
                        {session.closCovered.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>CLO Được Đề Cập</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {session.closCovered.map((clo) => (
                                            <div key={clo.cloId} className="p-3 border rounded">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <Badge variant="outline">{clo.cloCode}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{clo.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
