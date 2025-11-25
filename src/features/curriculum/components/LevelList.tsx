import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, Loader2, Eye, RotateCcw } from "lucide-react";
import { useGetSubjectsWithLevelsQuery, useGetLevelsQuery, useDeactivateLevelMutation, useReactivateLevelMutation } from "@/store/services/curriculumApi";
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

export function LevelList() {
    const navigate = useNavigate();
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(undefined);
    const [levelToDelete, setLevelToDelete] = useState<number | null>(null);
    const [levelToReactivate, setLevelToReactivate] = useState<number | null>(null);

    // Fetch subjects for filter dropdown
    const { data: subjectsData } = useGetSubjectsWithLevelsQuery();

    // Fetch levels filtered by selected subject
    const { data: levelsData, isLoading } = useGetLevelsQuery(selectedSubjectId);
    const [deactivateLevel, { isLoading: isDeactivating }] = useDeactivateLevelMutation();
    const [reactivateLevel, { isLoading: isReactivating }] = useReactivateLevelMutation();

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

    return (
        <div className="space-y-4">
            {/* Filter Section */}
            <div className="flex items-center gap-4">
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
            </div>

            {/* Table Section */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã cấp độ</TableHead>
                            <TableHead>Tên cấp độ</TableHead>
                            <TableHead>Môn học</TableHead>
                            <TableHead>Thời lượng (Giờ)</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : levels.length > 0 ? (
                            levels.map((level) => (
                                <TableRow key={level.id}>
                                    <TableCell className="font-medium">{level.code}</TableCell>
                                    <TableCell>{level.name}</TableCell>
                                    <TableCell>
                                        {level.subjectName} <span className="text-muted-foreground text-xs">({level.subjectCode})</span>
                                    </TableCell>
                                    <TableCell>{level.durationHours}</TableCell>
                                    <TableCell>
                                        <Badge variant={level.status === "ACTIVE" ? "default" : "secondary"}>
                                            {level.status || "ACTIVE"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => navigate(`/curriculum/levels/${level.id}`)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => navigate(`/curriculum/levels/${level.id}/edit`)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            {level.status === "INACTIVE" ? (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => setLevelToReactivate(level.id)}
                                                    title="Kích hoạt lại"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => setLevelToDelete(level.id)}
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
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Chưa có cấp độ nào.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!levelToDelete} onOpenChange={(open) => !open && setLevelToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn hủy kích hoạt?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ chuyển trạng thái cấp độ sang INACTIVE. Bạn có thể kích hoạt lại sau này.
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

            <AlertDialog open={!!levelToReactivate} onOpenChange={(open) => !open && setLevelToReactivate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kích hoạt lại cấp độ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ chuyển trạng thái cấp độ sang ACTIVE.
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
