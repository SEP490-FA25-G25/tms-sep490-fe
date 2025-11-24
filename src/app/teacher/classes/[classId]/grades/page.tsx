import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetClassAssessmentsQuery,
  useGetClassGradesSummaryQuery,
  useGetClassGradebookQuery,
  type TeacherAssessmentDTO,
} from "@/store/services/teacherGradeApi";
import {
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  ArrowLeft,
  Edit,
  Table2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Award } from "lucide-react";

const ASSESSMENT_KINDS: Record<string, string> = {
  QUIZ: "Quiz",
  MIDTERM: "Giữa kỳ",
  FINAL: "Cuối kỳ",
  ASSIGNMENT: "Bài tập",
  PROJECT: "Dự án",
};

export default function TeacherGradesPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "graded" | "overdue"
  >("all");

  // Debug: Log when component mounts
  console.log("TeacherGradesPage mounted", { classId });

  const {
    data: assessments,
    isLoading: isLoadingAssessments,
    error: assessmentsError,
  } = useGetClassAssessmentsQuery(
    { classId: Number(classId), filter },
    { skip: !classId }
  );

  const {
    data: summary,
    isLoading: isLoadingSummary,
    error: summaryError,
  } = useGetClassGradesSummaryQuery(Number(classId), { skip: !classId });

  const {
    data: gradebook,
    isLoading: isLoadingGradebook,
    error: gradebookError,
  } = useGetClassGradebookQuery(Number(classId), { skip: !classId });

  // Debug: Log gradebook data
  if (gradebook) {
    console.log("Gradebook loaded:", {
      classId: gradebook.classId,
      className: gradebook.className,
      studentsCount: gradebook.students.length,
      assessmentsCount: gradebook.assessments.length,
    });
  }
  if (gradebookError) {
    console.error("Gradebook error:", gradebookError);
  }

  const [selectedStudent, setSelectedStudent] = useState<{
    studentId: number;
    studentName: string;
    studentCode: string;
  } | null>(null);

  // Debug: Log errors
  if (assessmentsError) {
    console.error("Assessments error:", assessmentsError);
  }
  if (summaryError) {
    console.error("Summary error:", summaryError);
  }

  // Early return if no classId
  if (!classId) {
    return (
      <DashboardLayout
        title="Quản lý điểm"
        description="Lỗi: Không tìm thấy lớp học"
      >
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
          <p>Không tìm thấy lớp học. Vui lòng quay lại danh sách lớp.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/teacher/classes")}
            className="mt-4"
          >
            Quay lại
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  const getAssessmentStatus = (assessment: TeacherAssessmentDTO) => {
    const now = new Date();
    const scheduledDate = new Date(assessment.scheduledDate);

    if (assessment.allGraded) {
      return {
        label: "Đã chấm xong",
        variant: "default" as const,
        icon: CheckCircle,
      };
    }

    if (assessment.gradedCount > 0) {
      return { label: "Đang chấm", variant: "secondary" as const, icon: Clock };
    }

    if (scheduledDate < now) {
      return {
        label: "Quá hạn",
        variant: "destructive" as const,
        icon: AlertCircle,
      };
    }

    return { label: "Sắp tới", variant: "outline" as const, icon: Calendar };
  };

  const getAssessmentKindColor = (kind?: string) => {
    switch (kind) {
      case "QUIZ":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "MIDTERM":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "FINAL":
        return "bg-red-100 text-red-800 border-red-200";
      case "ASSIGNMENT":
        return "bg-green-100 text-green-800 border-green-200";
      case "PROJECT":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <DashboardLayout
      title="Quản lý điểm"
      description="Xem và quản lý điểm số của học sinh trong lớp học"
    >
      <div className="space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/teacher/classes")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách lớp
        </Button>

        <Tabs defaultValue="assessments" className="w-full">
          <TabsList>
            <TabsTrigger value="assessments">
              Danh sách bài kiểm tra
            </TabsTrigger>
            <TabsTrigger value="gradebook">Bảng điểm học sinh</TabsTrigger>
            <TabsTrigger value="summary">Tổng quan điểm số</TabsTrigger>
          </TabsList>

          {/* Tab 1: Assessments List */}
          <TabsContent value="assessments" className="space-y-4">
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "Tất cả" },
                { key: "upcoming", label: "Sắp tới" },
                { key: "graded", label: "Đã chấm" },
                { key: "overdue", label: "Quá hạn" },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={filter === tab.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(tab.key as typeof filter)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Assessments list */}
            {isLoadingAssessments ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : assessmentsError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
                <p>
                  Có lỗi xảy ra khi tải danh sách bài kiểm tra. Vui lòng thử lại
                  sau.
                </p>
              </div>
            ) : !assessments || assessments.length === 0 ? (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {filter === "all"
                    ? "Chưa có bài kiểm tra nào"
                    : "Không có bài kiểm tra theo bộ lọc hiện tại"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assessments.map((assessment) => {
                  const status = getAssessmentStatus(assessment);
                  const StatusIcon = status.icon;

                  return (
                    <Card
                      key={assessment.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-lg">
                                {assessment.name}
                              </CardTitle>
                              {assessment.kind && (
                                <Badge
                                  className={cn(
                                    "text-xs",
                                    getAssessmentKindColor(assessment.kind)
                                  )}
                                >
                                  {ASSESSMENT_KINDS[assessment.kind] ||
                                    assessment.kind}
                                </Badge>
                              )}
                              <Badge variant={status.variant} className="gap-1">
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                            </div>
                            {assessment.description && (
                              <p className="text-sm text-muted-foreground">
                                {assessment.description}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/teacher/assessments/${assessment.id}/scores`
                              )
                            }
                            className="gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Nhập điểm
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(assessment.scheduledDate)}</span>
                          </div>
                          {assessment.durationMinutes && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{assessment.durationMinutes} phút</span>
                            </div>
                          )}
                          {assessment.maxScore && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>Điểm tối đa: {assessment.maxScore}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>
                              {assessment.gradedCount}/
                              {assessment.totalStudents} đã nhập
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Grades Summary */}
          <TabsContent value="summary" className="space-y-6">
            {isLoadingSummary ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg" />
                  ))}
                </div>
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
            ) : summaryError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
                <p>
                  Có lỗi xảy ra khi tải tổng quan điểm số. Vui lòng thử lại sau.
                </p>
              </div>
            ) : !summary ? (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Chưa có dữ liệu điểm số
                </p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Điểm trung bình
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                        <span className="text-2xl font-bold">
                          {summary.averageScore
                            ? summary.averageScore.toFixed(1)
                            : "N/A"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Điểm cao nhất
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <span className="text-2xl font-bold">
                          {summary.highestScore
                            ? summary.highestScore.toFixed(1)
                            : "N/A"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Điểm thấp nhất
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-orange-600" />
                        <span className="text-2xl font-bold">
                          {summary.lowestScore
                            ? summary.lowestScore.toFixed(1)
                            : "N/A"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Score Distribution */}
                {summary.scoreDistribution &&
                  Object.keys(summary.scoreDistribution).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Phân bố điểm số</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(summary.scoreDistribution)
                            .sort(([a], [b]) => {
                              const aNum = parseInt(a.split("-")[0]);
                              const bNum = parseInt(b.split("-")[0]);
                              return bNum - aNum;
                            })
                            .map(([range, count]) => (
                              <div
                                key={range}
                                className="flex items-center gap-4"
                              >
                                <span className="w-20 text-sm font-medium">
                                  {range}
                                </span>
                                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{
                                      width: `${
                                        (count / summary.totalStudents) * 100
                                      }%`,
                                    }}
                                  />
                                </div>
                                <span className="w-12 text-sm text-muted-foreground text-right">
                                  {count}
                                </span>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Top Students */}
                {summary.topStudents && summary.topStudents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top 5 học sinh xuất sắc</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {summary.topStudents.map((student, index) => (
                          <div
                            key={student.studentId}
                            className="flex items-center justify-between p-3 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className="w-8 h-8 flex items-center justify-center"
                              >
                                {index + 1}
                              </Badge>
                              <div>
                                <p className="font-medium">
                                  {student.studentName}
                                </p>
                                {student.studentCode && (
                                  <p className="text-xs text-muted-foreground">
                                    {student.studentCode}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-emerald-600">
                                {student.averageScore?.toFixed(1) || "N/A"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {student.gradedCount} bài
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Bottom Students */}
                {summary.bottomStudents &&
                  summary.bottomStudents.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Học sinh cần quan tâm</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {summary.bottomStudents.map((student, index) => (
                            <div
                              key={student.studentId}
                              className="flex items-center justify-between p-3 rounded-lg border"
                            >
                              <div className="flex items-center gap-3">
                                <Badge
                                  variant="outline"
                                  className="w-8 h-8 flex items-center justify-center"
                                >
                                  {index + 1}
                                </Badge>
                                <div>
                                  <p className="font-medium">
                                    {student.studentName}
                                  </p>
                                  {student.studentCode && (
                                    <p className="text-xs text-muted-foreground">
                                      {student.studentCode}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-orange-600">
                                  {student.averageScore?.toFixed(1) || "N/A"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {student.gradedCount} bài
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </>
            )}
          </TabsContent>

          {/* Tab 2: Gradebook Matrix */}
          <TabsContent value="gradebook" className="space-y-4">
            {isLoadingGradebook ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : gradebookError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
                <p>Có lỗi xảy ra khi tải bảng điểm. Vui lòng thử lại sau.</p>
              </div>
            ) : !gradebook ? (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <Table2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Không thể tải dữ liệu bảng điểm.
                </p>
              </div>
            ) : gradebook.students.length === 0 ? (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Lớp học này chưa có học sinh nào.
                </p>
              </div>
            ) : gradebook.assessments.length === 0 ? (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Chưa có bài kiểm tra nào trong lớp học này.
                </p>
                <p className="text-xs text-muted-foreground">
                  Vui lòng tạo bài kiểm tra trước khi xem bảng điểm.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted/50 px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold">
                    Bảng điểm lớp {gradebook.className}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click vào học viên để xem chi tiết điểm số
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">
                          Học sinh
                        </TableHead>
                        <TableHead className="text-center min-w-[140px]">
                          Điểm trung bình
                        </TableHead>
                        <TableHead className="text-center min-w-[140px]">
                          Tiến độ
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gradebook.students.map((student) => {
                        const gradedCount = student.gradedCount || 0;
                        const totalAssessments =
                          student.totalAssessments ||
                          gradebook.assessments.length;
                        const progressPercentage =
                          totalAssessments > 0
                            ? (gradedCount / totalAssessments) * 100
                            : 0;

                        return (
                          <TableRow
                            key={student.studentId}
                            className="cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => {
                              setSelectedStudent({
                                studentId: student.studentId,
                                studentName: student.studentName,
                                studentCode: student.studentCode || "",
                              });
                            }}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                  {student.studentName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {student.studentName}
                                  </p>
                                  {student.studentCode && (
                                    <p className="text-sm text-muted-foreground">
                                      {student.studentCode}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {student.averageScore !== null &&
                              student.averageScore !== undefined ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Award
                                    className={cn(
                                      "h-5 w-5",
                                      getScoreColor(student.averageScore, 100)
                                    )}
                                  />
                                  <span
                                    className={cn(
                                      "text-xl font-bold",
                                      getScoreColor(student.averageScore, 100)
                                    )}
                                  >
                                    {student.averageScore.toFixed(1)}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <span className="text-muted-foreground">
                                    Chưa có điểm
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-center gap-2 text-sm">
                                  <span className="font-medium">
                                    {gradedCount}/{totalAssessments}
                                  </span>
                                  <span className="text-muted-foreground">
                                    bài đã nhập
                                  </span>
                                </div>
                                <div className="w-full max-w-[120px] mx-auto bg-muted rounded-full h-2">
                                  <div
                                    className={cn(
                                      "h-2 rounded-full transition-all",
                                      progressPercentage === 100
                                        ? "bg-emerald-600"
                                        : progressPercentage > 0
                                        ? "bg-primary"
                                        : "bg-muted"
                                    )}
                                    style={{
                                      width: `${progressPercentage}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Student Detail Dialog */}
            {selectedStudent && gradebook && (
              <Dialog
                open={!!selectedStudent}
                onOpenChange={(open) => !open && setSelectedStudent(null)}
              >
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl">
                      Chi tiết điểm - {selectedStudent.studentName}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      {selectedStudent.studentCode} • {gradebook.className}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 mt-6">
                    {/* Student Info Card */}
                    {(() => {
                      const student = gradebook.students.find(
                        (s) => s.studentId === selectedStudent.studentId
                      );
                      const avgScore = student?.averageScore;
                      const gradedCount = student?.gradedCount || 0;
                      const totalAssessments =
                        student?.totalAssessments ||
                        gradebook.assessments.length;

                      return (
                        <div className="rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold text-xl shadow-md">
                                {selectedStudent.studentName
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xl font-semibold">
                                  {selectedStudent.studentName}
                                </p>
                                {selectedStudent.studentCode && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {selectedStudent.studentCode}
                                  </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                  {gradebook.className}
                                </p>
                              </div>
                            </div>
                            {avgScore !== null && avgScore !== undefined && (
                              <div className="text-right">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                  Điểm trung bình
                                </p>
                                <div className="flex items-baseline gap-2">
                                  <Award
                                    className={cn(
                                      "h-6 w-6",
                                      getScoreColor(avgScore, 100)
                                    )}
                                  />
                                  <p
                                    className={cn(
                                      "text-4xl font-bold",
                                      getScoreColor(avgScore, 100)
                                    )}
                                  >
                                    {avgScore.toFixed(1)}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {gradedCount}/{totalAssessments} bài đã nhập
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Assessment Scores */}
                    {gradebook.assessments.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-12 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">
                          Chưa có bài kiểm tra nào.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">
                          Chi tiết điểm các bài kiểm tra
                        </h3>
                        <div className="space-y-2">
                          {gradebook.assessments.map((assessment) => {
                            const student = gradebook.students.find(
                              (s) => s.studentId === selectedStudent.studentId
                            );
                            const score =
                              student?.scores[assessment.assessmentId];
                            const maxScore = assessment.maxScore || 100;
                            const percentage =
                              score && score.isGraded && score.score !== null
                                ? (Number(score.score) / maxScore) * 100
                                : null;

                            return (
                              <div
                                key={assessment.assessmentId}
                                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <p className="font-semibold text-base">
                                      {assessment.assessmentName}
                                    </p>
                                    {assessment.kind && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {ASSESSMENT_KINDS[assessment.kind] ||
                                          assessment.kind}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    {assessment.scheduledDate && (
                                      <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>
                                          {format(
                                            parseISO(assessment.scheduledDate),
                                            "dd/MM/yyyy",
                                            { locale: vi }
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                      <FileText className="h-3.5 w-3.5" />
                                      <span>Max: {maxScore}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {score &&
                                  score.isGraded &&
                                  score.score !== null ? (
                                    <div className="flex items-center gap-3">
                                      <Award
                                        className={cn(
                                          "h-6 w-6",
                                          percentage !== null
                                            ? getScoreColor(
                                                Number(score.score),
                                                maxScore
                                              )
                                            : "text-muted-foreground"
                                        )}
                                      />
                                      <div className="text-right">
                                        <div
                                          className={cn(
                                            "text-2xl font-bold",
                                            percentage !== null
                                              ? getScoreColor(
                                                  Number(score.score),
                                                  maxScore
                                                )
                                              : ""
                                          )}
                                        >
                                          {Number(score.score).toFixed(1)}
                                          <span className="text-base font-normal text-muted-foreground ml-1">
                                            /{maxScore}
                                          </span>
                                        </div>
                                        {percentage !== null && (
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            {percentage.toFixed(1)}%
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center">
                                      <span className="text-sm text-muted-foreground">
                                        Chưa nhập
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Progress Summary */}
                    {(() => {
                      const student = gradebook.students.find(
                        (s) => s.studentId === selectedStudent.studentId
                      );
                      if (!student) return null;
                      const gradedCount = student.gradedCount || 0;
                      const totalAssessments =
                        student.totalAssessments ||
                        gradebook.assessments.length;
                      const progressPercentage =
                        totalAssessments > 0
                          ? (gradedCount / totalAssessments) * 100
                          : 0;

                      return (
                        <div className="rounded-lg border bg-muted/50 p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-sm">
                              Tiến độ nhập điểm
                            </h3>
                            <span className="text-sm font-medium">
                              {gradedCount}/{totalAssessments} bài
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                            <div
                              className={cn(
                                "h-3 rounded-full transition-all",
                                progressPercentage === 100
                                  ? "bg-emerald-600"
                                  : progressPercentage > 0
                                  ? "bg-primary"
                                  : "bg-muted"
                              )}
                              style={{
                                width: `${progressPercentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Helper function for score color
function getScoreColor(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return "text-emerald-600";
  if (percentage >= 60) return "text-yellow-600";
  if (percentage >= 40) return "text-orange-600";
  return "text-red-600";
}
