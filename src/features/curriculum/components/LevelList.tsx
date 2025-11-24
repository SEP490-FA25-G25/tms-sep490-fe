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
import { Edit, Trash2, Loader2 } from "lucide-react";
import { useGetSubjectsWithLevelsQuery, useGetLevelsQuery } from "@/store/services/curriculumApi";

export function LevelList() {
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(undefined);

    // Fetch subjects for filter dropdown
    const { data: subjectsData } = useGetSubjectsWithLevelsQuery();

    // Fetch levels filtered by selected subject
    const { data: levelsData, isLoading } = useGetLevelsQuery(selectedSubjectId);

    const levels = levelsData?.data || [];

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
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
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
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Chưa có cấp độ nào.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
