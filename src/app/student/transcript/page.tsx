import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { StudentRoute } from '@/components/ProtectedRoute';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ENROLLMENT_STATUS_STYLES, getStatusStyle } from '@/lib/status-colors';
import { useGetStudentTranscriptQuery } from '@/store/services/studentApi';
import type { StudentTranscriptDTO } from '@/store/services/studentApi';
import { AlertCircle, BookOpen, GraduationCap } from 'lucide-react';
import TranscriptDetailPanel from './components/TranscriptDetailPanel';

const TranscriptPage = () => {
  const { user } = useAuth();
  const studentId = user?.id || 0;
  const [selectedClass, setSelectedClass] = useState<StudentTranscriptDTO | null>(null);

  const {
    data: transcriptResponse,
    isLoading,
    error,
    refetch,
  } = useGetStudentTranscriptQuery({
    studentId,
  });

  // Sort transcript: ONGOING first, then COMPLETED, then others
  const transcriptData = useMemo(() => {
    const data = transcriptResponse?.data || [];

    const statusPriority: Record<string, number> = {
      'ONGOING': 1,
      'COMPLETED': 2,
      'DROPPED': 3,
    };

    return [...data].sort((a, b) => {
      const priorityA = statusPriority[a.status] || 999;
      const priorityB = statusPriority[b.status] || 999;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      if (a.completedDate && b.completedDate) {
        return new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime();
      }
      if (a.completedDate && !b.completedDate) return 1;
      if (!a.completedDate && b.completedDate) return -1;

      return 0;
    });
  }, [transcriptResponse]);

  // Auto-select first class when data loads
  useMemo(() => {
    if (transcriptData.length > 0 && !selectedClass) {
      setSelectedClass(transcriptData[0]);
    }
  }, [transcriptData, selectedClass]);

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
              {/* Header */}
              <header className="flex flex-col gap-1 border-b border-border px-6 py-4">
                <h1 className="text-2xl font-bold tracking-tight">Bảng điểm</h1>
                <p className="text-sm text-muted-foreground">
                  Xem kết quả học tập và điểm số các lớp học đã tham gia
                </p>
              </header>

              {/* Main Content - 2 Columns Layout */}
              <main className="flex-1 overflow-hidden">
                {isLoading && (
                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(340px,_2fr)_3fr] xl:grid-cols-[minmax(360px,_1fr)_2fr] h-full">
                    <div className="border-r p-4 space-y-3">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Skeleton key={idx} className="h-24 w-full" />
                      ))}
                    </div>
                    <div className="p-6">
                      <Skeleton className="h-full w-full" />
                    </div>
                  </div>
                )}

                {error && !isLoading && (
                  <div className="flex items-center justify-center h-full p-6">
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center max-w-md">
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
                  </div>
                )}

                {!isLoading && !error && transcriptData.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(340px,_2fr)_3fr] xl:grid-cols-[minmax(360px,_1fr)_2fr] h-full">
                    {/* Left Column - Class List */}
                    <div className="border-r border-border flex flex-col min-w-0">
                      <div className="px-4 py-3 border-b bg-muted/30 shrink-0">
                        <p className="text-sm font-medium text-muted-foreground">
                          {transcriptData.length} lớp học
                        </p>
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="p-3 space-y-2">
                          {transcriptData.map((item: StudentTranscriptDTO) => (
                            <Card
                              key={item.classId}
                              className={cn(
                                "p-3 cursor-pointer transition-all hover:bg-muted/50",
                                selectedClass?.classId === item.classId
                                  ? "ring-2 ring-primary bg-primary/5"
                                  : "hover:shadow-sm"
                              )}
                              onClick={() => setSelectedClass(item)}
                            >
                              <div className="space-y-2.5">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-sm leading-tight line-clamp-2">
                                      {item.courseName}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {item.classCode} • {item.className}
                                    </p>
                                  </div>
                                  <Badge
                                    className={cn(
                                      'text-[10px] px-1.5 py-0.5 shrink-0',
                                      getStatusStyle(ENROLLMENT_STATUS_STYLES, item.status)
                                    )}
                                  >
                                    {getStatusText(item.status)}
                                  </Badge>
                                </div>

                                {/* Progress */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                                    <span>Tiến độ</span>
                                    <span className="tabular-nums">{item.completedSessions}/{item.totalSessions}</span>
                                  </div>
                                  <Progress
                                    value={Math.min(
                                      (item.completedSessions / item.totalSessions) * 100,
                                      100
                                    )}
                                    className="h-1.5"
                                  />
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Right Column - Detail Panel */}
                    <div className="flex flex-col overflow-hidden bg-muted/10 min-w-0">
                      {selectedClass ? (
                        <TranscriptDetailPanel selectedClass={selectedClass} />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Empty>
                            <EmptyHeader>
                              <EmptyMedia variant="icon">
                                <GraduationCap className="h-10 w-10" />
                              </EmptyMedia>
                              <EmptyTitle>Chọn một lớp học</EmptyTitle>
                              <EmptyDescription>
                                Chọn một lớp từ danh sách bên trái để xem chi tiết điểm số
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!isLoading && !error && transcriptData.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <BookOpen className="h-10 w-10" />
                        </EmptyMedia>
                        <EmptyTitle>Chưa có dữ liệu điểm số</EmptyTitle>
                        <EmptyDescription>
                          Bạn chưa tham gia lớp học nào hoặc chưa có điểm số.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
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
