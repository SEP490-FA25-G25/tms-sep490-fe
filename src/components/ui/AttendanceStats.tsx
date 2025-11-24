import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceStatsProps {
  attendanceRate: number;
  totalSessions?: number;
  totalAbsences?: number;
  size?: 'sm' | 'md' | 'lg';
  showGrade?: boolean;
  showDetails?: boolean;
  className?: string;
}

export function AttendanceStats({
  attendanceRate,
  totalSessions = 0,
  totalAbsences = 0,
  size = 'md',
  showGrade = true,
  showDetails = true,
  className
}: AttendanceStatsProps) {
  const presentSessions = totalSessions - totalAbsences;

  const getAttendanceGrade = (rate: number): string => {
    if (rate >= 95) return 'Xuất sắc';
    if (rate >= 85) return 'Tốt';
    if (rate >= 75) return 'Khá';
    if (rate >= 65) return 'Trung bình';
    return 'Cần cải thiện';
  };

  const getAttendanceColor = (rate: number): string => {
    if (rate >= 85) return 'text-success';
    if (rate >= 75) return 'text-warning';
    return 'text-destructive';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          value: 'text-lg font-semibold',
          label: 'text-sm font-medium',
          details: 'text-xs'
        };
      case 'lg':
        return {
          value: 'text-3xl font-bold',
          label: 'text-sm font-medium',
          details: 'text-xs'
        };
      default: // md
        return {
          value: 'text-2xl font-bold',
          label: 'text-sm font-medium',
          details: 'text-xs'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2">
        <TrendingUp className={cn('h-4 w-4', getAttendanceColor(attendanceRate))} />
        <div>
          <span className={cn(sizeClasses.value, getAttendanceColor(attendanceRate))}>
            {attendanceRate.toFixed(1)}%
          </span>
          {showDetails && totalSessions > 0 && (
            <span className={cn(sizeClasses.details, 'text-muted-foreground ml-1')}>
              ({presentSessions}/{totalSessions})
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <TrendingUp className="h-5 w-5" />
        <span className={sizeClasses.label}>Điểm danh</span>
      </div>
      <div className="space-y-1">
        <div className={cn(sizeClasses.value, getAttendanceColor(attendanceRate))}>
          {attendanceRate.toFixed(1)}%
        </div>
        {showDetails && totalSessions > 0 && (
          <p className={cn(sizeClasses.details, 'text-muted-foreground')}>
            {presentSessions}/{totalSessions} buổi
            {showGrade && (
              <span className="ml-1">
                ({getAttendanceGrade(attendanceRate)})
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}