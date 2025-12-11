import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loader2, GripVertical, BookOpen, Layers, Target, CheckCircle2 } from "lucide-react";
import {
    useGetCurriculumQuery,
    useUpdateLevelSortOrderMutation,
    type LevelDTO
} from "@/store/services/curriculumApi";
import { getStatusLabel, getStatusColor } from "@/utils/statusMapping";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { SubjectPLOMatrix } from "@/components/curriculum/SubjectPLOMatrix";


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
            <TableCell>
                <Badge variant={getStatusColor(level.status)}>
                    {getStatusLabel(level.status)}
                </Badge>
            </TableCell>
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

export default function SubjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: subjectData, isLoading, refetch } = useGetCurriculumQuery(Number(id), {
        skip: !id || isNaN(Number(id))
    });
    const [updateSortOrder] = useUpdateLevelSortOrderMutation();

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
            setLevels(newLevels);

            try {
                await updateSortOrder({
                    curriculumId: subject?.curriculumId ?? Number(id),
                    levelIds: newLevels.map(l => l.id)
                }).unwrap();
                toast.success("Đã cập nhật thứ tự cấp độ");
            } catch (error) {
                console.error("Cập nhật thứ tự thất bại", error);
                toast.error("Cập nhật thứ tự thất bại");
                refetch();
            }
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout
                title="Chi tiết Khung chương trình"
                description="Đang tải thông tin khung chương trình..."
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
                title="Chi tiết Khung chương trình"
                description="Không tìm thấy thông tin khung chương trình"
            >
                <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Khung chương trình không tồn tại hoặc đã bị xóa.</p>
                    <Button onClick={() => navigate("/curriculum")}>Quay lại danh sách</Button>
                </div>
            </DashboardLayout>
        );
    }

    const sortedPlos = subject.plos ? [...subject.plos].sort((a, b) => {
        const numA = parseInt(a.code.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.code.replace(/\D/g, '')) || 0;
        return numA - numB;
    }) : [];

    return (
        <DashboardLayout
            title={subject.name}
            description={`Mã chương trình: ${subject.code} `}
        >
            <div className="space-y-6">
                {/* Header Stats */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Mã chương trình</CardTitle>
                            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", "bg-slate-100 dark:bg-slate-800/50")}>
                                <BookOpen className={cn("h-4 w-4", "text-slate-600 dark:text-slate-400")} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{subject.code}</div>
                            <p className="text-xs text-muted-foreground">Mã định danh khung chương trình</p>
                        </CardContent>
                    </Card>
                    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Số cấp độ</CardTitle>
                            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", "bg-blue-50 dark:bg-blue-950/30")}>
                                <Layers className={cn("h-4 w-4", "text-blue-600 dark:text-blue-400")} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{levels.length}</div>
                            <p className="text-xs text-muted-foreground">Cấp độ thuộc chương trình</p>
                        </CardContent>
                    </Card>
                    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Số PLOs</CardTitle>
                            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", "bg-orange-50 dark:bg-orange-950/30")}>
                                <Target className={cn("h-4 w-4", "text-orange-600 dark:text-orange-400")} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{sortedPlos.length}</div>
                            <p className="text-xs text-muted-foreground">Chuẩn đầu ra chương trình</p>
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
                                <Badge variant={getStatusColor(subject.status)}>
                                    {getStatusLabel(subject.status)}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Trạng thái hiện tại</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:w-[650px]">
                        <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                        <TabsTrigger value="plos">Chuẩn đầu ra (PLOs)</TabsTrigger>
                        <TabsTrigger value="levels">Danh sách cấp độ</TabsTrigger>
                        <TabsTrigger value="matrix">Ma trận Subject-PLO</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Mô tả chương trình</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed">
                                    {subject.description || "Chưa có mô tả cho khung chương trình này."}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Thông tin chi tiết</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Mã chương trình</span>
                                    <span className="font-medium">{subject.code}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Tên chương trình</span>
                                    <span className="font-medium">{subject.name}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Trạng thái</span>
                                    <Badge variant={getStatusColor(subject.status)}>
                                        {getStatusLabel(subject.status)}
                                    </Badge>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Ngày tạo</span>
                                    <span className="font-medium">
                                        {subject.createdAt ? format(new Date(subject.createdAt), "dd/MM/yyyy HH:mm") : "-"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Ngày cập nhật</span>
                                    <span className="font-medium">
                                        {subject.updatedAt ? format(new Date(subject.updatedAt), "dd/MM/yyyy HH:mm") : "-"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PLOs Tab */}
                    <TabsContent value="plos" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Chuẩn đầu ra chương trình (PLOs)</CardTitle>
                                <CardDescription>
                                    Các mục tiêu học tập mà sinh viên cần đạt được sau khi hoàn thành khung chương trình.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Mã PLO</TableHead>
                                            <TableHead>Mô tả chi tiết</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedPlos.length > 0 ? (
                                            sortedPlos.map((plo, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-semibold">
                                                            {plo.code}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{plo.description}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                                                    Chưa có PLO nào được thiết lập.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Levels Tab */}
                    <TabsContent value="levels" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Danh sách Cấp độ</CardTitle>
                                <CardDescription>
                                    Kéo thả để sắp xếp lại thứ tự các cấp độ.
                                </CardDescription>
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
                                                <TableHead className="w-[120px]">Mã cấp độ</TableHead>
                                                <TableHead>Tên cấp độ</TableHead>
                                                <TableHead className="w-[120px]">Trạng thái</TableHead>
                                                <TableHead className="text-right w-[100px]">Hành động</TableHead>
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
                                                            onViewDetail={(id) => navigate(`/ curriculum / levels / ${id} `)}
                                                        />
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                            Chưa có cấp độ nào thuộc chương trình này.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </SortableContext>
                                        </TableBody>
                                    </Table>
                                </DndContext>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Subject-PLO Matrix Tab */}
                    <TabsContent value="matrix" className="mt-6">
                        <SubjectPLOMatrix curriculumId={Number(id)} />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
