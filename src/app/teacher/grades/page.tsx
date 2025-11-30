import React from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  useGetAttendanceClassesQuery,
  type AttendanceClassDTO,
} from "@/store/services/attendanceApi";
import {
  BookOpen,
  Search,
  Calendar,
  MapPin,
  GraduationCap,
  Award,
  TrendingUp,
  ClipboardList,
  AlertTriangle,
  Clock9,
} from "lucide-react";
import { useMemo, useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

const STATUS_LABELS: Record<string, string> = {
  ONGOING: "Đang diễn ra",
  COMPLETED: "Đã kết thúc",
  SCHEDULED: "Sắp bắt đầu",
  CANCELLED: "Đã hủy",
};

const MODALITY_LABELS: Record<string, string> = {
  ONLINE: "Trực tuyến",
  OFFLINE: "Trực tiếp",
  HYBRID: "Kết hợp",
};

function ClassCard({
  classItem,
  onSelect,
}: {
  classItem: AttendanceClassDTO;
  onSelect: (classId: number) => void;
}) {
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

  // Format dates
  const startDate = classItem.startDate
    ? format(parseISO(classItem.startDate), "dd/MM/yyyy", { locale: vi })
    : null;
  const endDate = classItem.plannedEndDate
    ? format(parseISO(classItem.plannedEndDate), "dd/MM/yyyy", { locale: vi })
    : null;
  const totalSessions = classItem.totalSessions ?? 0;

  return (
    <div
      className="rounded-lg border p-5 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md cursor-pointer"
      onClick={() => onSelect(classItem.id)}
    >
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

        {/* Action button */}
        <div className="flex justify-end pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(classItem.id);
            }}
            className="gap-2"
          >
            <Award className="h-4 w-4" />
            Quản lý điểm
          </Button>
        </div>
      </div>
    </div>
  );
}

const formatPercent = (value?: number | null) => {
  if (typeof value !== "number") {
    return "--";
  }
  return `${Math.round(value * 1000) / 10}%`;
};

const safeParseDate = (value?: string | null) => {
  if (!value) return null;
  try {
    return parseISO(value);
  } catch {
    return null;
  }
};

const getDaysUntil = (value?: string | null) => {
  const parsed = safeParseDate(value);
  if (!parsed) return null;
  return differenceInCalendarDays(parsed, new Date());
};

type StatusFilter = "ALL" | "ONGOING" | "SCHEDULED" | "COMPLETED";

