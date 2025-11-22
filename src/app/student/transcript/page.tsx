import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { StudentRoute } from '@/components/ProtectedRoute';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useGetStudentTranscriptQuery } from '@/store/services/studentApi';
import type { StudentTranscriptDTO } from '@/store/services/studentApi';
import { AlertCircle, BookOpen, TrendingUp } from 'lucide-react';

const TranscriptPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id || 0;

  const {
    data: transcriptResponse,
    isLoading,
    error,
    refetch,
  } = useGetStudentTranscriptQuery({
    studentId,
  });

  const transcriptData = useMemo(
    () => transcriptResponse?.data || [],
    [transcriptResponse]
  );

  // Calculate GPA from completed classes with scores
  const gpa = useMemo(() => {
    const completedClassesWithScores = transcriptData.filter(
      item => item.status === 'COMPLETED' && item.averageScore !== null && item.averageScore !== undefined
    );

    if (completedClassesWithScores.length === 0) return null;

    const totalScore = completedClassesWithScores.reduce(
      (sum, item) => sum + (item.averageScore || 0), 0
    );

    return (totalScore / completedClassesWithScores.length).toFixed(2);
  }, [transcriptData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONGOING':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COMPLETED':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'DROPPED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ONGOING':
        return 'Đang học';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'DROPPED':
        return 'Đã nghỉ';
      default:
        return status;
    }
  };

  const formatScore = (score?: number) => {
    return score !== null && score !== undefined ? score.toFixed(1) : '—';
  };

  // Format component scores for tooltip
  const formatComponentScores = (componentScores: Record<string, number>) => {
    const entries = Object.entries(componentScores);
    if (entries.length === 0) return 'Chưa có điểm';

    return entries.map(([name, score]) => `${name}: ${score.toFixed(1)}`).join('\n');
  };

  return (
    <StudentRoute>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col">
              <header className="flex flex-col gap-2 border-b border-border px-6 py-5">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Bảng điểm
                </h1>
                <p className="text-sm text-muted-foreground">
                  Xem kết quả học tập và điểm số các lớp học đã tham gia
                </p>
                {gpa && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium">Điểm trung bình chung (GPA):</span>
                    <span className="text-lg font-semibold text-emerald-600">{gpa}</span>
                  </div>
                )}
              </header>

              <main className="flex-1 px-6 py-6 md:px-8 md:py-8">
                {isLoading && (
                  <div className="rounded-lg border">
                    <div className="p-4 space-y-3">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Skeleton key={idx} className="h-12 w-full" />
                      ))}
                    </div>
                  </div>
                )}

                {error && !isLoading && (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Không thể tải bảng điểm
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vui lòng thử lại sau ít phút.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                      Thử lại
                    </Button>
                  </div>
                )}

                {!isLoading && !error && transcriptData.length > 0 && (
                  <div className="space-y-6">
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-32">Mã lớp</TableHead>
                            <TableHead>Tên môn</TableHead>
                            <TableHead className="w-48">Giáo viên</TableHead>
                            <TableHead className="w-32 text-center">
                              Điểm TB
                            </TableHead>
                            <TableHead className="w-32 text-center">
                              Tiến độ
                            </TableHead>
                            <TableHead className="w-32 text-center">
                              Trạng thái
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transcriptData.map((transcriptItem: StudentTranscriptDTO) => (
                            <TableRow
                              key={transcriptItem.classId}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() =>
                                navigate(
                                  `/student/my-classes/${transcriptItem.classId}?tab=assessments`
                                )
                              }
                              title={
                                Object.keys(transcriptItem.componentScores).length > 0
                                  ? formatComponentScores(transcriptItem.componentScores)
                                  : undefined
                              }
                            >
                              <TableCell className="font-medium">
                                {transcriptItem.classCode}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-medium">
                                    {transcriptItem.courseName}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {transcriptItem.className}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {transcriptItem.teacherName}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="space-y-1">
                                  <span className="font-semibold">
                                    {formatScore(transcriptItem.averageScore)}
                                  </span>
                                  {Object.keys(transcriptItem.componentScores).length > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      {Object.keys(transcriptItem.componentScores).length} điểm thành phần
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="text-sm">
                                  {transcriptItem.completedSessions}/{transcriptItem.totalSessions}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div
                                    className="bg-blue-600 h-1.5 rounded-full"
                                    style={{
                                      width: `${Math.min(
                                        (transcriptItem.completedSessions / transcriptItem.totalSessions) * 100,
                                        100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  className={cn(
                                    'text-xs',
                                    getStatusColor(transcriptItem.status)
                                  )}
                                >
                                  {getStatusText(transcriptItem.status)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {!isLoading && !error && transcriptData.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/10 p-10 text-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-foreground">
                        Chưa có dữ liệu điểm số
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Bạn chưa tham gia lớp học nào hoặc chưa có điểm số.
                      </p>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </StudentRoute>
  );
};

export default TranscriptPage;
