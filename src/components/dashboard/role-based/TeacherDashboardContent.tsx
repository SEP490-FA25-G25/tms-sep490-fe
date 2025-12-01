import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Calendar, ClipboardList, Clock } from "lucide-react";
import {
  useGetAttendanceClassesQuery,
  useGetTodaySessionsQuery,
  type AttendanceClassDTO,
  type AttendanceSessionDTO,
} from "@/store/services/attendanceApi";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

const formatPercent = (value?: number | null) => {
  if (typeof value !== "number") {
    return "--";
  }
  return `${Math.round(value * 1000) / 10}%`;
};

const safeParseDate = (value?: string | null) => {
  if (!value) return null;
  try {
    return parseISO(value);
  } catch {
    return null;
  }
};

const extractClassList = (response: unknown): AttendanceClassDTO[] => {
  if (!response) return [];
  if (Array.isArray(response)) {
    return response as AttendanceClassDTO[];
  }
  if (
    typeof response === "object" &&
    response !== null &&
    Array.isArray((response as { data?: AttendanceClassDTO[] }).data)
  ) {
    return (response as { data: AttendanceClassDTO[] }).data;
  }
  return [];
};

const extractSessions = (response: unknown): AttendanceSessionDTO[] => {
  if (!response) return [];
  if (Array.isArray(response)) {
    return response as AttendanceSessionDTO[];
  }
  if (
    typeof response === "object" &&
    response !== null &&
    Array.isArray((response as { data?: AttendanceSessionDTO[] }).data)
  ) {
    return (response as { data: AttendanceSessionDTO[] }).data;
  }
  return [];
};

