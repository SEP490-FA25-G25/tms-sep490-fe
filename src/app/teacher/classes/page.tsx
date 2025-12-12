import { useNavigate } from "react-router-dom";
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
  TrendingUp,
  Search,
  Calendar,
  MapPin,
  GraduationCap,
  RefreshCw,
  RotateCcw,
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
  subjectName: string;
  modality: "ALL" | "ONLINE" | "OFFLINE";
  searchTerm: string;
}

const MODALITY_LABELS: Record<"ONLINE" | "OFFLINE", string> = {
  ONLINE: "Trực tuyến",
  OFFLINE: "Trực tiếp",
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
    subjectName: "ALL",
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
    refetch: refetchClasses,
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

  const normalizedClasses = useMemo(() => {
    return allClasses.map((item) => ({
      ...item,
      subjectName: item.subjectName,
      subjectCode: item.subjectCode,
      curriculumName: item.curriculumName,
    }));
  }, [allClasses]);

  // Extract unique options for filters
  const subjectOptions = useMemo(() => {
    const map = new Map<string, string>();
    normalizedClasses.forEach((item) => {
      if (item.subjectName) {
        map.set(item.subjectName, item.subjectName);
      }
    });
    return Array.from(map.entries())
      .map(([name]) => ({ name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [normalizedClasses]);

  // Apply filters
  const classes = useMemo(() => {
    let filtered = [...normalizedClasses];

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
    if (filters.subjectName !== "ALL") {
      filtered = filtered.filter(
        (item) => item.subjectName === filters.subjectName
      );
    }

    // Search filter
    if (filters.searchTerm.trim() !== "") {
      const searchLower = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const subject = (item.subjectName || "").toLowerCase();
        return (
          item.name.toLowerCase().includes(searchLower) ||
          item.code.toLowerCase().includes(searchLower) ||
          subject.includes(searchLower) ||
          item.branchName.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [normalizedClasses, activeStatusTab, filters]);

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
      filters.subjectName !== "ALL" ||
      filters.modality !== "ALL" ||
      filters.searchTerm.trim() !== ""
    );
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      status: "ALL",
      branchName: "ALL",
      subjectName: "ALL",
      modality: "ALL",
      searchTerm: "",
    });
    setActiveStatusTab("all");
    setSortField("name");
    setSortOrder("asc");
    setCurrentPage(1);
    refetchClasses();
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
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
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
          <div className="space-y-3">
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm lớp..."
                  value={filters.searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 h-9 w-full"
                />
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Select
                  value={sortField}
                  onValueChange={(value) => setSortField(value as SortField)}
                >
                  <SelectTrigger className="h-9 w-auto min-w-[180px]">
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
                      modality: value as "ALL" | "ONLINE" | "OFFLINE",
                    }))
                  }
                >
                  <SelectTrigger className="h-9 w-auto min-w-[180px]">
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
                  </SelectContent>
                </Select>

                <Select
                  value={filters.branchName}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, branchName: value }))
                  }
                >
                  <SelectTrigger className="h-9 w-auto min-w-[180px]">
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
                  value={filters.subjectName}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, subjectName: value }))
                  }
                >
                  <SelectTrigger className="h-9 w-auto min-w-[180px]">
                    <SelectValue placeholder="Môn học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả môn học</SelectItem>
                    {subjectOptions.length > 0 ? (
                      subjectOptions.map((subject) => (
                        <SelectItem key={subject.name} value={subject.name}>
                          {subject.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="NO_DATA" disabled>
                        Chưa có dữ liệu môn học
                      </SelectItem>
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

            {/* Active Filters Badges */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-1.5">
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
                {filters.subjectName !== "ALL" && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, subjectName: "ALL" }))
                    }
                  >
                    {filters.subjectName} · Bỏ
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
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedClasses.map((classItem) => (
                  <ClassCard key={classItem.id} classItem={classItem} />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Trang {currentPage} / {Math.max(totalPages, 1)} · {sortedClasses.length} lớp học
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
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage((prev) => Math.max(1, prev - 1));
                            }}
                            aria-disabled={currentPage === 1}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum = i + 1;
                          if (totalPages > 5) {
                            if (currentPage < 4) {
                              pageNum = i + 1;
                            } else if (currentPage > totalPages - 3) {
                              pageNum = totalPages - 5 + i + 1;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                          }
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(pageNum);
                                }}
                                isActive={currentPage === pageNum}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                            }}
                            aria-disabled={currentPage === totalPages}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </TeacherRoute>
  );
}

