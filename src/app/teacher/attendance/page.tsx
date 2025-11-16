import { useMemo } from "react";
import { format, parseISO, startOfToday, isBefore } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TeacherRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useGetTodaySessionsQuery,
  type AttendanceSessionDTO,
} from "@/store/services/attendanceApi";
import { Clock, BookOpen, Users } from "lucide-react";

export default function TeacherAttendancePage() {
  const {
    data: sessionsResponse,
    isFetching: isLoadingSessions,
    error: sessionsError,
  } = useGetTodaySessionsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const todaySessions = useMemo(() => {
    return sessionsResponse?.data ?? [];
  }, [sessionsResponse?.data]);

  const today = startOfToday();
  const formattedToday = format(today, "EEEE, dd/MM/yyyy", {
    locale: vi,
  });

  return (
    <TeacherRoute>
      <DashboardLayout
        title="Điểm danh"
        description="Quản lý điểm danh cho các buổi học hôm nay"
      >
        <div className="space-y-6">
          {/* Header với ngày hôm nay */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Buổi học hôm nay</h2>
              <p className="text-sm text-muted-foreground capitalize">
                {formattedToday}
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              {todaySessions.length} buổi học
            </Badge>
          </div>

          {/* Danh sách sessions */}
          {isLoadingSessions ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : sessionsError ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
              <p>
                Có lỗi xảy ra khi tải danh sách buổi học. Vui lòng thử lại sau.
              </p>
            </div>
          ) : todaySessions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Không có buổi học nào vào hôm nay.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {todaySessions.map((session) => (
                <SessionCard key={session.sessionId} session={session} />
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </TeacherRoute>
  );
}

function SessionCard({ session }: { session: AttendanceSessionDTO }) {
  const navigate = useNavigate();
  const sessionDate = format(parseISO(session.date), "dd/MM/yyyy", {
    locale: vi,
  });
  const timeRange = `${session.startTime} - ${session.endTime}`;

  // Check if session has started (current time >= session start time)
  const hasSessionStarted = useMemo(() => {
    if (!session.date || !session.startTime) return true; // If no time info, allow by default

    try {
      const now = new Date();
      const sessionDateObj = parseISO(session.date);
      
      // Parse startTime (could be "HH:mm:ss" or "HH:mm")
      const timeParts = session.startTime.split(":");
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1] || "0", 10);
      
      // Create session start datetime
      const sessionStartDateTime = new Date(sessionDateObj);
      sessionStartDateTime.setHours(hours, minutes, 0, 0);
      
      // Check if current time is before session start time
      return !isBefore(now, sessionStartDateTime);
    } catch (error) {
      // If parsing fails, allow by default
      console.error("Error parsing session time:", error);
      return true;
    }
  }, [session.date, session.startTime]);

  const handleAttendanceClick = () => {
    if (hasSessionStarted) {
      navigate(`/teacher/attendance/${session.sessionId}`);
    }
  };

  return (
    <div className="rounded-lg border p-5 transition-colors hover:border-primary/60 hover:bg-primary/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Course */}
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {session.courseName}
            </h3>
          </div>

          {/* Topic */}
          {session.topic && (
            <div className="flex items-start gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">{session.topic}</p>
            </div>
          )}

          {/* Thời gian */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>{timeRange}</span>
            <span className="mx-1">·</span>
            <span>{sessionDate}</span>
          </div>

          {/* Resource và Modality */}
          {(session.resourceName || session.modality) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {session.resourceName && (
                <span>Resource: {session.resourceName}</span>
              )}
              {session.modality && (
                <span className="capitalize">
                  {session.modality.toLowerCase()}
                </span>
              )}
            </div>
          )}

          {/* Student count */}
          {session.totalStudents !== undefined && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>
                {session.presentCount !== undefined
                  ? `${session.presentCount}/${session.totalStudents} học sinh có mặt`
                  : `${session.totalStudents} học sinh`}
              </span>
              {session.attendanceSubmitted && (
                <Badge
                  variant="outline"
                  className="ml-2 text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                >
                  Đã điểm danh
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Status badge */}
        {session.status && (
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium",
                session.status === "DONE"
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : session.status === "CANCELLED"
                  ? "bg-rose-100 text-rose-700 border-rose-200"
                  : "bg-sky-100 text-sky-700 border-sky-200"
              )}
            >
              {session.status === "DONE"
                ? "Đã hoàn thành"
                : session.status === "CANCELLED"
                ? "Đã hủy"
                : "Đã lên kế hoạch"}
            </Badge>
          </div>
        )}
      </div>

      {/* Action button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleAttendanceClick}
          disabled={!hasSessionStarted}
          className={cn(
            "text-sm font-medium",
            hasSessionStarted
              ? "text-primary hover:underline"
              : "text-muted-foreground cursor-not-allowed opacity-50"
          )}
        >
          Điểm danh →
        </button>
      </div>
    </div>
  );
}
