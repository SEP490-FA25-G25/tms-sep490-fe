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
  useSaveOrUpdateScoreMutation,
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
  Edit,
  Table2,
  Search,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [assessmentSearchQuery, setAssessmentSearchQuery] = useState("");
  const [assessmentPage, setAssessmentPage] = useState(0);
  const [gradebookSearchQuery, setGradebookSearchQuery] = useState("");
  const [gradebookPage, setGradebookPage] = useState(0);
  const [gradebookSortField, setGradebookSortField] = useState<
    "name" | "averageScore" | "attendanceRate"
  >("name");
  const [gradebookSortOrder, setGradebookSortOrder] = useState<"asc" | "desc">(
    "asc"
  );
  const ASSESSMENT_PAGE_SIZE = 5;
  const GRADEBOOK_PAGE_SIZE = 10;

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

  // Filter and paginate assessments
  const filteredAndPaginatedAssessments = useMemo(() => {
    if (!assessments) return [];

    let filtered = assessments;

    // Apply search filter
    if (assessmentSearchQuery.trim()) {
      const query = assessmentSearchQuery.trim().toLowerCase();
      filtered = filtered.filter((assessment) => {
        const searchFields = [
          assessment.name,
          assessment.description,
          assessment.kind,
          ASSESSMENT_KINDS[assessment.kind || ""],
        ];
        return searchFields.some(
          (field) => field && field.toString().toLowerCase().includes(query)
        );
      });
    }

    // Apply pagination
    const startIndex = assessmentPage * ASSESSMENT_PAGE_SIZE;
    const endIndex = startIndex + ASSESSMENT_PAGE_SIZE;
    return filtered.slice(startIndex, endIndex);
  }, [assessments, assessmentSearchQuery, assessmentPage]);

  const totalAssessmentPages = useMemo(() => {
    if (!assessments) return 0;
    let filtered = assessments;
    if (assessmentSearchQuery.trim()) {
      const query = assessmentSearchQuery.trim().toLowerCase();
      filtered = assessments.filter((assessment) => {
        const searchFields = [
          assessment.name,
          assessment.description,
          assessment.kind,
          ASSESSMENT_KINDS[assessment.kind || ""],
        ];
        return searchFields.some(
          (field) => field && field.toString().toLowerCase().includes(query)
        );
      });
    }
    return Math.max(1, Math.ceil(filtered.length / ASSESSMENT_PAGE_SIZE));
  }, [assessments, assessmentSearchQuery]);

  // Filter, sort and paginate gradebook students
  const filteredAndPaginatedStudents = useMemo(() => {
    if (!gradebook || !gradebook.students) return [];

    let filtered = gradebook.students;

    // Apply search filter
    if (gradebookSearchQuery.trim()) {
      const query = gradebookSearchQuery.trim().toLowerCase();
      filtered = filtered.filter((student) => {
        const searchFields = [student.studentName, student.studentCode];
        return searchFields.some(
          (field) => field && field.toString().toLowerCase().includes(query)
        );
      });
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (gradebookSortField) {
        case "name": {
          const nameA = a.studentName?.toLowerCase() || "";
          const nameB = b.studentName?.toLowerCase() || "";
          comparison = nameA.localeCompare(nameB, "vi");
          break;
        }
        case "averageScore": {
          const scoreA = a.averageScore ?? 0;
          const scoreB = b.averageScore ?? 0;
          comparison = Number(scoreA) - Number(scoreB);
          break;
        }
        case "attendanceRate": {
          const rateA = a.attendanceScore ?? 0;
          const rateB = b.attendanceScore ?? 0;
          comparison = Number(rateA) - Number(rateB);
          break;
        }
      }

      return gradebookSortOrder === "asc" ? comparison : -comparison;
    });

    // Apply pagination
    const startIndex = gradebookPage * GRADEBOOK_PAGE_SIZE;
    const endIndex = startIndex + GRADEBOOK_PAGE_SIZE;
    return filtered.slice(startIndex, endIndex);
  }, [
    gradebook,
    gradebookSearchQuery,
    gradebookPage,
    gradebookSortField,
    gradebookSortOrder,
  ]);

  const totalGradebookPages = useMemo(() => {
    if (!gradebook || !gradebook.students) return 0;
    let filtered = gradebook.students;
    if (gradebookSearchQuery.trim()) {
      const query = gradebookSearchQuery.trim().toLowerCase();
      filtered = gradebook.students.filter((student) => {
        const searchFields = [student.studentName, student.studentCode];
        return searchFields.some(
          (field) => field && field.toString().toLowerCase().includes(query)
        );
      });
    }
    return Math.max(1, Math.ceil(filtered.length / GRADEBOOK_PAGE_SIZE));
  }, [gradebook, gradebookSearchQuery]);

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

  const [scoreDrafts, setScoreDrafts] = useState<
    Record<number, { value: string; error?: string }>
  >({});
  const [saveStatus, setSaveStatus] = useState<
    Record<number, "success" | "error" | undefined>
  >({});
  const [savingAssessmentId, setSavingAssessmentId] = useState<number | null>(
    null
  );
  const [editingAssessmentId, setEditingAssessmentId] = useState<number | null>(
    null
  );
  const [saveOrUpdateScore] = useSaveOrUpdateScoreMutation();
  const activeStudent =
    selectedStudent && gradebook
      ? gradebook.students.find(
          (s) => s.studentId === selectedStudent.studentId
        )
      : undefined;

  useEffect(() => {
    if (!selectedStudent || !gradebook) {
      setScoreDrafts({});
      setEditingAssessmentId(null);
      return;
    }

    const student = gradebook.students.find(
      (s) => s.studentId === selectedStudent.studentId
    );
    if (!student) return;

    const drafts: Record<number, { value: string; error?: string }> = {};

    gradebook.assessments.forEach((assessment) => {
      const score = student.scores[assessment.assessmentId];
      drafts[assessment.assessmentId] =
        score && score.score !== null && score.score !== undefined
          ? { value: String(score.score) }
          : { value: "" };
    });

    setScoreDrafts(drafts);
    setSaveStatus({});
    setEditingAssessmentId(null);
  }, [gradebook, selectedStudent]);

  const handleStartEditing = (assessmentId: number) => {
    setEditingAssessmentId(assessmentId);
  };

  const handleCancelEditing = (assessmentId: number) => {
    if (!activeStudent) {
      setEditingAssessmentId(null);
      return;
    }
    const existingScore = activeStudent.scores[assessmentId];
    setScoreDrafts((prev) => ({
      ...prev,
      [assessmentId]:
        existingScore &&
        existingScore.score !== null &&
        existingScore.score !== undefined
          ? { value: String(existingScore.score) }
          : { value: "" },
    }));
    setSaveStatus((prev) => ({ ...prev, [assessmentId]: undefined }));
    setEditingAssessmentId(null);
  };

  const handleScoreChange = (assessmentId: number, value: string) => {
    setScoreDrafts((prev) => ({
      ...prev,
      [assessmentId]: { value, error: undefined },
    }));
    setSaveStatus((prev) => ({
      ...prev,
      [assessmentId]: undefined,
    }));
  };

  const handleSaveScore = async (
    assessmentId: number,
    maxScore: number = 100
  ) => {
    if (!selectedStudent) return;
    const currentDraft = scoreDrafts[assessmentId];
    const rawValue = currentDraft?.value ?? "";

    if (rawValue.trim() === "") {
      setScoreDrafts((prev) => ({
        ...prev,
        [assessmentId]: {
          value: "",
          error: "Vui lòng nhập điểm hợp lệ",
        },
      }));
      return;
    }

    const numericValue = Number(rawValue);
    if (Number.isNaN(numericValue)) {
      setScoreDrafts((prev) => ({
        ...prev,
        [assessmentId]: {
          value: rawValue,
          error: "Điểm phải là số",
        },
      }));
      return;
    }

    if (numericValue < 0 || numericValue > maxScore) {
      setScoreDrafts((prev) => ({
        ...prev,
        [assessmentId]: {
          value: rawValue,
          error: `Điểm phải nằm trong khoảng 0 - ${maxScore}`,
        },
      }));
      return;
    }

    setSavingAssessmentId(assessmentId);
    setSaveStatus((prev) => ({ ...prev, [assessmentId]: undefined }));
    try {
      await saveOrUpdateScore({
        assessmentId,
        scoreInput: {
          studentId: selectedStudent.studentId,
          score: numericValue,
        },
      }).unwrap();

      setScoreDrafts((prev) => ({
        ...prev,
        [assessmentId]: { value: numericValue.toString(), error: undefined },
      }));
      setSaveStatus((prev) => ({ ...prev, [assessmentId]: "success" }));
      if (editingAssessmentId === assessmentId) {
        setEditingAssessmentId(null);
      }
      await refetchGradebook();
    } catch (error) {
      console.error("Failed to save score", error);
      setScoreDrafts((prev) => ({
        ...prev,
        [assessmentId]: {
          value: rawValue,
          error: "Không thể lưu điểm. Vui lòng thử lại.",
        },
      }));
      setSaveStatus((prev) => ({ ...prev, [assessmentId]: "error" }));
    } finally {
      setSavingAssessmentId(null);
    }
  };

  const renderAssessmentRows = () => {
    if (!gradebook || !activeStudent) {
      return null;
    }

    return gradebook.assessments.map((assessment) => {
      const score = activeStudent.scores[assessment.assessmentId];
      const maxScore = assessment.maxScore || 100;
      const percentage =
        score && score.isGraded && score.score !== null
          ? (Number(score.score) / maxScore) * 100
          : null;
      const draft = scoreDrafts[assessment.assessmentId] || {
        value: "",
        error: undefined,
      };
      const inputValue = draft.value ?? "";
      const isSavingThisScore = savingAssessmentId === assessment.assessmentId;
      const saveState = saveStatus[assessment.assessmentId];
      const isEditing = editingAssessmentId === assessment.assessmentId;

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
                <Badge variant="outline" className="text-xs">
                  {ASSESSMENT_KINDS[assessment.kind] || assessment.kind}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {assessment.scheduledDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {format(parseISO(assessment.scheduledDate), "dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span>Max: {maxScore}</span>
              </div>
            </div>
          </div>
          <div className="w-full max-w-[280px] text-right space-y-2">
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex items-center justify-end gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    max={maxScore}
                    value={inputValue}
                    onChange={(event) =>
                      handleScoreChange(
                        assessment.assessmentId,
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        if (inputValue.trim() !== "" && !isSavingThisScore) {
                          handleSaveScore(assessment.assessmentId, maxScore);
                        }
                      } else if (event.key === "Escape") {
                        event.preventDefault();
                        handleCancelEditing(assessment.assessmentId);
                      }
                    }}
                    className="w-28 text-right"
                    placeholder="Nhập điểm"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() =>
                      handleSaveScore(assessment.assessmentId, maxScore)
                    }
                    disabled={isSavingThisScore || inputValue.trim() === ""}
                  >
                    {isSavingThisScore ? "Đang lưu..." : "Lưu điểm"}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancelEditing(assessment.assessmentId)}
                >
                  Hủy
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  "flex items-center gap-3 justify-end cursor-pointer hover:opacity-80 transition-opacity",
                  score && score.isGraded && score.score !== null
                    ? ""
                    : "text-muted-foreground"
                )}
                onClick={() => handleStartEditing(assessment.assessmentId)}
              >
                {score && score.isGraded && score.score !== null ? (
                  <>
                    <Award
                      className={cn(
                        "h-6 w-6",
                        percentage !== null
                          ? getScoreColor(Number(score.score), maxScore)
                          : "text-muted-foreground"
                      )}
                    />
                    <div className="text-right">
                      <div
                        className={cn(
                          "text-2xl font-bold",
                          percentage !== null
                            ? getScoreColor(Number(score.score), maxScore)
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
                  </>
                ) : (
                  <div className="text-sm">Chưa nhập - Click để nhập</div>
                )}
              </div>
            )}

            {draft.error && (
              <p className="text-xs text-destructive">{draft.error}</p>
            )}
            {saveState === "success" && !draft.error && !isEditing && (
              <p className="text-xs text-emerald-600">Đã lưu điểm</p>
            )}
            {saveState === "error" && !draft.error && (
              <p className="text-xs text-destructive">
                Lưu điểm thất bại, vui lòng thử lại.
              </p>
            )}
          </div>
        </div>
      );
    });
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
            {/* Search and Filter */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên, mô tả, loại bài kiểm tra..."
                  value={assessmentSearchQuery}
                  onChange={(e) => {
                    setAssessmentSearchQuery(e.target.value);
                    setAssessmentPage(0);
                  }}
                  className="pl-10"
                />
              </div>
              <Select
                value={filter}
                onValueChange={(value) => {
                  setFilter(value as typeof filter);
                  setAssessmentPage(0);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="upcoming">Sắp tới</SelectItem>
                  <SelectItem value="graded">Đã chấm</SelectItem>
                  <SelectItem value="overdue">Quá hạn</SelectItem>
                </SelectContent>
              </Select>
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
              <>
                <div className="space-y-4">
                  {filteredAndPaginatedAssessments.map((assessment) => {
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
                                <Badge
                                  variant={status.variant}
                                  className="gap-1"
                                >
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
                              <span>
                                {formatDate(assessment.scheduledDate)}
                              </span>
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

                {/* Pagination */}
                {totalAssessmentPages > 1 && (
                  <div className="flex items-center justify-center pt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setAssessmentPage((prev) => Math.max(0, prev - 1))
                            }
                            className={
                              assessmentPage === 0
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        {Array.from(
                          { length: totalAssessmentPages },
                          (_, i) => i + 1
                        ).map((page) => {
                          const currentPage = assessmentPage + 1; // Convert 0-based to 1-based
                          if (
                            page === 1 ||
                            page === totalAssessmentPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setAssessmentPage(page - 1)}
                                  isActive={assessmentPage === page - 1}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <span className="px-2">...</span>
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setAssessmentPage((prev) =>
                                Math.min(totalAssessmentPages - 1, prev + 1)
                              )
                            }
                            className={
                              assessmentPage === totalAssessmentPages - 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
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
            {/* Search and Sort */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên học sinh, mã học sinh..."
                  value={gradebookSearchQuery}
                  onChange={(e) => {
                    setGradebookSearchQuery(e.target.value);
                    setGradebookPage(0);
                  }}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={gradebookSortField}
                  onValueChange={(value) => {
                    setGradebookSortField(value as typeof gradebookSortField);
                    setGradebookPage(0);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sắp xếp theo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Tên</SelectItem>
                    <SelectItem value="averageScore">
                      Điểm trung bình
                    </SelectItem>
                    <SelectItem value="attendanceRate">Chuyên cần</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setGradebookSortOrder(
                      gradebookSortOrder === "asc" ? "desc" : "asc"
                    );
                    setGradebookPage(0);
                  }}
                  className="gap-2"
                >
                  {gradebookSortOrder === "asc" ? (
                    <>
                      <ArrowUp className="h-4 w-4" />
                      Tăng dần
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-4 w-4" />
                      Giảm dần
                    </>
                  )}
                </Button>
              </div>
            </div>
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
                        <TableHead className="text-center min-w-[180px]">
                          Chuyên cần
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndPaginatedStudents.map((student) => {
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
                              {student.attendanceFinalized &&
                              student.attendanceScore !== undefined &&
                              student.totalSessions !== undefined ? (
                                <div className="text-center space-y-1">
                                  <p className="text-lg font-semibold text-primary">
                                    {student.attendanceScore.toFixed(1)}%
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {student.attendedSessions ?? 0}/
                                    {student.totalSessions ?? 0} buổi
                                  </p>
                                </div>
                              ) : (
                                <div className="text-center text-sm text-muted-foreground">
                                  Chưa có dữ liệu
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalGradebookPages > 1 && (
                  <div className="flex items-center justify-center pt-4 border-t">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setGradebookPage((prev) => Math.max(0, prev - 1))
                            }
                            className={
                              gradebookPage === 0
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        {Array.from(
                          { length: totalGradebookPages },
                          (_, i) => i + 1
                        ).map((page) => {
                          const currentPage = gradebookPage + 1; // Convert 0-based to 1-based
                          if (
                            page === 1 ||
                            page === totalGradebookPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setGradebookPage(page - 1)}
                                  isActive={gradebookPage === page - 1}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <span className="px-2">...</span>
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setGradebookPage((prev) =>
                                Math.min(totalGradebookPages - 1, prev + 1)
                              )
                            }
                            className={
                              gradebookPage === totalGradebookPages - 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            )}

            {/* Student Detail Dialog */}
            {selectedStudent && gradebook && (
              <Dialog
                open={!!selectedStudent}
                onOpenChange={(open) => {
                  if (!open) {
                    setSelectedStudent(null);
                    setEditingAssessmentId(null);
                  }
                }}
              >
                <DialogContent className="max-w-5xl sm:max-w-5xl max-h-[85vh] overflow-y-auto">
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
                      const avgScore = activeStudent?.averageScore;
                      const gradedCount = activeStudent?.gradedCount || 0;
                      const totalAssessments =
                        activeStudent?.totalAssessments ||
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

                    {/* Attendance */}
                    {activeStudent?.attendanceFinalized ? (
                      <div className="rounded-lg border bg-muted/40 p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">
                              Điểm chuyên cần
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {activeStudent.attendedSessions ?? 0}/
                              {activeStudent.totalSessions ?? 0} buổi đã tham
                              gia
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-4xl font-bold text-primary">
                              {activeStudent.attendanceScore !== undefined
                                ? activeStudent.attendanceScore.toFixed(1)
                                : "--"}
                              <span className="text-base font-normal text-muted-foreground ml-1">
                                %
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Tỷ lệ chuyên cần
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                        Điểm chuyên cần sẽ được tự động cập nhật khi lớp học
                        hoàn thành.
                      </div>
                    )}

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
                          {renderAssessmentRows()}
                        </div>
                      </div>
                    )}
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
