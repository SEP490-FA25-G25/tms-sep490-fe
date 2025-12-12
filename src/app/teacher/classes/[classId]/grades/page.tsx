import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useGetClassAssessmentsQuery,
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
  Users,
  Edit,
  Table2,
  Search,
  BookOpen,
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
  const ASSESSMENT_PAGE_SIZE = 5;

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

  // Filter gradebook students (no pagination for 2-column layout)
  const filteredStudents = useMemo(() => {
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

    return filtered;
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
      const score = student.scores.find(
        (s) => s.assessmentId === assessment.id
      );
      drafts[assessment.id] =
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
    const existingScore = activeStudent.scores.find(
      (s) => s.assessmentId === assessmentId
    );
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

  // Debug: Log errors
  if (assessmentsError) {
    console.error("Assessments error:", assessmentsError);
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
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "ASSIGNMENT":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
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
                        value={gradebookSearchQuery}
                        onChange={(e) => {
                          setGradebookSearchQuery(e.target.value);
                        }}
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
                            {gradebookSearchQuery
                              ? "Không tìm thấy học viên"
                              : "Chưa có học viên nào"}
                          </p>
                        </div>
                      ) : (
                        filteredStudents.map((student) => {
                          const isSelected = selectedStudent?.studentId === student.studentId;
                          return (
                            <Card
                              key={student.studentId}
                              className={cn(
                                "p-3 cursor-pointer transition-all hover:bg-muted/50",
                                isSelected
                                  ? "ring-2 ring-primary bg-primary/5"
                                  : "hover:shadow-sm"
                              )}
                              onClick={() => {
                                setSelectedStudent({
                                  studentId: student.studentId,
                                  studentName: student.studentName,
                                  studentCode: student.studentCode || "",
                                });
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-semibold">
                                  {student.studentName.charAt(0).toUpperCase()}
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
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Right: scores detail */}
                <div className="flex flex-col h-full overflow-hidden bg-background">
                  {selectedStudent && activeStudent ? (
                    <ScrollArea className="flex-1">
                      <div className="px-4 lg:px-6 py-4 lg:py-5 space-y-5">
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            Điểm thành phần
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {gradebook.assessments.length} bài kiểm tra
                          </p>
                        </div>

                        {gradebook.assessments.length === 0 ? (
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
                                {gradebook.assessments.map((assessment) => {
                                  const studentScore = activeStudent.scores.find(
                                    (s) => s.assessmentId === assessment.id
                                  );
                                  const maxScore = assessment.maxScore || 100;
                                  const scoreValue = studentScore?.score;
                                  const draft = scoreDrafts[assessment.id] ?? {
                                    value:
                                      scoreValue !== null &&
                                      scoreValue !== undefined
                                        ? String(scoreValue)
                                        : "",
                                  };
                                  const inputValue = draft.value ?? "";
                                  const isEditing =
                                    editingAssessmentId === assessment.id;
                                  const isSaving =
                                    savingAssessmentId === assessment.id;
                                  return (
                                    <TableRow key={assessment.id}>
                                      <TableCell className="font-medium">
                                        {assessment.name}
                                      </TableCell>
                                      <TableCell>
                                        {assessment.scheduledDate
                                          ? format(parseISO(assessment.scheduledDate), "dd/MM/yyyy", {
                                              locale: vi,
                                            })
                                          : "—"}
                                      </TableCell>
                                      <TableCell className="hidden md:table-cell text-muted-foreground">
                                        {assessment.durationMinutes
                                          ? `${assessment.durationMinutes} phút`
                                          : "—"}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {isEditing ? (
                                          <div className="flex items-center justify-end gap-2">
                                            <Input
                                              type="number"
                                              step="0.1"
                                              min={0}
                                              max={maxScore}
                                              value={inputValue}
                                              onChange={(e) =>
                                                handleScoreChange(
                                                  assessment.id,
                                                  e.target.value
                                                )
                                              }
                                              className="w-24 text-right h-9"
                                              autoFocus
                                            />
                                            <Button
                                              size="sm"
                                              onClick={() =>
                                                handleSaveScore(
                                                  assessment.id,
                                                  maxScore
                                                )
                                              }
                                              disabled={
                                                isSaving || inputValue.trim() === ""
                                              }
                                            >
                                              {isSaving ? "Đang lưu" : "Lưu"}
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                handleCancelEditing(assessment.id)
                                              }
                                            >
                                              Hủy
                                            </Button>
                                          </div>
                                        ) : (
                                          <button
                                            className="inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 hover:bg-muted transition-colors"
                                            onClick={() => handleStartEditing(assessment.id)}
                                          >
                                            {scoreValue != null ? (
                                              <span
                                                className={cn(
                                                  getScoreColor(
                                                    Number(scoreValue),
                                                    maxScore
                                                  ),
                                                  "font-semibold"
                                                )}
                                              >
                                                {scoreValue}/{maxScore}
                                              </span>
                                            ) : (
                                              <Badge variant="outline" className="text-xs">
                                                Chưa chấm
                                              </Badge>
                                            )}
                                          </button>
                                        )}
                                        {draft.error && (
                                          <p className="text-xs text-destructive mt-1">
                                            {draft.error}
                                          </p>
                                        )}
                                        {saveStatus[assessment.id] === "success" &&
                                          !draft.error &&
                                          !isEditing && (
                                            <p className="text-[11px] text-emerald-600 mt-1">
                                              Đã lưu điểm
                                            </p>
                                          )}
                                        {saveStatus[assessment.id] === "error" &&
                                          !draft.error && (
                                            <p className="text-[11px] text-destructive mt-1">
                                              Lưu điểm thất bại
                                            </p>
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
                          Nhấn vào học viên ở danh sách bên trái để xem và nhập điểm
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
  return "text-rose-600";
}
