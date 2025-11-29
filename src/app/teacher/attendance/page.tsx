import { useMemo, useState } from "react";
import { format, parseISO, startOfToday, subDays, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TeacherRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useGetSessionsForDateQuery,
  type AttendanceSessionDTO,
} from "@/store/services/attendanceApi";
import { Clock, BookOpen, Users, Search } from "lucide-react";

export default function TeacherAttendancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "yesterday" | "twoDaysAgo"
  >("all");

  const today = startOfToday();
  const yesterday = subDays(today, 1);
  const twoDaysAgo = subDays(today, 2);

  // Format dates for API (YYYY-MM-DD)
  const todayStr = format(today, "yyyy-MM-dd");
  const yesterdayStr = format(yesterday, "yyyy-MM-dd");
  const twoDaysAgoStr = format(twoDaysAgo, "yyyy-MM-dd");

  // Fetch sessions for today, yesterday, and 2 days ago
  const {
    data: todaySessionsResponse,
    isFetching: isLoadingToday,
    error: todayError,
  } = useGetSessionsForDateQuery(todayStr, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const {
    data: yesterdaySessionsResponse,
    isFetching: isLoadingYesterday,
    error: yesterdayError,
  } = useGetSessionsForDateQuery(yesterdayStr, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const {
    data: twoDaysAgoSessionsResponse,
    isFetching: isLoadingTwoDaysAgo,
    error: twoDaysAgoError,
  } = useGetSessionsForDateQuery(twoDaysAgoStr, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const todaySessions = useMemo(() => {
    return todaySessionsResponse?.data ?? [];
  }, [todaySessionsResponse?.data]);

  const yesterdaySessions = useMemo(() => {
    return yesterdaySessionsResponse?.data ?? [];
  }, [yesterdaySessionsResponse?.data]);

  const twoDaysAgoSessions = useMemo(() => {
    return twoDaysAgoSessionsResponse?.data ?? [];
  }, [twoDaysAgoSessionsResponse?.data]);

  // Combine all sessions with date info
  const allSessions = useMemo(() => {
    const sessions: (AttendanceSessionDTO & { sessionDate: Date })[] = [];

    todaySessions.forEach((session) => {
      sessions.push({ ...session, sessionDate: today });
    });

    yesterdaySessions.forEach((session) => {
      sessions.push({ ...session, sessionDate: yesterday });
    });

    twoDaysAgoSessions.forEach((session) => {
      sessions.push({ ...session, sessionDate: twoDaysAgo });
    });

    return sessions;
  }, [
    todaySessions,
    yesterdaySessions,
    twoDaysAgoSessions,
    today,
    yesterday,
    twoDaysAgo,
  ]);

  // Filter sessions based on search and date filter
  const filteredSessions = useMemo(() => {
    let filtered = allSessions;

    // Apply date filter
    if (dateFilter === "today") {
      filtered = filtered.filter((session) =>
        isSameDay(session.sessionDate, today)
      );
    } else if (dateFilter === "yesterday") {
      filtered = filtered.filter((session) =>
        isSameDay(session.sessionDate, yesterday)
      );
    } else if (dateFilter === "twoDaysAgo") {
      filtered = filtered.filter((session) =>
        isSameDay(session.sessionDate, twoDaysAgo)
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((session) => {
        const searchFields = [
          session.courseName,
          session.topic,
          session.resourceName,
          session.modality,
        ];
        return searchFields.some(
          (field) => field && field.toString().toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [allSessions, dateFilter, searchQuery, today, yesterday, twoDaysAgo]);

  const isLoadingSessions =
    isLoadingToday || isLoadingYesterday || isLoadingTwoDaysAgo;
  const hasError = todayError || yesterdayError || twoDaysAgoError;

  const formattedToday = format(today, "EEEE, dd/MM/yyyy", {
    locale: vi,
  });
  const formattedYesterday = format(yesterday, "EEEE, dd/MM/yyyy", {
    locale: vi,
  });
  const formattedTwoDaysAgo = format(twoDaysAgo, "EEEE, dd/MM/yyyy", {
    locale: vi,
  });

  // Group filtered sessions by date
  const groupedSessions = useMemo(() => {
    const groups: {
      date: Date;
      label: string;
      sessions: (AttendanceSessionDTO & { sessionDate: Date })[];
    }[] = [];

    const todayGroup = filteredSessions.filter((s) =>
      isSameDay(s.sessionDate, today)
    );
    if (todayGroup.length > 0) {
      groups.push({
        date: today,
        label: `Buổi học hôm nay - ${formattedToday}`,
        sessions: todayGroup,
      });
    }

    const yesterdayGroup = filteredSessions.filter((s) =>
      isSameDay(s.sessionDate, yesterday)
    );
    if (yesterdayGroup.length > 0) {
      groups.push({
        date: yesterday,
        label: `Buổi học hôm qua - ${formattedYesterday}`,
        sessions: yesterdayGroup,
      });
    }

    const twoDaysAgoGroup = filteredSessions.filter((s) =>
      isSameDay(s.sessionDate, twoDaysAgo)
    );
    if (twoDaysAgoGroup.length > 0) {
      groups.push({
        date: twoDaysAgo,
        label: `Buổi học hôm kia - ${formattedTwoDaysAgo}`,
        sessions: twoDaysAgoGroup,
      });
    }

    return groups;
  }, [
    filteredSessions,
    today,
    yesterday,
    twoDaysAgo,
    formattedToday,
    formattedYesterday,
    formattedTwoDaysAgo,
  ]);

  return (
    <TeacherRoute>
      <DashboardLayout
        title="Điểm danh"
        description="Quản lý điểm danh cho các buổi học (có thể sửa trong 48h)"
      >
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo tên khóa học, chủ đề, phòng học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={dateFilter}
              onValueChange={(
                value: "all" | "today" | "yesterday" | "twoDaysAgo"
              ) => setDateFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc theo ngày" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả buổi</SelectItem>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="yesterday">Hôm qua</SelectItem>
                <SelectItem value="twoDaysAgo">Hôm kia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sessions List */}
          {isLoadingSessions ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : hasError ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
              <p>
                Có lỗi xảy ra khi tải danh sách buổi học. Vui lòng thử lại sau.
              </p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground">
                {searchQuery || dateFilter !== "all"
                  ? "Không tìm thấy buổi học nào phù hợp với bộ lọc."
                  : "Không có buổi học nào trong 48 giờ qua."}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedSessions.map((group) => (
                <SessionSection
                  key={format(group.date, "yyyy-MM-dd")}
                  title={group.label.split(" - ")[0]}
                  dateLabel={group.label.split(" - ")[1]}
                  sessions={group.sessions.map((session) => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { sessionDate, ...rest } = session;
                    return rest;
                  })}
                  isLoading={false}
                  error={null}
                />
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </TeacherRoute>
  );
}

function SessionSection({
  title,
  dateLabel,
  sessions,
  isLoading,
  error,
}: {
  title: string;
  dateLabel: string;
  sessions: AttendanceSessionDTO[];
  isLoading: boolean;
  error: unknown;
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground capitalize">
            {dateLabel}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {sessions.length} buổi học
        </Badge>
      </div>

      {/* Danh sách sessions */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
          <p>Có lỗi xảy ra khi tải danh sách buổi học. Vui lòng thử lại sau.</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Không có buổi học nào vào ngày này.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionCard key={session.sessionId} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session }: { session: AttendanceSessionDTO }) {
  const navigate = useNavigate();
  const sessionDate = format(parseISO(session.date), "dd/MM/yyyy", {
    locale: vi,
  });
  const timeRange = `${session.startTime} - ${session.endTime}`;

  const handleAttendanceClick = () => {
    // Always allow navigation to attendance page
    // The actual attendance submission will be checked on the detail page
    navigate(`/teacher/attendance/${session.sessionId}`);
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

          {/* Phòng học và hình thức */}
          {(session.resourceName || session.modality) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {session.resourceName && (
                <span>Phòng/phương tiện: {session.resourceName}</span>
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
          className="text-sm font-medium text-primary hover:underline"
        >
          Điểm danh →
        </button>
      </div>
    </div>
  );
}
