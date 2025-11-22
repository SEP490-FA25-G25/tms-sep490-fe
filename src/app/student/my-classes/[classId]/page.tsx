import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import AnnouncementsTab from './components/AnnouncementsTab';
import SessionsTab from './components/SessionsTab';
import SyllabusTab from './components/SyllabusTab';

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

  const attendanceRate = useMemo<number | undefined>(() => {
    if (!sessionsData?.studentSessions || !sessionsData.studentSessions.length) return undefined;
    const present = sessionsData.studentSessions.filter((s: StudentSessionDTO) => s.attendanceStatus === 'PRESENT').length;
    return (present / sessionsData.studentSessions.length) * 100;
  }, [sessionsData]);

  const sessionStats = useMemo(() => {
    const sessions = sessionsData?.studentSessions || [];
    const completed = sessions.filter((s: StudentSessionDTO) => s.attendanceStatus !== 'PLANNED').length;
    return { completed, total: sessions.length };
  }, [sessionsData]);

  const averageScore = useMemo(() => {
    if (!scores || scores.length === 0) return undefined;
    const total = scores.reduce((acc, score) => acc + (score.score || 0), 0);
    return total / scores.length;
  }, [scores]);

  const renderHeader = () => {
    if (isDetailLoading) {
      return (
        <div className="border-b bg-white">
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
        <div className="border-b bg-white">
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
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
                      <div
                        className="sticky z-20 -mx-4 -mt-2 bg-background/95 backdrop-blur px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
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
                            value="syllabus"
                            className="rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary"
                          >
                            Giáo trình
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

                      <TabsContent value="syllabus" className="mt-0">
                        <SyllabusTab
                          classDetail={classDetail}
                          isLoading={isAssessmentsLoading}
                        />
                      </TabsContent>

                      <TabsContent value="assessments" className="mt-0">
                        <AssessmentsTab
                          assessments={assessments || []}
                          isLoading={isAssessmentsLoading}
                          scores={scores || []}
                          averageScore={averageScore}
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
