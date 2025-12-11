import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { StudentClassHeader } from '@/components/class/StudentClassHeader';
import { StudentRoute } from '@/components/ProtectedRoute';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetClassDetailQuery, useGetClassmatesQuery } from '@/store/services/studentClassApi';

import ClassmatesTab from './components/ClassmatesTab';
import SyllabusTab from './components/SyllabusTab';

const VALID_TABS = ['syllabus', 'classmates'] as const;
type TabValue = typeof VALID_TABS[number];

const ClassDetailPage = () => {
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

  const classIdNumber = Number(classId);
  const isValidClassId = Number.isFinite(classIdNumber);

  const {
    data: classDetailResponse,
    isLoading: isDetailLoading,
    error: detailError,
  } = useGetClassDetailQuery({ classId: classIdNumber }, { skip: !isValidClassId });

  const {
    data: classmatesResponse,
    isLoading: isClassmatesLoading,
  } = useGetClassmatesQuery(
    { classId: classIdNumber },
    { skip: !classDetailResponse || !isValidClassId }
  );

  const classDetail = classDetailResponse?.data;
  const classmates = classmatesResponse?.data;

  const renderHeader = () => {
    if (isDetailLoading) {
      return (
        <div className="border-b bg-background">
          <div className="@container/main py-6 md:py-8">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
      <StudentClassHeader classDetail={classDetail} />
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
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
                      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2 -mt-6 pt-6">
                        <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50">
                          <TabsTrigger
                            value="syllabus"
                            className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                          >
                            Giáo trình
                          </TabsTrigger>
                          <TabsTrigger
                            value="classmates"
                            className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
                          >
                            Thành viên
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="syllabus" className="space-y-4">
                        <SyllabusTab
                          classDetail={classDetail}
                          isLoading={false}
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
