import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceStats } from "@/components/ui/AttendanceStats";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock, TrendingUp } from "lucide-react";
import type { StudentAttendanceOverviewClassDTO } from "@/store/services/attendanceApi";
import { cn } from "@/lib/utils";

interface AttendanceSummaryProps {
  classes: StudentAttendanceOverviewClassDTO[];
  className?: string;
}

export function AttendanceSummary({ classes, className }: AttendanceSummaryProps) {
  if (!classes || classes.length === 0) {
    return null;
  }

  // Calculate overall statistics
  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => c.status === 'ONGOING').length;

  const totalAttended = classes.reduce((sum, c) => sum + c.attended, 0);
  const totalAbsent = classes.reduce((sum, c) => sum + c.absent, 0);
  const totalUpcoming = classes.reduce((sum, c) => sum + c.upcoming, 0);

  const overallAttendanceRate = totalAttended + totalAbsent > 0
    ? (totalAttended / (totalAttended + totalAbsent)) * 100
    : 0;

  const getOverallStatusColor = (rate: number) => {
    if (rate >= 85) return 'bg-success/10 text-success border-success/20';
    if (rate >= 75) return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  const getOverallStatusText = (rate: number) => {
    if (rate >= 95) return 'Xuất sắc';
    if (rate >= 85) return 'Tốt';
    if (rate >= 75) return 'Khá';
    if (rate >= 65) return 'Trung bình';
    return 'Cần cải thiện';
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Attendance Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tỷ lệ điểm danh tổng thể
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">
              {overallAttendanceRate.toFixed(1)}%
            </div>
            <Badge className={cn("text-xs", getOverallStatusColor(overallAttendanceRate))}>
              {getOverallStatusText(overallAttendanceRate)}
            </Badge>
          </CardContent>
        </Card>

        {/* Active Classes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Lớp đang học
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">
              {activeClasses}
            </div>
            <p className="text-xs text-muted-foreground">
              trên {totalClasses} lớp tổng cộng
            </p>
          </CardContent>
        </Card>

        {/* Completed Sessions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Buổi đã tham dự
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">
              {totalAttended}
            </div>
            <p className="text-xs text-muted-foreground">
              trên {totalAttended + totalAbsent} buổi đã diễn ra
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Buổi sắp tới
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">
              {totalUpcoming}
            </div>
            <p className="text-xs text-muted-foreground">
              buổi học sắp diễn ra
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Attendance Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Chi tiết điểm danh</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceStats
            attendanceRate={overallAttendanceRate}
            totalSessions={totalAttended + totalAbsent}
            totalAbsences={totalAbsent}
            size="md"
            showGrade={true}
            showDetails={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}