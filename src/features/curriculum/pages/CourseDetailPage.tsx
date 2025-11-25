import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowLeft, Loader2, Edit } from "lucide-react";
import { useGetCourseDetailsQuery } from "@/store/services/courseApi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function CourseDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: courseData, isLoading } = useGetCourseDetailsQuery(Number(id));
    const course = courseData?.data;

    if (isLoading) {
        return (
            <DashboardLayout
                title="Chi tiết Khóa học"
                description="Đang tải thông tin khóa học..."
            >
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!course) {
        return (
            <DashboardLayout
                title="Chi tiết Khóa học"
                description="Không tìm thấy thông tin khóa học"
            >
                <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Khóa học không tồn tại hoặc đã bị xóa.</p>
                    <Button onClick={() => navigate("/curriculum")}>Quay lại danh sách</Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title={`Chi tiết: ${course.name}`}
            description={`Mã khóa học: ${course.code}`}
        >
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Button variant="outline" onClick={() => navigate("/curriculum")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Button>
                    <Button onClick={() => navigate(`/curriculum/courses/${id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Basic Info Card */}
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle>Thông tin chung</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Môn học</span>
                                <p>{course.subjectName} (ID: {course.id})</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Cấp độ</span>
                                <p>{course.levelName}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Thời lượng</span>
                                <p>{course.totalHours} giờ / {course.durationWeeks} tuần</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Số buổi/tuần</span>
                                <p>{course.sessionPerWeek} buổi</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Giờ/buổi</span>
                                <p>{course.hoursPerSession} giờ</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Thang điểm</span>
                                <p>{course.scoreScale || "10"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Content Tabs */}
                    <Card className="md:col-span-2">
                        <CardContent className="p-6">
                            <Tabs defaultValue="structure">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="structure">Cấu trúc</TabsTrigger>
                                    <TabsTrigger value="clos">CLOs</TabsTrigger>
                                    <TabsTrigger value="assessments">Đánh giá</TabsTrigger>
                                    <TabsTrigger value="materials">Tài liệu</TabsTrigger>
                                </TabsList>

                                <TabsContent value="structure" className="mt-4 space-y-4">
                                    {course.phases?.map((phase, index) => (
                                        <div key={index} className="border rounded-md p-4">
                                            <h3 className="font-semibold mb-2">{phase.name}</h3>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Buổi</TableHead>
                                                        <TableHead>Chủ đề</TableHead>
                                                        <TableHead>Nhiệm vụ SV</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {phase.sessions?.map((session, sIndex) => (
                                                        <TableRow key={sIndex}>
                                                            <TableCell>{sIndex + 1}</TableCell>
                                                            <TableCell>{session.topic}</TableCell>
                                                            <TableCell>{session.objectives}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ))}
                                </TabsContent>

                                <TabsContent value="clos" className="mt-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Mã</TableHead>
                                                <TableHead>Mô tả</TableHead>
                                                <TableHead>PLOs liên quan</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {course.clos?.map((clo, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{clo.code}</TableCell>
                                                    <TableCell>{clo.description}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1 flex-wrap">
                                                            {clo.relatedPLOs?.map((plo) => (
                                                                <Badge key={plo.id} variant="outline">{plo.code}</Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TabsContent>

                                <TabsContent value="assessments" className="mt-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tên bài</TableHead>
                                                <TableHead>Loại</TableHead>
                                                <TableHead>Trọng số</TableHead>
                                                <TableHead>Thời lượng</TableHead>
                                                <TableHead>CLOs</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {course.assessments?.map((assessment, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{assessment.name}</TableCell>
                                                    <TableCell>{assessment.assessmentType}</TableCell>
                                                    <TableCell>{assessment.maxScore}</TableCell>
                                                    <TableCell>{assessment.duration} phút</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1 flex-wrap">
                                                            {assessment.cloMappings?.map((clo) => (
                                                                <Badge key={clo} variant="outline">{clo}</Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TabsContent>

                                <TabsContent value="materials" className="mt-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tên tài liệu</TableHead>
                                                <TableHead>Loại</TableHead>
                                                <TableHead>Phạm vi</TableHead>
                                                <TableHead>Link</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {course.materials?.map((material, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{material.title}</TableCell>
                                                    <TableCell>{material.materialType}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{material.level}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                            Mở link
                                                        </a>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
