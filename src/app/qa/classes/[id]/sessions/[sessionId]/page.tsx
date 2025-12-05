"use client"

import { useParams } from "react-router-dom"
import { useGetSessionDetailQuery } from "@/store/services/qaApi"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
    ArrowLeft,
    Calendar,
    Clock,
    Users,
    BookOpen,
    AlertTriangle,
    FileText,
    Plus,
    Loader2,
    Target,
} from "lucide-react"
import { Link } from "react-router-dom"

export default function SessionDetailsPage() {
    const params = useParams()
    const classId = parseInt(params.id as string)
    const sessionId = parseInt(params.sessionId as string)

    const { data: session, isLoading, error } = useGetSessionDetailQuery(sessionId)

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

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Không xác định"
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const getAttendanceStatusColor = (status?: string) => {
        const value = status?.toLowerCase() || 'unknown'
        switch (value) {
            case 'present':
                return 'text-emerald-600 bg-emerald-50'
            case 'absent':
                return 'text-rose-600 bg-rose-50'
            case 'late':
                return 'text-yellow-600 bg-yellow-50'
            case 'excused':
                return 'text-blue-600 bg-blue-50'
            default:
                return 'text-gray-600 bg-gray-50'
        }
    }

    const getHomeworkStatusColor = (status?: string) => {
        const value = status?.toUpperCase() || 'UNKNOWN'
        switch (value) {
            case 'COMPLETED':
                return 'text-emerald-600 bg-emerald-50'
            case 'INCOMPLETE':
                return 'text-rose-600 bg-rose-50'
            case 'NO_HOMEWORK':
                return 'text-gray-600 bg-gray-50'
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

    return (
        <DashboardLayout
            title={`Buổi học #${session.sessionId}`}
            description={`${session.classCode} - ${session.courseName}`}
        >
            <div className="space-y-6">
                {/* Back Button */}
                <div>
                    <Link to={`/qa/classes/${classId}`}>
                        <Button variant="ghost" size="sm" className="gap-1 pl-0">
                            <ArrowLeft className="h-4 w-4" /> Quay lại chi tiết lớp
                        </Button>
                    </Link>
                </div>

                {/* Session Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-6 border rounded-lg">
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Ngày</p>
                                <p className="font-medium">{formatDate(session.date)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border rounded-lg">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Thời gian</p>
                                <p className="font-medium">{session.timeSlot}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border rounded-lg">
                        <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Điểm danh</p>
                                <p className="font-medium">
                                    {session.attendanceStats.presentCount}/{session.attendanceStats.totalStudents}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border rounded-lg">
                        <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Bài tập</p>
                                <p className="font-medium">
                                    {session.attendanceStats.homeworkCompletedCount}/{session.attendanceStats.totalStudents}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Session Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="p-6 border rounded-lg space-y-4">
                        <h3 className="text-lg font-semibold">Thông Tin Chung</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Mã lớp</p>
                                <p className="font-medium">{session.classCode}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Khóa học</p>
                                <p className="font-medium">{session.courseName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Giáo viên</p>
                                <p className="font-medium">{session.teacherName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Trạng thái</p>
                                <Badge variant={session.status === 'done' ? 'default' : 'outline'}>
                                    {session.status === 'done' ? 'Đã hoàn thành' : 'Đã lên lịch'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Performance Stats */}
                    <div className="p-6 border rounded-lg space-y-4">
                        <h3 className="text-lg font-semibold">Hiệu Suất</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Tỷ lệ điểm danh</p>
                                <p className="font-medium text-lg">
                                    {session.attendanceStats.attendanceRate.toFixed(1)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tỷ lệ hoàn thành BT</p>
                                <p className="font-medium text-lg">
                                    {session.attendanceStats.homeworkCompletionRate.toFixed(1)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Số vắng</p>
                                <p className="font-medium text-lg">{session.attendanceStats.absentCount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tổng số học viên</p>
                                <p className="font-medium text-lg">{session.attendanceStats.totalStudents}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Teacher Notes and CLO Coverage */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Teacher Notes */}
                    <div className="p-6 border rounded-lg space-y-4">
                        <h3 className="text-lg font-semibold">Ghi Chú Giáo Viên</h3>
                        {session.teacherNote ? (
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm">{session.teacherNote}</p>
                            </div>
                        ) : (
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Chưa có ghi chú từ giáo viên.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div>
                            <p className="text-sm text-muted-foreground">Nhiệm vụ học viên</p>
                            <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm">{session.studentTask}</p>
                            </div>
                        </div>
                    </div>

                    {/* CLO Coverage */}
                    <div className="p-6 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">CLO Được Bao Phủ</h3>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </div>
                        {session.closCovered && session.closCovered.length > 0 ? (
                            <div className="space-y-2">
                                {session.closCovered?.map((clo) => (
                                    <div key={clo.cloId} className="p-3 border rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <Badge variant="outline">{clo.cloCode}</Badge>
                                            <p className="text-sm">{clo.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Chưa có thông tin CLO được bao phủ.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </div>

                {/* Students Attendance and Homework */}
                <div className="p-6 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Điểm Danh & Bài Tập Học Viên</h3>
                        <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                {session.students.length} học viên
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã HV</TableHead>
                                    <TableHead>Họ và tên</TableHead>
                                    <TableHead className="text-center">Điểm danh</TableHead>
                                    <TableHead className="text-center">Bài tập</TableHead>
                                    <TableHead>Ghi chú</TableHead>
                                    <TableHead className="text-center">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {session.students.map((student) => (
                                    <TableRow key={student.studentId}>
                                        <TableCell className="font-medium">{student.studentCode}</TableCell>
                                        <TableCell>{student.studentName}</TableCell>
                                        <TableCell className="text-center">
                                            {getAttendanceStatusBadge(student.attendanceStatus)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {getHomeworkStatusBadge(student.homeworkStatus)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-xs">
                                                <p className="text-sm truncate" title={student.note}>
                                                    {student.note || '-'}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                                {student.isMakeup && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Bù
                                                    </Badge>
                                                )}
                                                <Button variant="outline" size="sm">
                                                    Chi tiết
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* QA Reports for this Session */}
                <div className="p-6 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Báo Cáo QA Cho Buổi Học</h3>
                        <Button asChild>
                            <Link to={`/qa/reports/create?classId=${classId}&sessionId=${sessionId}`}>
                                <Plus className="h-4 w-4 mr-2" />
                                Tạo báo cáo
                            </Link>
                        </Button>
                    </div>

                    <Alert>
                        <FileText className="h-4 w-4" />
                        <AlertDescription>
                            Hiển thị các báo cáo QA liên quan đến buổi học này.
                            Tính năng sẽ được triển khai khi có dữ liệu từ backend.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        </DashboardLayout>
    )
}
