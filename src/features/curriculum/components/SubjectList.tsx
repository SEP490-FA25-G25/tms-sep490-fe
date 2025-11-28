import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Trash2, Loader2, RotateCcw, ArrowUpDown } from "lucide-react";
import { useGetSubjectsWithLevelsQuery, useDeactivateSubjectMutation, useReactivateSubjectMutation } from "@/store/services/curriculumApi";
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

export function SubjectList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSubjectLeader = user?.roles?.includes("SUBJECT_LEADER");
    const { data: subjectsData, isLoading } = useGetSubjectsWithLevelsQuery();
    const [deactivateSubject, { isLoading: isDeactivating }] = useDeactivateSubjectMutation();
    const [reactivateSubject, { isLoading: isReactivating }] = useReactivateSubjectMutation();
    const [subjectToDelete, setSubjectToDelete] = useState<number | null>(null);
    const [subjectToReactivate, setSubjectToReactivate] = useState<number | null>(null);

    const handleEdit = (id: number) => {
        navigate(`/curriculum/subjects/${id}/edit`);
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
                    variant={row.getValue("status") === "ACTIVE" ? "default" : "secondary"}
                >
                    {row.getValue("status")}
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
            id: "actions",
            cell: ({ row }) => {
                const subject = row.original;
                return (
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/curriculum/subjects/${subject.id}`)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        {isSubjectLeader && (
                            <>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(subject.id)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                {subject.status === "INACTIVE" ? (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => setSubjectToReactivate(subject.id)}
                                        title="Kích hoạt lại"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive"
                                        onClick={() => setSubjectToDelete(subject.id)}
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

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full">
            <DataTable
                columns={columns}
                data={subjectsData?.data || []}
                searchKey="name"
                searchPlaceholder="Tìm kiếm theo tên môn học..."
            />

            <AlertDialog open={!!subjectToDelete} onOpenChange={(open) => !open && setSubjectToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn hủy kích hoạt?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ chuyển trạng thái môn học sang INACTIVE. Bạn có thể kích hoạt lại sau này.
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

            <AlertDialog open={!!subjectToReactivate} onOpenChange={(open) => !open && setSubjectToReactivate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kích hoạt lại môn học?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ chuyển trạng thái môn học sang ACTIVE (hoặc DRAFT nếu chưa có PLO).
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
