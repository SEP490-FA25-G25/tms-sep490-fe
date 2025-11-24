import { cn } from '@/lib/utils';

interface AttendanceProgressRingProps {
  present: number;
  absent: number;
  future: number;
  className?: string;
  size?: number;
  strokeWidth?: number;
  textClassName?: string;
}

export function AttendanceProgressRing({
  present,
  absent,
  future,
  className,
  size = 80,
  strokeWidth = 8,
  textClassName,
}: AttendanceProgressRingProps) {
  const total = present + absent + future;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
        <div className="text-xs text-muted-foreground">N/A</div>
      </div>
    );
  }

  // Layering approach:
  // 1. Gray (Future) - Bottom layer, full circle (represents Total)
  // 2. Red (Absent) - Middle layer, represents (Present + Absent)
  // 3. Green (Present) - Top layer, represents Present

  const presentPercentage = present / total;
  const presentAbsentPercentage = (present + absent) / total;

  const presentOffset = circumference - (presentPercentage * circumference);
  const presentAbsentOffset = circumference - (presentAbsentPercentage * circumference);

  // Calculate percentage to display (Present / Total)
  const displayPercentage = Math.round((present / total) * 100);

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background Circle (Future - Gray) */}
        <circle
          className="text-slate-100 dark:text-slate-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        
        {/* Middle Circle (Absent - Red) */}
        <circle
          className="text-rose-500 transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={presentAbsentOffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />

        {/* Top Circle (Present - Green) */}
        <circle
          className="text-emerald-500 transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={presentOffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      
      {/* Center Text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className={cn("text-xl font-bold text-foreground", textClassName)}>
          {displayPercentage}%
        </span>
      </div>
    </div>
  );
}
