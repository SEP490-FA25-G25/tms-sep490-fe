import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TeacherRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useGetAttendanceClassesQuery,
  type AttendanceClassDTO,
} from "@/store/services/attendanceApi";
import { BookOpen, BarChart3, TrendingUp } from "lucide-react";
import { useEffect } from "react";

export default function TeacherClassesPage() {
  const {
    data: classesResponse,
    isFetching: isLoadingClasses,
    error: classesError,
  } = useGetAttendanceClassesQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  // Handle different response structures - API returns array directly or wrapped in data
  const classes = Array.isArray(classesResponse)
    ? classesResponse
    : Array.isArray(classesResponse?.data)
    ? classesResponse.data
    : [];

  // Debug in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (classesResponse) {
        console.log("Classes Response:", classesResponse);
        console.log("Classes:", classes);
      }
      if (classesError) {
        console.error("Classes Error:", classesError);
      }
    }
  }, [classesResponse, classesError, classes]);

  return (
    <TeacherRoute>
      <DashboardLayout
        title="Lớp học của tôi"
        description="Quản lý lịch trình lớp học, học sinh và tài liệu khóa học"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Danh sách lớp học</h2>
              <p className="text-sm text-muted-foreground">
                Xem và quản lý các lớp học của bạn
                    </p>
                  </div>
            <Badge variant="outline" className="text-sm">
              {classes.length} lớp học
            </Badge>
                </div>

          {/* Danh sách classes */}
          {isLoadingClasses ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : classesError ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
              <p>
                Có lỗi xảy ra khi tải danh sách lớp học. Vui lòng thử lại sau.
              </p>
              {process.env.NODE_ENV === "development" && (
                <pre className="mt-2 text-xs text-left overflow-auto">
                  {JSON.stringify(classesError, null, 2)}
                </pre>
              )}
            </div>
          ) : classes.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Bạn chưa có lớp học nào.
              </p>
            </div>
          ) : (
                      <div className="space-y-4">
              {classes.map((classItem) => (
                <ClassCard key={classItem.id} classItem={classItem} />
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </TeacherRoute>
  );
}

function ClassCard({ classItem }: { classItem: AttendanceClassDTO }) {
  const navigate = useNavigate();

  const handleViewMatrix = () => {
    navigate(`/teacher/attendance/classes/${classItem.id}/matrix`);
  };

  // Color coding for attendance rate
  const getAttendanceRateColor = (rate: number | undefined) => {
    if (rate === undefined || rate === null) return "text-muted-foreground";
    if (rate >= 80) return "text-emerald-700";
    if (rate >= 60) return "text-amber-700";
    return "text-rose-700";
  };

  const getAttendanceRateBgColor = (rate: number | undefined) => {
    if (rate === undefined || rate === null) return "bg-muted border-muted";
    if (rate >= 80) return "bg-emerald-50 border-emerald-200";
    if (rate >= 60) return "bg-amber-50 border-amber-200";
    return "bg-rose-50 border-rose-200";
  };

  // API returns rate as 0-1, convert to 0-100 for display
  const averageAttendanceRate = classItem.attendanceRate
    ? classItem.attendanceRate * 100
    : undefined;
  const totalSessions = classItem.totalSessions ?? 0;

  return (
    <div className="rounded-lg border p-5 transition-colors hover:border-primary/60 hover:bg-primary/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Course Name */}
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {classItem.courseName}
            </h3>
          </div>

          {/* Stats */}
          {totalSessions !== undefined ||
          averageAttendanceRate !== undefined ? (
            <div className="flex items-center gap-6 text-sm">
              {/* Total Sessions */}
              {totalSessions !== undefined && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-4 w-4 flex-shrink-0" />
                  <span>{totalSessions} buổi học</span>
                </div>
              )}

              {/* Attendance Rate */}
              {averageAttendanceRate !== undefined && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Tỷ lệ chuyên cần:
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium",
                      getAttendanceRateColor(averageAttendanceRate),
                      getAttendanceRateBgColor(averageAttendanceRate)
                    )}
                  >
                    {averageAttendanceRate !== undefined
                      ? averageAttendanceRate.toFixed(1)
                      : "0.0"}
                    %
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4 flex-shrink-0" />
              <span>{classItem.name}</span>
                      </div>
          )}
                </div>
              </div>

      {/* Action button */}
      <div className="mt-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewMatrix}
          className="gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Xem thông tin lớp học
        </Button>
            </div>
          </div>
  );
}
