import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TeacherRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetAssessmentScoresQuery,
  useSaveOrUpdateScoreMutation,
  useBatchSaveOrUpdateScoresMutation,
  type TeacherStudentScoreDTO,
  type ScoreInputDTO,
} from "@/store/services/teacherGradeApi";
import { CheckCircle, XCircle, FileText, Users, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export default function AssessmentScoresPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [editingScore, setEditingScore] = useState<{
    score: number | null;
    feedback: string;
  }>({ score: null, feedback: "" });
  const [batchMode, setBatchMode] = useState(false);
  const [batchScores, setBatchScores] = useState<
    Map<number, { score: number; feedback: string }>
  >(new Map());

  const {
    data: scores,
    isLoading,
    error,
    refetch,
  } = useGetAssessmentScoresQuery(Number(assessmentId), {
    skip: !assessmentId,
  });

  const [saveScore] = useSaveOrUpdateScoreMutation();
  const [batchSaveScores, { isLoading: isBatchSaving }] =
    useBatchSaveOrUpdateScoresMutation();

  // Get assessment info from first score (if available)
  const assessmentInfo =
    scores && scores.length > 0
      ? {
          maxScore: scores[0].maxScore || 100,
          assessmentName: "Bài kiểm tra", // This should come from API, but for now use placeholder
        }
      : { maxScore: 100, assessmentName: "Bài kiểm tra" };

  const handleEditClick = (student: TeacherStudentScoreDTO) => {
    setEditingStudentId(student.studentId);
    setEditingScore({
      score:
        student.score !== null && student.score !== undefined
          ? Number(student.score)
          : null,
      feedback: student.feedback || "",
    });
  };

  const handleSaveScore = async () => {
    if (!editingStudentId || !assessmentId) return;

    if (editingScore.score === null) {
      toast.error("Vui lòng nhập điểm");
      return;
    }

    try {
      await saveScore({
        assessmentId: Number(assessmentId),
        scoreInput: {
          studentId: editingStudentId,
          score: editingScore.score,
          feedback: editingScore.feedback || undefined,
        },
      }).unwrap();

      toast.success("Đã lưu điểm thành công");
      setEditingStudentId(null);
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Có lỗi xảy ra khi lưu điểm");
    }
  };

  const handleBatchSave = async () => {
    if (!assessmentId) return;

    try {
      const scoreInputs: ScoreInputDTO[] = Array.from(
        batchScores.entries()
      ).map(([studentId, data]) => ({
        studentId,
        score: data.score,
        feedback: data.feedback || undefined,
      }));

      await batchSaveScores({
        assessmentId: Number(assessmentId),
        batchInput: { scores: scoreInputs },
      }).unwrap();

      toast.success(
        `Đã lưu điểm cho ${scoreInputs.length} học sinh thành công`
      );
      setBatchMode(false);
      setBatchScores(new Map());
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Có lỗi xảy ra khi lưu điểm");
    }
  };

  const updateBatchScore = (
    studentId: number,
    field: "score" | "feedback",
    value: string | number
  ) => {
    const newBatchScores = new Map(batchScores);
    const current = newBatchScores.get(studentId) || { score: 0, feedback: "" };
    newBatchScores.set(studentId, { ...current, [field]: value });
    setBatchScores(newBatchScores);
  };

  const getScoreColor = (score?: number, maxScore?: number) => {
    if (!score || !maxScore) return "text-muted-foreground";
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "text-emerald-600";
    if (percentage >= 60) return "text-yellow-600";
    if (percentage >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return format(parseISO(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  const gradedCount = scores?.filter((s) => s.isGraded).length || 0;
  const totalCount = scores?.length || 0;

  return (
    <TeacherRoute>
      <DashboardLayout
        title="Nhập điểm"
        description="Nhập và chỉnh sửa điểm số cho học sinh"
      >
        <div className="space-y-6">
          {/* Assessment Info */}
          <Card>
            <CardHeader>
              <CardTitle>{assessmentInfo.assessmentName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Điểm tối đa: {assessmentInfo.maxScore}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Tổng số học sinh: {totalCount}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>Đã nhập: {gradedCount}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <XCircle className="h-4 w-4" />
                  <span>Chưa nhập: {totalCount - gradedCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scores Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
              <p>Có lỗi xảy ra khi tải danh sách điểm. Vui lòng thử lại sau.</p>
            </div>
          ) : !scores || scores.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Chưa có học sinh nào
              </p>
            </div>
          ) : (
            <>
              {batchMode && (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Chế độ nhập hàng loạt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Đã chọn {batchScores.size} học sinh. Nhập điểm và nhấn
                        "Lưu tất cả".
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setBatchMode(false);
                            setBatchScores(new Map());
                          }}
                        >
                          Hủy
                        </Button>
                        <Button
                          onClick={handleBatchSave}
                          disabled={isBatchSaving}
                        >
                          {isBatchSaving && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Lưu tất cả
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="border-r w-16 text-center">
                            STT
                          </TableHead>
                          <TableHead className="border-r">Học sinh</TableHead>
                          <TableHead className="border-r">Điểm</TableHead>
                          <TableHead className="border-r">Phần trăm</TableHead>
                          <TableHead className="border-r">Nhận xét</TableHead>
                          <TableHead className="border-r">Người nhập</TableHead>
                          <TableHead>Ngày nhập</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scores.map((student, index) => {
                          const batchData = batchScores.get(student.studentId);
                          const isEditing =
                            editingStudentId === student.studentId;

                          return (
                            <TableRow key={student.studentId}>
                              <TableCell className="border-r w-16 text-center">
                                <span className="text-sm text-muted-foreground">
                                  {index + 1}
                                </span>
                              </TableCell>
                              <TableCell className="border-r">
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
                              </TableCell>
                              <TableCell className="border-r">
                                {batchMode ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    max={assessmentInfo.maxScore}
                                    step="0.01"
                                    value={batchData?.score || 0}
                                    onChange={(e) =>
                                      updateBatchScore(
                                        student.studentId,
                                        "score",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-24"
                                  />
                                ) : isEditing ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    max={assessmentInfo.maxScore}
                                    step="0.01"
                                    value={
                                      editingScore.score === null
                                        ? ""
                                        : editingScore.score
                                    }
                                    onChange={(e) =>
                                      setEditingScore({
                                        ...editingScore,
                                        score:
                                          e.target.value === ""
                                            ? null
                                            : parseFloat(e.target.value) ||
                                              null,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        if (editingScore.score !== null) {
                                          handleSaveScore();
                                        }
                                      } else if (e.key === "Escape") {
                                        e.preventDefault();
                                        setEditingStudentId(null);
                                      }
                                    }}
                                    className="w-24"
                                    autoFocus
                                    placeholder="Nhập điểm"
                                  />
                                ) : (
                                  <span
                                    className={cn(
                                      "font-semibold cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors",
                                      getScoreColor(
                                        student.score,
                                        student.maxScore
                                      )
                                    )}
                                    onClick={() => handleEditClick(student)}
                                  >
                                    {student.score !== null &&
                                    student.score !== undefined
                                      ? `${student.score}/${
                                          student.maxScore ||
                                          assessmentInfo.maxScore
                                        }`
                                      : "—"}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="border-r">
                                {student.scorePercentage !== null &&
                                student.scorePercentage !== undefined ? (
                                  <Badge variant="outline">
                                    {student.scorePercentage.toFixed(1)}%
                                  </Badge>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell className="max-w-xs border-r">
                                {batchMode ? (
                                  <Textarea
                                    value={batchData?.feedback || ""}
                                    onChange={(e) =>
                                      updateBatchScore(
                                        student.studentId,
                                        "feedback",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Nhận xét..."
                                    className="min-h-[60px]"
                                  />
                                ) : isEditing ? (
                                  <Textarea
                                    value={editingScore.feedback}
                                    onChange={(e) =>
                                      setEditingScore({
                                        ...editingScore,
                                        feedback: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        if (editingScore.score !== null) {
                                          handleSaveScore();
                                        }
                                      } else if (e.key === "Escape") {
                                        e.preventDefault();
                                        setEditingStudentId(null);
                                      }
                                    }}
                                    placeholder="Nhận xét... (Enter để lưu, Shift+Enter để xuống dòng)"
                                    className="min-h-[60px]"
                                  />
                                ) : (
                                  <p
                                    className="text-sm text-muted-foreground truncate cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                    onClick={() => handleEditClick(student)}
                                  >
                                    {student.feedback || "—"}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell className="border-r">
                                <p className="text-sm text-muted-foreground">
                                  {student.gradedBy || "—"}
                                </p>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(student.gradedAt)}
                                </p>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DashboardLayout>
    </TeacherRoute>
  );
}
