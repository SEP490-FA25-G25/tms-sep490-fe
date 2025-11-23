import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useGetAttendanceClassesQuery,
  type AttendanceClassDTO,
} from "@/store/services/attendanceApi";
import { BookOpen, Search, Calendar, MapPin, GraduationCap, Award } from "lucide-react";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
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

function ClassCard({ classItem, onSelect }: { classItem: AttendanceClassDTO; onSelect: (classId: number) => void }) {
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
    <div className="rounded-lg border p-5 transition-colors hover:border-primary/60 hover:bg-primary/5 cursor-pointer"
         onClick={() => onSelect(classItem.id)}>
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

export default function TeacherGradesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

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

    return filtered;
  }, [allClasses, searchTerm]);

  const handleSelectClass = (classId: number) => {
    navigate(`/teacher/classes/${classId}/grades`);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  return (
    <DashboardLayout
      title="Quản lý điểm"
      description="Chọn lớp học để xem và quản lý điểm số của học sinh"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              {classes.length} lớp học
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên lớp, mã lớp, khóa học hoặc chi nhánh..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
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
            <p>Có lỗi xảy ra khi tải danh sách lớp học. Vui lòng thử lại sau.</p>
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

