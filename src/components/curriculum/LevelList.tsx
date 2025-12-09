import { useState } from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, Loader2, Eye, RotateCcw, MoreHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { useGetCurriculumsWithLevelsQuery, useGetLevelsQuery, useDeactivateLevelMutation, useReactivateLevelMutation, useDeleteLevelMutation, type LevelDTO } from "@/store/services/curriculumApi";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { getStatusLabel, getStatusColor } from "@/utils/statusMapping";
import { LevelDialog } from "./LevelDialog";
import { Plus } from "lucide-react";

export function LevelList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSubjectLeader = user?.roles?.includes("SUBJECT_LEADER");
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(undefined);
    const [levelToDelete, setLevelToDelete] = useState<number | null>(null);
    const [levelToReactivate, setLevelToReactivate] = useState<number | null>(null);
    const [levelToDeletePermanently, setLevelToDeletePermanently] = useState<number | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<LevelDTO | null>(null);

    const handleCreate = () => {
        setSelectedLevel(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (level: LevelDTO) => {
        setSelectedLevel(level);
        setIsDialogOpen(true);
    };

    // Fetch subjects for filter dropdown
    const { data: subjectsData } = useGetCurriculumsWithLevelsQuery();

    // Fetch levels filtered by selected subject
    const { data: levelsData } = useGetLevelsQuery(selectedSubjectId);
    const [deactivateLevel, { isLoading: isDeactivating }] = useDeactivateLevelMutation();
    const [reactivateLevel, { isLoading: isReactivating }] = useReactivateLevelMutation();
    const [deleteLevel, { isLoading: isDeleting }] = useDeleteLevelMutation();

    const levels = levelsData?.data || [];

    const handleDeactivate = async () => {
        if (levelToDelete) {
            try {
                await deactivateLevel(levelToDelete).unwrap();
                toast.success("Đã hủy kích hoạt cấp độ thành công");
                setLevelToDelete(null);
            } catch (error) {
                console.error("Failed to deactivate level:", error);
                toast.error("Hủy kích hoạt thất bại. Vui lòng thử lại.");
            }
        }
    };

    const handleReactivate = async () => {
        if (levelToReactivate) {
            try {
                await reactivateLevel(levelToReactivate).unwrap();
                toast.success("Đã kích hoạt lại cấp độ thành công");
                setLevelToReactivate(null);
            } catch (error) {
                console.error("Failed to reactivate level:", error);
                toast.error("Kích hoạt lại thất bại. Vui lòng thử lại.");
            }
        }
    };

    const handleDelete = async () => {
        if (levelToDeletePermanently) {
            try {
                await deleteLevel(levelToDeletePermanently).unwrap();
                toast.success("Đã xóa cấp độ thành công");
                setLevelToDeletePermanently(null);
            } catch (error: unknown) {
                console.error("Failed to delete level:", error);
                const apiError = error as { data?: { message?: string } };
                const errorMessage = apiError.data?.message || "Xóa thất bại. Vui lòng thử lại.";
                toast.error(errorMessage);
            }
        }
    };

    const columns: ColumnDef<LevelDTO>[] = [
        {
            accessorKey: "code",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Mã cấp độ
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
                        Tên cấp độ
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="pl-4">{row.getValue("name")}</div>,
        },
        {
            accessorKey: "subjectName",
            header: "Khung chương trình",
            cell: ({ row }) => (
                <div>
                    {row.original.subjectName} <span className="text-muted-foreground text-xs">({row.original.subjectCode})</span>
                </div>
            ),
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Ngày tạo
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="pl-4">{row.getValue("createdAt") ? format(new Date(row.getValue("createdAt")), "dd/MM/yyyy") : "-"}</div>,
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
            cell: ({ row }) => {
                const date = row.getValue("updatedAt");
                return <div className="pl-4">{date ? format(new Date(date as string), "dd/MM/yyyy") : "-"}</div>;
            },
        },
        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => (
                <Badge variant={getStatusColor(row.getValue("status"))}>
                    {getStatusLabel(row.getValue("status"))}
                </Badge>
            ),
        },
        {
            id: "actions",
            header: "Hành động",
            cell: ({ row }) => {
                const level = row.original;
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
                                    onClick={() => navigate(`/curriculum/levels/${level.id}`)}
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
                                            onClick={() => handleEdit(level)}
                                        >
                                            <Edit className="h-4 w-4" />
                                            Chỉnh sửa
                                        </Button>
                                        {level.status === "INACTIVE" ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start gap-2 h-9 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                onClick={() => setLevelToReactivate(level.id)}
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                Kích hoạt lại
                                            </Button>
                                        ) : level.status === "ACTIVE" ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start gap-2 h-9 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                onClick={() => setLevelToDelete(level.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Hủy kích hoạt
                                            </Button>
                                        ) : null}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start gap-2 h-9 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                            onClick={() => setLevelToDeletePermanently(level.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Xóa
                                        </Button>
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
            {/* Filter Section */}
            <div className="flex items-center justify-between gap-4">
                <div className="w-[250px]">
                    <Select
                        value={selectedSubjectId?.toString() || "all"}
                        onValueChange={(value) => setSelectedSubjectId(value === "all" ? undefined : Number(value))}
                    >
                        <SelectTrigger>
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
                {isSubjectLeader && (
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tạo Cấp độ
                    </Button>
                )}
            </div>

            {/* Table Section */}
            <DataTable
                columns={columns}
                data={[...(levels || [])].sort((a, b) =>
                    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                )}
                searchKey="name"
                searchPlaceholder="Tìm kiếm theo tên cấp độ..."
            />

            <LevelDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                level={selectedLevel ? { ...selectedLevel, subjectId: selectedLevel.subjectId || 0 } : null}
                subjectId={selectedSubjectId}
            />

            <AlertDialog open={!!levelToDelete} onOpenChange={(open) => !open && setLevelToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn hủy kích hoạt?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ chuyển trạng thái cấp độ sang Ngừng hoạt động. Bạn có thể kích hoạt lại sau này.
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

            <AlertDialog open={!!levelToReactivate} onOpenChange={(open) => !open && setLevelToReactivate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kích hoạt lại cấp độ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ chuyển trạng thái cấp độ sang Hoạt động.
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

            <AlertDialog open={!!levelToDeletePermanently} onOpenChange={(open) => !open && setLevelToDeletePermanently(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ xóa vĩnh viễn cấp độ. Không thể hoàn tác.
                            <br />
                            Lưu ý: Chỉ có thể xóa cấp độ nếu chưa có khóa học nào.
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
