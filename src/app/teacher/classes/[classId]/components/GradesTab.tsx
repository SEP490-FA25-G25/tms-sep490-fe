import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetClassGradesSummaryQuery,
  useGetClassGradebookQuery,
} from "@/store/services/teacherGradeApi";
import { BarChart3, Users, Award } from "lucide-react";

interface GradesTabProps {
  classId: number;
}

const GradesTab: React.FC<GradesTabProps> = ({ classId }) => {
  const navigate = useNavigate();

  const {
    data: summary,
    isLoading: isLoadingSummary,
    error: summaryError,
  } = useGetClassGradesSummaryQuery(classId, { skip: !classId });

  const {
    data: gradebook,
    isLoading: isLoadingGradebook,
    error: gradebookError,
  } = useGetClassGradebookQuery(classId, { skip: !classId });

  if (isLoadingSummary || isLoadingGradebook) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (summaryError || gradebookError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
        <p>
          Có lỗi xảy ra khi tải thông tin điểm. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  const averageScore = summary?.averageScore ?? 0;
  const totalStudents = gradebook?.students?.length ?? 0;
  const totalAssessments = gradebook?.assessments?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Điểm trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{averageScore.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">/ 10.0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng học viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-xs text-muted-foreground">học viên</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng bài kiểm tra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalAssessments}</p>
                <p className="text-xs text-muted-foreground">bài kiểm tra</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => navigate(`/teacher/classes/${classId}/grades`)}
          size="lg"
          className="gap-2"
        >
          <BarChart3 className="h-5 w-5" />
          Xem chi tiết và quản lý điểm
        </Button>
      </div>
    </div>
  );
};

export default GradesTab;

