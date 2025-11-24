import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { ClassHeader } from '@/components/class/ClassHeader';
import { StudentRoute } from '@/components/ProtectedRoute';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useGetStudentAttendanceReportQuery } from '@/store/services/attendanceApi';
import { useGetClassAssessmentsQuery, useGetClassDetailQuery, useGetClassSessionsQuery, useGetClassmatesQuery, useGetStudentAssessmentScoresQuery } from '@/store/services/studentClassApi';
import type { StudentSessionDTO } from '@/types/studentClass';

import AssessmentsTab from './components/AssessmentsTab';
import ClassmatesTab from './components/ClassmatesTab';
import SessionsTab from './components/SessionsTab';
import SyllabusTab from './components/SyllabusTab';

const VALID_TABS = ['sessions', 'syllabus', 'assessments', 'classmates'] as const;
type TabValue = typeof VALID_TABS[number];

const ClassDetailPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id || 0;

  // Read tab from URL query param, fallback to 'sessions'
  const tabFromUrl = searchParams.get('tab') || 'sessions';
  const initialTab = VALID_TABS.includes(tabFromUrl as TabValue) ? tabFromUrl : 'sessions';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Sync activeTab when URL changes (e.g., browser back/forward navigation)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && VALID_TABS.includes(tab as TabValue)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
    error: sessionsError,
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

  const attendanceRate = useMemo<number | undefined>(() => {
    if (!sessionsData?.studentSessions || !sessionsData.studentSessions.length) return undefined;
    const present = sessionsData.studentSessions.filter((s: StudentSessionDTO) => s.attendanceStatus === 'PRESENT').length;
    return (present / sessionsData.studentSessions.length) * 100;
  }, [sessionsData]);

  const sessionStats = useMemo(() => {
    const sessions = sessionsData?.studentSessions || [];
    const present = sessions.filter((s: StudentSessionDTO) => s.attendanceStatus === 'PRESENT').length;
    const absent = sessions.filter((s: StudentSessionDTO) => s.attendanceStatus === 'ABSENT').length;
    const future = sessions.filter((s: StudentSessionDTO) => s.attendanceStatus === 'PLANNED').length;
    const completed = present + absent;
    return { completed, total: sessions.length, present, absent, future };
  }, [sessionsData]);

  const averageScore = useMemo(() => {
    if (!scores || scores.length === 0) return undefined;
    const total = scores.reduce((acc, score) => acc + (score.score || 0), 0);
    return total / scores.length;
  }, [scores]);

  const renderHeader = () => {
    if (isDetailLoading) {
      return (
        <div className="border-b bg-background">
          <div className="@container/main py-6 md:py-8">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-20 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (detailError || !classDetail) {
      return (
        <div className="border-b bg-background">
          <div className="@container/main py-4">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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
            </div>
          </div>
        </div>
      );
    }

    return (
      <ClassHeader
        classDetail={classDetail}
        attendanceRate={attendanceRate}
        sessionStats={sessionStats}
        nextSession={classDetail.nextSession}
      />
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

              <main className="flex-1">
                <div className="max-w-7xl mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8 md:py-8">
                  {isDetailLoading && (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-40 w-full" />
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
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                      <div className="sticky top-[--header-height] bg-background/95 backdrop-blur-sm z-10 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2" style={{ top: 'calc(var(--header-height) + 0.5rem)' }}>
                        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50">
                          <TabsTrigger
                            value="sessions"
                            className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                          >
                            Lịch học
                          </TabsTrigger>
                          <TabsTrigger
                            value="syllabus"
                            className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                          >
                            Giáo trình
                          </TabsTrigger>
                          <TabsTrigger
                            value="assessments"
                            className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                          >
                            Bài kiểm tra
                          </TabsTrigger>
                          <TabsTrigger
                            value="classmates"
                            className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                          >
                            Thành viên
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="sessions" className="space-y-4">
                        {sessionsError ? (
                          <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">Không tải được lịch học</p>
                            <Button size="sm" variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                              Thử lại
                            </Button>
                          </div>
                        ) : (
                          <SessionsTab
                            sessionsData={sessionsData}
                            isLoading={isSessionsLoading}
                            classDetail={classDetail}
                            reportSessions={attendanceReportSessions}
                          />
                        )}
                      </TabsContent>

                      <TabsContent value="syllabus" className="space-y-4">
                        <SyllabusTab
                          classDetail={classDetail}
                          isLoading={false}
                        />
                      </TabsContent>

                      <TabsContent value="assessments" className="space-y-4">
                        <AssessmentsTab
                          assessments={assessments || []}
                          isLoading={isAssessmentsLoading}
                          scores={scores || []}
                          averageScore={averageScore}
                        />
                      </TabsContent>

                      <TabsContent value="classmates" className="space-y-4">
                        <ClassmatesTab
                          classmates={classmates || []}
                          isLoading={isClassmatesLoading}
                          enrollmentSummary={classDetail.enrollmentSummary}
                        />
                      </TabsContent>
                    </Tabs>
                  )}
                </div>
              </main>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </StudentRoute>
  );
};

export default ClassDetailPage;
