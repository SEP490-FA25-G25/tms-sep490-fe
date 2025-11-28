import { useState } from "react";

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
import type { CourseDTO } from "@/store/services/courseApi";
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

import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

export function CourseList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSubjectLeader = user?.roles?.includes("SUBJECT_LEADER");
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(undefined);
    const [selectedLevelId, setSelectedLevelId] = useState<number | undefined>(undefined);
    const [courseToDelete, setCourseToDelete] = useState<number | null>(null);
    const [courseToReactivate, setCourseToReactivate] = useState<number | null>(null);

    // Fetch filters data
    const { data: subjectsData } = useGetSubjectsWithLevelsQuery();

    // Fetch courses with filters
    const { data: courses } = useGetAllCoursesQuery({
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

    const columns: ColumnDef<CourseDTO>[] = [
        {
            accessorKey: "code",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Mã khóa học
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="font-medium pl-4">{row.getValue("code")}</div>,
        },
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Tên khóa học
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="pl-4">{row.getValue("name")}</div>,
        },
        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                const approvalStatus = row.original.approvalStatus;
                return (
                    <div className="flex gap-2 items-center">
                        <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {status}
                        </Badge>
                        {approvalStatus === 'REJECTED' && (
                            <Badge variant="destructive">
                                {approvalStatus}
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const course = row.original;
                return (
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/curriculum/courses/${course.id}`)}
                            title="Xem chi tiết"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        {isSubjectLeader && (
                            <>
                                {course.status === 'DRAFT' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium w-auto px-2"
                                        onClick={() => navigate(`/curriculum/courses/${course.id}/edit`)}
                                        title="Tiếp tục tạo khóa học"
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Tiếp tục tạo khóa học
                                    </Button>
                                )}
                                {course.status === 'REJECTED' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-medium w-auto px-2"
                                        onClick={() => navigate(`/curriculum/courses/${course.id}/edit`)}
                                        title="Chỉnh sửa khóa học"
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Chỉnh sửa khóa học
                                    </Button>
                                )}
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
                            </>
                        )}
                    </div>
                );
            },
        },
    ];

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
                <DataTable
                    columns={columns}
                    data={courses || []}
                    searchKey="name"
                    searchPlaceholder="Tìm kiếm theo tên khóa học..."
                />
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