export function TeacherDashboardContent() {
  const navigate = useNavigate();
  const {
    data: classesResponse,
    isLoading: isLoadingClasses,
    error: classesError,
  } = useGetAttendanceClassesQuery();
  const { data: sessionsResponse, isLoading: isLoadingSessions } =
    useGetTodaySessionsQuery();

  const classes = useMemo(
    () => extractClassList(classesResponse),
    [classesResponse]
  );
  const todaySessions = useMemo(
    () => extractSessions(sessionsResponse),
    [sessionsResponse]
  );

  const summary = useMemo(() => {
    const ongoing = classes.filter((item) => item.status === "ONGOING").length;
    const scheduled = classes.filter(
      (item) => item.status === "SCHEDULED"
    ).length;
    const completed = classes.filter(
      (item) => item.status === "COMPLETED"
    ).length;

    const attendanceRates = classes
      .map((item) =>
        typeof item.attendanceRate === "number" ? item.attendanceRate : null
      )
      .filter((rate): rate is number => rate !== null);

    const avgAttendance =
      attendanceRates.length > 0
        ? attendanceRates.reduce((sum, rate) => sum + rate, 0) /
          attendanceRates.length
        : null;

    return {
      total: classes.length,
      ongoing,
      scheduled,
      completed,
      avgAttendance,
      todaySessions: todaySessions.length,
    };
  }, [classes, todaySessions]);

  const classesNeedingGrades = useMemo(() => {
    return classes
      .filter((item) => item.status === "ONGOING")
      .sort((a, b) => {
        const aTime =
          safeParseDate(a.plannedEndDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bTime =
          safeParseDate(b.plannedEndDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      })
      .slice(0, 4);
  }, [classes]);

  const upcomingSessions = useMemo(() => {
    return todaySessions
      .slice()
      .sort((a, b) => {
        const aTime = `${a.startTime ?? ""}`;
        const bTime = `${b.startTime ?? ""}`;
        return aTime.localeCompare(bTime);
      })
      .slice(0, 5);
  }, [todaySessions]);

  const handleGoToGrades = (classId: number) => {
    navigate(`/teacher/classes/${classId}/grades`);
  };

  return (
    <>
      <div className="px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Lớp đang dạy",
              value: summary.ongoing,
              helper: "Số lớp ở trạng thái Đang diễn ra",
              icon: BookOpen,
            },
            {
              label: "Buổi dạy hôm nay",
              value: summary.todaySessions,
              helper: "Số buổi có trong lịch hôm nay",
              icon: Calendar,
            },
            {
              label: "Lớp sắp khai giảng",
              value: summary.scheduled,
              helper: "Trạng thái Sắp bắt đầu",
              icon: Clock,
            },
            {
              label: "Điểm chuyên cần TB",
              value: formatPercent(summary.avgAttendance),
              helper: "Dựa trên lớp đã có điểm danh",
              icon: ClipboardList,
            },
          ].map((card, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.label}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.helper}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {classesError && (
          <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Không thể tải danh sách lớp học. Vui lòng thử lại sau.
          </div>
        )}
      </div>

      <div className="px-4 lg:px-6">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Lịch giảng dạy hôm nay</CardTitle>
              <CardDescription>
                Các buổi học được giao trong ngày, bao gồm trạng thái điểm danh
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full rounded-md" />
                  ))}
                </div>
              ) : upcomingSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Hôm nay không có buổi dạy nào trong lịch.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.sessionId}
                      className="rounded-md border p-4 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">
                          {session.className || session.courseName}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {session.status || "Chưa diễn ra"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {session.topic || "Chưa có chủ đề"}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {session.date
                            ? format(parseISO(session.date), "dd/MM/yyyy", {
                                locale: vi,
                              })
                            : "--/--"}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                        <span>
                          {session.startTime && session.endTime
                            ? `${session.startTime} - ${session.endTime}`
                            : "Chưa sắp xếp giờ"}
                        </span>
                        {typeof session.presentCount === "number" && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                            <span>
                              {session.presentCount}/{session.totalStudents} đã
                              điểm danh
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Lớp cần nhập điểm</CardTitle>
              <CardDescription>
                Các lớp đang diễn ra, ưu tiên theo thời gian kết thúc
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingClasses ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full rounded-md" />
                  ))}
                </div>
              ) : classesNeedingGrades.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Hiện chưa có lớp nào cần nhập điểm.
                </p>
              ) : (
                <div className="space-y-3">
                  {classesNeedingGrades.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="rounded-lg border p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{classItem.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {classItem.courseName}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {classItem.branchName}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {classItem.startDate
                            ? format(parseISO(classItem.startDate), "dd/MM", {
                                locale: vi,
                              })
                            : "--"}
                          {" - "}
                          {classItem.plannedEndDate
                            ? format(
                                parseISO(classItem.plannedEndDate),
                                "dd/MM",
                                {
                                  locale: vi,
                                }
                              )
                            : "--"}
                        </span>
                        {typeof classItem.attendanceRate === "number" && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                            <span>
                              Chuyên cần:{" "}
                              {formatPercent(classItem.attendanceRate)}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          className="gap-2"
                          onClick={() => handleGoToGrades(classItem.id)}
                        >
                          <ClipboardList className="h-4 w-4" />
                          Quản lý điểm
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin lớp đã hoàn tất</CardTitle>
              <CardDescription>
                Tóm tắt các lớp vừa kết thúc để tiện tổng hợp hồ sơ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingClasses ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className="h-18 w-full rounded-md" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {classes
                    .filter((item) => item.status === "COMPLETED")
                    .slice(0, 4)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{item.name}</p>
                          <Badge variant="secondary">Đã hoàn thành</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.courseName}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            Hoàn tất:{" "}
                            {item.plannedEndDate
                              ? format(
                                  parseISO(item.plannedEndDate),
                                  "dd/MM/yyyy",
                                  {
                                    locale: vi,
                                  }
                                )
                              : "--/--"}
                          </span>
                          {typeof item.attendanceRate === "number" && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                              <span>
                                Chuyên cần: {formatPercent(item.attendanceRate)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  {classes.filter((item) => item.status === "COMPLETED")
                    .length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Chưa có lớp nào hoàn tất gần đây.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
