"use client"

import { useState } from "react"
import { useGetQAClassesQuery } from "@/store/services/qaApi"
import { DashboardLayout } from "@/components/DashboardLayout"
import { ClassStatusBadge } from "@/components/qa/ClassStatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Filter, Eye, MessageSquareIcon, Loader2, AlertTriangle } from "lucide-react"
import { Link } from "react-router-dom"

export default function ClassesListPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(0)

    const { data: classesData, isLoading, error } = useGetQAClassesQuery({
        search: searchTerm,
        page,
        size: 20,
        sort: 'startDate',
        sortDir: 'desc',
    })

    const classes = classesData?.data || []
    const totalCount = classesData?.total || 0

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
        );
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
        );
    }

    return (
        <DashboardLayout
            title="Danh Sách Lớp Học"
            description="Quản lý và theo dõi chất lượng các lớp học."
        >
            <div className="space-y-6">
                {/* Search and Filters */}
                <div className="flex items-center space-x-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm lớp học hoặc khóa học..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Bộ lọc
                    </Button>
                </div>

                {/* Classes List */}
                <div className="space-y-4">
                    {classes.map((classItem) => (
                        <div key={classItem.classId} className="p-6 border rounded-lg space-y-4">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg">{classItem.classCode}</h3>
                                    <p className="text-muted-foreground">{classItem.className}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <ClassStatusBadge status={classItem.status} />
                                    <Button variant="outline" size="sm" asChild>
                                        <Link to={`/qa/classes/${classItem.classId}`}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Xem chi tiết
                                        </Link>
                                    </Button>
                                    <Button variant="secondary" size="sm" asChild>
                                        <Link to={`/qa/student-feedback?classId=${classItem.classId}`}>
                                            <MessageSquareIcon className="h-4 w-4 mr-2" />
                                            Phản hồi
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Khóa học</p>
                                    <p className="font-medium">{classItem.courseName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Chi nhánh</p>
                                    <p className="font-medium">{classItem.branchName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Hình thức</p>
                                    <Badge variant="outline">{classItem.modality}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Ngày bắt đầu</p>
                                    <p className="font-medium">{classItem.startDate}</p>
                                </div>
                            </div>

                            {/* Progress & Metrics */}
                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="flex items-center space-x-6">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tiến độ buổi học</p>
                                        <p className="font-medium">{classItem.completedSessions}/{classItem.totalSessions} buổi</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tỷ lệ điểm danh</p>
                                        <p className="font-medium">{classItem.attendanceRate.toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Hoàn thành BT</p>
                                        <p className="font-medium">{classItem.homeworkCompletionRate.toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Báo cáo QA</p>
                                        <p className="font-medium">{classItem.qaReportCount}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {classes.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">Không tìm thấy lớp học nào.</p>
                    </div>
                )}

                {/* Pagination */}
                {totalCount > 20 && (
                    <div className="flex items-center justify-center space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 0}
                        >
                            Trang trước
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Trang {page + 1}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => setPage(page + 1)}
                            disabled={classes.length < 20}
                        >
                            Trang tiếp
                        </Button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}