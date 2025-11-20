import type React from "react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";

import { StudentRoute } from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/app-sidebar";
import { AttendanceSessionsTable } from "@/components/attendance/AttendanceSessionsTable";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type StudentAttendanceReportDTO,
  useGetStudentAttendanceReportQuery,
} from "@/store/services/attendanceApi";

function computeAttendanceRate(attended: number, absent: number) {
  const totalCompleted = attended + absent;
  if (totalCompleted <= 0) return 0;
  return (attended / totalCompleted) * 100;
}

export default function StudentClassAttendanceReportPage() {
  const navigate = useNavigate();
  const params = useParams();
  const classIdParam = params.classId;
  const classId = classIdParam ? Number.parseInt(classIdParam, 10) : NaN;

  const { data, isLoading, isError, refetch } =
    useGetStudentAttendanceReportQuery(
      { classId },
      {
        skip: Number.isNaN(classId),
      }
    );

  const report: StudentAttendanceReportDTO | null = data?.data ?? null;

  const attendanceRate = useMemo(() => {
    if (!report) return 0;
    const { attended, absent, attendanceRate: backendRate } = report.summary;
    if (typeof backendRate === "number") {
      return backendRate * 100;
    }
    return computeAttendanceRate(attended, absent);
  }, [report]);

  const hasSessions =
    report && Array.isArray(report.sessions) && report.sessions.length > 0;

  return (
    <StudentRoute>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <main className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <section className="flex flex-col gap-4 px-4 pb-6 pt-4 lg:px-6">
                <header className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mr-1"
                      onClick={() => navigate("/student/attendance-report")}
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-col">
                      <h1 className="text-2xl font-semibold tracking-tight">
                        Báo cáo điểm danh theo buổi
                      </h1>
                      {report ? (
                        <p className="text-sm font-semibold text-foreground">
                          {report.className}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {report && (
                    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Tổng số buổi đã học
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {report.summary.attended + report.summary.absent} /{" "}
                          {report.summary.totalSessions}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Có mặt</p>
                        <p className="text-sm font-semibold text-emerald-700">
                          {report.summary.attended}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Vắng</p>
                        <p className="text-sm font-semibold text-rose-700">
                          {report.summary.absent}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Buổi sắp tới
                        </p>
                        <p className="text-sm font-semibold text-sky-700">
                          {report.summary.upcoming}
                        </p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-xs text-muted-foreground">
                          Tỷ lệ chuyên cần
                        </p>
                        <p className="text-xl font-semibold text-foreground">
                          {attendanceRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}
                </header>

                {isLoading && (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-40 w-full rounded-2xl" />
                    <Skeleton className="h-40 w-full rounded-2xl" />
                  </div>
                )}

                {isError && !isLoading && (
                  <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                    <p className="font-semibold">
                      Không thể tải báo cáo chi tiết.
                    </p>
                    <p className="mt-1 text-destructive/80">
                      Vui lòng kiểm tra kết nối hoặc thử tải lại sau.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => refetch()}
                    >
                      Thử tải lại
                    </Button>
                  </div>
                )}

                {!isLoading && !isError && report && !hasSessions && (
                  <div className="rounded-2xl border border-dashed border-muted-foreground/40 bg-background/60 p-10 text-center">
                    <p className="text-base font-medium text-foreground">
                      Chưa có buổi học nào để hiển thị.
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Báo cáo chi tiết sẽ xuất hiện sau khi lớp có ít nhất một
                      buổi học đã diễn ra.
                    </p>
                  </div>
                )}

                {!isLoading && !isError && hasSessions && report && (
                  <AttendanceSessionsTable
                    rows={report.sessions.map((session, idx) => ({
                      id: session.sessionId ?? idx,
                      order: session.sessionNumber ?? idx + 1,
                      date: session.date,
                      startTime: session.startTime,
                      endTime: session.endTime,
                      room: session.classroomName,
                      teacher: session.teacherName,
                      attendanceStatus: session.attendanceStatus,
                      note: session.note,
                    }))}
                  />
                )}
              </section>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </StudentRoute>
  );
}
