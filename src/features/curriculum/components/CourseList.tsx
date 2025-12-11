import { useState } from "react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Edit, Eye, Loader2, Trash2, RotateCcw, MoreVertical, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    useGetAllCoursesQuery,
    useDeactivateCourseMutation,
    useReactivateCourseMutation,
    useDeleteCourseMutation
} from "@/store/services/courseApi";
import type { CourseDTO } from "@/store/services/courseApi";
import { useGetCurriculumsWithLevelsQuery } from "@/store/services/curriculumApi";
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { getStatusLabel, getStatusColor } from "@/utils/statusMapping";

export function CourseList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSubjectLeader = user?.roles?.includes("SUBJECT_LEADER");
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(undefined);
    const [selectedLevelId, setSelectedLevelId] = useState<number | undefined>(undefined);
    const [courseToDelete, setCourseToDelete] = useState<number | null>(null);
    const [courseToReactivate, setCourseToReactivate] = useState<number | null>(null);
    const [courseToDeletePermanently, setCourseToDeletePermanently] = useState<number | null>(null);

    // Fetch filters data
    const { data: subjectsData } = useGetCurriculumsWithLevelsQuery();

    // Fetch courses with filters - uses /subjects endpoint
    const { data: courses } = useGetAllCoursesQuery({
        curriculumId: selectedSubjectId,
        levelId: selectedLevelId
    });

    const [deactivateCourse, { isLoading: isDeactivating }] = useDeactivateCourseMutation();
    const [reactivateCourse, { isLoading: isReactivating }] = useReactivateCourseMutation();
    const [deleteCourse, { isLoading: isDeleting }] = useDeleteCourseMutation();

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

    const handleDelete = async () => {
        if (courseToDeletePermanently) {
            try {
                await deleteCourse(courseToDeletePermanently).unwrap();
                toast.success("Đã xóa khóa học thành công");
                setCourseToDeletePermanently(null);
            } catch (error: unknown) {
                console.error("Failed to delete course:", error);
                const errorMessage =
                    (error as { data?: { message?: string } })?.data?.message ||
                    "Xóa thất bại. Vui lòng thử lại.";
                toast.error(errorMessage);
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
            accessorKey: "effectiveDate",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Ngày hiệu lực
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const dateValue = row.getValue("effectiveDate");
                if (!dateValue) return <div className="pl-4">-</div>;

                let dateObj: Date;
                if (Array.isArray(dateValue)) {
                    // Handle [year, month, day] format
                    dateObj = new Date(dateValue[0], dateValue[1] - 1, dateValue[2]);
                } else {
                    // Handle string format
                    dateObj = new Date(dateValue as string);
                }

                return <div className="pl-4">{format(dateObj, "dd/MM/yyyy")}</div>;
            },
        },
        {
            accessorKey: "updatedAt",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Ngày thay đổi
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="pl-4">{row.getValue("updatedAt") ? format(new Date(row.getValue("updatedAt")), "dd/MM/yyyy") : "-"}</div>,
        },
        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                const approvalStatus = row.original.approvalStatus;
                return (
                    <div className="flex gap-2 items-center">
                        <Badge variant={getStatusColor(status)}>
                            {getStatusLabel(status)}
                        </Badge>
                        {approvalStatus && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge variant={getStatusColor(approvalStatus)} className="cursor-help">
                                            {getStatusLabel(approvalStatus)}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Lý do: {row.original.rejectionReason || "Không có lý do"}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: "Hành động",
            cell: ({ row }) => {
                const course = row.original;
                return (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Mở menu hành động</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-48 p-1">
                            <div className="flex flex-col gap-0.5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start gap-2 h-9 px-2"
                                    onClick={() => navigate(`/curriculum/courses/${course.id}`)}
                                >
                                    <Eye className="h-4 w-4" />
                                    Xem chi tiết
                                </Button>
                                {isSubjectLeader && (
                                    <>
                                        {course.status === 'DRAFT' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start gap-2 h-9 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => navigate(`/curriculum/courses/${course.id}/edit`)}
                                            >
                                                <Edit className="h-4 w-4" />
                                                Tiếp tục tạo
                                            </Button>
                                        )}
                                        {course.status === 'REJECTED' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start gap-2 h-9 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                onClick={() => navigate(`/curriculum/courses/${course.id}/edit`)}
                                            >
                                                <Edit className="h-4 w-4" />
                                                Chỉnh sửa
                                            </Button>
                                        )}
                                        {course.status === 'INACTIVE' ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start gap-2 h-9 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                onClick={() => setCourseToReactivate(course.id)}
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                Kích hoạt lại
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start gap-2 h-9 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setCourseToDelete(course.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Hủy kích hoạt
                                            </Button>
                                        )}
                                        {course.status === 'DRAFT' && !course.approvalStatus && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start gap-2 h-9 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setCourseToDeletePermanently(course.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Xóa
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                );
            },
        },
    ];

    return (
        <div className="space-y-4">
            {/* Title and Create Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Danh sách Môn học</h2>
                {isSubjectLeader && (
                    <Button onClick={() => navigate("/curriculum/courses/create")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tạo Môn học
                    </Button>
                )}
            </div>
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
                            Hành động này sẽ chuyển trạng thái khóa học sang Ngừng hoạt động. Bạn có thể kích hoạt lại sau này.
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
                            Hành động này sẽ chuyển trạng thái khóa học sang Hoạt động (hoặc Nháp nếu chưa đầy đủ thông tin).
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

            <AlertDialog open={!!courseToDeletePermanently} onOpenChange={(open) => !open && setCourseToDeletePermanently(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ xóa vĩnh viễn khóa học. Không thể hoàn tác.
                            <br />
                            Lưu ý: Chỉ có thể xóa khóa học ở trạng thái Nháp và chưa gửi duyệt.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xóa vĩnh viễn"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
