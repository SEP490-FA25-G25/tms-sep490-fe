import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  useGetAttendanceClassesQuery,
  type AttendanceClassDTO,
} from "@/store/services/attendanceApi";
import {
  useGetClassGradebookQuery,
  type GradebookDTO,
} from "@/store/services/teacherGradeApi";
import {
  Search,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Award,
  AlertCircle,
  BookOpen,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseISO } from "date-fns";

// Calculate trend from scores - defined outside component to avoid closure issues
function calculateTrend(
  gradebook: GradebookDTO,
  studentId: number
): "up" | "down" | "stable" | "none" {
  try {
    const student = gradebook.students.find((s) => s.studentId === studentId);
    if (!student || !student.scores) return "none";

    // Get assessments sorted by scheduledDate
    const assessmentsWithScores = gradebook.assessments
      .map((assessment) => {
        const score = student.scores[assessment.assessmentId];
        if (
          !score ||
          !score.isGraded ||
          score.score === null ||
          score.score === undefined ||
          !assessment.scheduledDate
        ) {
          return null;
        }
        return {
          assessment,
          score:
            typeof score.score === "number" ? score.score : Number(score.score),
          scheduledDate: assessment.scheduledDate,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        try {
          const dateA = parseISO(a.scheduledDate).getTime();
          const dateB = parseISO(b.scheduledDate).getTime();
          return dateA - dateB;
        } catch {
          return 0;
        }
      });

    if (assessmentsWithScores.length < 2) return "none";

    // Compare first half vs second half
    const midPoint = Math.floor(assessmentsWithScores.length / 2);
    const firstHalf = assessmentsWithScores.slice(0, midPoint);
    const secondHalf = assessmentsWithScores.slice(midPoint);

    const firstAvg =
      firstHalf.reduce((sum, item) => sum + item.score, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, item) => sum + item.score, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    if (Math.abs(diff) < 2) return "stable";
    return diff > 0 ? "up" : "down";
  } catch (error) {
    console.error("Error calculating trend:", error);
    return "none";
  }
}

interface StudentProgress {
  studentId: number;
  studentCode: string;
  studentName: string;
  classId: number;
  className: string;
  classCode: string;
  averageScore: number | null;
  gradedCount: number;
  totalAssessments: number;
  trend: "up" | "down" | "stable" | "none";
}

// Component to fetch gradebook for a single class - moved outside to avoid render issues
function ClassGradebookFetcher({
  classItem,
  onDataReady,
}: {
  classItem: AttendanceClassDTO;
  onDataReady: (data: StudentProgress[]) => void;
}) {
  const { data: gradebook } = useGetClassGradebookQuery(classItem.id, {
    skip: !classItem.id,
  });

  useEffect(() => {
    if (!gradebook) return;

    try {
      const students: StudentProgress[] = gradebook.students.map((student) => {
        const trend = calculateTrend(gradebook, student.studentId);
        return {
          studentId: student.studentId,
          studentCode: student.studentCode || "",
          studentName: student.studentName,
          classId: gradebook.classId,
          className: gradebook.className,
          classCode: gradebook.classCode || "",
          averageScore: student.averageScore
            ? Number(student.averageScore)
            : null,
          gradedCount: student.gradedCount || 0,
          totalAssessments:
            student.totalAssessments || gradebook.assessments.length,
          trend,
        };
      });

      onDataReady(students);
    } catch (error) {
      console.error("Error processing gradebook:", error);
    }
  }, [gradebook, onDataReady]);

  return null;
}

export default function TeacherStudentsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "needsAttention" | "excellent">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"averageScore" | "name" | "gradedCount">(
    "averageScore"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Get all classes
  const {
    data: classesResponse,
    isLoading: isLoadingClasses,
    error: classesError,
    refetch: refetchClasses,
  } = useGetAttendanceClassesQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  // Handle different response structures
  const classes = useMemo(() => {
    if (Array.isArray(classesResponse)) {
      return classesResponse;
    }
    if (Array.isArray(classesResponse?.data)) {
      return classesResponse.data;
    }
    return [];
  }, [classesResponse]);

  // Aggregate student progress from all classes
  const [aggregatedStudents, setAggregatedStudents] = useState<
    StudentProgress[]
  >([]);

  const studentProgressList = useMemo(() => {
    return aggregatedStudents;
  }, [aggregatedStudents]);

  // Memoize callback to avoid infinite loops
  const handleDataReady = useCallback((students: StudentProgress[]) => {
    setAggregatedStudents((prev) => {
      const newMap = new Map<string, StudentProgress>();
      // Add existing students
      prev.forEach((s) => {
        newMap.set(`${s.studentId}-${s.classId}`, s);
      });
      // Add new students from this class
      students.forEach((s) => {
        newMap.set(`${s.studentId}-${s.classId}`, s);
      });
      return Array.from(newMap.values());
    });
  }, []);

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = studentProgressList;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.studentName.toLowerCase().includes(query) ||
          s.studentCode.toLowerCase().includes(query) ||
          s.className.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filter === "needsAttention") {
      filtered = filtered.filter(
        (s) =>
          s.averageScore === null || s.averageScore < 60 || s.gradedCount === 0
      );
    } else if (filter === "excellent") {
      filtered = filtered.filter(
        (s) => s.averageScore !== null && s.averageScore >= 80
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "averageScore") {
        const aScore = a.averageScore ?? 0;
        const bScore = b.averageScore ?? 0;
        comparison = aScore - bScore;
      } else if (sortBy === "name") {
        comparison = a.studentName.localeCompare(b.studentName);
      } else if (sortBy === "gradedCount") {
        comparison = a.gradedCount - b.gradedCount;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [studentProgressList, searchQuery, filter, sortBy, sortOrder]);

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-rose-600";
  };

  const getTrendIcon = (trend: StudentProgress["trend"]) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-rose-600" />;
      case "stable":
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      title="Tiến độ học sinh"
      description="Xem tiến độ và điểm số của tất cả học sinh trong các lớp bạn đang dạy"
    >
      <div className="space-y-6">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, mã học sinh hoặc lớp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Tất cả" },
              { key: "needsAttention", label: "Cần quan tâm" },
              { key: "excellent", label: "Xuất sắc" },
            ].map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.key as typeof filter)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {isLoadingClasses && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Error state */}
        {classesError && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Không thể tải dữ liệu
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Đã có lỗi xảy ra khi tải danh sách lớp học. Vui lòng thử lại.
            </p>
            <Button size="sm" onClick={() => refetchClasses()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Thử lại
            </Button>
          </div>
        )}

        {/* Empty state - no classes */}
        {!isLoadingClasses && !classesError && classes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Chưa có lớp học</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Bạn chưa được phân công dạy lớp nào. Vui lòng liên hệ quản trị
              viên.
            </p>
          </div>
        )}

        {/* Fetch gradebooks for all classes */}
        {!isLoadingClasses && !classesError && classes.length > 0 && (
          <>
            {classes.map((classItem) => (
              <ClassGradebookFetcher
                key={classItem.id}
                classItem={classItem}
                onDataReady={handleDataReady}
              />
            ))}
          </>
        )}

        {/* Empty state - has classes but no students */}
        {!isLoadingClasses &&
          !classesError &&
          classes.length > 0 &&
          filteredAndSortedStudents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || filter !== "all"
                  ? "Không tìm thấy học sinh"
                  : "Chưa có học sinh"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                {searchQuery || filter !== "all"
                  ? "Không có học sinh nào phù hợp với bộ lọc hiện tại."
                  : "Các lớp học của bạn chưa có học sinh hoặc chưa có dữ liệu điểm số."}
              </p>
            </div>
          )}

        {/* Students list */}
        {!isLoadingClasses &&
          !classesError &&
          filteredAndSortedStudents.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              {/* Table header */}
              <div className="bg-muted/50 sticky top-0 z-10">
                <div className="grid grid-cols-12 gap-4 p-4 text-sm font-semibold text-muted-foreground border-b">
                  <div className="col-span-3">Học sinh</div>
                  <div className="col-span-2">Lớp học</div>
                  <div
                    className="col-span-2 cursor-pointer hover:text-foreground flex items-center gap-1"
                    onClick={() => handleSort("averageScore")}
                  >
                    Điểm TB
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                  <div
                    className="col-span-2 cursor-pointer hover:text-foreground flex items-center gap-1"
                    onClick={() => handleSort("gradedCount")}
                  >
                    Tiến độ
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                  <div className="col-span-2">Xu hướng</div>
                  <div className="col-span-1">Thao tác</div>
                </div>
              </div>

              {/* Students rows */}
              <div className="divide-y">
                {filteredAndSortedStudents.map((student) => (
                  <div
                    key={`${student.studentId}-${student.classId}`}
                    className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="col-span-3">
                      <div>
                        <p className="text-base font-medium">
                          {student.studentName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {student.studentCode}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {student.className}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.classCode}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        {student.averageScore !== null ? (
                          <>
                            <Award
                              className={cn(
                                "h-4 w-4",
                                getScoreColor(student.averageScore)
                              )}
                            />
                            <span
                              className={cn(
                                "text-base font-semibold",
                                getScoreColor(student.averageScore)
                              )}
                            >
                              {student.averageScore.toFixed(1)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">
                            {student.gradedCount}/{student.totalAssessments}
                          </span>
                          <span className="text-muted-foreground">bài</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{
                              width: `${
                                student.totalAssessments > 0
                                  ? (student.gradedCount /
                                      student.totalAssessments) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center">
                        {getTrendIcon(student.trend)}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(`/teacher/classes/${student.classId}/grades`)
                        }
                        aria-label="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    </DashboardLayout>
  );
}
