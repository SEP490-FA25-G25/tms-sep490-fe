import { useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TeacherRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  useGetAttendanceClassesQuery,
  type AttendanceClassDTO,
} from "@/store/services/attendanceApi";
import { BookOpen, BarChart3, TrendingUp, Search, Calendar, MapPin, GraduationCap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

interface FilterState {
  status: string[];
  branchName: string[];
  courseName: string[];
  modality: ("ONLINE" | "OFFLINE" | "HYBRID")[];
  searchTerm: string;
}

const MODALITY_LABELS: Record<"ONLINE" | "OFFLINE" | "HYBRID", string> = {
  ONLINE: "Trực tuyến",
  OFFLINE: "Trực tiếp",
  HYBRID: "Kết hợp",
};

const STATUS_LABELS: Record<string, string> = {
  ONGOING: "Lớp đang dạy",
  COMPLETED: "Đã hoàn thành",
  SCHEDULED: "Sắp dạy",
  CANCELLED: "Đã hủy",
};

export default function TeacherClassesPage() {
  const [activeStatusTab, setActiveStatusTab] = useState<"all" | string>("all");
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    branchName: [],
    courseName: [],
    modality: [],
    searchTerm: "",
  });

  const {
    data: classesResponse,
    isFetching: isLoadingClasses,
    error: classesError,
  } = useGetAttendanceClassesQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  // Handle different response structures - API returns array directly or wrapped in data
  const allClasses = useMemo(() => {
    if (Array.isArray(classesResponse)) {
      return classesResponse;
    }
    if (Array.isArray(classesResponse?.data)) {
      return classesResponse.data;
    }
    return [];
  }, [classesResponse]);

  // Extract unique options for filters
  const branchOptions = useMemo(() => {
    const map = new Map<string, string>();
    allClasses.forEach((item) => {
      if (item.branchName) {
        map.set(item.branchName, item.branchName);
      }
    });
    return Array.from(map.entries())
      .map(([name]) => ({ name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allClasses]);

  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    allClasses.forEach((item) => {
      if (item.courseName) {
        map.set(item.courseName, item.courseName);
      }
    });
    return Array.from(map.entries())
      .map(([name]) => ({ name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allClasses]);

  // Apply filters
  const classes = useMemo(() => {
    let filtered = [...allClasses];

    // Status tab filter
    if (activeStatusTab !== "all") {
      filtered = filtered.filter((item) => item.status === activeStatusTab);
    }

    // Additional status filters
    if (filters.status.length > 0) {
      filtered = filtered.filter((item) =>
        filters.status.includes(item.status)
      );
    }

    // Modality filter
    if (filters.modality.length > 0) {
      filtered = filtered.filter((item) =>
        filters.modality.includes(item.modality)
      );
    }

    // Branch filter
    if (filters.branchName.length > 0) {
      filtered = filtered.filter((item) =>
        filters.branchName.includes(item.branchName)
      );
    }

    // Course filter
    if (filters.courseName.length > 0) {
      filtered = filtered.filter((item) =>
        filters.courseName.includes(item.courseName)
      );
    }

    // Search filter
    if (filters.searchTerm.trim() !== "") {
      const searchLower = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.code.toLowerCase().includes(searchLower) ||
          item.courseName.toLowerCase().includes(searchLower) ||
          item.branchName.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [allClasses, activeStatusTab, filters]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.status.length > 0 ||
      filters.branchName.length > 0 ||
      filters.courseName.length > 0 ||
      filters.modality.length > 0 ||
      filters.searchTerm.trim() !== ""
    );
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      status: [],
      branchName: [],
      courseName: [],
      modality: [],
      searchTerm: "",
    });
    setActiveStatusTab("all");
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: value }));
  };

  const toggleFilter = (
    type: keyof FilterState,
    value: string | "ONLINE" | "OFFLINE" | "HYBRID"
  ) => {
    setFilters((prev) => {
      const currentValues = prev[type] as (
        | string
        | "ONLINE"
        | "OFFLINE"
        | "HYBRID"
      )[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];
      return { ...prev, [type]: newValues };
    });
  };

  // Debug in development
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    if (!isDev) return;
    if (classesError) {
      console.error("Classes Error:", classesError);
    }
  }, [classesError, isDev]);

  return (
    <TeacherRoute>
      <DashboardLayout
        title="Lớp học của tôi"
        description="Quản lý lịch trình lớp học, học sinh và tài liệu khóa học"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Xóa bộ lọc
                </Button>
              )}
              <Badge variant="outline" className="text-sm">
                {classes.length} lớp học
              </Badge>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            {/* Status Tabs */}
            <Tabs
              value={activeStatusTab}
              onValueChange={(value) => setActiveStatusTab(value)}
              className="w-full"
            >
              <TabsList className="w-full justify-start">
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="ONGOING">Lớp đang dạy</TabsTrigger>
                <TabsTrigger value="COMPLETED">Đã hoàn thành</TabsTrigger>
                <TabsTrigger value="SCHEDULED">Sắp dạy</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search and Dropdown Filters */}
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
                    <Button variant="outline" size="sm">
                      Hình thức
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    {(["ONLINE", "OFFLINE", "HYBRID"] as const).map((key) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={filters.modality.includes(key)}
                        onCheckedChange={() => toggleFilter("modality", key)}
                      >
                        {MODALITY_LABELS[key]}
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
                          key={branch.name}
                          checked={filters.branchName.includes(branch.name)}
                          onCheckedChange={() =>
                            toggleFilter("branchName", branch.name)
                          }
                        >
                          {branch.name}
                        </DropdownMenuCheckboxItem>
                      ))
                    ) : (
                      <div className="px-2 py-1 text-xs text-muted-foreground">
                        Chưa có dữ liệu chi nhánh
                      </div>
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
                          key={course.name}
                          checked={filters.courseName.includes(course.name)}
                          onCheckedChange={() =>
                            toggleFilter("courseName", course.name)
                          }
                        >
                          {course.name}
                        </DropdownMenuCheckboxItem>
                      ))
                    ) : (
                      <div className="px-2 py-1 text-xs text-muted-foreground">
                        Chưa có dữ liệu khóa học
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Active Filters Badges */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {filters.status.map((status) => (
                  <Badge
                    key={status}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => toggleFilter("status", status)}
                  >
                    {STATUS_LABELS[status] || status} · Bỏ
                  </Badge>
                ))}
                {filters.modality.map((modality) => (
                  <Badge
                    key={modality}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => toggleFilter("modality", modality)}
                  >
                    {MODALITY_LABELS[modality]} · Bỏ
                  </Badge>
                ))}
                {filters.branchName.map((branchName) => (
                  <Badge
                    key={branchName}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => toggleFilter("branchName", branchName)}
                  >
                    {branchName} · Bỏ
                  </Badge>
                ))}
                {filters.courseName.map((courseName) => (
                  <Badge
                    key={courseName}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => toggleFilter("courseName", courseName)}
                  >
                    {courseName} · Bỏ
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Danh sách classes */}
          {isLoadingClasses ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : classesError ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
              <p>
                Có lỗi xảy ra khi tải danh sách lớp học. Vui lòng thử lại sau.
              </p>
              {isDev && (
                <pre className="mt-2 text-xs text-left overflow-auto">
                  {JSON.stringify(classesError, null, 2)}
                </pre>
              )}
            </div>
          ) : classes.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? "Không tìm thấy lớp học phù hợp"
                  : "Bạn chưa có lớp học nào"}
              </p>
              {hasActiveFilters && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Điều chỉnh bộ lọc hoặc thử từ khóa khác.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((classItem) => (
                <ClassCard key={classItem.id} classItem={classItem} />
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </TeacherRoute>
  );
}

function ClassCard({ classItem }: { classItem: AttendanceClassDTO }) {
  const navigate = useNavigate();

  const handleViewMatrix = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    navigate(`/teacher/attendance/classes/${classItem.id}/matrix`);
  };

  const handleViewSchedule = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/teacher/schedule?classId=${classItem.id}`);
  };

  // Color coding for attendance rate
  const getAttendanceRateColor = (rate: number | undefined) => {
    if (rate === undefined || rate === null) return "text-muted-foreground";
    if (rate >= 80) return "text-emerald-700";
    if (rate >= 60) return "text-amber-700";
    return "text-rose-700";
  };

  const getAttendanceRateBgColor = (rate: number | undefined) => {
    if (rate === undefined || rate === null) return "bg-muted border-muted";
    if (rate >= 80) return "bg-emerald-50 border-emerald-200";
    if (rate >= 60) return "bg-amber-50 border-amber-200";
    return "bg-rose-50 border-rose-200";
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ONGOING":
        return "default";
      case "COMPLETED":
        return "secondary";
      case "SCHEDULED":
        return "outline";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  // API returns rate as 0-1, convert to 0-100 for display
  const averageAttendanceRate = classItem.attendanceRate
    ? classItem.attendanceRate * 100
    : undefined;
  const totalSessions = classItem.totalSessions ?? 0;

  // Format dates
  const startDate = classItem.startDate
    ? format(parseISO(classItem.startDate), "dd/MM/yyyy", { locale: vi })
    : null;
  const endDate = classItem.plannedEndDate
    ? format(parseISO(classItem.plannedEndDate), "dd/MM/yyyy", { locale: vi })
    : null;

  return (
    <div className="rounded-lg border p-5 transition-colors hover:border-primary/60 hover:bg-primary/5">
      <div className="space-y-4">
        {/* Header: Class Name and Status */}
      <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">
              {classItem.name}
            </h3>
              <Badge variant={getStatusBadgeVariant(classItem.status)}>
                {STATUS_LABELS[classItem.status] || classItem.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {MODALITY_LABELS[classItem.modality]}
              </Badge>
            </div>
            {classItem.code && (
              <p className="text-sm text-muted-foreground">
                Mã lớp: {classItem.code}
              </p>
            )}
          </div>
        </div>

        {/* Class Info Grid */}
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          {/* Course */}
          {classItem.courseName && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <GraduationCap className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{classItem.courseName}</span>
            </div>
          )}

          {/* Branch */}
          {classItem.branchName && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{classItem.branchName}</span>
            </div>
          )}

          {/* Date Range */}
          {(startDate || endDate) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>
                {startDate && endDate
                  ? `${startDate} - ${endDate}`
                  : startDate
                  ? `Bắt đầu: ${startDate}`
                  : endDate
                  ? `Kết thúc: ${endDate}`
                  : ""}
              </span>
            </div>
          )}

              {/* Total Sessions */}
          {totalSessions > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-4 w-4 flex-shrink-0" />
                  <span>{totalSessions} buổi học</span>
                </div>
              )}
        </div>

              {/* Attendance Rate */}
              {averageAttendanceRate !== undefined && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                  <TrendingUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
                    Tỷ lệ chuyên cần:
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium",
                      getAttendanceRateColor(averageAttendanceRate),
                      getAttendanceRateBgColor(averageAttendanceRate)
                    )}
                  >
              {averageAttendanceRate.toFixed(1)}%
                  </Badge>
                </div>
              )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewSchedule}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Xem lịch dạy
          </Button>
        <Button
          variant="outline"
          size="sm"
            onClick={handleViewMatrix}
          className="gap-2"
        >
          <BarChart3 className="h-4 w-4" />
            Xem bảng điểm danh
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2"
          >
            <Link to={`/teacher/classes/${classItem.id}/grades`}>
              <BookOpen className="h-4 w-4" />
              Quản lý điểm
            </Link>
        </Button>
        </div>
      </div>
    </div>
  );
}
