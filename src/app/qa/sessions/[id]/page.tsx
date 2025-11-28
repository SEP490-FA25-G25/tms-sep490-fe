"use client"

import { useParams, Link } from "react-router-dom"
import { useGetSessionDetailQuery } from "@/store/services/qaApi"
import { DashboardLayout } from "@/components/DashboardLayout"
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
    ArrowLeft,
    CheckCircle,
    XCircle,
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
                {/* Back Button */}
                <div>
                    <Link to={`/qa/classes/${session.classId}`}>
                        <Button variant="ghost" size="sm" className="gap-1 pl-0">
                            <ArrowLeft className="h-4 w-4" /> Quay lại lớp học
                        </Button>
                    </Link>
                </div>

                {/* Session Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Ngày</p>
                                    <p className="text-2xl font-bold">
                                        {new Date(session.date).toLocaleDateString('vi-VN')}
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
                                    <p className="text-sm text-muted-foreground">Thời gian</p>
                                    <p className="text-2xl font-bold">{session.timeSlot}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Điểm danh</p>
                                    <p className="text-2xl font-bold">
                                        {session.attendanceStats.presentCount}/{session.attendanceStats.totalStudents}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Bài tập</p>
                                    <p className="text-2xl font-bold">
                                        {session.attendanceStats.homeworkCompletionRate.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

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
                        <Card>
                            <CardHeader>
                                <CardTitle>Điểm Danh Học Sinh</CardTitle>
                            </CardHeader>
                            <CardContent>
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
                                                    {student.attendanceStatus === 'present' ? (
                                                        <div className="flex items-center space-x-1 text-green-600">
                                                            <CheckCircle className="h-4 w-4" />
                                                            <span>Có mặt</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center space-x-1 text-red-600">
                                                            <XCircle className="h-4 w-4" />
                                                            <span>Vắng mặt</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {student.homeworkStatus === 'completed' ? (
                                                        <div className="flex items-center space-x-1 text-green-600">
                                                            <CheckCircle className="h-4 w-4" />
                                                            <span>Hoàn thành</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center space-x-1 text-yellow-600">
                                                            <Clock className="h-4 w-4" />
                                                            <span>Chưa nộp</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {student.note || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
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

                        {/* Create QA Report */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Hành Động</CardTitle>
                            </CardHeader>
                            <CardContent>
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