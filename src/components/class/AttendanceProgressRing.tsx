import { cn } from '@/lib/utils';

interface AttendanceProgressRingProps {
  present: number;
  absent: number;
  excused?: number;
  future?: number;
  className?: string;
  size?: number;
  strokeWidth?: number;
  textClassName?: string;
}

export function AttendanceProgressRing({
  present,
  absent,
  excused = 0,
  future = 0,
  className,
  size = 80,
  strokeWidth = 8,
  textClassName,
}: AttendanceProgressRingProps) {
  const total = present + absent;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  if (total === 0) {
    const hasFuture = future > 0;
    const hasExcusedOnly = excused > 0 && !hasFuture;
    return (
      <div 
        className={cn("relative flex items-center justify-center shrink-0", className)} 
        style={{ width: size, height: size }}
        role="img"
        aria-label={hasExcusedOnly ? "Chỉ có buổi vắng có phép" : hasFuture ? "Chưa có buổi học nào diễn ra" : "Không có dữ liệu"}
      >
        <svg className="transform -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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
        <div className="absolute text-xs text-muted-foreground font-medium">
          {hasExcusedOnly ? "Có phép" : hasFuture ? "Chờ" : "N/A"}
        </div>
      </div>
    );
  }

  const presentPercentage = present / total;
  const presentOffset = circumference - (presentPercentage * circumference);

  // Calculate percentage to display (Present / (Present + Absent))
  const displayPercentage = Math.round((present / total) * 100);

  // Determine color based on percentage
  const getProgressColor = () => {
    if (displayPercentage >= 80) return "text-emerald-500";
    if (displayPercentage >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div 
      className={cn("relative flex items-center justify-center shrink-0", className)} 
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={displayPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Tỉ lệ có mặt: ${displayPercentage}%`}
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
          strokeDashoffset={presentOffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
      </svg>
      
      {/* Center Text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className={cn(
          "font-bold tabular-nums",
          size >= 80 ? "text-xl" : size >= 64 ? "text-base" : "text-sm",
          textClassName
        )}>
          {displayPercentage}%
        </span>
      </div>
    </div>
  );
}

