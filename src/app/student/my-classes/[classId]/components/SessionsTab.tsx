import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import AttendanceSessionsTable, { type AttendanceSessionRow } from '@/components/attendance/AttendanceSessionsTable';
import type { StudentAttendanceReportSessionDTO } from '@/store/services/attendanceApi';
import type { ClassSessionsResponseDTO, ClassDetailDTO } from '@/types/studentClass';

interface SessionsTabProps {
  sessionsData: ClassSessionsResponseDTO | undefined;
  isLoading: boolean;
  classDetail?: ClassDetailDTO;
  reportSessions?: StudentAttendanceReportSessionDTO[];
}

type SessionFilter = 'all' | 'upcoming' | 'past';

const SessionsTab: React.FC<SessionsTabProps> = ({ sessionsData, isLoading, reportSessions }) => {
  const [filter, setFilter] = useState<SessionFilter>('all');

  const { upcomingSessions, pastSessions, studentSessions } = useMemo(
    () => ({
      upcomingSessions: sessionsData?.upcomingSessions || [],
      pastSessions: sessionsData?.pastSessions || [],
      studentSessions: sessionsData?.studentSessions || [],
    }),
    [sessionsData]
  );

  const studentSessionMap = useMemo(() => {
    return new Map(studentSessions.map((ss) => [ss.sessionId, ss]));
  }, [studentSessions]);

  const reportSessionMap = useMemo(() => {
    return new Map((reportSessions || []).map((session) => [session.sessionId, session]));
  }, [reportSessions]);

  const allSessions = useMemo(() => {
    return [...upcomingSessions, ...pastSessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [upcomingSessions, pastSessions]);

  const filteredSessions = useMemo(() => {
    const now = new Date();
    if (filter === 'upcoming') {
      return allSessions.filter((s) => new Date(s.date) >= now);
    }
    if (filter === 'past') {
      return allSessions.filter((s) => new Date(s.date) < now);
    }
    return allSessions;
  }, [allSessions, filter]);

  const summary = useMemo(() => {
    const total = allSessions.length;
    const regularPresent = studentSessions.filter((s) => s.attendanceStatus === 'PRESENT' && !s.isMakeup).length;
    const makeupPresent = studentSessions.filter((s) => s.attendanceStatus === 'PRESENT' && s.isMakeup).length;
    const present = regularPresent + makeupPresent;
    const absent = studentSessions.filter((s) => s.attendanceStatus === 'ABSENT').length;
    const excused = studentSessions.filter((s) => s.attendanceStatus === 'EXCUSED').length;
    const upcomingCount = upcomingSessions.length;
    const completed = present + absent + excused;
    const attendanceRate = (present + absent) > 0 ? (present / (present + absent)) * 100 : 0;
    return { total, present, regularPresent, makeupPresent, absent, excused, upcomingCount, completed, attendanceRate };
  }, [allSessions.length, studentSessions, upcomingSessions.length]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lịch học</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Lịch học & Điểm danh</h3>
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(value) => setFilter(value as SessionFilter)}
          className="border rounded-lg p-1"
        >
          <ToggleGroupItem value="all" className="text-sm">
            Tất cả
          </ToggleGroupItem>
          <ToggleGroupItem value="upcoming" className="text-sm">
            Sắp tới
          </ToggleGroupItem>
          <ToggleGroupItem value="past" className="text-sm">
            Đã diễn ra
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-7">
        <div className="rounded-lg border bg-muted/10 p-3 shadow-sm">
          <p className="text-xs text-muted-foreground">Tổng số buổi</p>
          <p className="text-sm font-semibold text-foreground">
            {summary.total > 0 ? `${summary.completed} / ${summary.total}` : '—'}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/10 p-3 shadow-sm">
          <p className="text-xs text-muted-foreground">Có mặt</p>
          <p className="text-sm font-semibold text-emerald-700">{summary.regularPresent}</p>
        </div>
        <div className="rounded-lg border bg-muted/10 p-3 shadow-sm">
          <p className="text-xs text-muted-foreground">Học bù</p>
          <p className="text-sm font-semibold text-blue-700">{summary.makeupPresent}</p>
        </div>
        <div className="rounded-lg border bg-muted/10 p-3 shadow-sm">
          <p className="text-xs text-muted-foreground">Vắng không phép</p>
          <p className="text-sm font-semibold text-rose-700">{summary.absent}</p>
        </div>
        <div className="rounded-lg border bg-muted/10 p-3 shadow-sm">
          <p className="text-xs text-muted-foreground">Vắng có phép</p>
          <p className="text-sm font-semibold text-indigo-700">{summary.excused}</p>
        </div>
        <div className="rounded-lg border bg-muted/10 p-3 shadow-sm">
          <p className="text-xs text-muted-foreground">Sắp tới</p>
          <p className="text-sm font-semibold text-foreground">{summary.upcomingCount}</p>
        </div>
        <div className="rounded-lg border bg-muted/10 p-3 md:col-span-1 col-span-2 shadow-sm">
          <p className="text-xs text-muted-foreground">Chuyên cần</p>
          <p className="text-sm font-semibold text-foreground">{summary.attendanceRate.toFixed(1)}%</p>
        </div>
      </div>

      <AttendanceSessionsTable
        rows={filteredSessions.map((session, idx) => {
          const studentSession = studentSessionMap.get(session.id);
          const reportSession = reportSessionMap.get(session.id);
          const isCancelled = session.status === 'CANCELLED';
          const isPast = new Date(session.date) < new Date();

          const attendanceStatus =
            studentSession?.attendanceStatus ??
            reportSession?.attendanceStatus ??
            (isCancelled || isPast ? 'PLANNED' : 'PLANNED');

          return {
            id: session.id,
            order: reportSession?.sessionNumber ?? idx + 1,
            date: session.date,
            startTime: session.startTime || reportSession?.startTime,
            endTime: session.endTime || reportSession?.endTime,
            room: reportSession?.classroomName ?? session.room,
            teacher: reportSession?.teacherName ?? session.teachers[0],
            attendanceStatus,
            note: reportSession?.note ?? session.teacherNote ?? studentSession?.note,
            // Makeup session fields
            isMakeup: studentSession?.isMakeup ?? false,
            makeupSessionId: studentSession?.makeupSessionId,
            originalSessionId: studentSession?.originalSessionId,
          } as AttendanceSessionRow;
        })}
        emptyMessage="Không có buổi học trong bộ lọc này."
      />
    </div>
  );
};

export default SessionsTab;
