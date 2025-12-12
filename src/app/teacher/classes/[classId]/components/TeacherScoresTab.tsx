"use client";

import { useMemo, useState } from "react";
import {
  useGetClassGradebookQuery,
  type GradebookStudentDTO,
  type GradebookAssessmentDTO,
} from "@/store/services/teacherGradeApi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertTriangle, BookOpen, Search, Users, ClipboardList } from "lucide-react";

interface TeacherScoresTabProps {
  classId: number;
}

export function TeacherScoresTab({ classId }: TeacherScoresTabProps) {
  const { data: gradebook, isLoading, error } = useGetClassGradebookQuery(
    classId,
    { skip: !classId }
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null
  );

  const students: GradebookStudentDTO[] = gradebook?.students ?? [];
  const assessments: GradebookAssessmentDTO[] = gradebook?.assessments ?? [];

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.studentName?.toLowerCase().includes(q) ||
        s.studentCode?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const selectedStudent =
    students.find((s) => s.studentId === selectedStudentId) ??
    (filteredStudents.length > 0 ? filteredStudents[0] : null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Không thể tải dữ liệu điểm. Vui lòng thử lại.
        </AlertDescription>
      </Alert>
    );
  }

  if (!gradebook) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Không có dữ liệu điểm cho lớp này.</AlertDescription>
      </Alert>
    );
  }

  const getScoreForAssessment = (
    student: GradebookStudentDTO,
    assessmentId: number
  ) => {
    return student.scores.find((s) => s.assessmentId === assessmentId);
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const pct = (score / maxScore) * 100;
    if (pct >= 80) return "text-emerald-600 font-semibold";
    if (pct >= 60) return "text-amber-600 font-medium";
    if (pct >= 40) return "text-orange-600";
    return "text-rose-600";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,_2fr)_3fr] xl:grid-cols-[minmax(360px,_1fr)_2fr] h-[calc(100vh-280px)] overflow-hidden border rounded-lg">
      {/* Left: students list */}
      <div className="border-r flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {filteredStudents.length} học viên
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, mã..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <ScrollArea className="h-full w-full">
          <div className="p-3 space-y-2">
            {filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  {searchQuery
                    ? "Không tìm thấy học viên"
                    : "Chưa có học viên nào"}
                </p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <Card
                  key={student.studentId}
                  className={cn(
                    "p-3 cursor-pointer transition-all hover:bg-muted/50",
                    selectedStudent?.studentId === student.studentId
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:shadow-sm"
                  )}
                  onClick={() => setSelectedStudentId(student.studentId)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-semibold">
                      {student.studentName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight truncate">
                        {student.studentName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {student.studentCode}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: scores detail */}
      <div className="flex flex-col h-full overflow-hidden bg-background">
        {selectedStudent ? (
          <ScrollArea className="flex-1">
            <div className="px-4 lg:px-6 py-4 lg:py-5 space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Điểm thành phần
                </h3>
                <p className="text-xs text-muted-foreground">
                  {assessments.length} bài kiểm tra
                </p>
              </div>

              {/* Attendance Score Card */}
              <Card className="bg-muted/30 border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                        <ClipboardList className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          Điểm chuyên cần
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {selectedStudent.attendanceScore != null ? (
                        <span
                          className={cn(
                            getScoreColor(
                              Number(selectedStudent.attendanceScore),
                              100
                            ),
                            "text-2xl font-bold"
                          )}
                        >
                          {Math.round(selectedStudent.attendanceScore * 10) / 10}/100
                        </span>
                      ) : selectedStudent.attendanceRate != null ? (
                        <div>
                          <span className="text-2xl font-bold text-muted-foreground">
                            {Math.round(selectedStudent.attendanceRate * 100)}%
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Tỷ lệ đi học
                          </p>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-sm">
                          Chưa có
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {assessments.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg bg-muted/30">
                  <BookOpen className="h-10 w-10 mx-auto mb-2 text-muted-foreground/60" />
                  Chưa có bài kiểm tra nào
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Bài kiểm tra</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Thời lượng
                        </TableHead>
                        <TableHead className="text-center">Điểm</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assessments.map((assessment) => {
                        const studentScore = getScoreForAssessment(
                          selectedStudent,
                          assessment.id
                        );
                        const maxScore = assessment.maxScore || 100;
                        return (
                          <TableRow key={assessment.id}>
                            <TableCell className="font-medium">
                              {assessment.name}
                            </TableCell>
                            <TableCell>
                              {assessment.scheduledDate
                                ? new Date(
                                    assessment.scheduledDate
                                  ).toLocaleDateString("vi-VN")
                                : "—"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                              {assessment.durationMinutes
                                ? `${assessment.durationMinutes} phút`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              {studentScore && studentScore.score != null ? (
                                <span
                                  className={cn(
                                    getScoreColor(
                                      Number(studentScore.score),
                                      maxScore
                                    )
                                  )}
                                >
                                  {studentScore.score}/{maxScore}
                                </span>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Chưa chấm
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                Chọn học viên để xem điểm
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Nhấn vào học viên ở danh sách bên trái
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

