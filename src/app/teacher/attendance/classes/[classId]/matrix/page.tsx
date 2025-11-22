import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TeacherRoute } from "@/components/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  useGetClassAttendanceMatrixQuery,
  type AttendanceMatrixDTO,
  type AttendanceMatrixResponseDTO,
  type AttendanceMatrixSessionDTO,
} from "@/store/services/attendanceApi";
import { cn } from "@/lib/utils";

export default function ClassAttendanceMatrixPage() {
  const { classId } = useParams<{ classId: string }>();
  const classIdNum = classId ? parseInt(classId, 10) : 0;
  const navigate = useNavigate();

  const {
    data: matrixResponse,
    isFetching: isLoading,
    error,
  } = useGetClassAttendanceMatrixQuery(
    { classId: classIdNum },
    { skip: !classIdNum }
  );

  // Debug logging
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("Matrix Response:", matrixResponse);
      console.log("Error:", error);
      console.log("Is Loading:", isLoading);
      console.log("Class ID:", classIdNum);
    }
  }, [matrixResponse, error, isLoading, classIdNum]);

  // Transform API response to UI format
  const matrixData: AttendanceMatrixDTO | null = (() => {
    if (!matrixResponse) return null;
    if (Array.isArray(matrixResponse)) return null;

    // Get the actual data
    const rawData = (
      "data" in matrixResponse && matrixResponse.data
        ? matrixResponse.data
        : matrixResponse
    ) as AttendanceMatrixResponseDTO | AttendanceMatrixDTO;

    // Check if it's already in the transformed format
    if ("matrix" in rawData && "sessions" in rawData) {
      return rawData as AttendanceMatrixDTO;
    }

    // Transform from API format to UI format
    const apiData = rawData as AttendanceMatrixResponseDTO;
    if (!apiData.students || !Array.isArray(apiData.students)) return null;

    // Extract all unique sessions from cells
    const sessionMap = new Map<
      number,
      {
        sessionId: number;
        date?: string;
        timeSlotName?: string;
        status?: string;
      }
    >();

    apiData.students.forEach((student) => {
      student.cells?.forEach((cell) => {
        if (!sessionMap.has(cell.sessionId)) {
          sessionMap.set(cell.sessionId, {
            sessionId: cell.sessionId,
          });
        }
      });
    });

    // Get sessions from API if available, otherwise use extracted sessions
    const sessions: AttendanceMatrixSessionDTO[] =
      apiData.sessions && apiData.sessions.length > 0
        ? apiData.sessions
        : Array.from(sessionMap.values()).map((s) => ({
            sessionId: s.sessionId,
            date: s.date || "",
            timeSlotName: s.timeSlotName,
            status: s.status,
          }));

    // Build matrix from cells
    const matrix: Record<number, Record<number, "P" | "A" | "E" | "-">> = {};
    apiData.students.forEach((student) => {
      matrix[student.studentId] = {};
      student.cells?.forEach((cell) => {
        let status: "P" | "A" | "E" | "-" = "-";
        if (cell.attendanceStatus === "PRESENT") status = "P";
        else if (cell.attendanceStatus === "ABSENT") status = "A";
        else if (cell.attendanceStatus === "EXCUSED") status = "E";
        matrix[student.studentId][cell.sessionId] = status;
      });
    });

    // Transform students
    const students = apiData.students.map((student) => ({
      studentId: student.studentId,
      studentCode: student.studentCode,
      fullName: student.fullName,
      email: student.email,
      attendanceRate: student.attendanceRate ?? 0,
    }));

    // Get attendance rate from top level or summary
    const averageAttendanceRate =
      apiData.attendanceRate ?? apiData.summary?.averageAttendanceRate ?? 0;

    return {
      classId: apiData.classId ?? 0,
      classCode: apiData.classCode,
      courseCode: apiData.courseCode,
      className: apiData.className || apiData.courseName || "",
      summary: {
        totalSessions: apiData.summary?.totalSessions ?? sessions.length,
        averageAttendanceRate,
      },
      students,
      sessions,
      matrix,
    };
  })();

  if (isLoading) {
    return (
      <TeacherRoute>
        <DashboardLayout
          title="Ma trận điểm danh"
          description="Tổng quan điểm danh của lớp"
        >
          <div className="space-y-6">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </DashboardLayout>
      </TeacherRoute>
    );
  }

  if (error) {
    return (
      <TeacherRoute>
        <DashboardLayout
          title="Ma trận điểm danh"
          description="Tổng quan điểm danh của lớp"
        >
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
            <p>
              Có lỗi xảy ra khi tải ma trận điểm danh. Vui lòng thử lại sau.
            </p>
            {import.meta.env.DEV && (
              <pre className="mt-2 text-xs text-left overflow-auto">
                {JSON.stringify(error, null, 2)}
              </pre>
            )}
          </div>
        </DashboardLayout>
      </TeacherRoute>
    );
  }

  if (!matrixData) {
    return (
      <TeacherRoute>
        <DashboardLayout
          title="Ma trận điểm danh"
          description="Tổng quan điểm danh của lớp"
        >
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Không có dữ liệu điểm danh.
            </p>
          </div>
        </DashboardLayout>
      </TeacherRoute>
    );
  }

  const { students, sessions, matrix, summary, className } = matrixData;

  // Defensive checks
  if (!students || !sessions || !matrix || !summary) {
    return (
      <TeacherRoute>
        <DashboardLayout
          title="Ma trận điểm danh"
          description="Tổng quan điểm danh của lớp"
        >
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
            <p>Dữ liệu không đầy đủ. Vui lòng thử lại sau.</p>
            {import.meta.env.DEV && (
              <pre className="mt-2 text-xs text-left overflow-auto">
                {JSON.stringify(
                  { students, sessions, matrix, summary },
                  null,
                  2
                )}
              </pre>
            )}
          </div>
        </DashboardLayout>
      </TeacherRoute>
    );
  }

  const getStatusColor = (status: "P" | "A" | "E" | "-") => {
    switch (status) {
      case "P":
        return "bg-emerald-100 text-emerald-700";
      case "A":
        return "bg-rose-100 text-rose-700";
      case "E":
        return "bg-amber-100 text-amber-700";
      case "-":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getAttendanceRateColor = (rate: number) => {
    // rate is already converted to 0-100
    if (rate >= 80) return "text-emerald-700";
    if (rate >= 60) return "text-amber-700";
    return "text-rose-700";
  };

  return (
    <TeacherRoute>
      <DashboardLayout title="Ma trận điểm danh">
        <div className="space-y-6">
          {/* Header with back button */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/teacher/classes")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-lg font-semibold">{className}</h1>
          </div>

          {/* Summary section */}
          <div className="rounded-lg border bg-muted/50 p-6">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-sm text-muted-foreground">Tổng buổi</p>
                <p className="text-2xl font-semibold">
                  {summary.totalSessions}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Tỷ lệ chuyên cần trung bình
                </p>
                <p className="text-2xl font-semibold">
                  {summary.averageAttendanceRate !== undefined
                    ? (summary.averageAttendanceRate * 100).toFixed(1)
                    : "0.0"}
                  %
                </p>
              </div>
            </div>
          </div>

          {/* Matrix table */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="sticky left-0 z-10 bg-muted/50 text-left p-4 font-semibold text-foreground border-r min-w-[200px]">
                      Học viên
                    </th>
                    {sessions.map(
                      (session: AttendanceMatrixDTO["sessions"][0]) => (
                        <th
                          key={session.sessionId}
                          className="text-center p-4 font-semibold text-foreground border-r min-w-[80px]"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-xs">
                              {session.date
                                ? format(parseISO(session.date), "dd/MM", {
                                    locale: vi,
                                  })
                                : "-"}
                            </span>
                            {(session.startTime || session.sessionStartTime) &&
                            (session.endTime || session.sessionEndTime) ? (
                              <span className="text-xs text-muted-foreground">
                                {(
                                  session.startTime || session.sessionStartTime
                                )?.substring(0, 5)}{" "}
                                -{" "}
                                {(
                                  session.endTime || session.sessionEndTime
                                )?.substring(0, 5)}
                              </span>
                            ) : session.startTime ||
                              session.sessionStartTime ? (
                              <span className="text-xs text-muted-foreground">
                                {(
                                  session.startTime || session.sessionStartTime
                                )?.substring(0, 5)}
                              </span>
                            ) : null}
                          </div>
                        </th>
                      )
                    )}
                    <th className="text-center p-4 font-semibold text-foreground min-w-[100px]">
                      Tỷ lệ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(
                    (student: AttendanceMatrixDTO["students"][0]) => (
                      <tr
                        key={student.studentId}
                        className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="sticky left-0 z-10 bg-card border-r p-4 min-w-[200px]">
                          <div>
                            <p className="font-medium text-foreground">
                              {student.fullName}
                            </p>
                            {student.studentCode && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {student.studentCode}
                              </p>
                            )}
                          </div>
                        </td>
                        {sessions.map(
                          (session: AttendanceMatrixDTO["sessions"][0]) => {
                            const status =
                              matrix[student.studentId]?.[session.sessionId] ||
                              "-";
                            return (
                              <td
                                key={session.sessionId}
                                className="text-center p-4 border-r"
                              >
                                <span
                                  className={cn(
                                    "inline-flex items-center justify-center w-8 h-8 rounded text-sm font-medium",
                                    getStatusColor(status)
                                  )}
                                >
                                  {status}
                                </span>
                              </td>
                            );
                          }
                        )}
                        <td className="text-right p-4">
                          <span
                            className={cn(
                              "font-semibold",
                              getAttendanceRateColor(
                                (student.attendanceRate ?? 0) * 100
                              )
                            )}
                          >
                            {((student.attendanceRate ?? 0) * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="text-sm text-muted-foreground">
            <p>
              <span className="font-medium">Chú thích:</span> P Có mặt | A Vắng
              | - Chưa điểm danh
            </p>
          </div>
        </div>
      </DashboardLayout>
    </TeacherRoute>
  );
}
