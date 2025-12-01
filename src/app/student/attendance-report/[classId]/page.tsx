import type React from "react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ClipboardList, CheckCircle2, XCircle, Clock, CalendarCheck } from "lucide-react";

import { StudentRoute } from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import AttendanceSessionsTable, { type AttendanceSessionRow } from "@/components/attendance/AttendanceSessionsTable";
import { useGetStudentAttendanceReportQuery } from "@/store/services/attendanceApi";
import { useGetClassSessionsQuery } from "@/store/services/studentClassApi";

type SessionFilter = 'all' | 'upcoming' | 'past';

function computeAttendanceRate(attended: number, absent: number) {
  const totalCompleted = attended + absent;
  if (totalCompleted <= 0) return 0;
  return (attended / totalCompleted) * 100;
}

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  iconClassName: string;
}

function StatCard({ title, value, description, icon, iconClassName }: StatCardProps) {
  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconClassName}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </Card>
  );
}

export default function StudentClassAttendanceDetailPage() {
  const params = useParams();
  const classIdParam = params.classId;
  const classId = classIdParam ? Number.parseInt(classIdParam, 10) : NaN;
  const [filter, setFilter] = useState<SessionFilter>('all');

  const { data: reportData, isLoading: isLoadingReport, isError, refetch } =
    useGetStudentAttendanceReportQuery(
      { classId },
      { skip: Number.isNaN(classId) }
    );

  const { data: sessionsResponse, isLoading: isLoadingSessions } =
    useGetClassSessionsQuery(
      { classId },
      { skip: Number.isNaN(classId) }
    );

  const report = reportData?.data ?? null;
  const sessionsData = sessionsResponse?.data;

  const attendanceRate = useMemo(() => {
    if (!report) return 0;
    const { attended, absent, attendanceRate: backendRate } = report.summary;
    if (typeof backendRate === "number") {
      return backendRate * 100;
    }
    return computeAttendanceRate(attended, absent);
  }, [report]);

  const summary = report?.summary;
  const excused = summary?.excused ?? 0;

  // Build session rows from sessionsData and reportData
  const { upcomingSessions, pastSessions, studentSessions } = useMemo(
    () => ({
      upcomingSessions: sessionsData?.upcomingSessions || [],
      pastSessions: sessionsData?.pastSessions || [],
      studentSessions: sessionsData?.studentSessions || [],
    }),
    [sessionsData]
  );

  const studentSessionMap = useMemo(() => {
    return new Map(studentSessions.map((ss) => [ss.sessionId, ss]));
  }, [studentSessions]);

  const reportSessionMap = useMemo(() => {
    return new Map((report?.sessions || []).map((session) => [session.sessionId, session]));
  }, [report?.sessions]);

  const allSessions = useMemo(() => {
    return [...upcomingSessions, ...pastSessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [upcomingSessions, pastSessions]);

  const filteredSessions = useMemo(() => {
    const now = new Date();
    if (filter === 'upcoming') {
      return allSessions.filter((s) => new Date(s.date) >= now);
    }
    if (filter === 'past') {
      return allSessions.filter((s) => new Date(s.date) < now);
    }
    return allSessions;
  }, [allSessions, filter]);

  const sessionRows: AttendanceSessionRow[] = useMemo(() => {
    return filteredSessions.map((session, idx) => {
      const studentSession = studentSessionMap.get(session.id);
      const reportSession = reportSessionMap.get(session.id);
      const isCancelled = session.status === 'CANCELLED';
      const isPast = new Date(session.date) < new Date();

      const attendanceStatus =
        studentSession?.attendanceStatus ??
        reportSession?.attendanceStatus ??
        (isCancelled || isPast ? 'PLANNED' : 'PLANNED');

      return {
        id: session.id,
        order: reportSession?.sessionNumber ?? idx + 1,
        date: session.date,
        startTime: session.startTime || reportSession?.startTime,
        endTime: session.endTime || reportSession?.endTime,
        room: reportSession?.classroomName ?? session.room,
        teacher: reportSession?.teacherName ?? session.teachers[0],
        attendanceStatus,
        note: reportSession?.note ?? session.teacherNote ?? studentSession?.note,
        isMakeup: studentSession?.isMakeup ?? false,
        makeupSessionId: studentSession?.makeupSessionId,
        originalSessionId: studentSession?.originalSessionId,
      };
    });
  }, [filteredSessions, studentSessionMap, reportSessionMap]);

  const isLoading = isLoadingReport || isLoadingSessions;

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
            {/* Page Header */}
            <header className="flex flex-col gap-2 border-b border-border px-6 py-5">
              <h1 className="text-3xl font-bold tracking-tight">
                Lịch học & Điểm danh
              </h1>
              {report && (
                <p className="text-sm text-muted-foreground">
                  {report.className}
                </p>
              )}
            </header>

            {/* Content */}
            <div className="flex flex-1 flex-col px-6 py-6 gap-6">
              {isLoading && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full" />
                    ))}
                  </div>
                  <Skeleton className="h-64 w-full" />
                </div>
              )}

              {isError && !isLoading && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    Không thể tải báo cáo chi tiết
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Vui lòng kiểm tra kết nối hoặc thử tải lại sau.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                  >
                    Thử lại
                  </Button>
                </div>
              )}

              {!isLoading && !isError && report && (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <StatCard
                      title="Tổng số buổi"
                      value={report.summary.totalSessions}
                      description="Tất cả buổi học"
                      icon={<ClipboardList className="h-4 w-4 text-blue-600" />}
                      iconClassName="bg-blue-50"
                    />
                    <StatCard
                      title="Có mặt"
                      value={report.summary.attended}
                      description="Đã tham gia"
                      icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      iconClassName="bg-emerald-50"
                    />
                    <StatCard
                      title="Vắng không phép"
                      value={report.summary.absent}
                      description="Không có phép"
                      icon={<XCircle className="h-4 w-4 text-rose-600" />}
                      iconClassName="bg-rose-50"
                    />
                    <StatCard
                      title="Vắng có phép"
                      value={excused}
                      description="Được chấp thuận"
                      icon={<CalendarCheck className="h-4 w-4 text-indigo-600" />}
                      iconClassName="bg-indigo-50"
                    />
                    <StatCard
                      title="Tỷ lệ chuyên cần"
                      value={`${attendanceRate.toFixed(1)}%`}
                      description="Có mặt / Tổng đã học"
                      icon={<Clock className="h-4 w-4 text-amber-600" />}
                      iconClassName="bg-amber-50"
                    />
                  </div>

                  {/* Sessions Table */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold">Danh sách buổi học</h2>
                      <ToggleGroup
                        type="single"
                        value={filter}
                        onValueChange={(value) => {
                          if (value) setFilter(value as SessionFilter);
                        }}
                        className="border rounded-lg p-1"
                      >
                        <ToggleGroupItem value="all" className="text-sm">
                          Tất cả
                        </ToggleGroupItem>
                        <ToggleGroupItem value="upcoming" className="text-sm">
                          Sắp tới
                        </ToggleGroupItem>
                        <ToggleGroupItem value="past" className="text-sm">
                          Đã diễn ra
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>

                    <AttendanceSessionsTable
                      rows={sessionRows}
                      emptyMessage="Không có buổi học trong bộ lọc này."
                    />
                  </div>
                </>
              )}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </StudentRoute>
  );
}
