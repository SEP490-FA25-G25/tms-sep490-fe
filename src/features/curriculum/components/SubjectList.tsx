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
import { Edit, Eye, Trash2, Loader2 } from "lucide-react";
import { useGetSubjectsWithLevelsQuery } from "@/store/services/curriculumApi";
import { format } from "date-fns";

export function SubjectList() {
    const { data: subjectsData, isLoading } = useGetSubjectsWithLevelsQuery();

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Mã môn</TableHead>
                        <TableHead>Tên môn học</TableHead>
                        <TableHead>Số cấp độ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {subjectsData?.data?.map((subject) => (
                        <TableRow key={subject.id}>
                            <TableCell className="font-medium">{subject.code}</TableCell>
                            <TableCell>{subject.name}</TableCell>
                            <TableCell>{subject.levels?.length || 0}</TableCell>
                            <TableCell>
                                <Badge
                                    variant={subject.status === "ACTIVE" ? "default" : "secondary"}
                                >
                                    {subject.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {subject.createdAt ? format(new Date(subject.createdAt), "dd/MM/yyyy") : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {(!subjectsData?.data || subjectsData.data.length === 0) && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                Chưa có môn học nào.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
