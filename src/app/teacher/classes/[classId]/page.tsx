import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { ClassHeader } from '@/components/class/ClassHeader';
import { TeacherRoute } from '@/components/ProtectedRoute';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetClassByIdQuery } from '@/store/services/classApi';
import type { ClassDetailDTO as StudentClassDetailDTO } from '@/types/studentClass';
import SyllabusTab from '@/app/student/my-classes/[classId]/components/SyllabusTab';
import AttendanceMatrixTab from './components/AttendanceMatrixTab';
import GradesTab from './components/GradesTab';
import SessionsTab from './components/SessionsTab';

const VALID_TABS = ['syllabus', 'sessions', 'attendance', 'grades'] as const;
type TabValue = typeof VALID_TABS[number];

const TeacherClassDetailPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read tab from URL query param, fallback to 'syllabus'
  const tabFromUrl = searchParams.get('tab') || 'syllabus';
  const initialTab = VALID_TABS.includes(tabFromUrl as TabValue) ? tabFromUrl : 'syllabus';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Sync activeTab when URL changes (e.g., browser back/forward navigation)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && VALID_TABS.includes(tab as TabValue)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newSearchParams = new URLSearchParams(searchParams);
    if (value === 'syllabus') {
      newSearchParams.delete('tab');
    } else {
      newSearchParams.set('tab', value);
    }
    navigate(`?${newSearchParams.toString()}`, { replace: true });
  };

  const classIdNumber = Number(classId);
  const isValidClassId = Number.isFinite(classIdNumber);

  const {
    data: classDetailResponse,
    isLoading: isDetailLoading,
    error: detailError,
  } = useGetClassByIdQuery(classIdNumber, { skip: !isValidClassId });

  // Map ClassDetailDTO from classApi to StudentClassDetailDTO format
  const classDetail: StudentClassDetailDTO | undefined = classDetailResponse?.data ? (() => {
    const apiData = classDetailResponse.data;
    return {
      id: apiData.id,
      code: apiData.code,
      name: apiData.name,
      course: {
        id: apiData.course.id,
        name: apiData.course.name,
        code: apiData.course.code,
      },
      branch: {
        id: apiData.branch.id,
        name: apiData.branch.name,
        address: apiData.branch.address,
      },
      modality: apiData.modality,
      startDate: apiData.startDate,
      plannedEndDate: apiData.plannedEndDate,
      actualEndDate: apiData.actualEndDate,
      scheduleDays: apiData.scheduleDays,
      maxCapacity: apiData.maxCapacity,
      status: apiData.status === 'ONGOING' ? 'ONGOING' : apiData.status === 'COMPLETED' ? 'COMPLETED' : apiData.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED',
      teachers: apiData.teachers.length > 0 ? apiData.teachers.map((t, index) => ({
        teacherId: t.teacherId,
        teacherName: t.fullName,
        teacherEmail: t.email,
        isPrimaryInstructor: index === 0 || t.sessionCount === Math.max(...apiData.teachers.map(tt => tt.sessionCount)), // First teacher or one with highest session count is primary
      })) : [],
      scheduleSummary: apiData.scheduleSummary,
      enrollmentSummary: {
        totalEnrolled: apiData.enrollmentSummary.currentEnrolled,
        maxCapacity: apiData.enrollmentSummary.maxCapacity,
      },
      nextSession: apiData.upcomingSessions?.[0] ? {
        id: apiData.upcomingSessions[0].id,
        classId: apiData.id,
        date: apiData.upcomingSessions[0].date,
        type: apiData.upcomingSessions[0].type as 'CLASS' | 'TEACHER_RESCHEDULE',
        status: apiData.upcomingSessions[0].status as 'PLANNED' | 'CANCELLED' | 'DONE',
        room: apiData.upcomingSessions[0].room,
        teacherNote: undefined,
        startTime: apiData.upcomingSessions[0].startTime,
        endTime: apiData.upcomingSessions[0].endTime,
        teachers: apiData.upcomingSessions[0].teachers.map((t) => t.fullName),
      } : undefined,
    };
  })() : undefined;

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
                    onClick={() => navigate('/teacher/classes')}
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
      <ClassHeader classDetail={classDetail} />
    );
  };

  return (
    <TeacherRoute>
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
                        <Button variant="outline" size="sm" onClick={() => navigate('/teacher/classes')}>
                          Quay lại
                        </Button>
                        <Button size="sm" onClick={() => navigate(0)}>
                          Thử lại
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isDetailLoading && classDetail && (
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
                      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2 -mt-6 pt-6">
                        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50">
                          <TabsTrigger
                            value="syllabus"
                            className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                          >
                            Giáo trình
                          </TabsTrigger>
                          <TabsTrigger
                            value="sessions"
                            className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                          >
                            Buổi học
                          </TabsTrigger>
                          <TabsTrigger
                            value="attendance"
                            className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                          >
                            Ma trận điểm danh
                          </TabsTrigger>
                          <TabsTrigger
                            value="grades"
                            className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                          >
                            Xem điểm
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="syllabus" className="space-y-4">
                        <SyllabusTab
                          classDetail={classDetail}
                          isLoading={false}
                        />
                      </TabsContent>

                      <TabsContent value="sessions" className="space-y-4">
                        <SessionsTab classId={classIdNumber} />
                      </TabsContent>

                      <TabsContent value="attendance" className="space-y-4">
                        <AttendanceMatrixTab classId={classIdNumber} />
                      </TabsContent>

                      <TabsContent value="grades" className="space-y-4">
                        <GradesTab classId={classIdNumber} />
                      </TabsContent>
                    </Tabs>
                  )}
                </div>
              </main>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TeacherRoute>
  );
};

export default TeacherClassDetailPage;

