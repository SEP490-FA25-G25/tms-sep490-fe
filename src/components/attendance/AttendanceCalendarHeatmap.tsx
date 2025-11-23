import { useMemo } from "react";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
  addWeeks,
} from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AttendanceSession {
  sessionId: number;
  date: string;
  attendanceStatus?: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "PLANNED" | "UNKNOWN" | null;
  startTime?: string;
  endTime?: string;
  teacherName?: string;
  topic?: string;
}

interface AttendanceCalendarHeatmapProps {
  sessions: AttendanceSession[];
  startDate?: string;
  endDate?: string;
}

type CellStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "PLANNED" | "UNKNOWN" | "EMPTY";

function getStatusColor(status: CellStatus): string {
  switch (status) {
    case "PRESENT":
      return "bg-emerald-500 border-emerald-600/20";
    case "ABSENT":
      return "bg-rose-500 border-rose-600/20";
    case "LATE":
    case "EXCUSED":
      return "bg-amber-500 border-amber-600/20";
    case "PLANNED":
      return "bg-sky-100 border-sky-200 dark:bg-sky-900/30 dark:border-sky-800";
    case "UNKNOWN":
    case "EMPTY":
    default:
      return "bg-muted/40 border-transparent";
  }
}

function getStatusLabel(status: CellStatus): string {
  switch (status) {
    case "PRESENT":
      return "Có mặt";
    case "ABSENT":
      return "Vắng";
    case "LATE":
      return "Muộn";
    case "EXCUSED":
      return "Có phép";
    case "PLANNED":
      return "Sắp tới";
    case "UNKNOWN":
      return "Chưa có thông tin";
    case "EMPTY":
    default:
      return "Không có lịch";
  }
}

export function AttendanceCalendarHeatmap({
  sessions,
  startDate,
  endDate,
}: AttendanceCalendarHeatmapProps) {
  const calendarData = useMemo(() => {
    if (!sessions && !startDate) {
      return { weeks: [], sessionMap: new Map() };
    }

    // Parse all session dates and create a map
    const sessionMap = new Map<string, AttendanceSession>();
    (sessions || []).forEach((session) => {
      const dateKey = format(parseISO(session.date), "yyyy-MM-dd");
      sessionMap.set(dateKey, session);
    });

    // Determine date range
    let minDate: Date;
    let maxDate: Date;

    if (startDate) {
      minDate = parseISO(startDate);
    } else if (sessions && sessions.length > 0) {
      const sessionDates = sessions.map((s) => parseISO(s.date));
      minDate = new Date(Math.min(...sessionDates.map((d) => d.getTime())));
    } else {
      minDate = new Date(); // Fallback
    }

    if (endDate) {
      maxDate = parseISO(endDate);
    } else if (sessions && sessions.length > 0) {
      const sessionDates = sessions.map((s) => parseISO(s.date));
      maxDate = new Date(Math.max(...sessionDates.map((d) => d.getTime())));
    } else {
      maxDate = addWeeks(minDate, 12); // Default to 12 weeks if no end date
    }

    // Get the start of the first week (Monday)
    const calendarStart = startOfWeek(minDate, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(maxDate, { weekStartsOn: 1 });

    // Generate weeks
    const weeks: Array<{
      startDate: Date;
      days: Array<{ date: Date; session?: AttendanceSession }>;
    }> = [];
    
    let currentWeekStart = calendarStart;

    while (currentWeekStart <= calendarEnd) {
      const weekDays = eachDayOfInterval({
        start: currentWeekStart,
        end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
      });

      weeks.push({
        startDate: currentWeekStart,
        days: weekDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          return {
            date: day,
            session: sessionMap.get(dateKey),
          };
        }),
      });

      currentWeekStart = addWeeks(currentWeekStart, 1);
    }

    return { weeks, sessionMap };
  }, [sessions, startDate, endDate]);

  if (calendarData.weeks.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        Chưa có dữ liệu điểm danh
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full overflow-hidden">
      <div className="flex flex-col w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        <div className="min-w-max">
          {/* Month Labels */}
          <div className="flex gap-1 ml-8 mb-1 h-4">
            {calendarData.weeks.map((week, i) => {
              let showLabel = false;
              let labelDate = week.startDate;

              if (i === 0) {
                showLabel = true;
              } else {
                const firstOfMonth = week.days.find((d) => d.date.getDate() === 1);
                if (firstOfMonth) {
                  showLabel = true;
                  labelDate = firstOfMonth.date;
                }
              }

              const monthLabel = format(labelDate, "MMM", { locale: vi });

              return (
                <div
                  key={i}
                  className="w-3 text-[10px] text-muted-foreground overflow-visible whitespace-nowrap relative"
                >
                  {showLabel && (
                    <span className="absolute top-0 left-0 capitalize">
                      {monthLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            {/* Day Labels (Mon, Wed, Fri) */}
            <div className="flex flex-col gap-1 pt-px">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day, i) => (
                <div
                  key={day}
                  className="h-3 text-[10px] leading-3 text-muted-foreground w-6 text-right pr-1"
                >
                  {i % 2 === 0 ? day : ""}
                </div>
              ))}
            </div>

            {/* Heatmap Grid */}
            <div className="flex gap-1">
              {calendarData.weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.days.map((day, dayIndex) => {
                    const session = day.session;
                    const status: CellStatus = session
                      ? session.attendanceStatus === "PLANNED" ||
                        !session.attendanceStatus
                        ? "PLANNED"
                        : session.attendanceStatus
                      : "EMPTY";

                    const colorClass = getStatusColor(status);

                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          "h-3 w-3 rounded-[2px] border transition-all",
                          colorClass,
                          session && "cursor-pointer hover:ring-2 hover:ring-ring hover:ring-offset-1 hover:z-10"
                        )}
                        title={
                          `${format(day.date, "dd/MM/yyyy", { locale: vi })}: ${getStatusLabel(status)}` +
                          (session?.teacherName ? `\nGV: ${session.teacherName}` : "") +
                          (session?.topic ? `\nBài: ${session.topic}` : "")
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

