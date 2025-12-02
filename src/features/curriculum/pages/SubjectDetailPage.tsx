import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowLeft, Loader2, Edit, GripVertical, Ban, CheckCircle } from "lucide-react";
import {
    useGetSubjectQuery,
    useUpdateLevelSortOrderMutation,
    useDeactivateSubjectMutation,
    useReactivateSubjectMutation,
    type LevelDTO
} from "@/store/services/curriculumApi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SortableRowProps {
    level: LevelDTO;
    onViewDetail: (id: number) => void;
}

function SortableRow({ level, onViewDetail }: SortableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: level.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        position: isDragging ? "relative" as const : undefined,
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className={isDragging ? "bg-muted/50" : ""}
        >
            <TableCell className="w-[50px]">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab hover:bg-muted p-1 rounded-md w-fit"
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
            </TableCell>
            <TableCell className="font-medium">{level.code}</TableCell>
            <TableCell>{level.name}</TableCell>
            <TableCell className="text-right">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetail(level.id)}
                >
                    Chi tiết
                </Button>
            </TableCell>
        </TableRow>
    );
}

import { useAuth } from "@/contexts/AuthContext";

export default function SubjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSubjectLeader = user?.roles?.includes("SUBJECT_LEADER");
    const { data: subjectData, isLoading, refetch } = useGetSubjectQuery(Number(id), {
        skip: !id || isNaN(Number(id))
    });
    const [updateSortOrder] = useUpdateLevelSortOrderMutation();
    const [deactivateSubject, { isLoading: isDeactivating }] = useDeactivateSubjectMutation();
    const [reactivateSubject, { isLoading: isReactivating }] = useReactivateSubjectMutation();

    const [levels, setLevels] = useState<LevelDTO[]>([]);
    const subject = subjectData?.data;

    useEffect(() => {
        if (subject?.levels) {
            setLevels([...subject.levels].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
        }
    }, [subject]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = levels.findIndex((item) => item.id === active.id);
            const newIndex = levels.findIndex((item) => item.id === over.id);

            const newLevels = arrayMove(levels, oldIndex, newIndex);
            setLevels(newLevels); // Optimistic update

            try {
                await updateSortOrder({
                    subjectId: Number(id),
                    levelIds: newLevels.map(l => l.id)
                }).unwrap();
                toast.success("Đã cập nhật thứ tự cấp độ");
            } catch (error) {
                console.error("Cập nhật thứ tự thất bại", error);
                toast.error("Cập nhật thứ tự thất bại");
                refetch(); // Revert on failure
            }
        }
    };

    const handleDeactivate = async () => {
        try {
            await deactivateSubject(Number(id)).unwrap();
            toast.success("Đã ngừng hoạt động môn học");
            refetch();
        } catch (error) {
            console.error("Ngừng hoạt động môn học thất bại:", error);
            toast.error("Ngừng hoạt động thất bại");
        }
    };

    const handleReactivate = async () => {
        try {
            await reactivateSubject(Number(id)).unwrap();
            toast.success("Đã kích hoạt lại môn học");
            refetch();
        } catch (error) {
            console.error("Kích hoạt lại môn học thất bại:", error);
            toast.error("Kích hoạt lại thất bại");
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout
                title="Chi tiết Môn học"
                description="Đang tải thông tin môn học..."
            >
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!subject) {
        return (
            <DashboardLayout
                title="Chi tiết Môn học"
                description="Không tìm thấy thông tin môn học"
            >
                <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Môn học không tồn tại hoặc đã bị xóa.</p>
                    <Button onClick={() => navigate("/curriculum")}>Quay lại danh sách</Button>
                </div>
            </DashboardLayout>
        );
    }

    const isActive = subject.status === 'ACTIVE';

    return (
        <DashboardLayout
            title={`Chi tiết: ${subject.name}`}
            description={`Mã môn học: ${subject.code}`}
        >
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Button variant="outline" onClick={() => navigate("/curriculum")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Button>

                    <div className="flex gap-2">
                        {isSubjectLeader && (
                            <>
                                {isActive ? (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" disabled={isDeactivating}>
                                                {isDeactivating ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Ban className="mr-2 h-4 w-4" />
                                                )}
                                                Ngừng hoạt động
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Xác nhận ngừng hoạt động</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Bạn có chắc chắn muốn ngừng hoạt động môn học này?
                                                    Môn học sẽ không thể được sử dụng để tạo lớp học mới.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeactivate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                    Ngừng hoạt động
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="text-green-600 border-green-600 hover:bg-green-50"
                                        onClick={handleReactivate}
                                        disabled={isReactivating}
                                    >
                                        {isReactivating ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                        )}
                                        Kích hoạt lại
                                    </Button>
                                )}
                                <Button onClick={() => navigate(`/curriculum/subjects/${id}/edit`)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Chỉnh sửa
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Basic Info Card */}
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle>Thông tin chung</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Mã môn học</span>
                                <p className="font-medium">{subject.code}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Tên môn học</span>
                                <p>{subject.name}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Trạng thái</span>
                                <div className="mt-1">
                                    <Badge variant={isActive ? 'default' : 'secondary'}>
                                        {isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Mô tả</span>
                                <p className="text-sm text-gray-600 mt-1">{subject.description || "Chưa có mô tả"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="md:col-span-2 space-y-6">
                        {/* PLOs Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Chuẩn đầu ra chương trình (PLOs)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Mã</TableHead>
                                            <TableHead>Mô tả</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subject.plos && subject.plos.length > 0 ? (
                                            subject.plos.map((plo, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{plo.code}</TableCell>
                                                    <TableCell>{plo.description}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center text-muted-foreground">
                                                    Chưa có PLO nào được thiết lập.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Levels Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Danh sách Cấp độ</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]"></TableHead>
                                                <TableHead className="w-[100px]">Mã</TableHead>
                                                <TableHead>Tên cấp độ</TableHead>
                                                <TableHead className="text-right">Hành động</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <SortableContext
                                                items={levels.map((l) => l.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {levels.length > 0 ? (
                                                    levels.map((level) => (
                                                        <SortableRow
                                                            key={level.id}
                                                            level={level}
                                                            onViewDetail={(id) => navigate(`/curriculum/levels/${id}`)}
                                                        />
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                            Chưa có cấp độ nào thuộc môn học này.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </SortableContext>
                                        </TableBody>
                                    </Table>
                                </DndContext>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
