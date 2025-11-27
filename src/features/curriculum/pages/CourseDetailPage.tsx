import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowLeft, Loader2, Edit, BookOpen, Clock, GraduationCap, CheckCircle, XCircle, FileText, Target, PlayCircle, Download } from "lucide-react";
import { useGetCourseDetailsQuery, useApproveCourseMutation, useRejectCourseMutation, useSubmitCourseMutation } from "@/store/services/courseApi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

export default function CourseDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSubjectLeader = user?.roles?.includes("SUBJECT_LEADER");
    const isManager = user?.roles?.includes("MANAGER") || user?.roles?.includes("ADMIN");

    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const isVideoFile = (url?: string) => {
        if (!url) return false;
        const videoExtensions = ['.mp4', '.mov', '.webm', '.mkv', '.avi'];
        return videoExtensions.some(ext => url.toLowerCase().includes(ext));
    };

    const { data: courseData, isLoading, refetch } = useGetCourseDetailsQuery(Number(id), {
        skip: !id || isNaN(Number(id))
    });
    const course = courseData?.data;

    const [approveCourse, { isLoading: isApproving }] = useApproveCourseMutation();
    const [rejectCourse, { isLoading: isRejecting }] = useRejectCourseMutation();
    const [submitCourse] = useSubmitCourseMutation();

    const handleApprove = async () => {
        if (!course?.id) return;
        try {
            await approveCourse(course.id).unwrap();
            toast.success("Đã phê duyệt khóa học thành công");
            refetch();
        } catch (error) {
            console.error("Failed to approve course:", error);
            toast.error("Phê duyệt thất bại. Vui lòng thử lại.");
        }
    };

    const handleReject = async () => {
        if (!course?.id || !rejectReason.trim()) return;
        try {
            await rejectCourse({ id: course.id, reason: rejectReason }).unwrap();
            toast.success("Đã từ chối khóa học");
            setRejectDialogOpen(false);
            refetch();
        } catch (error) {
            console.error("Failed to reject course:", error);
            toast.error("Từ chối thất bại. Vui lòng thử lại.");
        }
    };

    const handleSubmit = async () => {
        if (!course?.id) return;
        try {
            await submitCourse(course.id).unwrap();
            toast.success("Đã nộp khóa học để phê duyệt");
            refetch();
        } catch (error) {
            console.error("Failed to submit course:", error);
            toast.error("Nộp thất bại. Vui lòng thử lại.");
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout title="Chi tiết Khóa học" description="Đang tải thông tin khóa học...">
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!course) {
        return (
            <DashboardLayout title="Chi tiết Khóa học" description="Không tìm thấy thông tin khóa học">
                <div className="text-center py-12">
                    <div className="bg-muted/30 p-6 rounded-full w-fit mx-auto mb-4">
                        <BookOpen className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Không tìm thấy khóa học</h3>
                    <p className="text-muted-foreground mb-6">Khóa học không tồn tại hoặc đã bị xóa.</p>
                    <Button onClick={() => navigate("/curriculum")}>Quay lại danh sách</Button>
                </div>
            </DashboardLayout>
        );
    }

    const getStatusBadge = (status: string, approvalStatus?: string) => {
        if (approvalStatus === "REJECTED") {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Badge variant="destructive" className="cursor-help px-3 py-1 text-sm">Đã từ chối</Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Lý do: {course.rejectionReason || "Không có lý do"}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }
        switch (status) {
            case "SUBMITTED":
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1 text-sm">Chờ phê duyệt</Badge>;
            case "ACTIVE":
                return <Badge variant="default" className="bg-green-600 hover:bg-green-700 px-3 py-1 text-sm">Đã phê duyệt</Badge>;
            case "DRAFT":
                return <Badge variant="outline" className="px-3 py-1 text-sm">Nháp</Badge>;
            default:
                return <Badge variant="outline" className="px-3 py-1 text-sm">{status}</Badge>;
        }
    };

    return (
        <DashboardLayout
            title={course.name || "Chi tiết khóa học"}
            description={`Mã khóa học: ${course.code || "N/A"}`}
            actions={
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigate("/curriculum")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate(`/curriculum/courses/${id}/learn`)}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Vào học
                    </Button>

                    {isSubjectLeader && (course.status === "DRAFT" || course.approvalStatus === "REJECTED") && (
                        <>
                            <Button variant="outline" onClick={() => navigate(`/curriculum/courses/${id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Chỉnh sửa
                            </Button>

                        </>
                    )}

                    {isManager && course.status === "SUBMITTED" && (
                        <>
                            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setRejectDialogOpen(true)} disabled={isRejecting}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Từ chối
                            </Button>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={isApproving}>
                                {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Phê duyệt
                            </Button>
                        </>
                    )}
                </div>
            }
        >
            <div className="space-y-6">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Môn học</p>
                                <p className="font-semibold">{course.subjectName}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <GraduationCap className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Cấp độ</p>
                                <p className="font-semibold">{course.levelName}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-orange-100 rounded-full">
                                <Clock className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Thời lượng</span>
                                <p>{course.totalHours} giờ</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Giờ/buổi</span>
                                <p>{course.hoursPerSession} giờ</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-purple-100 rounded-full">
                                <Target className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Trạng thái</p>
                                <div className="mt-1">{getStatusBadge(course.status, course.approvalStatus)}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-5 lg:w-[800px]">
                        <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                        <TabsTrigger value="syllabus">Cấu trúc khóa học</TabsTrigger>
                        <TabsTrigger value="clos">Chuẩn đầu ra</TabsTrigger>
                        <TabsTrigger value="assessments">Đánh giá</TabsTrigger>
                        <TabsTrigger value="materials">Tài liệu</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Mô tả khóa học</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed">
                                    {course.description || "Chưa có mô tả cho khóa học này."}
                                </p>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Thông tin chi tiết</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Số buổi học</span>
                                        <span className="font-medium">{course.totalSessions} buổi</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Thời lượng/buổi</span>
                                        <span className="font-medium">{course.hoursPerSession} giờ</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Thang điểm</span>
                                        <span className="font-medium">{course.scoreScale || "10"}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Yêu cầu & Đối tượng</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-medium mb-1 text-sm">Tiên quyết</h4>
                                        <p className="text-sm text-muted-foreground">{course.prerequisites || "Không có yêu cầu tiên quyết"}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <h4 className="font-medium mb-1 text-sm">Đối tượng học viên</h4>
                                        <p className="text-sm text-muted-foreground">{course.targetAudience || "Chưa xác định"}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <h4 className="font-medium mb-1 text-sm">Phương pháp giảng dạy</h4>
                                        <p className="text-sm text-muted-foreground">{course.teachingMethods || "Chưa xác định"}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Syllabus Tab */}
                    <TabsContent value="syllabus" className="mt-6">
                        <div className="space-y-6">
                            {course.phases?.map((phase, index) => (
                                <Card key={index} className="overflow-hidden">
                                    <CardHeader className="bg-muted/30 pb-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <Badge variant="outline" className="mb-2">Giai đoạn {phase.phaseNumber}</Badge>
                                                <CardTitle className="text-lg">{phase.name}</CardTitle>
                                                {phase.description && <CardDescription>{phase.description}</CardDescription>}
                                                {/* Phase Materials */}
                                                {(course.materials?.filter(m => m.scope === 'PHASE' && m.phaseId === phase.id) ?? []).length > 0 && (
                                                    <div className="mt-4 pt-4 border-t">
                                                        <h5 className="text-sm font-medium mb-2">Tài liệu giai đoạn:</h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(course.materials?.filter(m => m.scope === 'PHASE' && m.phaseId === phase.id) ?? []).map((material, mIndex) => (
                                                                <div key={mIndex} className="flex items-center gap-2 bg-background border rounded px-2 py-1 text-sm">
                                                                    <FileText className="h-3 w-3 text-muted-foreground" />
                                                                    <a href={material.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-[150px]" title={material.name}>
                                                                        {material.name}
                                                                    </a>
                                                                    <div className="flex items-center gap-1 border-l pl-2 ml-1">
                                                                        <a href={material.url} download title="Tải xuống" className="text-green-600 hover:text-green-700">
                                                                            <Download className="h-3 w-3" />
                                                                        </a>
                                                                        {isVideoFile(material.url) && (
                                                                            <button onClick={() => setVideoUrl(material.url || null)} title="Xem video" className="text-purple-600 hover:text-purple-700">
                                                                                <PlayCircle className="h-3 w-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right text-sm text-muted-foreground">
                                                <p>{phase.sessions?.length || 0} buổi học</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/10">
                                                    <TableHead className="w-[80px] text-center">Buổi</TableHead>
                                                    <TableHead className="w-[30%]">Chủ đề</TableHead>
                                                    <TableHead>Nhiệm vụ sinh viên</TableHead>
                                                    <TableHead>Tài liệu</TableHead>
                                                    <TableHead className="w-[150px]">Kỹ năng</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {phase.sessions?.map((session, sIndex) => (
                                                    <TableRow key={sIndex} className="hover:bg-muted/5">
                                                        <TableCell className="text-center font-medium text-muted-foreground">
                                                            {sIndex + 1}
                                                        </TableCell>
                                                        <TableCell className="font-medium">{session.topic}</TableCell>
                                                        <TableCell className="text-muted-foreground text-sm">{session.studentTask || "—"}</TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col gap-1">
                                                                {(course.materials?.filter(m => m.scope === 'SESSION' && m.sessionId === session.id) ?? []).map((material, mIndex) => (
                                                                    <div key={mIndex} className="flex items-center gap-2 text-xs">
                                                                        <FileText className="h-3 w-3 text-muted-foreground" />
                                                                        <a href={material.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-[120px]" title={material.name}>
                                                                            {material.name}
                                                                        </a>
                                                                        <a href={material.url} download title="Tải xuống" className="text-green-600 hover:text-green-700">
                                                                            <Download className="h-3 w-3" />
                                                                        </a>
                                                                        {isVideoFile(material.url) && (
                                                                            <button onClick={() => setVideoUrl(material.url || null)} title="Xem video" className="text-purple-600 hover:text-purple-700">
                                                                                <PlayCircle className="h-3 w-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {(!course.materials?.some(m => m.scope === 'SESSION' && m.sessionId === session.id)) && (
                                                                    <span className="text-muted-foreground text-xs">—</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-wrap gap-1">
                                                                {session.skillSets?.map((skill) => (
                                                                    <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                                                                ))}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* CLOs Tab */}
                    <TabsContent value="clos" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Chuẩn đầu ra khóa học (CLOs)</CardTitle>
                                <CardDescription>Các mục tiêu học tập mà sinh viên cần đạt được sau khi hoàn thành khóa học.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Mã CLO</TableHead>
                                            <TableHead>Mô tả chi tiết</TableHead>
                                            <TableHead className="w-[200px]">PLOs liên quan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {course.clos?.map((clo, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-bold text-primary">{clo.code}</TableCell>
                                                <TableCell>{clo.description}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {clo.mappedPLOs?.map((plo) => (
                                                            <Badge key={plo} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{plo}</Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Assessments Tab */}
                    <TabsContent value="assessments" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle>Danh sách bài đánh giá</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tên bài đánh giá</TableHead>
                                                <TableHead>Loại</TableHead>
                                                <TableHead className="text-center">Thời lượng</TableHead>
                                                <TableHead className="text-center">Điểm tối đa</TableHead>
                                                <TableHead>CLOs đánh giá</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {course.assessments?.map((assessment, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{assessment.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{assessment.type}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">{assessment.duration} phút</TableCell>
                                                    <TableCell className="text-center font-bold">{assessment.maxScore || 0}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1 flex-wrap">
                                                            {assessment.mappedCLOs?.map((clo) => (
                                                                <Badge key={clo} variant="outline" className="text-xs">{clo}</Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Tổng kết</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Tổng số bài đánh giá</span>
                                        <span className="font-bold text-lg">{course.assessments?.length || 0}</span>
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Phân bố trọng số</p>
                                        {/* Simple visualization could go here */}
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                                            <div className="h-full bg-blue-500" style={{ width: '30%' }} title="Quizzes" />
                                            <div className="h-full bg-green-500" style={{ width: '30%' }} title="Assignments" />
                                            <div className="h-full bg-orange-500" style={{ width: '40%' }} title="Exams" />
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" />Quiz</div>
                                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" />Assignment</div>
                                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" />Exam</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Materials Tab */}
                    <TabsContent value="materials" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Tài liệu học tập</CardTitle>
                                <CardDescription>Tài liệu tham khảo và giáo trình cho khóa học.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {course.materials?.filter(m => m.scope === 'COURSE').map((material, index) => (
                                        <div key={index} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="p-2 bg-primary/10 rounded-md">
                                                <FileText className="h-6 w-6 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium truncate" title={material.name}>{material.name}</h4>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                    <Badge variant="secondary" className="text-[10px] h-5">{material.type}</Badge>
                                                    <span>{material.scope}</span>
                                                </div>
                                                <a
                                                    href={material.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                                                >
                                                    Xem tài liệu
                                                </a>
                                                <a
                                                    href={material.url}
                                                    download
                                                    className="text-sm text-green-600 hover:underline mt-2 inline-block ml-4"
                                                    title="Tải xuống tài liệu"
                                                >
                                                    Tải xuống
                                                </a>
                                                {isVideoFile(material.url) && (
                                                    <button
                                                        onClick={() => setVideoUrl(material.url || null)}
                                                        className="text-sm text-purple-600 hover:underline mt-2 inline-flex items-center ml-4"
                                                        title="Xem video"
                                                    >
                                                        <PlayCircle className="h-4 w-4 mr-1" />
                                                        Xem Video
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {(!course.materials || course.materials.filter(m => m.scope === 'COURSE').length === 0) && (
                                        <div className="col-span-full text-center py-8 text-muted-foreground">
                                            Chưa có tài liệu nào được tải lên.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Reject Dialog */}
                <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Từ chối phê duyệt khóa học</DialogTitle>
                            <DialogDescription>
                                Vui lòng nhập lý do từ chối để gửi phản hồi cho người tạo.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Textarea
                                placeholder="Nhập lý do từ chối..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                                Hủy
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={isRejecting || !rejectReason.trim()}
                            >
                                {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Xác nhận từ chối
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Video Player Dialog */}
                <Dialog open={!!videoUrl} onOpenChange={(open) => !open && setVideoUrl(null)}>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
                        <DialogHeader className="p-4 absolute top-0 left-0 z-10 w-full bg-gradient-to-b from-black/70 to-transparent">
                            <div className="flex justify-between items-center">
                                <DialogTitle className="text-white">Xem Video</DialogTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20 rounded-full"
                                    onClick={() => setVideoUrl(null)}
                                >
                                    <XCircle className="h-6 w-6" />
                                </Button>
                            </div>
                        </DialogHeader>
                        <div className="aspect-video w-full flex items-center justify-center bg-black">
                            {videoUrl && (
                                <video
                                    src={videoUrl}
                                    controls
                                    autoPlay
                                    className="w-full h-full"
                                    controlsList="nodownload"
                                >
                                    Trình duyệt của bạn không hỗ trợ thẻ video.
                                </video>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
