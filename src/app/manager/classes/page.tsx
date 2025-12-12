import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  Calendar,
  ChevronRight,
  PlayCircle,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ChevronsUpDown,
  Check,
  BookOpen,
  Building2,
} from "lucide-react";
import { useGetClassesQuery } from "@/store/services/classApi";
import type {
  ClassListItemDTO,
  ClassListRequest,
  TeacherSummaryDTO,
} from "@/store/services/classApi";
import { useGetAllSubjectsQuery } from "@/store/services/subjectApi";
import { useGetBranchesQuery } from "@/store/services/classCreationApi";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

// ========== Types ==========
type SortField = "startDate" | "name" | "code" | "currentEnrolled" | "status";
type SortDirection = "asc" | "desc";

type FilterState = Omit<
  ClassListRequest,
  "page" | "size" | "sort" | "sortDir" | "status" | "approvalStatus"
> & {
  unifiedStatus?: string;
};

// ========== Sortable Column Header Component ==========
function SortableHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
  className = "",
}: {
  label: string;
  field: SortField;
  currentSort: string;
  currentDir: SortDirection;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = currentSort === field;

  return (
    <Button
      variant="ghost"
      onClick={() => onSort(field)}
      className={`h-8 px-2 font-semibold hover:bg-muted/50 ${className}`}
    >
      {label}
      {isActive ? (
        currentDir === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}

export default function ManagerClassesPage() {
  const navigate = useNavigate();

  // State cho filters
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    branchIds: undefined,
    subjectId: undefined,
    unifiedStatus: undefined,
    modality: undefined,
  });

  // State cho sort
  const [sortField, setSortField] = useState<SortField>("startDate");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  // Debounce search
  const debouncedSearch = useDebounce(filters.search, 300);

  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
  });

  // Combobox states
  const [branchOpen, setBranchOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);

  // Fetch branches
  const { data: branchesResponse } = useGetBranchesQuery();
  const branches = branchesResponse?.data || [];

  // Fetch subjects
  const { data: courses = [] } = useGetAllSubjectsQuery();

  // Convert unifiedStatus to API params
  const { apiStatus, apiApprovalStatus } = useMemo(() => {
    const unified = filters.unifiedStatus;
    if (!unified) return { apiStatus: undefined, apiApprovalStatus: undefined };

    switch (unified) {
      case "DRAFT":
        return { apiStatus: "DRAFT" as const, apiApprovalStatus: undefined };
      case "PENDING":
        return { apiStatus: undefined, apiApprovalStatus: "PENDING" as const };
      case "REJECTED":
        return { apiStatus: undefined, apiApprovalStatus: "REJECTED" as const };
      case "SCHEDULED":
        return {
          apiStatus: "SCHEDULED" as const,
          apiApprovalStatus: "APPROVED" as const,
        };
      case "ONGOING":
        return { apiStatus: "ONGOING" as const, apiApprovalStatus: undefined };
      case "COMPLETED":
        return {
          apiStatus: "COMPLETED" as const,
          apiApprovalStatus: undefined,
        };
      case "CANCELLED":
        return {
          apiStatus: "CANCELLED" as const,
          apiApprovalStatus: undefined,
        };
      default:
        return { apiStatus: undefined, apiApprovalStatus: undefined };
    }
  }, [filters.unifiedStatus]);

  const queryParams = useMemo(
    () => ({
      branchIds: filters.branchIds,
      search: debouncedSearch || undefined,
      subjectId: filters.subjectId || undefined,
      status: apiStatus,
      approvalStatus: apiApprovalStatus,
      modality: filters.modality || undefined,
      sort: sortField,
      sortDir: sortDir,
      ...pagination,
    }),
    [
      filters.branchIds,
      debouncedSearch,
      filters.subjectId,
      apiStatus,
      apiApprovalStatus,
      filters.modality,
      sortField,
      sortDir,
      pagination,
    ]
  );

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      (filters.search?.trim() ?? "") !== "" ||
      filters.branchIds !== undefined ||
      filters.subjectId !== undefined ||
      filters.unifiedStatus !== undefined ||
      filters.modality !== undefined
    );
  }, [filters]);

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      search: "",
      branchIds: undefined,
      subjectId: undefined,
      unifiedStatus: undefined,
      modality: undefined,
    });
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const { data: response, error } = useGetClassesQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });

  // Statistics
  const statistics = useMemo(() => {
    const classes = response?.data?.content || [];
    const ongoingCount = classes.filter((c) => c.status === "ONGOING").length;
    const pendingCount = classes.filter(
      (c) => c.approvalStatus === "PENDING"
    ).length;
    const completedCount = classes.filter(
      (c) => c.status === "COMPLETED"
    ).length;
    return {
      total: response?.data?.totalElements || classes.length,
      ongoing: ongoingCount,
      pending: pendingCount,
      completed: completedCount,
    };
  }, [response?.data]);

  const handleFilterChange = (
    key: keyof FilterState,
    value: string | number | number[] | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const getCapacityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage < 80) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (percentage < 95)
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-rose-100 text-rose-800 border-rose-200";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "SUBMITTED":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "ONGOING":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "CANCELLED":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "Bản nháp";
      case "SUBMITTED":
        return "Đã gửi duyệt";
      case "SCHEDULED":
        return "Đã lên lịch";
      case "ONGOING":
        return "Đang diễn ra";
      case "COMPLETED":
        return "Đã hoàn thành";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getUnifiedStatus = (status: string, approval?: string | null) => {
    if (approval === "PENDING") {
      return {
        label: "Chờ duyệt",
        color: "bg-amber-100 text-amber-800 border-amber-200",
      };
    }
    if (approval === "REJECTED") {
      return {
        label: "Đã từ chối",
        color: "bg-rose-100 text-rose-800 border-rose-200",
      };
    }
    return { label: getStatusLabel(status), color: getStatusColor(status) };
  };

  const renderTeachers = (teachers: TeacherSummaryDTO[]) => {
    if (!teachers || teachers.length === 0) {
      return <span className="text-muted-foreground">Chưa phân công</span>;
    }

    return (
      <div className="flex flex-col gap-0.5 max-w-full">
        {teachers.map((teacher) => (
          <span key={teacher.id} className="text-sm truncate">
            {teacher.fullName}
          </span>
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <DashboardLayout
        title="Quản lý Lớp học"
        description="Xem tất cả lớp học trong hệ thống"
      >
        <div className="rounded-lg border bg-card p-6">
          <div className="text-center text-destructive">
            <p>Không thể tải lớp học. Vui lòng thử lại.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Quản lý Lớp học"
      description="Xem tất cả lớp học trong phạm vi các chi nhánh mà bạn quản lý"
    >
      <div className="flex flex-col gap-6">
        {/* Statistics Summary */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng lớp học
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-950/30">
                <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground">Tổng số lớp học</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Đang diễn ra
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <PlayCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.ongoing}</div>
              <p className="text-xs text-muted-foreground">Lớp đang học</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.pending}</div>
              <p className="text-xs text-muted-foreground">Lớp chờ phê duyệt</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Đã hoàn thành
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.completed}</div>
              <p className="text-xs text-muted-foreground">Lớp đã kết thúc</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm mã, tên lớp, môn học..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-8 h-9 w-full"
            />
          </div>

          {/* Filters */}
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {/* Branch Filter */}
            <Popover open={branchOpen} onOpenChange={setBranchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={branchOpen}
                  className="h-9 w-auto min-w-[180px] justify-between"
                >
                  <Building2 className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  {filters.branchIds && filters.branchIds.length > 0
                    ? filters.branchIds.length === 1
                      ? branches.find((b) => b.id === filters.branchIds![0])?.name || "Chi nhánh"
                      : `${filters.branchIds.length} chi nhánh`
                    : "Chi nhánh: Tất cả"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Tìm chi nhánh..." />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy chi nhánh.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          handleFilterChange("branchIds", undefined);
                          setBranchOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !filters.branchIds ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Tất cả chi nhánh
                      </CommandItem>
                      {branches.map((branch) => (
                        <CommandItem
                          key={branch.id}
                          value={branch.name}
                          onSelect={() => {
                            handleFilterChange("branchIds", [branch.id]);
                            setBranchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filters.branchIds?.includes(branch.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {branch.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Subject Filter */}
            <Popover open={courseOpen} onOpenChange={setCourseOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={courseOpen}
                  className="h-9 w-auto min-w-[180px] justify-between"
                >
                  <BookOpen className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  {filters.subjectId
                    ? courses.find((course) => course.id === filters.subjectId)
                      ?.name || "Chọn môn học"
                    : "Môn học: Tất cả"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Tìm môn học..." />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy môn học.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          handleFilterChange("subjectId", undefined);
                          setCourseOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !filters.subjectId ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Tất cả môn học
                      </CommandItem>
                      {courses.map((course) => (
                        <CommandItem
                          key={course.id}
                          value={`${course.code} ${course.name}`}
                          onSelect={() => {
                            handleFilterChange("subjectId", course.id);
                            setCourseOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filters.subjectId === course.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{course.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {course.code}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
            <Select
              value={filters.unifiedStatus || "all"}
              onValueChange={(value) =>
                handleFilterChange(
                  "unifiedStatus",
                  value === "all" ? undefined : value
                )
              }
            >
              <SelectTrigger className="h-9 w-auto min-w-40">
                <SelectValue placeholder="Giai đoạn lớp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Giai đoạn: Tất cả</SelectItem>
                <SelectItem value="DRAFT">Bản nháp</SelectItem>
                <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                <SelectItem value="REJECTED">Đã từ chối</SelectItem>
                <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
                <SelectItem value="ONGOING">Đang diễn ra</SelectItem>
                <SelectItem value="COMPLETED">Đã hoàn thành</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            {/* Modality Filter */}
            <Select
              value={filters.modality || "all"}
              onValueChange={(value) =>
                handleFilterChange(
                  "modality",
                  value === "all" ? undefined : value
                )
              }
            >
              <SelectTrigger className="h-9 w-auto min-w-[130px]">
                <SelectValue placeholder="Hình thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hình thức: Tất cả</SelectItem>
                <SelectItem value="ONLINE">Trực tuyến</SelectItem>
                <SelectItem value="OFFLINE">Trực tiếp</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Button */}
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

        {/* Class List */}
        <div>
          {response?.data?.content ? (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[20%]">
                      <SortableHeader
                        label="Lớp học"
                        field="name"
                        currentSort={sortField}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[22%] font-semibold">
                      Môn học
                    </TableHead>
                    <TableHead className="w-[10%] font-semibold">
                      Tiến trình
                    </TableHead>
                    <TableHead className="w-[18%] font-semibold">
                      Giáo viên
                    </TableHead>
                    <TableHead className="w-[10%]">
                      <SortableHeader
                        label="Sĩ số"
                        field="currentEnrolled"
                        currentSort={sortField}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[12%]">
                      <SortableHeader
                        label="Giai đoạn"
                        field="status"
                        currentSort={sortField}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[8%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {response.data.content.map((classItem: ClassListItemDTO) => {
                    const totalSessions = classItem.totalSessions || 0;
                    const completedSessions = classItem.completedSessions || 0;
                    const progressPercent =
                      totalSessions > 0
                        ? (completedSessions / totalSessions) * 100
                        : 0;

                    return (
                      <TableRow
                        key={classItem.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() =>
                          navigate(`/academic/classes/${classItem.id}`)
                        }
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{classItem.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {classItem.code}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {new Date(
                                  classItem.startDate
                                ).toLocaleDateString("vi-VN")}{" "}
                                -{" "}
                                {new Date(
                                  classItem.plannedEndDate
                                ).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {classItem.subjectName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {classItem.subjectCode}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="space-y-1 cursor-help">
                                  <div className="text-xs text-muted-foreground">
                                    {completedSessions}/{totalSessions}
                                  </div>
                                  <Progress
                                    value={progressPercent}
                                    className="h-2 w-20"
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Đã hoàn thành {completedSessions} trên{" "}
                                  {totalSessions} buổi
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          {renderTeachers(classItem.teachers)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getCapacityColor(
                              classItem.currentEnrolled,
                              classItem.maxCapacity
                            )}
                          >
                            {classItem.currentEnrolled}/{classItem.maxCapacity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const unified = getUnifiedStatus(
                              classItem.status,
                              classItem.approvalStatus
                            );
                            return (
                              <Badge
                                variant="outline"
                                className={unified.color}
                              >
                                {unified.label}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy lớp học nào phù hợp với tiêu chí của bạn.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {response?.data && response.data.totalPages > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Trang {response.data.number + 1} / {response.data.totalPages} ·{" "}
              {response.data.totalElements} lớp học
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }));
                    }}
                    aria-disabled={response.data.number === 0}
                    className={
                      response.data.number === 0
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
                {Array.from(
                  { length: Math.min(5, response.data.totalPages) },
                  (_, i) => {
                    let pageNum = i;
                    const totalPages = response.data.totalPages;
                    const currentPage = response.data.number;
                    if (totalPages > 5) {
                      if (currentPage < 3) {
                        pageNum = i;
                      } else if (currentPage > totalPages - 3) {
                        pageNum = totalPages - 5 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                    }
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPagination((prev) => ({
                              ...prev,
                              page: pageNum,
                            }));
                          }}
                          isActive={response.data.number === pageNum}
                        >
                          {pageNum + 1}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }));
                    }}
                    aria-disabled={
                      response.data.number >= response.data.totalPages - 1
                    }
                    className={
                      response.data.number >= response.data.totalPages - 1
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
