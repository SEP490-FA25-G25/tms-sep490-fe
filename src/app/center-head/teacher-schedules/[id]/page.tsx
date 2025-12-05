"use client";

import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { addDays, format, startOfWeek, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetManagerTeacherProfileQuery,
  useGetManagerTeacherWeeklyScheduleQuery,
} from "@/store/services/teacherApi";
import { TeacherCalendarView } from "@/app/teacher/schedule/components/TeacherCalendarView";
import { ArrowLeft, Calendar, Clock, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

function getCurrentWeekStartISO(): string {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  return format(monday, "yyyy-MM-dd");
}

export default function CenterHeadTeacherScheduleDetailPage() {
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

  // Teaching load calculation
  const teachingLoad = useMemo(() => {
    if (!scheduleData) {
      return { totalSessions: 0, totalHours: 0, todaySessions: 0 };
    }

    const allSessions = Object.values(scheduleData.schedule).flat();
    const countedSessions = allSessions.filter(
      (session) => session.sessionStatus !== "CANCELLED"
    );

    // Unique sessions by sessionId
    const uniqueSessionsMap = new Map<number, (typeof countedSessions)[number]>();
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

    return { totalSessions, totalHours, todaySessions };
  }, [scheduleData]);

  if (isLoadingProfile) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (isProfileError || !profile) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4">
            Không thể tải thông tin giáo viên. Vui lòng thử lại.
          </p>
          <Button onClick={() => navigate("/center-head/teacher-schedules")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={profile.fullName}
      description={`Lịch dạy giáo viên - Mã GV: ${profile.teacherCode || "N/A"}`}
    >
      <div className="space-y-6">
        {/* Back button and profile info */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/center-head/teacher-schedules")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant={profile.status === "ACTIVE" ? "default" : "secondary"}>
              {profile.status === "ACTIVE" ? "Đang hoạt động" : "Ngưng hoạt động"}
            </Badge>
          </div>
        </div>

        {/* Teacher Info */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin giáo viên</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Họ tên</p>
                <p className="font-medium">{profile.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số điện thoại</p>
                <p className="font-medium">{profile.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chi nhánh</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.branchName ? (
                    <Badge variant="outline">
                      {profile.branchName}
                    </Badge>
                  ) : <span className="text-muted-foreground">N/A</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teaching Load Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Buổi dạy trong tuần</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachingLoad.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                {teachingLoad.todaySessions} buổi hôm nay
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Số giờ dạy</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachingLoad.totalHours}h</div>
              <p className="text-xs text-muted-foreground">Tổng trong tuần</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tuần hiện tại</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weekLabel}</div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(), "yyyy", { locale: vi })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Lịch dạy</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChangeWeek("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
              Tuần trước
            </Button>
            <span className="px-3 py-1 text-sm font-medium bg-muted rounded">
              {weekLabel}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChangeWeek("next")}
            >
              Tuần sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar View */}
        {isLoadingSchedule ? (
          <Skeleton className="h-96 w-full" />
        ) : isScheduleError ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              Không thể tải lịch dạy. Vui lòng thử lại sau.
            </CardContent>
          </Card>
        ) : scheduleData ? (
          <TeacherCalendarView
            scheduleData={scheduleData}
            onSessionClick={() => {}}
          />
        ) : (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              Không có lịch dạy trong tuần này.
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
