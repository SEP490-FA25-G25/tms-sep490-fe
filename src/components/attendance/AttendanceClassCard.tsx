import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AttendanceCalendarHeatmap } from "./AttendanceCalendarHeatmap";
import { useGetStudentAttendanceReportQuery } from "@/store/services/attendanceApi";

interface AttendanceClassCardProps {
  classId: number;
  classCode: string;
  className: string;
  startDate: string;
  actualEndDate: string | null;
  totalSessions: number;
  attended: number;
  absent: number;
  upcoming: number;
  status: string;
  onClick: () => void;
  onMouseEnter?: () => void;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  ONGOING: {
    label: "Đang học",
    className: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  COMPLETED: {
    label: "Đã kết thúc",
    className: "text-slate-700 bg-slate-50 border-slate-200",
  },
  UPCOMING: {
    label: "Sắp diễn ra",
    className: "text-sky-700 bg-sky-50 border-sky-200",
  },
};

function getStatusMeta(status?: string | null) {
  if (!status) return null;
  return (
    STATUS_LABELS[status] ?? {
      label: status,
      className: "text-slate-700 bg-slate-50 border-slate-200",
    }
  );
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd/MM/yyyy");
}

function AttendanceProgressRing({ attended, absent }: { attended: number; absent: number }) {
  const total = attended + absent;
  const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="transform -rotate-90 w-14 h-14">
        {/* Background Circle (Absent Color - Red) */}
        <circle
          className="text-rose-500"
          strokeWidth="5"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="28"
          cy="28"
        />
        {/* Foreground Circle (Present Color - Green) */}
        <circle
          className="text-emerald-500 transition-all duration-1000 ease-out"
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="28"
          cy="28"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xs font-bold text-foreground">{percentage}%</span>
      </div>
    </div>
  );
}

export function AttendanceClassCard({
  classId,
  // classCode, // Unused
  className,
  startDate,
  actualEndDate,
  totalSessions,
  attended,
  absent,
  upcoming,
  status,
  onClick,
  onMouseEnter,
}: AttendanceClassCardProps) {
  const statusMeta = getStatusMeta(status);

  // Fetch detailed report data for heatmap
  const { data: reportData, isLoading: isLoadingReport } =
    useGetStudentAttendanceReportQuery(
      { classId },
      {
        // Only fetch if we need the heatmap
        skip: false,
      }
    );

  const sessions = reportData?.data?.sessions ?? [];

  return (
    <article
      className="group flex flex-col gap-4 rounded-lg border border-border bg-muted/40 p-5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-full"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Header Info */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h2
            className="text-base font-semibold text-foreground line-clamp-1"
            title={className}
          >
            {className}
          </h2>
          {statusMeta && (
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 text-[10px] px-1.5 py-0 h-5",
                statusMeta.className
              )}
            >
              {statusMeta.label}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDate(startDate)} - {formatDate(actualEndDate)}
        </p>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4">
        <AttendanceProgressRing attended={attended} absent={absent} />

        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground flex-1">
          <div className="flex items-center justify-between gap-2">
            <span>Tổng số buổi</span>
            <span className="font-medium text-foreground">
              {totalSessions}
            </span>
          </div>
          <div className="h-px bg-border/50 w-full my-0.5" />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Có mặt</span>
            </div>
            <span className="font-medium text-emerald-700">{attended}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>Vắng</span>
            </div>
            <span className="font-medium text-rose-700">{absent}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              <span>Sắp tới</span>
            </div>
            <span className="font-medium text-sky-700">{upcoming}</span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="mt-auto pt-4 border-t border-border/50">
        {isLoadingReport ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <AttendanceCalendarHeatmap
            sessions={sessions}
            startDate={startDate}
            endDate={actualEndDate ?? undefined}
          />
        )}
      </div>
    </article>
  );
}
