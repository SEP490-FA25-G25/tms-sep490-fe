import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { StudentRoute } from '@/components/ProtectedRoute';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useGetStudentClassesQuery } from '@/store/services/studentClassApi';
import type { ClassStatus, EnrollmentStatus, Modality, StudentClassDTO } from '@/types/studentClass';
import { CLASS_STATUSES, MODALITIES } from '@/types/studentClass';
import { CLASS_STATUS_STYLES, getStatusStyle } from '@/lib/status-colors';
import { AlertCircle, BookOpen, RotateCcw, Search } from 'lucide-react';

interface FilterState {
  status: ClassStatus | 'all';
  modality: Modality | 'all';
  branchId: number | 'all';
  courseId: number | 'all';
  searchTerm: string;
}

const MyClassesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id || 0;

  const [activeStatusTab, setActiveStatusTab] = useState<'all' | ClassStatus>('all');
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    modality: 'all',
    branchId: 'all',
    courseId: 'all',
    searchTerm: '',
  });
  const [branchOptions, setBranchOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [courseOptions, setCourseOptions] = useState<Array<{ id: number; name: string }>>([]);

  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);

  // Map frontend status tabs to backend filters
  const getClassStatusFilter = (tabStatus: 'all' | ClassStatus): ClassStatus[] | undefined => {
    switch (tabStatus) {
      case 'ONGOING':
        return ['ONGOING'];
      case 'COMPLETED':
        return ['COMPLETED'];
      case 'SCHEDULED':
        return ['SCHEDULED'];
      default:
        return undefined;
    }
  };

  const getEnrollmentStatusFilter = (tabStatus: 'all' | ClassStatus): EnrollmentStatus[] | undefined => {
    switch (tabStatus) {
      case 'ONGOING':
        return ['ENROLLED'];
      case 'COMPLETED':
        return ['COMPLETED'];
      default:
        return undefined;
    }
  };

  const {
    data: classesResponse,
    isLoading,
    error,
    refetch,
  } = useGetStudentClassesQuery({
    studentId,
    classStatus: getClassStatusFilter(activeStatusTab),
    enrollmentStatus: getEnrollmentStatusFilter(activeStatusTab),
    modality: filters.modality !== 'all' ? [filters.modality] : undefined,
    branchId: filters.branchId !== 'all' ? [filters.branchId] : undefined,
    courseId: filters.courseId !== 'all' ? [filters.courseId] : undefined,
    page,
    size: pageSize,
    sort: 'startDate',
    direction: 'desc',
  });

  // Filter and sort classes by status priority, then by startDate
  const classItems = useMemo(() => {
    let items = classesResponse?.data?.content || [];

    // Client-side search filtering
    const searchTerm = filters.searchTerm.trim().toLowerCase();
    if (searchTerm) {
      items = items.filter((item) => {
        const searchableFields = [
          item.className,
          item.classCode,
          item.courseName,
          item.branchName,
          ...(item.instructorNames || []),
        ];
        return searchableFields.some(
          (field) => field && field.toLowerCase().includes(searchTerm)
        );
      });
    }

    // If viewing specific status tab, no need to re-sort by status priority
    if (activeStatusTab !== 'all') {
      return items;
    }

    // For "all" tab, prioritize: ONGOING → SCHEDULED → COMPLETED → DRAFT → CANCELLED
    const statusPriority: Record<ClassStatus, number> = {
      'ONGOING': 1,
      'SCHEDULED': 2,
      'COMPLETED': 3,
      'DRAFT': 4,
      'CANCELLED': 5,
    };

    return [...items].sort((a, b) => {
      const priorityA = statusPriority[a.status] || 999;
      const priorityB = statusPriority[b.status] || 999;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Within same status, keep server-side sorting (startDate desc)
      return 0;
    });
  }, [classesResponse, activeStatusTab, filters.searchTerm]);
  useEffect(() => {
    setBranchOptions((prev) => {
      const map = new Map<number, string>();
      prev.forEach((item) => map.set(item.id, item.name));
      (classesResponse?.data?.content || []).forEach((item) => {
        if (item.branchId && item.branchName) {
          map.set(item.branchId, item.branchName);
        }
      });
      return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    });
  }, [classesResponse]);

  useEffect(() => {
    setCourseOptions((prev) => {
      const map = new Map<number, string>();
      prev.forEach((item) => map.set(item.id, item.name));
      (classesResponse?.data?.content || []).forEach((item) => {
        if (item.courseId && item.courseName) {
          map.set(item.courseId, item.courseName);
        }
      });
      return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    });
  }, [classesResponse]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== 'all' ||
      filters.modality !== 'all' ||
      filters.branchId !== 'all' ||
      filters.courseId !== 'all' ||
      filters.searchTerm.trim() !== ''
    );
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      status: 'all',
      modality: 'all',
      branchId: 'all',
      courseId: 'all',
      searchTerm: '',
    });
    setPage(0);
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: value }));
    setPage(0);
  };

  const setFilter = (type: keyof FilterState, value: string | number | 'all') => {
    setFilters((prev) => ({ ...prev, [type]: value }));
    setPage(0);
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
              <header className="flex flex-col gap-2 border-b border-border px-4 lg:px-6 py-5">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Lớp của tôi</h1>
                  <p className="text-sm text-muted-foreground">
                    Quản lý và xem thông tin các lớp học đã đăng ký
                  </p>
                </div>
                <Tabs value={activeStatusTab} onValueChange={(value) => {
                  setActiveStatusTab(value as 'all' | ClassStatus);
                  setPage(0);
                }} className="w-full">
                  <TabsList className="w-full justify-start mt-2">
                    <TabsTrigger value="all">Tất cả</TabsTrigger>
                    <TabsTrigger value="ONGOING">Đang học</TabsTrigger>
                    <TabsTrigger value="COMPLETED">Đã hoàn thành</TabsTrigger>
                    <TabsTrigger value="SCHEDULED">Sắp học</TabsTrigger>
                  </TabsList>
                </Tabs>
              </header>

              <div className="flex flex-col gap-4 px-4 lg:px-6 py-4 md:py-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm lớp học..."
                      value={filters.searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={filters.modality} onValueChange={(value) => setFilter('modality', value as Modality | 'all')}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue placeholder="Tất cả hình thức" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả hình thức</SelectItem>
                        {Object.entries(MODALITIES).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filters.branchId.toString()} onValueChange={(value) => setFilter('branchId', value === 'all' ? 'all' : parseInt(value))}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue placeholder="Tất cả chi nhánh" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                        {branchOptions.length > 0 ? (
                          branchOptions.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id.toString()}>
                              {branch.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1 text-xs text-muted-foreground">Chưa có dữ liệu chi nhánh</div>
                        )}
                      </SelectContent>
                    </Select>

                    <Select value={filters.courseId.toString()} onValueChange={(value) => setFilter('courseId', value === 'all' ? 'all' : parseInt(value))}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue placeholder="Tất cả khóa học" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả khóa học</SelectItem>
                        {courseOptions.length > 0 ? (
                          courseOptions.map((course) => (
                            <SelectItem key={course.id} value={course.id.toString()}>
                              {course.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1 text-xs text-muted-foreground">Chưa có dữ liệu khóa học</div>
                        )}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={resetFilters}
                      disabled={!hasActiveFilters}
                      title="Xóa bộ lọc"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <main className="flex-1 px-4 lg:px-6 py-6 md:py-8">
                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}

                {error && !isLoading && (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Không thể tải danh sách lớp</p>
                      <p className="text-sm text-muted-foreground">Vui lòng thử lại sau ít phút.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                      Thử lại
                    </Button>
                  </div>
                )}

                {!isLoading && !error && classItems.length > 0 && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {classItems.map((classItem: StudentClassDTO) => {
                        const progress =
                          classItem.totalSessions > 0
                            ? (classItem.completedSessions / classItem.totalSessions) * 100
                            : 0;
                        const teacherSummary = classItem.instructorNames?.length
                          ? `${classItem.instructorNames[0]}${classItem.instructorNames.length > 1 ? ` +${classItem.instructorNames.length - 1}` : ''}`
                          : 'Chưa phân công';

                        return (
                          <Card
                            key={classItem.classId}
                            className="h-full cursor-pointer transition-shadow hover:shadow-md"
                            onClick={() => navigate(`/student/my-classes/${classItem.classId}`)}
                          >
                            <CardHeader className="pb-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0 space-y-1">
                                  <CardTitle className="text-lg leading-tight line-clamp-2">
                                    {classItem.className}
                                  </CardTitle>
                                  <p className="text-sm text-muted-foreground font-medium">{classItem.classCode}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <Badge className={cn('text-xs', getStatusStyle(CLASS_STATUS_STYLES, classItem.status))}>
                                    {CLASS_STATUSES[classItem.status]}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {MODALITIES[classItem.modality]}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="space-y-1">
                                  <p className="text-muted-foreground">Giáo viên</p>
                                  <p className="font-medium text-foreground">{teacherSummary}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                  <p className="text-muted-foreground">Địa điểm</p>
                                  <p className="font-medium text-foreground">{classItem.branchName}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-muted-foreground">Lịch</p>
                                  <p className="font-medium text-foreground">{classItem.scheduleSummary}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                  <p className="text-muted-foreground">Khóa học</p>
                                  <p className="font-medium text-foreground">{classItem.courseName}</p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Tiến độ</span>
                                  <span className="font-medium text-foreground">
                                    {classItem.completedSessions}/{classItem.totalSessions} buổi
                                  </span>
                                </div>
                                <Progress value={progress} className="h-2" />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}

                {!isLoading && !error && classItems.length === 0 && (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <BookOpen className="h-10 w-10" />
                      </EmptyMedia>
                      <EmptyTitle>
                        {hasActiveFilters ? 'Không tìm thấy lớp học phù hợp' : 'Bạn chưa đăng ký lớp học nào'}
                      </EmptyTitle>
                      <EmptyDescription>
                        {hasActiveFilters
                          ? 'Điều chỉnh bộ lọc hoặc thử từ khóa khác.'
                          : 'Liên hệ với trung tâm để đăng ký lớp học.'}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </main>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </StudentRoute>
  );
};

export default MyClassesPage;
