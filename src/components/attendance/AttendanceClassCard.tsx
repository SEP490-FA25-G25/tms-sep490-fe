import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { CLASS_STATUS_STYLES, ENROLLMENT_STATUS_STYLES, getStatusStyle } from "@/lib/status-colors";

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
  enrollmentStatus?: string; // ENROLLED, TRANSFERRED, COMPLETED
  onClick: () => void;
}

const CLASS_STATUS_LABELS: Record<string, string> = {
  ONGOING: "Đang học",
  COMPLETED: "Đã hoàn thành",
  UPCOMING: "Đã lên lịch",
  SCHEDULED: "Đã lên lịch",
  CANCELLED: "Đã hủy",
  DRAFT: "Bản nháp",
};

const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  ENROLLED: "Đang học",
  TRANSFERRED: "Đã chuyển lớp",
  COMPLETED: "Đã hoàn thành",
  DROPPED: "Đã hủy",
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
  upcoming?: number;
  size?: number;
}

function AttendanceProgressRing({ attended, absent, excused = 0, upcoming = 0, size = 80 }: ProgressRingProps) {
  // Proportional radius based on size - thicker ring
  const innerRadius = size * 0.32;
  const outerRadius = size * 0.48;

  // Tính tỷ lệ chuyên cần = có mặt / (có mặt + vắng không phép)
  const attendedAndAbsent = attended + absent;
  const percentage = attendedAndAbsent > 0 ? Math.round((attended / attendedAndAbsent) * 100) : 0;
  
  const total = attended + absent + excused + upcoming;
  const hasNoData = total === 0;

  // Colors matching the legend
  const COLORS = {
    attended: "#10b981",  // emerald-500
    absent: "#f43f5e",    // rose-500
    excused: "#6366f1",   // indigo-500
    upcoming: "#0ea5e9",  // sky-500
    empty: "#e5e7eb",     // gray-200
  };

  // Trường hợp không có dữ liệu
  if (hasNoData) {
    return (
      <div 
        className="relative shrink-0 flex items-center justify-center" 
        style={{ width: size, height: size }}
        role="img"
        aria-label="Chưa có dữ liệu điểm danh"
      >
        <ResponsiveContainer width={size} height={size}>
          <RePieChart>
            <Pie
              data={[{ name: "Chưa có dữ liệu", value: 1 }]}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={0}
              dataKey="value"
            >
              <Cell fill={COLORS.empty} />
            </Pie>
          </RePieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-medium text-muted-foreground">N/A</span>
        </div>
      </div>
    );
  }

  // Build chart data - chỉ thêm những phần có giá trị > 0
  const chartData = [];
  if (attended > 0) chartData.push({ name: "Có mặt", value: attended, color: COLORS.attended });
  if (absent > 0) chartData.push({ name: "Vắng", value: absent, color: COLORS.absent });
  if (excused > 0) chartData.push({ name: "Có phép", value: excused, color: COLORS.excused });
  if (upcoming > 0) chartData.push({ name: "Sắp tới", value: upcoming, color: COLORS.upcoming });

  return (
    <div 
      className="relative shrink-0 overflow-visible" 
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Tỉ lệ có mặt: ${percentage}%`}
    >
      <ResponsiveContainer width={size} height={size}>
        <RePieChart>
          <Pie
            data={chartData}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
            allowEscapeViewBox={{ x: true, y: true }}
            position={{ x: size + 8, y: size / 2 - 20 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0];
                const value = data.value as number;
                const name = data.name as string;
                const pct = total > 0 ? (value / total) * 100 : 0;
                return (
                  <div className="rounded-lg border bg-background px-3 py-2 shadow-lg whitespace-nowrap">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">
                      {value} buổi ({pct.toFixed(1)}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </RePieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
  enrollmentStatus,
  onClick,
}: AttendanceClassCardProps) {
  // Use enrollmentStatus if available, otherwise fallback to class status
  const displayStatus = enrollmentStatus || status;
  const statusLabel = enrollmentStatus 
    ? ENROLLMENT_STATUS_LABELS[enrollmentStatus] || enrollmentStatus
    : getStatusLabel(status);
  const statusClassName = enrollmentStatus
    ? getStatusStyle(ENROLLMENT_STATUS_STYLES, enrollmentStatus)
    : getStatusStyle(CLASS_STATUS_STYLES, status);

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
      <div className="flex items-center gap-6">
        <AttendanceProgressRing attended={attended} absent={absent} excused={excused} upcoming={upcoming} size={80} />

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
