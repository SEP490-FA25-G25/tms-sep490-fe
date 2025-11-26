"use client"

import { useParams } from "react-router-dom"
import { useGetQAClassDetailQuery } from "@/store/services/qaApi"
import { DashboardLayout } from "@/components/DashboardLayout"
import { ClassStatusBadge } from "@/components/qa/ClassStatusBadge"
import { QAReportStatusBadge } from "@/components/qa/QAReportStatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    FileText,
    MessageSquare,
    Plus,
    Users,
    Loader2,
    AlertTriangle,
} from "lucide-react"
import { Link } from "react-router-dom"

export default function ClassDetailsPage() {
    const params = useParams()
    const classId = parseInt(params.id as string)

    const { data: classInfo, isLoading, error } = useGetQAClassDetailQuery(classId)

    if (isLoading) {
        return (
            <DashboardLayout title="Đang tải..." description="Chi tiết lớp học">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Lỗi" description="Chi tiết lớp học">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Không thể tải thông tin lớp học. Vui lòng thử lại.
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    if (!classInfo) {
        return (
            <DashboardLayout title="Không tìm thấy" description="Chi tiết lớp học">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Lớp học không tồn tại.
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title={`Lớp ${classInfo.classCode}`}
            description={classInfo.className}
        >
            <div className="space-y-6">
                {/* Back Button */}
                <div>
                    <Link to="/qa/classes">
                        <Button variant="ghost" size="sm" className="gap-1 pl-0">
                            <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
                        </Button>
                    </Link>
                </div>

                {/* Class Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Sĩ số</p>
                                    <p className="text-2xl font-bold">
                                        {classInfo.currentEnrollment}/{classInfo.maxCapacity}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Tiến độ buổi học</p>
                                    <p className="text-2xl font-bold">
                                        {classInfo.sessionSummary?.completedSessions || 0}/{classInfo.sessionSummary?.totalSessions || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Tỷ lệ điểm danh</p>
                                    <p className="text-2xl font-bold">
                                        {classInfo.performanceMetrics?.attendanceRate?.toFixed(1) || "0.0"}%
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Báo cáo QA</p>
                                    <p className="text-2xl font-bold">{classInfo.qaReports?.length || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                        <TabsTrigger value="sessions">Buổi học</TabsTrigger>
                        <TabsTrigger value="reports">Báo cáo QA</TabsTrigger>
                        <TabsTrigger value="teachers">Giáo viên</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thông Tin Chung</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Mã lớp</p>
                                            <p className="font-medium">{classInfo.classCode}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Trạng thái</p>
                                            <ClassStatusBadge status={classInfo.status} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Khóa học</p>
                                            <p className="font-medium">{classInfo.courseName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Hình thức</p>
                                            <Badge variant="outline">{classInfo.modality}</Badge>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Chi nhánh</p>
                                            <p className="font-medium">{classInfo.branchName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Ngày bắt đầu</p>
                                            <p className="font-medium">{classInfo.startDate}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Performance Metrics */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Hiệu Suất</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Tỷ lệ hoàn thành BT</p>
                                            <p className="font-medium">{classInfo.performanceMetrics?.homeworkCompletionRate?.toFixed(1) || "0.0"}%</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Tổng số vắng</p>
                                            <p className="font-medium">{classInfo.performanceMetrics?.totalAbsences || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Học sinh rủi ro</p>
                                            <p className="font-medium">{classInfo.performanceMetrics?.studentsAtRisk || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Buổi học sắp tới</p>
                                            <p className="font-medium">
                                                {classInfo.sessionSummary?.nextSessionDate || "Không có"}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="sessions" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Tổng Quan Buổi Học</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tổng số buổi</p>
                                        <p className="text-2xl font-bold">{classInfo.sessionSummary?.totalSessions || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Đã hoàn thành</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {classInfo.sessionSummary?.completedSessions || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Sắp tới</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {classInfo.sessionSummary?.upcomingSessions || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Đã hủy</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {classInfo.sessionSummary?.cancelledSessions || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sessions list would go here */}
                        <Alert>
                            <MessageSquare className="h-4 w-4" />
                            <AlertDescription>
                                Chi tiết buổi học sẽ được hiển thị trong phiên bản tiếp theo.
                            </AlertDescription>
                        </Alert>
                    </TabsContent>

                    <TabsContent value="reports" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Báo Cáo QA</h3>
                            <Button asChild>
                                <Link to={`/qa/reports/create?classId=${classInfo.classId}`}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tạo Báo Cáo Mới
                                </Link>
                            </Button>
                        </div>

                        {classInfo.qaReports?.length > 0 ? (
                            <div className="space-y-4">
                                {classInfo.qaReports.map((report) => (
                                    <Card key={report.reportId}>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-semibold">{report.reportType}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Tạo bởi {report.reportedByName} • {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <QAReportStatusBadge status={report.status} />
                                                    <Badge variant="outline">{report.reportLevel}</Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Alert>
                                <FileText className="h-4 w-4" />
                                <AlertDescription>
                                    Chưa có báo cáo QA nào cho lớp này.
                                </AlertDescription>
                            </Alert>
                        )}
                    </TabsContent>

                    <TabsContent value="teachers" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Giáo Viên Phụ Trách</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {classInfo.teachers?.length > 0 ? (
                                    <div className="space-y-4">
                                        {classInfo.teachers.map((teacher) => (
                                            <div key={teacher.teacherId} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <h4 className="font-semibold">{teacher.teacherName}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        ID: {teacher.teacherId}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-muted-foreground">Phân công</p>
                                                    <p className="font-medium">{teacher.sessionsAssigned} buổi</p>
                                                    <p className="text-sm text-muted-foreground">Hoàn thành</p>
                                                    <p className="font-medium text-green-600">{teacher.sessionsCompleted} buổi</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Alert>
                                        <Users className="h-4 w-4" />
                                        <AlertDescription>
                                            Chưa có giáo viên nào được phân công cho lớp này.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}