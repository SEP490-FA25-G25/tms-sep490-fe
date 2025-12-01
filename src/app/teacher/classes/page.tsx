import { useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TeacherRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  useGetAttendanceClassesQuery,
  type AttendanceClassDTO,
} from "@/store/services/attendanceApi";
import {
  BookOpen,
  BarChart3,
  TrendingUp,
  Search,
  Calendar,
  MapPin,
  GraduationCap,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterState {
  status: string;
  branchName: string;
  courseName: string;
  modality: "ALL" | "ONLINE" | "OFFLINE" | "HYBRID";
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

type SortField =
  | "name"
  | "startDate"
  | "attendanceRate"
  | "totalSessions"
  | "status";
type SortOrder = "asc" | "desc";

export default function TeacherClassesPage() {
  const [activeStatusTab, setActiveStatusTab] = useState<"all" | string>("all");
  const [filters, setFilters] = useState<FilterState>({
    status: "ALL",
    branchName: "ALL",
    courseName: "ALL",
    modality: "ALL",
    searchTerm: "",
  });
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    if (filters.status !== "ALL") {
      filtered = filtered.filter((item) => item.status === filters.status);
    }

    // Modality filter
    if (filters.modality !== "ALL") {
      filtered = filtered.filter((item) => item.modality === filters.modality);
    }

    // Branch filter
    if (filters.branchName !== "ALL") {
      filtered = filtered.filter(
        (item) => item.branchName === filters.branchName
      );
    }

    // Course filter
    if (filters.courseName !== "ALL") {
      filtered = filtered.filter(
        (item) => item.courseName === filters.courseName
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

  // Apply sorting
  const sortedClasses = useMemo(() => {
    const sorted = [...classes];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name, "vi");
          break;
        case "startDate": {
          const dateA = a.startDate ? parseISO(a.startDate).getTime() : 0;
          const dateB = b.startDate ? parseISO(b.startDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
        case "attendanceRate": {
          const rateA = a.attendanceRate ?? 0;
          const rateB = b.attendanceRate ?? 0;
          comparison = rateA - rateB;
          break;
        }
        case "totalSessions": {
          const sessionsA = a.totalSessions ?? 0;
          const sessionsB = b.totalSessions ?? 0;
          comparison = sessionsA - sessionsB;
          break;
        }
        case "status":
          comparison = a.status.localeCompare(b.status, "vi");
          break;
        default:
          return 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [classes, sortField, sortOrder]);

  // Apply pagination
  const paginatedClasses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedClasses.slice(startIndex, endIndex);
  }, [sortedClasses, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedClasses.length / pageSize);

  // Reset to page 1 when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatusTab, filters, sortField, sortOrder]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== "ALL" ||
      filters.branchName !== "ALL" ||
      filters.courseName !== "ALL" ||
      filters.modality !== "ALL" ||
      filters.searchTerm.trim() !== ""
    );
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      status: "ALL",
      branchName: "ALL",
      courseName: "ALL",
      modality: "ALL",
      searchTerm: "",
    });
    setActiveStatusTab("all");
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: value }));
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Xóa bộ lọc
                </Button>
              )}
              <Badge variant="outline" className="text-sm">
                {sortedClasses.length} lớp học
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
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm lớp học..."
                  value={filters.searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={sortField}
                  onValueChange={(value) => setSortField(value as SortField)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sắp xếp theo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Tên lớp</SelectItem>
                    <SelectItem value="startDate">Ngày bắt đầu</SelectItem>
                    <SelectItem value="attendanceRate">
                      Tỷ lệ chuyên cần
                    </SelectItem>
                    <SelectItem value="totalSessions">Số buổi học</SelectItem>
                    <SelectItem value="status">Trạng thái</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.modality}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      modality: value as
                        | "ALL"
                        | "ONLINE"
                        | "OFFLINE"
                        | "HYBRID",
                    }))
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Hình thức" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả hình thức</SelectItem>
                    <SelectItem value="ONLINE">
                      {MODALITY_LABELS.ONLINE}
                    </SelectItem>
                    <SelectItem value="OFFLINE">
                      {MODALITY_LABELS.OFFLINE}
                    </SelectItem>
                    <SelectItem value="HYBRID">
                      {MODALITY_LABELS.HYBRID}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.branchName}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, branchName: value }))
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Chi nhánh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả chi nhánh</SelectItem>
                    {branchOptions.length > 0 ? (
                      branchOptions.map((branch) => (
                        <SelectItem key={branch.name} value={branch.name}>
                          {branch.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="NO_DATA" disabled>
                        Chưa có dữ liệu chi nhánh
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.courseName}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, courseName: value }))
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Khóa học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả khóa học</SelectItem>
                    {courseOptions.length > 0 ? (
                      courseOptions.map((course) => (
                        <SelectItem key={course.name} value={course.name}>
                          {course.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="NO_DATA" disabled>
                        Chưa có dữ liệu khóa học
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="gap-2"
                >
                  {sortOrder === "asc" ? (
                    <>
                      <ArrowUp className="h-4 w-4" />
                      Tăng dần
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-4 w-4" />
                      Giảm dần
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Active Filters Badges */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {filters.status !== "ALL" && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, status: "ALL" }))
                    }
                  >
                    {STATUS_LABELS[filters.status] || filters.status} · Bỏ
                  </Badge>
                )}
                {filters.modality !== "ALL" && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, modality: "ALL" }))
                    }
                  >
                    {MODALITY_LABELS[filters.modality]} · Bỏ
                  </Badge>
                )}
                {filters.branchName !== "ALL" && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, branchName: "ALL" }))
                    }
                  >
                    {filters.branchName} · Bỏ
                  </Badge>
                )}
                {filters.courseName !== "ALL" && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, courseName: "ALL" }))
                    }
                  >
                    {filters.courseName} · Bỏ
                  </Badge>
                )}
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
            <>
              <div className="space-y-4">
                {paginatedClasses.map((classItem) => (
                  <ClassCard key={classItem.id} classItem={classItem} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Hiển thị {(currentPage - 1) * pageSize + 1} -{" "}
                      {Math.min(currentPage * pageSize, sortedClasses.length)}{" "}
                      trong tổng số {sortedClasses.length} lớp học
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 / trang</SelectItem>
                        <SelectItem value="10">10 / trang</SelectItem>
                        <SelectItem value="20">20 / trang</SelectItem>
                        <SelectItem value="50">50 / trang</SelectItem>
                      </SelectContent>
                    </Select>

                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(1, prev - 1))
                            }
                            className={
                              currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>

                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((page) => {
                          // Show first page, last page, current page, and pages around current
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(page)}
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(totalPages, prev + 1)
                              )
                            }
                            className={
                              currentPage === totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              )}
            </>
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
            onClick={handleViewMatrix}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Xem bảng điểm danh
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-2">
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
