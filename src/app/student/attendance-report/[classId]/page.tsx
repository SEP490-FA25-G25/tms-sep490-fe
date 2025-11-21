import type React from "react";
import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeftIcon } from "lucide-react";

import { StudentRoute } from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  type StudentAttendanceReportDTO,
  type StudentAttendanceReportSessionDTO,
  useGetStudentAttendanceReportQuery,
  attendanceApi,
} from "@/store/services/attendanceApi";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";

const ATTENDANCE_STATUS_META: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  PRESENT: {
    label: "Có mặt",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  ABSENT: {
    label: "Vắng",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  LATE: {
    label: "Đi trễ",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  EXCUSED: {
    label: "Có phép",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  PLANNED: {
    label: "Chưa diễn ra",
    className: "bg-slate-50 text-slate-700 border-slate-200",
  },
};

function formatDateLabel(dateString: string) {
  try {
    const date = parseISO(dateString);
    return format(date, "EEEE '-' dd/MM/yyyy", { locale: vi });
  } catch {
    return dateString;
  }
}

function formatTimeRange(startTime?: string, endTime?: string) {
  const start = startTime ? startTime.slice(0, 5) : "";
  const end = endTime ? endTime.slice(0, 5) : "";
  if (!start && !end) return "—";
  if (!end) return start;
  if (!start) return end;
  return `${start} - ${end}`;
}

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
  const dispatch = useDispatch<AppDispatch>();

  // Prefetch overview data để khi quay lại trang tổng quan không bị giật
  useEffect(() => {
    dispatch(
      attendanceApi.endpoints.getStudentAttendanceOverview.initiate(undefined, {
        forceRefetch: false,
      })
    );
  }, [dispatch]);

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
                    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/40 px-4 py-3">
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
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
                    <p className="font-semibold text-destructive">
                      Không thể tải báo cáo chi tiết.
                    </p>
                    <p className="mt-1 text-destructive/90">
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
                  <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
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
                  <section className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-foreground">
                        Danh sách buổi học
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {report.sessions.length} buổi
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border/60 text-xs text-muted-foreground">
                            <th className="border-r border-border/40 px-3 py-2 font-medium">
                              Buổi
                            </th>
                            <th className="border-r border-border/40 px-3 py-2 text-center font-medium">
                              Ngày
                            </th>
                            <th className="border-r border-border/40 px-3 py-2 text-center font-medium">
                              Giờ học
                            </th>
                            <th className="border-r border-border/40 px-3 py-2 text-center font-medium">
                              Phòng học
                            </th>
                            <th className="border-r border-border/40 px-3 py-2 text-center font-medium">
                              Giảng viên
                            </th>
                            <th className="border-r border-border/40 px-3 py-2 text-center font-medium">
                              Trạng thái điểm danh
                            </th>
                            <th className="border-r border-border/40 px-3 py-2 text-center font-medium">
                              Ghi chú từ giảng viên
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.sessions.map(
                            (
                              session: StudentAttendanceReportSessionDTO,
                              idx
                            ) => {
                              const statusKey =
                                session.attendanceStatus ?? "UNKNOWN";
                              const statusMeta =
                                ATTENDANCE_STATUS_META[statusKey] ?? null;
                              return (
                                <tr
                                  key={session.sessionId ?? idx}
                                  className="border-b border-border/40 last:border-0"
                                >
                                  <td className="border-r border-border/40 px-3 py-2 text-xs text-muted-foreground">
                                    {session.sessionNumber ?? idx + 1}
                                  </td>
                                  <td className="border-r border-border/40 px-3 py-2 text-sm text-center text-foreground">
                                    {formatDateLabel(session.date)}
                                  </td>
                                  <td className="border-r border-border/40 px-3 py-2 text-sm text-center text-muted-foreground">
                                    {formatTimeRange(
                                      session.startTime,
                                      session.endTime
                                    )}
                                  </td>
                                  <td className="border-r border-border/40 px-3 py-2 text-sm text-center text-muted-foreground">
                                    {session.classroomName || "Chưa cập nhật"}
                                  </td>
                                  <td className="border-r border-border/40 px-3 py-2 text-sm text-center text-muted-foreground">
                                    {session.teacherName || "Chưa cập nhật"}
                                  </td>
                                  <td className="border-r border-border/40 px-3 py-2 text-center">
                                    {statusMeta ? (
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "px-2 py-0.5 text-[11px] font-medium",
                                          statusMeta.className
                                        )}
                                      >
                                        {statusMeta.label}
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        Chưa có dữ liệu
                                      </span>
                                    )}
                                  </td>
                                  <td className="border-r border-border/40 px-3 py-2 text-sm text-center text-muted-foreground">
                                    {session.note?.trim() || "Không có ghi chú"}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </section>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </StudentRoute>
  );
}
