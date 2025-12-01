import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CLASS_STATUS_STYLES, getStatusStyle } from "@/lib/status-colors";

interface AttendanceClassCardProps {
  classCode: string;
  className: string;
  startDate: string;
  actualEndDate: string | null;
  totalSessions: number;
  attended: number;
  absent: number;
  excused?: number;
  upcoming: number;
  status: string;
  onClick: () => void;
}

const CLASS_STATUS_LABELS: Record<string, string> = {
  ONGOING: "Đang học",
  COMPLETED: "Đã kết thúc",
  UPCOMING: "Sắp diễn ra",
  SCHEDULED: "Sắp diễn ra",
  CANCELLED: "Đã hủy",
  DRAFT: "Nháp",
};

function getStatusLabel(status?: string | null) {
  if (!status) return null;
  return CLASS_STATUS_LABELS[status] ?? status;
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd/MM/yyyy");
}

interface ProgressRingProps {
  attended: number;
  absent: number;
  excused?: number;
  size?: number;
}

function AttendanceProgressRing({ attended, absent, excused = 0, size = 64 }: ProgressRingProps) {
  // Tỷ lệ chuyên cần = có mặt / (có mặt + vắng không phép)
  // EXCUSED không tính vào mẫu số vì đã xin phép
  const total = attended + absent;
  const totalWithExcused = attended + absent + excused;
  const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
  const hasOnlyExcused = total === 0 && excused > 0;
  
  // Proportional calculations
  const strokeWidth = size * 0.1; // 10% of size
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  // Determine color based on percentage
  const getProgressColor = () => {
    if (percentage >= 80) return "text-emerald-500";
    if (percentage >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  // Trường hợp đặc biệt: chỉ có buổi vắng có phép
  if (hasOnlyExcused) {
    return (
      <div 
        className="relative shrink-0 flex items-center justify-center" 
        style={{ width: size, height: size }}
        role="img"
        aria-label={`Chỉ có ${excused} buổi vắng có phép`}
      >
        <svg 
          className="transform -rotate-90" 
          width={size} 
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            className="text-muted/30"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={center}
            cy={center}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-muted-foreground">Có phép</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative shrink-0" 
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Tỉ lệ có mặt: ${percentage}% (${attended}/${totalWithExcused} buổi)`}
    >
      <svg 
        className="transform -rotate-90" 
        width={size} 
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Track (background circle) */}
        <circle
          className="text-muted/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
        {/* Progress indicator */}
        <circle
          className={cn(
            getProgressColor(),
            "transition-all duration-700 ease-out"
          )}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
          style={{
            // Animation on mount
            animation: "progress-ring 1s ease-out forwards",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground tabular-nums">
          {percentage}%
        </span>
      </div>
    </div>
  );
}

export function AttendanceClassCard({
  // classCode, // Unused
  className,
  startDate,
  actualEndDate,
  totalSessions,
  attended,
  absent,
  excused = 0,
  upcoming,
  status,
  onClick,
}: AttendanceClassCardProps) {
  const statusLabel = getStatusLabel(status);
  const statusClassName = getStatusStyle(CLASS_STATUS_STYLES, status);

  return (
    <Card
      className="group flex flex-col gap-4 p-5 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-full cursor-pointer"
      onClick={onClick}
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
          {statusLabel && (
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 text-[10px] px-1.5 py-0 h-5",
                statusClassName
              )}
            >
              {statusLabel}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDate(startDate)} - {formatDate(actualEndDate)}
        </p>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-5">
        <AttendanceProgressRing attended={attended} absent={absent} excused={excused} size={64} />

        <div className="flex-1 space-y-2 text-sm">
          {/* Total sessions */}
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="text-muted-foreground">Tổng số buổi</span>
            <span className="font-semibold text-foreground tabular-nums">
              {totalSessions}
            </span>
          </div>
          
          {/* Stats grid */}
          <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-muted-foreground">Có mặt</span>
            </div>
            <span className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums text-right">
              {attended}
            </span>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="text-muted-foreground">Vắng</span>
            </div>
            <span className="font-medium text-rose-600 dark:text-rose-400 tabular-nums text-right">
              {absent}
            </span>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
              <span className="text-muted-foreground">Có phép</span>
            </div>
            <span className="font-medium text-indigo-600 dark:text-indigo-400 tabular-nums text-right">
              {excused}
            </span>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
              <span className="text-muted-foreground">Sắp tới</span>
            </div>
            <span className="font-medium text-sky-600 dark:text-sky-400 tabular-nums text-right">
              {upcoming}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
