"use client";

import { useGetSubjectPLOMatrixQuery } from "@/store/services/curriculumApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface SubjectPLOMatrixProps {
    curriculumId: number;
}

export function SubjectPLOMatrix({ curriculumId }: SubjectPLOMatrixProps) {
    const { data: matrixData, isLoading, error } = useGetSubjectPLOMatrixQuery(curriculumId);
    const matrix = matrixData?.data;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !matrix) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    Không thể tải ma trận Subject-PLO. Vui lòng thử lại.
                </CardContent>
            </Card>
        );
    }

    if (matrix.subjects.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Ma trận Môn học - PLO</CardTitle>
                    <CardDescription>
                        Mapping giữa các môn học với chuẩn đầu ra chương trình (PLO)
                    </CardDescription>
                </CardHeader>
                <CardContent className="py-8 text-center text-muted-foreground">
                    Chưa có môn học nào trong chương trình này.
                </CardContent>
            </Card>
        );
    }

    if (matrix.plos.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Ma trận Môn học - PLO</CardTitle>
                    <CardDescription>
                        Mapping giữa các môn học với chuẩn đầu ra chương trình (PLO)
                    </CardDescription>
                </CardHeader>
                <CardContent className="py-8 text-center text-muted-foreground">
                    Chưa có PLO nào được thiết lập cho chương trình này.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ma trận Môn học - PLO</CardTitle>
                <CardDescription>
                    Mapping giữa các môn học với chuẩn đầu ra chương trình (PLO)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <TooltipProvider>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">
                                        Môn học
                                    </TableHead>
                                    {matrix.plos.map((plo) => (
                                        <TableHead
                                            key={plo.id}
                                            className="text-center min-w-[60px] px-2"
                                        >
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help font-semibold text-orange-600">
                                                        {plo.code}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-[300px]">
                                                    <p className="font-semibold">{plo.code}</p>
                                                    <p className="text-sm">{plo.description}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {matrix.subjects.map((subject) => (
                                    <TableRow key={subject.subjectId}>
                                        <TableCell className="sticky left-0 bg-background z-10 font-medium">
                                            <div>
                                                <span className="text-primary">{subject.subjectCode}</span>
                                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                    {subject.subjectName}
                                                </p>
                                            </div>
                                        </TableCell>
                                        {subject.ploMappings.map((hasMapped, ploIndex) => (
                                            <TableCell key={ploIndex} className="text-center px-2">
                                                {hasMapped ? (
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TooltipProvider>
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Có CLO mapping với PLO</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-muted-foreground/30" />
                        <span>Chưa có mapping</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
