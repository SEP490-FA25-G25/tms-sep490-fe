import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Trash2, Loader2, RotateCcw, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGetSubjectsWithLevelsQuery, useDeactivateSubjectMutation, useReactivateSubjectMutation, useDeleteSubjectMutation } from "@/store/services/curriculumApi";
import type { SubjectWithLevelsDTO } from "@/store/services/curriculumApi";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
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
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/data-table";
import { getStatusLabel, getStatusColor } from "@/utils/statusMapping";
import { SubjectDialog } from "./SubjectDialog";
import { Plus } from "lucide-react";

export function SubjectList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSubjectLeader = user?.roles?.includes("SUBJECT_LEADER");
    const { data: subjectsData, isLoading } = useGetSubjectsWithLevelsQuery();
    const [deactivateSubject, { isLoading: isDeactivating }] = useDeactivateSubjectMutation();
    const [reactivateSubject, { isLoading: isReactivating }] = useReactivateSubjectMutation();
    const [deleteSubject, { isLoading: isDeleting }] = useDeleteSubjectMutation();
    const [subjectToDelete, setSubjectToDelete] = useState<number | null>(null);
    const [subjectToReactivate, setSubjectToReactivate] = useState<number | null>(null);
    const [subjectToDeletePermanently, setSubjectToDeletePermanently] = useState<number | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<SubjectWithLevelsDTO | null>(null);

    const handleCreate = () => {
        setSelectedSubject(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (subject: SubjectWithLevelsDTO) => {
        setSelectedSubject(subject);
        setIsDialogOpen(true);
    };

    const handleDeactivate = async () => {
        if (subjectToDelete) {
            try {
                await deactivateSubject(subjectToDelete).unwrap();
                toast.success("Đã hủy kích hoạt môn học thành công");
                setSubjectToDelete(null);
            } catch (error) {
                console.error("Failed to deactivate subject:", error);
                toast.error("Hủy kích hoạt thất bại. Vui lòng thử lại.");
            }
        }
    };

    const handleReactivate = async () => {
        if (subjectToReactivate) {
            try {
                await reactivateSubject(subjectToReactivate).unwrap();
                toast.success("Đã kích hoạt lại môn học thành công");
                setSubjectToReactivate(null);
            } catch (error) {
                console.error("Failed to reactivate subject:", error);
                toast.error("Kích hoạt lại thất bại. Vui lòng thử lại.");
            }
        }
    };

    const handleDelete = async () => {
        if (subjectToDeletePermanently) {
            try {
                await deleteSubject(subjectToDeletePermanently).unwrap();
                toast.success("Đã xóa môn học thành công");
                setSubjectToDeletePermanently(null);
            } catch (error: unknown) {
                console.error("Failed to delete subject:", error);
                const apiError = error as { data?: { message?: string } };
                const errorMessage = apiError.data?.message || "Xóa thất bại. Vui lòng thử lại.";
                toast.error(errorMessage);
            }
        }
    };

    const columns: ColumnDef<SubjectWithLevelsDTO>[] = [
        {
            accessorKey: "code",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Mã môn
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
                        Tên môn học
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="pl-4">{row.getValue("name")}</div>,
        },
        {
            id: "levels",
            header: "Số cấp độ",
            cell: ({ row }) => <div>{row.original.levels?.length || 0}</div>,
        },
        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => (
                <Badge
                    variant={getStatusColor(row.getValue("status"))}
                >
                    {getStatusLabel(row.getValue("status"))}
                </Badge>
            ),
        },
        {
            accessorKey: "createdAt",
            header: "Ngày tạo",
            cell: ({ row }) => {
                const date = row.getValue("createdAt");
                return date ? format(new Date(date as string), "dd/MM/yyyy") : "-";
            },
        },
        {
            accessorKey: "updatedAt",
            header: "Ngày thay đổi",
            cell: ({ row }) => {
                const date = row.getValue("updatedAt");
                return date ? format(new Date(date as string), "dd/MM/yyyy") : "-";
            },
        },
        {
            id: "actions",
            header: "Hành động",
            cell: ({ row }) => {
                const subject = row.original;
                return (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Mở menu hành động</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-48 p-1">
                            <div className="flex flex-col gap-0.5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start gap-2 h-9 px-2 bg-yellow-100 text-yellow-900 hover:bg-yellow-200"
                                    onClick={() => navigate(`/curriculum/subjects/${subject.id}`)}
                                >
                                    <Eye className="h-4 w-4" />
                                    Xem chi tiết
                                </Button>
                                {isSubjectLeader && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start gap-2 h-9 px-2"
                                            onClick={() => handleEdit(subject)}
                                        >
                                            <Edit className="h-4 w-4" />
                                            Chỉnh sửa
                                        </Button>
                                        {subject.status === "INACTIVE" ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start gap-2 h-9 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                onClick={() => setSubjectToReactivate(subject.id)}
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                Kích hoạt lại
                                            </Button>
                                        ) : subject.status === "ACTIVE" ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start gap-2 h-9 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                onClick={() => setSubjectToDelete(subject.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Hủy kích hoạt
                                            </Button>
                                        ) : null}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start gap-2 h-9 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                            onClick={() => setSubjectToDeletePermanently(subject.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Xóa
                                        </Button>
                                    </>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover >
                );
            },
        },
    ];

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Danh sách Môn học</h2>
                {isSubjectLeader && (
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tạo Môn học
                    </Button>
                )}
            </div>

            <DataTable
                columns={columns}
                data={[...(subjectsData?.data || [])].sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )}
                searchKey="name"
                searchPlaceholder="Tìm kiếm theo tên môn học..."
            />

            <SubjectDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                subject={selectedSubject ? { ...selectedSubject, plos: selectedSubject.plos || [], language: selectedSubject.language || '' } : null}
            />

            <AlertDialog open={!!subjectToDelete} onOpenChange={(open) => !open && setSubjectToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn hủy kích hoạt?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ chuyển trạng thái môn học sang Ngừng hoạt động. Bạn có thể kích hoạt lại sau này.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeactivate} className="bg-orange-600 text-white hover:bg-orange-700">
                            {isDeactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hủy kích hoạt"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!subjectToReactivate} onOpenChange={(open) => !open && setSubjectToReactivate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kích hoạt lại môn học?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ chuyển trạng thái môn học sang Hoạt động (hoặc Nháp nếu chưa có PLO).
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

            <AlertDialog open={!!subjectToDeletePermanently} onOpenChange={(open) => !open && setSubjectToDeletePermanently(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ xóa vĩnh viễn môn học. Không thể hoàn tác.
                            <br />
                            Lưu ý: Chỉ có thể xóa môn học nếu chưa có cấp độ nào.
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
