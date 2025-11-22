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
  useSaveOrUpdateScoreMutation,
  type TeacherAssessmentDTO,
  type GradebookDTO,
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
  Save,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

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
  const [filter, setFilter] = useState<"all" | "upcoming" | "graded" | "overdue">("all");

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
    refetch: refetchGradebook,
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

  const [saveScore] = useSaveOrUpdateScoreMutation();
  const [editingCell, setEditingCell] = useState<{
    studentId: number;
    assessmentId: number;
  } | null>(null);
  const [editingScoreValue, setEditingScoreValue] = useState<string>("");

  const handleSaveScore = async (
    studentId: number,
    assessmentId: number,
    scoreValue: number,
    maxScore: number
  ) => {
    if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > maxScore) {
      toast.error(`Điểm số không hợp lệ. Vui lòng nhập giá trị từ 0 đến ${maxScore}.`);
      return;
    }

    try {
      await saveScore({
        assessmentId,
        scoreInput: {
          studentId,
          score: scoreValue,
        },
      }).unwrap();
      toast.success("Đã lưu điểm thành công!");
      setEditingCell(null);
      setEditingScoreValue("");
      refetchGradebook();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || "Có lỗi xảy ra khi lưu điểm.";
      toast.error(errorMessage);
      console.error("Failed to save score:", error);
    }
  };

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
      <DashboardLayout title="Quản lý điểm" description="Lỗi: Không tìm thấy lớp học">
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
      return { label: "Đã chấm xong", variant: "default" as const, icon: CheckCircle };
    }
    
    if (assessment.gradedCount > 0) {
      return { label: "Đang chấm", variant: "secondary" as const, icon: Clock };
    }
    
    if (scheduledDate < now) {
      return { label: "Quá hạn", variant: "destructive" as const, icon: AlertCircle };
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
              <TabsTrigger value="assessments">Danh sách bài kiểm tra</TabsTrigger>
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
                  <p>Có lỗi xảy ra khi tải danh sách bài kiểm tra. Vui lòng thử lại sau.</p>
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
                      <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <CardTitle className="text-lg">{assessment.name}</CardTitle>
                                {assessment.kind && (
                                  <Badge className={cn("text-xs", getAssessmentKindColor(assessment.kind))}>
                                    {ASSESSMENT_KINDS[assessment.kind] || assessment.kind}
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
                              onClick={() => navigate(`/teacher/assessments/${assessment.id}/scores`)}
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Chấm điểm
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
                                {assessment.gradedCount}/{assessment.totalStudents} đã chấm
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
                  <p>Có lỗi xảy ra khi tải tổng quan điểm số. Vui lòng thử lại sau.</p>
                </div>
              ) : !summary ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Chưa có dữ liệu điểm số</p>
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
                  {summary.scoreDistribution && Object.keys(summary.scoreDistribution).length > 0 && (
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
                              <div key={range} className="flex items-center gap-4">
                                <span className="w-20 text-sm font-medium">{range}</span>
                                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{
                                      width: `${(count / summary.totalStudents) * 100}%`,
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
                                <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                                  {index + 1}
                                </Badge>
                                <div>
                                  <p className="font-medium">{student.studentName}</p>
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
                  {summary.bottomStudents && summary.bottomStudents.length > 0 && (
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
                                <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                                  {index + 1}
                                </Badge>
                                <div>
                                  <p className="font-medium">{student.studentName}</p>
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bảng điểm lớp {gradebook.className}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="sticky left-0 z-10 bg-background min-w-[150px]">
                              Học sinh
                            </TableHead>
                            {gradebook.assessments.map((assessment) => (
                              <TableHead key={assessment.assessmentId} className="min-w-[120px] text-center">
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs font-medium">{assessment.assessmentName}</span>
                                  {assessment.maxScore && (
                                    <span className="text-xs text-muted-foreground">
                                      (Max: {assessment.maxScore})
                                    </span>
                                  )}
                                </div>
                              </TableHead>
                            ))}
                            <TableHead className="text-center min-w-[100px]">Điểm TB</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {gradebook.students.map((student) => {
                            const isEditing = editingCell?.studentId === student.studentId;
                            return (
                              <TableRow key={student.studentId}>
                                <TableCell className="sticky left-0 z-10 bg-background font-medium">
                                  <div>
                                    <p>{student.studentName}</p>
                                    <p className="text-xs text-muted-foreground">{student.studentCode}</p>
                                  </div>
                                </TableCell>
                                {gradebook.assessments.map((assessment) => {
                                  const score = student.scores[assessment.assessmentId];
                                  const isEditingThisCell =
                                    editingCell?.studentId === student.studentId &&
                                    editingCell?.assessmentId === assessment.assessmentId;
                                  const maxScore = assessment.maxScore || 100;

                                  return (
                                    <TableCell key={assessment.assessmentId} className="text-center">
                                      {isEditingThisCell ? (
                                        <div className="flex items-center gap-1 justify-center">
                                          <Input
                                            type="number"
                                            min="0"
                                            max={maxScore}
                                            step="0.01"
                                            value={editingScoreValue}
                                            onChange={(e) => setEditingScoreValue(e.target.value)}
                                            className="w-20 h-8 text-center"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                handleSaveScore(
                                                  student.studentId,
                                                  assessment.assessmentId,
                                                  Number(editingScoreValue),
                                                  maxScore
                                                );
                                              } else if (e.key === "Escape") {
                                                setEditingCell(null);
                                                setEditingScoreValue("");
                                              }
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                            onClick={() =>
                                              handleSaveScore(
                                                student.studentId,
                                                assessment.assessmentId,
                                                Number(editingScoreValue),
                                                maxScore
                                              )
                                            }
                                          >
                                            <Save className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                            onClick={() => {
                                              setEditingCell(null);
                                              setEditingScoreValue("");
                                            }}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <div
                                          className={cn(
                                            "cursor-pointer hover:bg-muted rounded p-1",
                                            score?.isGraded
                                              ? score.score && score.maxScore
                                                ? getScoreColor(score.score, score.maxScore)
                                                : "text-muted-foreground"
                                              : "text-muted-foreground"
                                          )}
                                          onClick={() => {
                                            setEditingCell({
                                              studentId: student.studentId,
                                              assessmentId: assessment.assessmentId,
                                            });
                                            setEditingScoreValue(
                                              score?.score?.toString() || ""
                                            );
                                          }}
                                        >
                                          {score?.isGraded && score.score !== null && score.score !== undefined ? (
                                            <div>
                                              <span className="font-semibold">
                                                {score.score.toFixed(1)}
                                              </span>
                                              {score.maxScore && (
                                                <span className="text-xs text-muted-foreground">
                                                  /{score.maxScore}
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-xs">—</span>
                                          )}
                                        </div>
                                      )}
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="text-center font-semibold">
                                  {student.averageScore !== null && student.averageScore !== undefined ? (
                                    <span className={cn(getScoreColor(student.averageScore, 100))}>
                                      {student.averageScore.toFixed(1)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
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

