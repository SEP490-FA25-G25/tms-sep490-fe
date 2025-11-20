import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { StudentRoute } from '@/components/ProtectedRoute';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useGetStudentClassesQuery } from '@/store/services/studentClassApi';
import type { ClassStatus, Modality, StudentClassDTO } from '@/types/studentClass';
import { CLASS_STATUSES, MODALITIES } from '@/types/studentClass';
import { AlertCircle, BookOpen, Calendar, Filter, MapPin, Search, Users } from 'lucide-react';

interface FilterState {
  status: ClassStatus[];
  branchId: number[];
  courseId: number[];
  modality: Modality[];
  searchTerm: string;
}

const MyClassesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id || 0;

  const [filters, setFilters] = useState<FilterState>({
    status: [],
    branchId: [],
    courseId: [],
    modality: [],
    searchTerm: '',
  });

  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);

  const {
    data: classesResponse,
    isLoading,
    error,
    refetch,
  } = useGetStudentClassesQuery({
    studentId,
    status: filters.status.length > 0 ? filters.status : undefined,
    branchId: filters.branchId.length > 0 ? filters.branchId : undefined,
    courseId: filters.courseId.length > 0 ? filters.courseId : undefined,
    modality: filters.modality.length > 0 ? filters.modality : undefined,
    page,
    size: pageSize,
    sort: 'enrollmentDate',
    direction: 'desc',
  });

  const classItems = useMemo(
    () => classesResponse?.data?.content || [],
    [classesResponse]
  );
  const totalPages = useMemo(
    () => classesResponse?.data?.totalPages || 0,
    [classesResponse]
  );

  const branchOptions = useMemo(() => {
    const map = new Map<number, string>();
    classItems.forEach((item) => {
      if (item.branchId) {
        map.set(item.branchId, item.branchName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [classItems]);

  const courseOptions = useMemo(() => {
    const map = new Map<number, string>();
    classItems.forEach((item) => {
      if (item.courseId) {
        map.set(item.courseId, item.courseName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [classItems]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.status.length > 0 ||
      filters.branchId.length > 0 ||
      filters.courseId.length > 0 ||
      filters.modality.length > 0 ||
      filters.searchTerm.trim() !== ''
    );
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      status: [],
      branchId: [],
      courseId: [],
      modality: [],
      searchTerm: '',
    });
    setPage(0);
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: value }));
    setPage(0);
  };

  const toggleFilter = (type: keyof FilterState, value: string | number) => {
    setFilters((prev) => {
      const currentValues = prev[type] as (string | number)[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];
      return { ...prev, [type]: newValues };
    });
    setPage(0);
  };

  const getStatusColor = (status: ClassStatus) => {
    switch (status) {
      case 'ONGOING':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SCHEDULED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'COMPLETED':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
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
              <header className="flex flex-col gap-2 border-b border-border px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Lớp của tôi</h1>
                    <p className="text-sm text-muted-foreground">
                      Quản lý và xem thông tin các lớp học đã đăng ký
                    </p>
                  </div>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      Xóa bộ lọc
                    </Button>
                  )}
                </div>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          Trạng thái
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        {Object.keys(CLASS_STATUSES).map((key) => (
                          <DropdownMenuCheckboxItem
                            key={key}
                            checked={filters.status.includes(key as ClassStatus)}
                            onCheckedChange={() => toggleFilter('status', key)}
                          >
                            {CLASS_STATUSES[key as ClassStatus]}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Hình thức
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-40">
                        {Object.keys(MODALITIES).map((key) => (
                          <DropdownMenuCheckboxItem
                            key={key}
                            checked={filters.modality.includes(key as Modality)}
                            onCheckedChange={() => toggleFilter('modality', key)}
                          >
                            {MODALITIES[key as Modality]}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Chi nhánh
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        {branchOptions.length > 0 ? (
                          branchOptions.map((branch) => (
                            <DropdownMenuCheckboxItem
                              key={branch.id}
                              checked={filters.branchId.includes(branch.id)}
                              onCheckedChange={() => toggleFilter('branchId', branch.id)}
                            >
                              {branch.name}
                            </DropdownMenuCheckboxItem>
                          ))
                        ) : (
                          <div className="px-2 py-1 text-xs text-muted-foreground">Chưa có dữ liệu chi nhánh</div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Khóa học
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        {courseOptions.length > 0 ? (
                          courseOptions.map((course) => (
                            <DropdownMenuCheckboxItem
                              key={course.id}
                              checked={filters.courseId.includes(course.id)}
                              onCheckedChange={() => toggleFilter('courseId', course.id)}
                            >
                              {course.name}
                            </DropdownMenuCheckboxItem>
                          ))
                        ) : (
                          <div className="px-2 py-1 text-xs text-muted-foreground">Chưa có dữ liệu khóa học</div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {filters.status.map((status) => (
                      <Badge
                        key={status}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => toggleFilter('status', status)}
                      >
                        {CLASS_STATUSES[status]} · Bỏ
                      </Badge>
                    ))}
                    {filters.modality.map((modality) => (
                      <Badge
                        key={modality}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => toggleFilter('modality', modality)}
                      >
                        {MODALITIES[modality]} · Bỏ
                      </Badge>
                    ))}
                    {filters.branchId.map((branchId) => (
                      <Badge
                        key={branchId}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => toggleFilter('branchId', branchId)}
                      >
                        {branchOptions.find((b) => b.id === branchId)?.name || 'Chi nhánh'} · Bỏ
                      </Badge>
                    ))}
                    {filters.courseId.map((courseId) => (
                      <Badge
                        key={courseId}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => toggleFilter('courseId', courseId)}
                      >
                        {courseOptions.find((c) => c.id === courseId)?.name || 'Khóa học'} · Bỏ
                      </Badge>
                    ))}
                  </div>
                )}
              </header>

              <main className="flex-1 px-6 py-6 md:px-8 md:py-8">
                {isLoading && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <Card key={idx} className="h-full">
                        <CardHeader className="space-y-2">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-40" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-2 w-full" />
                          <Skeleton className="h-8 w-full" />
                        </CardContent>
                      </Card>
                    ))}
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
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {classItems.map((classItem: StudentClassDTO) => {
                        const progress =
                          classItem.totalSessions > 0
                            ? (classItem.completedSessions / classItem.totalSessions) * 100
                            : 0;
                        return (
                          <Card
                            key={classItem.classId}
                            className="h-full cursor-pointer border border-border/80 transition-shadow hover:shadow-md"
                            onClick={() => navigate(`/student/my-classes/${classItem.classId}`)}
                          >
                            <CardHeader className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <Badge className={cn('text-xs', getStatusColor(classItem.status))}>
                                  {CLASS_STATUSES[classItem.status]}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {MODALITIES[classItem.modality]}
                                </Badge>
                              </div>
                              <CardTitle className="text-lg leading-tight">
                                {classItem.classCode}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {classItem.className}
                              </p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {classItem.instructorNames?.length ? (
                                <div className="flex items-start gap-2 text-sm">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <div className="space-y-1">
                                    <p className="font-medium text-foreground">Giáo viên</p>
                                    <p className="text-muted-foreground">
                                      {classItem.instructorNames.slice(0, 2).join(', ')}
                                      {classItem.instructorNames.length > 2 &&
                                        ` +${classItem.instructorNames.length - 2}`}
                                    </p>
                                  </div>
                                </div>
                              ) : null}

                              <div className="flex items-start gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div className="space-y-1">
                                  <p className="font-medium text-foreground">Lịch</p>
                                  <p className="text-muted-foreground">{classItem.scheduleSummary}</p>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span>{classItem.branchName}</span>
                                  </div>
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
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>Điểm danh</span>
                                  <span className="font-semibold text-foreground">
                                    {classItem.attendanceRate.toFixed(1)}%
                                  </span>
                                </div>
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/student/my-classes/${classItem.classId}`);
                                }}
                              >
                                Xem chi tiết
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div className="mt-8 flex items-center justify-center gap-3 text-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(0, p - 1))}
                          disabled={page === 0}
                        >
                          Trước
                        </Button>
                        <span className="text-muted-foreground">
                          Trang {page + 1} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                          disabled={page === totalPages - 1}
                        >
                          Sau
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {!isLoading && !error && classItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/10 p-10 text-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-foreground">
                        {hasActiveFilters ? 'Không tìm thấy lớp học phù hợp' : 'Bạn chưa đăng ký lớp học nào'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {hasActiveFilters
                          ? 'Điều chỉnh bộ lọc hoặc thử từ khóa khác.'
                          : 'Hãy tìm lớp và đăng ký để bắt đầu học tập.'}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => navigate('/student/courses')}>
                      Tìm lớp học
                    </Button>
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

export default MyClassesPage;
