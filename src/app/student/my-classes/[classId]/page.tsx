import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft, Calendar, Clock, MapPin, Users, CheckCircle, TrendingUp } from 'lucide-react';
import { useGetClassDetailQuery, useGetClassSessionsQuery, useGetClassAssessmentsQuery, useGetStudentAssessmentScoresQuery, useGetClassmatesQuery } from '@/store/services/studentClassApi';
import { useGetStudentAttendanceReportQuery } from '@/store/services/attendanceApi';
import { CLASS_STATUSES, MODALITIES } from '@/types/studentClass';
import type { StudentSessionDTO } from '@/types/studentClass';
import { cn } from '@/lib/utils';
import { AppSidebar } from '@/components/app-sidebar';
import { StudentRoute } from '@/components/ProtectedRoute';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';

import SessionsTab from './components/SessionsTab';
import AssessmentsTab from './components/AssessmentsTab';
import ClassmatesTab from './components/ClassmatesTab';
import AnnouncementsTab from './components/AnnouncementsTab';

const ClassDetailPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id || 0;

  const [activeTab, setActiveTab] = useState('sessions');

  const classIdNumber = Number(classId);
  const isValidClassId = Number.isFinite(classIdNumber);

  const {
    data: classDetailResponse,
    isLoading: isDetailLoading,
    error: detailError,
  } = useGetClassDetailQuery({ classId: classIdNumber }, { skip: !isValidClassId });

  const {
    data: sessionsResponse,
    isLoading: isSessionsLoading,
  } = useGetClassSessionsQuery(
    { classId: classIdNumber, studentId },
    { skip: !classDetailResponse || !isValidClassId }
  );

  const {
    data: assessmentsResponse,
    isLoading: isAssessmentsLoading,
  } = useGetClassAssessmentsQuery(
    { classId: classIdNumber },
    { skip: !classDetailResponse || !isValidClassId }
  );

  const {
    data: scoresResponse,
  } = useGetStudentAssessmentScoresQuery(
    { classId: classIdNumber, studentId },
    { skip: !classDetailResponse || !isValidClassId }
  );

  const {
    data: classmatesResponse,
    isLoading: isClassmatesLoading,
  } = useGetClassmatesQuery(
    { classId: classIdNumber },
    { skip: !classDetailResponse || !isValidClassId }
  );

  const { data: attendanceReportResponse } = useGetStudentAttendanceReportQuery(
    { classId: classIdNumber },
    { skip: !isValidClassId }
  );

  const classDetail = classDetailResponse?.data;
  const sessionsData = sessionsResponse?.data;
  const assessments = assessmentsResponse?.data;
  const scores = scoresResponse?.data;
  const classmates = classmatesResponse?.data;
  const attendanceReportSessions = attendanceReportResponse?.data?.sessions;

  const attendanceRate = useMemo(() => {
    if (!sessionsData?.studentSessions || !sessionsData.studentSessions.length) return 0;
    const present = sessionsData.studentSessions.filter((s: StudentSessionDTO) => s.attendanceStatus === 'PRESENT').length;
    return (present / sessionsData.studentSessions.length) * 100;
  }, [sessionsData]);

  const sessionStats = useMemo(() => {
    const sessions = sessionsData?.studentSessions || [];
    const completed = sessions.filter((s: StudentSessionDTO) => s.attendanceStatus !== 'PLANNED').length;
    return { completed, total: sessions.length };
  }, [sessionsData]);

  const getScheduleDaysText = (days: number[] | null | undefined) => {
    if (!days || !Array.isArray(days)) return 'Chưa có lịch học';
    const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    return days.map((day) => dayNames[day - 1] || '').filter(Boolean).join(', ');
  };

  const renderHeader = () => {
    if (isDetailLoading) {
      return (
        <header className="border-b border-border px-6 py-5">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </header>
      );
    }

    if (detailError || !classDetail) {
      return (
        <header className="border-b border-border px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => navigate('/student/my-classes')}
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
              <p className="text-sm text-muted-foreground">Không thể tải thông tin lớp học</p>
            </div>
            <Button size="sm" onClick={() => navigate(0)}>
              Thử lại
            </Button>
          </div>
        </header>
      );
    }

    const nextSession = classDetail.upcomingSessions?.[0];

    return (
      <header className="border-b border-border px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 flex items-center gap-2"
              onClick={() => navigate('/student/my-classes')}
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn('text-xs', {
                  'bg-emerald-50 text-emerald-700 border-emerald-200': classDetail.status === 'ONGOING',
                  'bg-indigo-50 text-indigo-700 border-indigo-200': classDetail.status === 'SCHEDULED',
                  'bg-slate-50 text-slate-700 border-slate-200': classDetail.status === 'COMPLETED',
                })}>
                  {CLASS_STATUSES[classDetail.status]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {MODALITIES[classDetail.modality]}
                </Badge>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {classDetail.code} · {classDetail.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{classDetail.scheduleSummary}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{classDetail.branch.name}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[140px] rounded-lg border border-border/80 bg-muted/20 px-3 py-2">
              <p className="text-xs text-muted-foreground">Điểm danh</p>
              <p className="text-lg font-semibold text-foreground">{attendanceRate.toFixed(1)}%</p>
            </div>
            <div className="min-w-[140px] rounded-lg border border-border/80 bg-muted/20 px-3 py-2">
              <p className="text-xs text-muted-foreground">Tiến độ</p>
              <p className="text-lg font-semibold text-foreground">
                {sessionStats.total > 0
                  ? `${sessionStats.completed}/${sessionStats.total} buổi`
                  : 'Đang cập nhật'}
              </p>
            </div>
            {nextSession && (
              <div className="min-w-[180px] rounded-lg border border-border/80 bg-muted/20 px-3 py-2">
                <p className="text-xs text-muted-foreground">Buổi tiếp theo</p>
                <p className="text-sm font-semibold text-foreground">
                  {new Date(nextSession.date).toLocaleDateString('vi-VN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {nextSession.startTime} - {nextSession.endTime}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>
    );
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
              {renderHeader()}

              <main className="flex-1 space-y-6 px-6 py-6 md:px-8 md:py-8">
                {isDetailLoading && (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <Skeleton className="h-5 w-32" />
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <div key={idx} className="space-y-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <Skeleton className="h-5 w-40" />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Array.from({ length: 4 }).map((_, idx) => (
                          <div key={idx} className="space-y-2">
                            <Skeleton className="h-3 w-28" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {!isDetailLoading && detailError && (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-8 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <p className="text-base font-semibold text-foreground">Không thể tải thông tin lớp học</p>
                    <p className="text-sm text-muted-foreground">Vui lòng thử lại hoặc quay lại danh sách lớp.</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate('/student/my-classes')}>
                        Quay lại
                      </Button>
                      <Button size="sm" onClick={() => navigate(0)}>
                        Thử lại
                      </Button>
                    </div>
                  </div>
                )}

                {!isDetailLoading && classDetail && (
                  <>
                    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold">Thông tin chung</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Khóa học</p>
                                <p className="text-sm font-medium text-foreground">{classDetail.course.name}</p>
                                <p className="text-xs text-muted-foreground">Mã khóa: {classDetail.course.code}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Hình thức</p>
                                <p className="text-sm font-medium text-foreground">{MODALITIES[classDetail.modality]}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Sĩ số</p>
                                <p className="text-sm font-medium text-foreground">
                                  {classDetail.enrollmentSummary.totalEnrolled}/{classDetail.maxCapacity} học viên
                                </p>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Giáo viên</p>
                                <div className="space-y-1">
                                  {classDetail.teachers.map((teacher, index) => (
                                    <div key={teacher.id ?? `${teacher.name}-${index}`} className="flex items-center gap-2 text-sm">
                                      <Users className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-foreground">
                                        {teacher.name}
                                        {teacher.isPrimary && (
                                          <Badge variant="secondary" className="ml-2 text-[11px]">
                                            Chủ nhiệm
                                          </Badge>
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Địa điểm</p>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm text-foreground">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{classDetail.branch.name}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground ml-6">{classDetail.branch.address}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Lịch học</p>
                                <div className="space-y-1 text-sm text-foreground">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{getScheduleDaysText(classDetail.scheduleDays)}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground ml-6">{classDetail.scheduleSummary}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold">Lịch học & Tiến độ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <CheckCircle className="h-5 w-5 text-emerald-600" />
                              Điểm danh
                            </div>
                            <span className="text-sm font-semibold text-emerald-700">{attendanceRate.toFixed(1)}%</span>
                          </div>

                          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <TrendingUp className="h-5 w-5 text-indigo-600" />
                              Điểm trung bình
                            </div>
                            <span className="text-sm font-semibold text-indigo-700">
                              {scores && scores.length > 0
                                ? (scores.reduce((acc, score) => acc + (score.score || 0), 0) / scores.length).toFixed(1)
                                : 'N/A'}
                            </span>
                          </div>

                          {classDetail.upcomingSessions?.length > 0 && (
                            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Clock className="h-5 w-5 text-amber-600" />
                                Buổi tiếp theo
                              </div>
                              <p className="text-sm text-foreground">
                                {new Date(classDetail.upcomingSessions[0].date).toLocaleDateString('vi-VN', {
                                  weekday: 'long',
                                  day: '2-digit',
                                  month: '2-digit',
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {classDetail.upcomingSessions[0].startTime} - {classDetail.upcomingSessions[0].endTime}
                              </p>
                              {classDetail.upcomingSessions[0].room && (
                                <p className="text-xs text-muted-foreground">📍 {classDetail.upcomingSessions[0].room}</p>
                              )}
                            </div>
                          )}

                          <div className="border-t pt-3 text-sm text-foreground">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Bắt đầu:</span>
                              <span className="font-medium">
                                {new Date(classDetail.startDate).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            {classDetail.plannedEndDate && (
                              <div className="mt-1 flex justify-between">
                                <span className="text-muted-foreground">Kết thúc:</span>
                                <span className="font-medium">
                                  {new Date(classDetail.plannedEndDate).toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </section>

                    <section className="space-y-2">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
                        <div
                          className="sticky z-20 -mx-6 -mt-2 bg-background/95 backdrop-blur px-6 md:-mx-8 md:px-8"
                          style={{ top: 'calc(var(--header-height) + 0.5rem)' }}
                        >
                          <TabsList className="h-auto gap-2 bg-transparent p-0">
                            <TabsTrigger
                              value="sessions"
                              className="rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary"
                            >
                              Lịch học
                            </TabsTrigger>
                            <TabsTrigger
                              value="assessments"
                              className="rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary"
                            >
                              Bài kiểm tra
                            </TabsTrigger>
                            <TabsTrigger
                              value="classmates"
                              className="rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary"
                            >
                              Thành viên
                            </TabsTrigger>
                          </TabsList>
                        </div>

                        <TabsContent value="sessions" className="mt-0 space-y-4">
                          <SessionsTab
                            sessionsData={sessionsData}
                            isLoading={isSessionsLoading}
                            classDetail={classDetail}
                            reportSessions={attendanceReportSessions}
                          />
                        </TabsContent>

                        <TabsContent value="assessments" className="mt-0">
                          <AssessmentsTab
                            assessments={assessments || []}
                            isLoading={isAssessmentsLoading}
                            scores={scores || []}
                          />
                        </TabsContent>

                        <TabsContent value="classmates" className="mt-0">
                          <ClassmatesTab
                            classmates={classmates || []}
                            isLoading={isClassmatesLoading}
                            enrollmentSummary={classDetail.enrollmentSummary}
                          />
                        </TabsContent>

                        <TabsContent value="announcements" className="mt-0">
                          <AnnouncementsTab classDetail={classDetail} />
                        </TabsContent>
                      </Tabs>
                    </section>
                  </>
                )}
              </main>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </StudentRoute>
  );
};

export default ClassDetailPage;
