"use client";

import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { addDays, format, startOfWeek, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useGetManagerTeacherProfileQuery,
  useGetManagerTeacherWeeklyScheduleQuery,
} from "@/store/services/teacherApi";
import { TeacherCalendarView } from "@/app/teacher/schedule/components/TeacherCalendarView";
import { useGetQAReportsQuery } from "@/store/services/qaApi";
import type { QAReportListItemDTO } from "@/types/qa";
import { QAReportStatus } from "@/types/qa";

function getCurrentWeekStartISO(): string {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  return format(monday, "yyyy-MM-dd");
}

export default function ManagerTeacherDetailPage() {
  const { id } = useParams();
  const teacherId = Number(id);
  const navigate = useNavigate();

  const [weekStart, setWeekStart] = useState<string>(getCurrentWeekStartISO);

  const {
    data: profileResponse,
    isLoading: isLoadingProfile,
    isError: isProfileError,
  } = useGetManagerTeacherProfileQuery(teacherId, {
    skip: Number.isNaN(teacherId),
  });

  const {
    data: scheduleResponse,
    isLoading: isLoadingSchedule,
    isError: isScheduleError,
  } = useGetManagerTeacherWeeklyScheduleQuery(
    { teacherId, weekStart },
    {
      skip: Number.isNaN(teacherId) || !weekStart,
    }
  );

  const profile = profileResponse?.data;
  const scheduleData = scheduleResponse?.data;

  const isLoading = isLoadingProfile || Number.isNaN(teacherId);

  const weekLabel = useMemo(() => {
    const start = parseISO(weekStart);
    const end = addDays(start, 6);
    return `${format(start, "dd/MM", { locale: vi })} - ${format(end, "dd/MM", {
      locale: vi,
    })}`;
  }, [weekStart]);

  const handleChangeWeek = (direction: "prev" | "next") => {
    const base = parseISO(weekStart);
    const next = addDays(base, direction === "prev" ? -7 : 7);
    setWeekStart(format(next, "yyyy-MM-dd"));
  };

  // QA reports related to this teacher's name (approximation)
  const { data: qaReportsResponse, isLoading: isLoadingQA } =
    useGetQAReportsQuery(
      profile
        ? {
            search: profile.fullName,
            status: QAReportStatus.SUBMITTED,
            page: 0,
            size: 20,
            sort: "createdAt",
            sortDir: "desc",
          }
        : {
            page: 0,
            size: 0,
          },
      { skip: !profile }
    );

  const qaReports = useMemo(
    () => (qaReportsResponse?.data ?? []) as QAReportListItemDTO[],
    [qaReportsResponse]
  );
  const qaTotal = qaReportsResponse?.total ?? qaReports.length;

  const qaUniqueClasses = useMemo(() => {
    const set = new Set<string>();
    qaReports.forEach((r) => {
      if (r.classCode) set.add(r.classCode);
    });
    return set.size;
  }, [qaReports]);

  const qaLatest = qaReports[0];

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null
  );

  const selectedSession = useMemo(() => {
    if (!selectedSessionId || !scheduleData) return null;
    return Object.values(scheduleData.schedule)
      .flat()
      .find((s) => s.sessionId === selectedSessionId);
  }, [selectedSessionId, scheduleData]);

  const teachingLoad = useMemo(() => {
    if (!scheduleData) {
      return {
        totalSessions: 0,
        totalHours: 0,
        todaySessions: 0,
      };
    }

    const allSessions = Object.values(scheduleData.schedule).flat();
    // Chỉ tính các buổi thực sự diễn ra (không tính CANCELLED)
    const countedSessions = allSessions.filter(
      (session) => session.sessionStatus !== "CANCELLED"
    );

    // Một số giáo viên có thể có nhiều teaching slot cho cùng 1 sessionId.
    // Để teaching load khớp với lịch hiển thị, ta gom theo sessionId.
    const uniqueSessionsMap = new Map<
      number,
      (typeof countedSessions)[number]
    >();
    for (const session of countedSessions) {
      if (!uniqueSessionsMap.has(session.sessionId)) {
        uniqueSessionsMap.set(session.sessionId, session);
      }
    }
    const uniqueSessions = Array.from(uniqueSessionsMap.values());
    const totalSessions = uniqueSessions.length;

    const totalMinutes = uniqueSessions.reduce((sum, session) => {
      if (!session.startTime || !session.endTime) return sum;
      const [sh, sm] = session.startTime.split(":").map(Number);
      const [eh, em] = session.endTime.split(":").map(Number);
      const start = sh * 60 + (sm || 0);
      const end = eh * 60 + (em || 0);
      if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return sum;
      return sum + (end - start);
    }, 0);

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    const today = new Date();
    const todayDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    const dayMap: Record<number, string> = {
      1: "MONDAY",
      2: "TUESDAY",
      3: "WEDNESDAY",
      4: "THURSDAY",
      5: "FRIDAY",
      6: "SATURDAY",
      7: "SUNDAY",
    };
    const todayKey = dayMap[todayDayOfWeek];
    const todaySessions = todayKey
      ? uniqueSessions.filter((s) => s.dayOfWeek === todayKey).length
      : 0;

    return {
      totalSessions,
      totalHours,
      todaySessions,
    };
  }, [scheduleData]);

  return (
    <DashboardLayout
      title={profile?.fullName ?? "Chi tiết giáo viên"}
      description={
        profile
          ? `Mã: ${profile.teacherCode ?? "N/A"} · Email: ${profile.email}`
          : "Xem thông tin và lịch dạy của giáo viên trong phạm vi quản lý."
      }
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/manager/teachers")}
        >
          Quay lại danh sách
        </Button>
      }
    >
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      )}

      {!isLoading && isProfileError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          Không thể tải thông tin giáo viên hoặc giáo viên không thuộc phạm vi
          chi nhánh của bạn.
        </div>
      )}

      {!isLoading && profile && (
        <div className="flex flex-col gap-6">
          {/* Summary */}
          <div className="rounded-lg border bg-card p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      profile.status === "ACTIVE"
                        ? "default"
                        : profile.status === "SUSPENDED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {profile.status === "ACTIVE"
                      ? "Đang hoạt động"
                      : profile.status === "SUSPENDED"
                      ? "Tạm khóa"
                      : profile.status}
                  </Badge>
                  {profile.branchName && (
                    <Badge variant="outline">{profile.branchName}</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>Mã GV: {profile.teacherCode}</span>
                  {profile.phone && <span>ĐT: {profile.phone}</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground">
                    Tổng số lớp
                  </span>
                  <span className="text-base font-semibold">
                    {profile.totalClasses}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground">
                    Lớp đang dạy
                  </span>
                  <span className="text-base font-semibold text-emerald-600">
                    {profile.activeClasses}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground">
                    Lớp đã hoàn thành
                  </span>
                  <span className="text-base font-semibold text-slate-700">
                    {profile.completedClasses}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly teaching load */}
          {scheduleData && (
            <div className="grid gap-4 rounded-lg border bg-card p-4 text-sm md:grid-cols-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Buổi dạy trong tuần này
                </span>
                <span className="text-xl font-semibold">
                  {teachingLoad.totalSessions}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Tổng giờ dạy tuần này (ước tính)
                </span>
                <span className="text-xl font-semibold">
                  {teachingLoad.totalHours.toLocaleString("vi-VN", {
                    maximumFractionDigits: 1,
                  })}{" "}
                  giờ
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Buổi dạy trong hôm nay
                </span>
                <span className="text-xl font-semibold">
                  {teachingLoad.todaySessions}
                </span>
              </div>
            </div>
          )}

          {/* QA performance overview */}
          <div className="grid gap-4 rounded-lg border bg-card p-4 text-sm md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Báo cáo QA
              </span>
              <span className="text-xl font-semibold">
                {isLoadingQA ? "..." : qaTotal}
              </span>
              <span className="text-xs text-muted-foreground">
                Tổng số báo cáo QA trong hệ thống có liên quan đến tên giáo viên
                này.
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Lớp có báo cáo QA
              </span>
              <span className="text-xl font-semibold">
                {isLoadingQA ? "..." : qaUniqueClasses}
              </span>
              <span className="text-xs text-muted-foreground">
                Số lớp (theo mã lớp) xuất hiện trong các báo cáo QA bên trên.
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Báo cáo mới nhất
              </span>
              {isLoadingQA ? (
                <span className="text-xs text-muted-foreground">
                  Đang tải...
                </span>
              ) : qaLatest ? (
                <span className="text-xs text-muted-foreground">
                  {new Date(qaLatest.createdAt).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · Lớp {qaLatest.classCode}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Chưa có báo cáo QA nào được nộp.
                </span>
              )}
            </div>
          </div>

          {/* Layout: left classes, right schedule */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            {/* Classes table */}
            <div className="space-y-3 rounded-lg border bg-card p-4 md:p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold">Lớp phụ trách</h2>
                <span className="text-xs text-muted-foreground">
                  {profile.classes.length} lớp
                </span>
              </div>
              {profile.classes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Giáo viên hiện chưa được phân công lớp nào.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã lớp</TableHead>
                        <TableHead>Tên lớp</TableHead>
                        <TableHead>Khóa học</TableHead>
                        <TableHead>Chi nhánh</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profile.classes.map((cls) => (
                        <TableRow key={cls.classId}>
                          <TableCell className="font-medium">
                            {cls.classCode}
                          </TableCell>
                          <TableCell>{cls.className}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {cls.courseName}
                          </TableCell>
                          <TableCell className="text-xs">
                            {cls.branchName}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Weekly schedule */}
            <div className="space-y-3 rounded-lg border bg-card p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold">
                    Lịch dạy trong tuần
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Xem lịch dạy chi tiết theo tuần của giáo viên.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleChangeWeek("prev")}
                  >
                    ‹
                  </Button>
                  <span className="text-xs font-medium text-muted-foreground">
                    Tuần {weekLabel}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleChangeWeek("next")}
                  >
                    ›
                  </Button>
                </div>
              </div>

              {isLoadingSchedule && (
                <Skeleton className="h-80 w-full rounded-md" />
              )}

              {!isLoadingSchedule && isScheduleError && (
                <p className="text-sm text-muted-foreground">
                  Không thể tải lịch dạy cho tuần này.
                </p>
              )}

              {!isLoadingSchedule && !isScheduleError && scheduleData && (
                <div className="h-[420px]">
                  <TeacherCalendarView
                    scheduleData={scheduleData}
                    onSessionClick={(sessionId) => {
                      setSelectedSessionId(sessionId);
                    }}
                    className="h-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Session detail dialog (manager view, lightweight) */}
          <Dialog
            open={!!selectedSession}
            onOpenChange={(open) => {
              if (!open) setSelectedSessionId(null);
            }}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Chi tiết buổi dạy</DialogTitle>
                {selectedSession && (
                  <DialogDescription>
                    {selectedSession.className} · {selectedSession.classCode}
                  </DialogDescription>
                )}
              </DialogHeader>
              {selectedSession ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Thời gian
                    </p>
                    <p className="font-medium">
                      {format(
                        parseISO(selectedSession.date),
                        "EEEE, dd/MM/yyyy",
                        {
                          locale: vi,
                        }
                      )}{" "}
                      · {selectedSession.startTime.slice(0, 5)} -{" "}
                      {selectedSession.endTime.slice(0, 5)}
                    </p>
                  </div>
                  {selectedSession.topic && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Chủ đề
                      </p>
                      <p className="font-medium">{selectedSession.topic}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Chi nhánh
                    </p>
                    <p className="font-medium">{selectedSession.branchName}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Học viên
                      </p>
                      <p className="font-semibold">
                        {selectedSession.totalStudents}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Có mặt
                      </p>
                      <p className="font-semibold text-emerald-600">
                        {selectedSession.presentCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Vắng
                      </p>
                      <p className="font-semibold text-rose-600">
                        {selectedSession.absentCount}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </DashboardLayout>
  );
}