export default function TeacherGradesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const {
    data: classesResponse,
    isLoading: isLoadingClasses,
    error: classesError,
  } = useGetAttendanceClassesQuery();

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

  // Apply search filter
  const classes = useMemo(() => {
    let filtered = [...allClasses];

    // Search filter
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.code.toLowerCase().includes(searchLower) ||
          item.courseName.toLowerCase().includes(searchLower) ||
          item.branchName.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    return filtered;
  }, [allClasses, searchTerm, statusFilter]);

  const summaryStats = useMemo(() => {
    const now = new Date();
    const ongoing = allClasses.filter(
      (item) => item.status === "ONGOING"
    ).length;
    const scheduled = allClasses.filter(
      (item) => item.status === "SCHEDULED"
    ).length;

    const endingSoon = allClasses.filter((item) => {
      if (item.status !== "ONGOING") return false;
      const endDate = safeParseDate(item.plannedEndDate);
      if (!endDate) return false;
      const diff = differenceInCalendarDays(endDate, now);
      return diff >= 0 && diff <= 7;
    }).length;

    const attendanceRates = allClasses
      .map((item) =>
        typeof item.attendanceRate === "number" ? item.attendanceRate : null
      )
      .filter((rate): rate is number => rate !== null);

    const avgAttendance =
      attendanceRates.length > 0
        ? attendanceRates.reduce((sum, rate) => sum + rate, 0) /
          attendanceRates.length
        : null;

    return {
      total: allClasses.length,
      ongoing,
      scheduled,
      endingSoon,
      avgAttendance,
    };
  }, [allClasses]);

  const attentionClasses = useMemo(() => {
    const now = new Date();
    return allClasses
      .filter((item) => {
        if (item.status !== "ONGOING") return false;
        const endDate = safeParseDate(item.plannedEndDate);
        if (!endDate) return false;
        const diff = differenceInCalendarDays(endDate, now);
        return diff >= 0 && diff <= 7;
      })
      .sort((a, b) => {
        const aTime =
          safeParseDate(a.plannedEndDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bTime =
          safeParseDate(b.plannedEndDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      })
      .slice(0, 4);
  }, [allClasses]);

  const upcomingClasses = useMemo(() => {
    return allClasses
      .filter((item) => item.status === "SCHEDULED")
      .sort((a, b) => {
        const aTime =
          safeParseDate(a.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bTime =
          safeParseDate(b.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      })
      .slice(0, 4);
  }, [allClasses]);

  const handleSelectClass = (classId: number) => {
    navigate(`/teacher/classes/${classId}/grades`);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const statusFilters: { label: string; value: StatusFilter }[] = [
    { label: "Tất cả", value: "ALL" },
    { label: "Đang diễn ra", value: "ONGOING" },
    { label: "Sắp bắt đầu", value: "SCHEDULED" },
    { label: "Đã kết thúc", value: "COMPLETED" },
  ];

  return (
    <DashboardLayout
      title="Quản lý điểm"
      description="Tổng quan các lớp đang được phân công và truy cập nhanh đến bảng điểm chi tiết"
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Theo dõi tiến độ nhập điểm và tình trạng lớp đang dạy
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {summaryStats.total} lớp học
          </Badge>
        </div>

        {/* Summary cards */}
        {isLoadingClasses ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Đang diễn ra",
                value: summaryStats.ongoing,
                icon: TrendingUp,
                borderColor: "emerald-500",
                valueColor: "text-emerald-600",
                iconColor: "text-emerald-500",
              },
              {
                label: "Sắp kết thúc",
                value: summaryStats.endingSoon,
                icon: AlertTriangle,
                borderColor: "amber-500",
                valueColor: "text-amber-600",
                iconColor: "text-amber-500",
              },
              {
                label: "Lớp sắp bắt đầu",
                value: summaryStats.scheduled,
                icon: Clock9,
                borderColor: "sky-500",
                valueColor: "text-sky-600",
                iconColor: "text-sky-500",
              },
              {
                label: "Điểm chuyên cần TB",
                value: formatPercent(summaryStats.avgAttendance),
                icon: ClipboardList,
                borderColor: "slate-500",
                iconColor: "text-slate-500",
              },
            ].map((card, index) => {
              const borderColorMap: Record<string, string> = {
                "emerald-500": "#10b981",
                "amber-500": "#f59e0b",
                "sky-500": "#0ea5e9",
                "slate-500": "#64748b",
              };

              return (
                <div key={index} className="relative group">
                  <Card
                    className={cn(
                      "border-t-2 border-l-2 transition-all duration-300 ease-in-out group-hover:-translate-y-1 group-hover:shadow-md cursor-pointer relative"
                    )}
                    style={
                      {
                        borderTopColor:
                          borderColorMap[card.borderColor] || "#64748b",
                        borderLeftColor:
                          borderColorMap[card.borderColor] || "#64748b",
                      } as React.CSSProperties
                    }
                  >
                    {/* Icon positioned at vertical center of entire card */}
                    <card.icon
                      className={cn(
                        "h-6 w-6 absolute top-[calc(50%-0.125rem)] -translate-y-1/2 right-4 z-10",
                        card.iconColor
                      )}
                    />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 relative">
                      <CardTitle className="text-base font-medium">
                        {card.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-2 relative">
                      <div
                        className={cn("text-3xl font-bold", card.valueColor)}
                      >
                        {card.value}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {/* Search + filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên lớp, mã lớp, khóa học hoặc chi nhánh..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value: StatusFilter) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Highlight sections */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border p-5 space-y-4 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Lớp cần chú ý</p>
                <p className="text-xs text-muted-foreground">
                  Sắp kết thúc và cần hoàn tất việc nhập điểm
                </p>
              </div>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            {isLoadingClasses ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : attentionClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có lớp nào cần chú ý ngay lúc này.
              </p>
            ) : (
              <div className="space-y-3">
                {attentionClasses.map((item) => {
                  const daysLeft = getDaysUntil(item.plannedEndDate);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectClass(item.id)}
                      className="w-full text-left rounded-md border border-border/80 p-4 hover:bg-muted/40 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{item.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {STATUS_LABELS[item.status] || item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.courseName}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock9 className="h-3.5 w-3.5" />
                        {typeof daysLeft === "number" && daysLeft >= 0 ? (
                          <span>Còn {daysLeft} ngày đến ngày kết thúc</span>
                        ) : (
                          <span>Đã vượt quá kế hoạch ban đầu</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-lg border p-5 space-y-4 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Lớp sắp bắt đầu</p>
                <p className="text-xs text-muted-foreground">
                  Chuẩn bị kế hoạch nhập điểm và tài liệu
                </p>
              </div>
              <Clock9 className="h-5 w-5 text-primary" />
            </div>
            {isLoadingClasses ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : upcomingClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Không có lớp nào chuẩn bị khai giảng.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingClasses.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectClass(item.id)}
                    className="w-full text-left rounded-md border border-border/80 p-4 hover:bg-muted/40 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{item.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {STATUS_LABELS[item.status] || item.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.courseName}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {item.startDate
                          ? `Bắt đầu ${format(
                              parseISO(item.startDate),
                              "dd/MM/yyyy",
                              {
                                locale: vi,
                              }
                            )}`
                          : "Chưa có lịch cụ thể"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Classes List */}
        {isLoadingClasses ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        ) : classesError ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
            <p>
              Có lỗi xảy ra khi tải danh sách lớp học. Vui lòng thử lại sau.
            </p>
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {searchTerm.trim() !== ""
                ? "Không tìm thấy lớp học nào phù hợp với từ khóa tìm kiếm."
                : "Bạn chưa có lớp học nào để quản lý điểm."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classItem={classItem}
                onSelect={handleSelectClass}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
