import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Edit, Eye, Loader2, Trash2, RotateCcw } from "lucide-react";
import {
    useGetAllCoursesQuery,
    useDeactivateCourseMutation,
    useReactivateCourseMutation
} from "@/store/services/courseApi";
import { useGetSubjectsWithLevelsQuery } from "@/store/services/curriculumApi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function CourseList() {
    const navigate = useNavigate();
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(undefined);
    const [selectedLevelId, setSelectedLevelId] = useState<number | undefined>(undefined);
    const [courseToDelete, setCourseToDelete] = useState<number | null>(null);
    const [courseToReactivate, setCourseToReactivate] = useState<number | null>(null);

    // Fetch filters data
    const { data: subjectsData } = useGetSubjectsWithLevelsQuery();

    // Fetch courses with filters
    const { data: courses, isLoading } = useGetAllCoursesQuery({
        subjectId: selectedSubjectId,
        levelId: selectedLevelId
    });

    const [deactivateCourse, { isLoading: isDeactivating }] = useDeactivateCourseMutation();
    const [reactivateCourse, { isLoading: isReactivating }] = useReactivateCourseMutation();

    // Get levels for selected subject
    const selectedSubject = subjectsData?.data?.find(s => s.id === selectedSubjectId);
    const availableLevels = selectedSubject?.levels || [];

    const handleSubjectChange = (value: string) => {
        if (value === "all") {
            setSelectedSubjectId(undefined);
            setSelectedLevelId(undefined);
        } else {
            setSelectedSubjectId(Number(value));
            setSelectedLevelId(undefined); // Reset level when subject changes
        }
    };

    const handleDeactivate = async () => {
        if (courseToDelete) {
            try {
                await deactivateCourse(courseToDelete).unwrap();
                toast.success("Đã hủy kích hoạt khóa học thành công");
                setCourseToDelete(null);
            } catch (error) {
                console.error("Failed to deactivate course:", error);
                toast.error("Hủy kích hoạt thất bại. Vui lòng thử lại.");
            }
        }
    };

    const handleReactivate = async () => {
        if (courseToReactivate) {
            try {
                await reactivateCourse(courseToReactivate).unwrap();
                toast.success("Đã kích hoạt lại khóa học thành công");
                setCourseToReactivate(null);
            } catch (error) {
                console.error("Failed to reactivate course:", error);
                toast.error("Kích hoạt lại thất bại. Vui lòng thử lại.");
            }
        }
    };

    return (
        <div className="space-y-4">
            {/* Filter Section */}
            <div className="flex items-center gap-4">
                <div className="w-[250px]">
                    <Select
                        value={selectedSubjectId?.toString() || "all"}
                        onValueChange={handleSubjectChange}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Lọc theo môn học" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả môn học</SelectItem>
                            {subjectsData?.data?.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id.toString()}>
                                    {subject.name} ({subject.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-[250px]">
                    <Select
                        value={selectedLevelId?.toString() || "all"}
                        onValueChange={(value) => setSelectedLevelId(value === "all" ? undefined : Number(value))}
                        disabled={!selectedSubjectId}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Lọc theo cấp độ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả cấp độ</SelectItem>
                            {availableLevels.map((level) => (
                                <SelectItem key={level.id} value={level.id.toString()}>
                                    {level.name} ({level.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table Section */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã khóa học</TableHead>
                            <TableHead>Tên khóa học</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : courses && courses.length > 0 ? (
                            courses.map((course) => (
                                <TableRow key={course.id}>
                                    <TableCell className="font-medium">{course.code}</TableCell>
                                    <TableCell>{course.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={course.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                            {course.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => navigate(`/curriculum/courses/${course.id}`)}
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => navigate(`/curriculum/courses/${course.id}/edit`)}
                                                title="Chỉnh sửa"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            {course.status === 'INACTIVE' ? (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => setCourseToReactivate(course.id)}
                                                    title="Kích hoạt lại"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => setCourseToDelete(course.id)}
                                                    title="Hủy kích hoạt"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    Chưa có khóa học nào.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn hủy kích hoạt?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ chuyển trạng thái khóa học sang INACTIVE. Bạn có thể kích hoạt lại sau này.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeactivate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isDeactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hủy kích hoạt"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!courseToReactivate} onOpenChange={(open) => !open && setCourseToReactivate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kích hoạt lại khóa học?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ chuyển trạng thái khóa học sang ACTIVE (hoặc DRAFT nếu chưa đầy đủ thông tin).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReactivate} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {isReactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kích hoạt lại"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
