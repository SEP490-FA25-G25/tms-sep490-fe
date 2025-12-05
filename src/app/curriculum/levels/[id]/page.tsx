import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import {
    useGetLevelQuery
} from "@/store/services/curriculumApi";
import { useGetAllCoursesQuery } from "@/store/services/courseApi";
import { getStatusLabel, getStatusColor } from "@/utils/statusMapping";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, GraduationCap, Layers, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function LevelDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: levelData, isLoading } = useGetLevelQuery(Number(id), {
        skip: !id || isNaN(Number(id))
    });
    const { data: coursesData, isLoading: isLoadingCourses } = useGetAllCoursesQuery(
        { levelId: Number(id) },
        { skip: !id || isNaN(Number(id)) }
    );

    if (isLoading) {
        return (
            <DashboardLayout
                title="Chi tiết Cấp độ"
                description="Đang tải thông tin cấp độ..."
            >
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    const level = levelData?.data;

    if (!level) {
        return (
            <DashboardLayout
                title="Chi tiết Cấp độ"
                description="Không tìm thấy thông tin cấp độ"
            >
                <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Cấp độ không tồn tại hoặc đã bị xóa.</p>
                    <Button onClick={() => navigate("/curriculum")}>Quay lại danh sách</Button>
                </div>
            </DashboardLayout>
        );
    }

    const courses = coursesData || [];

    return (
        <DashboardLayout
            title={level.name}
            description={`Mã cấp độ: ${level.code}`}
        >
            <div className="space-y-6">
                {/* Header Stats */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Mã cấp độ</CardTitle>
                            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", "bg-slate-100 dark:bg-slate-800/50")}>
                                <Layers className={cn("h-4 w-4", "text-slate-600 dark:text-slate-400")} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{level.code}</div>
                            <p className="text-xs text-muted-foreground">Mã định danh cấp độ</p>
                        </CardContent>
                    </Card>
                    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Môn học</CardTitle>
                            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", "bg-blue-50 dark:bg-blue-950/30")}>
                                <BookOpen className={cn("h-4 w-4", "text-blue-600 dark:text-blue-400")} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold truncate" title={level.subjectName}>{level.subjectName}</div>
                            <p className="text-xs text-muted-foreground">({level.subjectCode})</p>
                        </CardContent>
                    </Card>
                    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Số khóa học</CardTitle>
                            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", "bg-orange-50 dark:bg-orange-950/30")}>
                                <GraduationCap className={cn("h-4 w-4", "text-orange-600 dark:text-orange-400")} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{courses.length}</div>
                            <p className="text-xs text-muted-foreground">Khóa học thuộc cấp độ</p>
                        </CardContent>
                    </Card>
                    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Trạng thái</CardTitle>
                            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", "bg-emerald-50 dark:bg-emerald-950/30")}>
                                <CheckCircle2 className={cn("h-4 w-4", "text-emerald-600 dark:text-emerald-400")} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="mt-1">
                                <Badge variant={getStatusColor(level.status)}>
                                    {getStatusLabel(level.status)}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Trạng thái hiện tại</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                        <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                        <TabsTrigger value="courses">Danh sách khóa học</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Mô tả cấp độ</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed">
                                    {level.description || "Chưa có mô tả cho cấp độ này."}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Thông tin chi tiết</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Mã cấp độ</span>
                                    <span className="font-medium">{level.code}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Tên cấp độ</span>
                                    <span className="font-medium">{level.name}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Môn học</span>
                                    <span className="font-medium">{level.subjectName} ({level.subjectCode})</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Trạng thái</span>
                                    <Badge variant={getStatusColor(level.status)}>
                                        {getStatusLabel(level.status)}
                                    </Badge>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Ngày tạo</span>
                                    <span className="font-medium">
                                        {level.createdAt ? format(new Date(level.createdAt), "dd/MM/yyyy HH:mm") : "-"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Ngày cập nhật</span>
                                    <span className="font-medium">
                                        {level.updatedAt ? format(new Date(level.updatedAt), "dd/MM/yyyy HH:mm") : "-"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Courses Tab */}
                    <TabsContent value="courses" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Danh sách Khóa học</CardTitle>
                                <CardDescription>
                                    Các khóa học thuộc cấp độ này.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingCourses ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[150px]">Mã khóa học</TableHead>
                                                <TableHead>Tên khóa học</TableHead>
                                                <TableHead className="w-[120px]">Trạng thái</TableHead>
                                                <TableHead className="text-right w-[100px]">Hành động</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {courses.length > 0 ? (
                                                courses.map((course) => (
                                                    <TableRow key={course.id}>
                                                        <TableCell className="font-medium">{course.code}</TableCell>
                                                        <TableCell>{course.name}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={getStatusColor(course.status)}>
                                                                {getStatusLabel(course.status)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => navigate(`/curriculum/courses/${course.id}`)}
                                                            >
                                                                Chi tiết
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                        Chưa có khóa học nào thuộc cấp độ này.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
