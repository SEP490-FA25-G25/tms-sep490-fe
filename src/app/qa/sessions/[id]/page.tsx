"use client"

import { useParams } from "react-router-dom"
import { Link } from "react-router-dom"
import { useGetSessionDetailQuery } from "@/store/services/qaApi"
import { DashboardLayout } from "@/components/DashboardLayout"
import { QAStatsCard } from "@/components/qa/QAStatsCard"
import { Button } from "@/components/ui/button"
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
    Clock,
    Calendar,
    BookOpen,
    Users,
    Loader2,
    AlertTriangle,
    Plus
} from "lucide-react"

export default function SessionDetailsPage() {
    const params = useParams()
    const sessionId = parseInt(params.id as string)

    const { data: session, isLoading, error } = useGetSessionDetailQuery(sessionId)

    const getAttendanceStatusColor = (status?: string) => {
        const value = status?.toLowerCase() || 'unknown'
        switch (value) {
            case 'present':
                return 'text-green-600 bg-green-50'
            case 'absent':
                return 'text-red-600 bg-red-50'
            case 'late':
                return 'text-yellow-600 bg-yellow-50'
            case 'excused':
                return 'text-blue-600 bg-blue-50'
            default:
                return 'text-gray-600 bg-gray-50'
        }
    }

    const getHomeworkStatusColor = (status?: string) => {
        const value = status?.toLowerCase() || 'unknown'
        switch (value) {
            case 'completed':
                return 'text-green-600 bg-green-50'
            case 'incomplete':
                return 'text-red-600 bg-red-50'
            case 'partial':
                return 'text-yellow-600 bg-yellow-50'
            default:
                return 'text-gray-600 bg-gray-50'
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
            'completed': 'Đã nộp',
            'incomplete': 'Chưa nộp',
            'partial': 'Nộp thiếu'
        }
        return (
            <Badge className={getHomeworkStatusColor(status)}>
                {status ? statusMap[status.toLowerCase()] || status : 'Không xác định'}
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

    return (
        <DashboardLayout
            title={`Chi Tiết Buổi Học #${session.sessionId}`}
            description={`${session.classCode} - ${session.courseName}`}
        >
            <div className="space-y-6">
                {/* Session Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <QAStatsCard
                        title="Ngày học"
                        value={new Date(session.date).toLocaleDateString('vi-VN')}
                        subtitle={new Date(session.date).toLocaleDateString('vi-VN', { weekday: 'long' })}
                        icon={Calendar}
                    />

                    <QAStatsCard
                        title="Thời gian"
                        value={session.timeSlot}
                        subtitle="Khung giờ học"
                        icon={Clock}
                    />

                    <QAStatsCard
                        title="Điểm danh"
                        value={`${session.attendanceStats.presentCount}/${session.attendanceStats.totalStudents}`}
                        subtitle="Học viên có mặt"
                        icon={Users}
                    />

                    <QAStatsCard
                        title="Bài tập"
                        value={`${session.attendanceStats.homeworkCompletionRate.toFixed(1)}%`}
                        subtitle="Tỷ lệ hoàn thành"
                        icon={BookOpen}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Session Information */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="py-0 gap-0">
                            <CardHeader className="py-3">
                                <CardTitle>Thông Tin Buổi Học</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pb-4">
                                <div className="grid grid-cols-2 gap-4">
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
                                        <Badge variant="outline">{session.status}</Badge>
                                    </div>
                                </div>

                                {session.teacherNote && (
                                    <div className="pt-4 border-t">
                                        <p className="text-sm text-muted-foreground mb-2">Ghi chú giáo viên</p>
                                        <p className="text-sm">{session.teacherNote}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Student Attendance */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Điểm Danh Học Sinh</h3>
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Mã học sinh</TableHead>
                                            <TableHead>Tên học sinh</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Bài tập</TableHead>
                                            <TableHead>Ghi chú</TableHead>
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
                        <Card className="py-0 gap-0">
                            <CardHeader className="py-3">
                                <CardTitle>Thống Kê</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pb-4">
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
                                    <span className="font-medium text-green-600">{session.attendanceStats.presentCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Vắng mặt</span>
                                    <span className="font-medium text-red-600">{session.attendanceStats.absentCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Hoàn thành BT</span>
                                    <span className="font-medium text-green-600">{session.attendanceStats.homeworkCompletedCount}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* CLO Covered */}
                        {session.closCovered.length > 0 && (
                            <Card className="py-0 gap-0">
                                <CardHeader className="py-3">
                                    <CardTitle>CLO Được Đề Cập</CardTitle>
                                </CardHeader>
                                <CardContent className="pb-4">
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

                        {/* Create QA Report */}
                        <Card className="py-0 gap-0">
                            <CardHeader className="py-3">
                                <CardTitle>Hành Động</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <Button asChild className="w-full">
                                    <Link to={`/qa/reports/create?sessionId=${session.sessionId}`}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Tạo Báo Cáo QA
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}