function ClassCard({ classItem }: { classItem: AttendanceClassDTO }) {
  const navigate = useNavigate();

  const handleNavigateDetail = () => {
    navigate(`/teacher/classes/${classItem.id}`);
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

  // Check if class has started
  const hasClassStarted =
    classItem.status !== "SCHEDULED" &&
    (classItem.startDate
      ? parseISO(classItem.startDate) <= new Date()
      : classItem.status === "ONGOING" || classItem.status === "COMPLETED");

  // Determine which info item is the last one to render
  const hasSubject = !!classItem.subjectName;
  const hasBranch = !!classItem.branchName;
  const hasDate = !!(startDate || endDate);
  const hasSessions = totalSessions > 0;

  // Find the last visible item
  const lastItem = hasSessions
    ? "sessions"
    : hasDate
    ? "date"
    : hasBranch
    ? "branch"
    : hasSubject
    ? "subject"
    : null;

  return (
    <button
      type="button"
      onClick={handleNavigateDetail}
      className="w-full rounded-lg border p-3 transition-all duration-200 hover:border-primary/60 hover:bg-primary/5 hover:-translate-y-1 hover:shadow-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 relative"
    >
      <div>
        {/* Modality Badge - Top Right Corner */}
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className="text-xs">
            {MODALITY_LABELS[classItem.modality]}
          </Badge>
        </div>

        {/* Header: Class Name and Status */}
        <div className="space-y-1.5 mb-2 pr-16">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-base font-semibold text-foreground">
              {classItem.name}
            </h3>
            <Badge
              variant={getStatusBadgeVariant(classItem.status)}
              className="text-xs"
            >
              {STATUS_LABELS[classItem.status] || classItem.status}
            </Badge>
          </div>
          {classItem.code && (
            <p className="text-xs text-muted-foreground">
              Mã lớp: {classItem.code}
            </p>
          )}
        </div>

        {/* Class Info Grid */}
        <div className="text-xs">
          {/* Subject */}
          {classItem.subjectName && (
            <div
              className={cn(
                "flex items-center gap-1.5 text-muted-foreground",
                lastItem !== "subject" && "mb-1.5"
              )}
            >
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{classItem.subjectName}</span>
            </div>
          )}

          {/* Branch */}
          {classItem.branchName && (
            <div
              className={cn(
                "flex items-center gap-1.5 text-muted-foreground",
                lastItem !== "branch" && "mb-1.5"
              )}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{classItem.branchName}</span>
            </div>
          )}

          {/* Date Range */}
          {(startDate || endDate) && (
            <div
              className={cn(
                "flex items-center gap-1.5 text-muted-foreground",
                lastItem !== "date" && "mb-1.5"
              )}
            >
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
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
            <div
              className={cn(
                "flex items-center gap-1.5 text-muted-foreground",
                lastItem !== "sessions" && "mb-1.5"
              )}
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <span>{totalSessions} buổi học</span>
            </div>
          )}
        </div>

        {/* Attendance Rate */}
        <div className="flex items-center gap-1.5 rounded-md border bg-muted/30 p-2 mt-2">
          <TrendingUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Tỷ lệ chuyên cần:
          </span>
          {!hasClassStarted ? (
            <Badge
              variant="outline"
              className="text-xs font-medium bg-slate-50 border-slate-200 text-slate-600"
            >
              Lớp chưa bắt đầu
            </Badge>
          ) : averageAttendanceRate !== undefined ? (
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
          ) : (
            <Badge
              variant="outline"
              className="text-xs font-medium bg-muted border-muted text-muted-foreground"
            >
              Chưa có dữ liệu
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
