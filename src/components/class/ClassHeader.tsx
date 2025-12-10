import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CLASS_STATUS_STYLES, ENROLLMENT_STATUS_STYLES, getStatusStyle } from "@/lib/status-colors";
import type { ClassDetailDTO } from "@/types/studentClass";
import { CLASS_STATUSES, ENROLLMENT_STATUSES, MODALITIES } from "@/types/studentClass";
import {
  BookOpen,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Users,
} from "lucide-react";

interface ClassHeaderProps {
  classDetail: ClassDetailDTO;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export function ClassHeader({ classDetail }: ClassHeaderProps) {
  const scheduleDisplay = classDetail.scheduleSummary || "Chưa có lịch";
  const enrollment = classDetail.enrollmentSummary?.totalEnrolled ?? 0;
  const capacity =
    classDetail.enrollmentSummary?.maxCapacity ?? classDetail.maxCapacity ?? 0;

  return (
    <div className="border-b bg-background">
      <div className="@container/main py-6 md:py-8">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          {/* Header top row */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "text-xs",
                    getStatusStyle(CLASS_STATUS_STYLES, classDetail.status)
                  )}
                >
                  {CLASS_STATUSES[classDetail.status]}
                </Badge>
                {classDetail.enrollmentStatus && (
                  <Badge
                    className={cn(
                      "text-xs",
                      getStatusStyle(ENROLLMENT_STATUS_STYLES, classDetail.enrollmentStatus)
                    )}
                  >
                    {ENROLLMENT_STATUSES[classDetail.enrollmentStatus]}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {classDetail.name}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {classDetail.code}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {classDetail.subject && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{classDetail.subject.name}</span>
                  </div>
                )}
                {classDetail.level && (
                  <Badge
                    variant="outline"
                    className="text-xs font-medium border-primary/30 text-primary bg-primary/5"
                  >
                    {classDetail.level.name}
                  </Badge>
                )}
                {classDetail.curriculum && (
                  <Badge
                    variant="outline"
                    className="text-xs font-medium border-primary/30 text-primary bg-primary/5"
                  >
                    {classDetail.curriculum.name}
                  </Badge>
                )}
                {classDetail.branch && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{classDetail.branch.name}</span>
                  </div>
                )}
                {/* Fallback to old course fields if subject not present */}
                {!classDetail.subject && classDetail.course?.name && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{classDetail.course.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info grid - 4 cards like AA header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border/70 bg-muted/10 p-3 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">Hình thức</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {classDetail.modality
                  ? MODALITIES[
                      classDetail.modality as keyof typeof MODALITIES
                    ] || classDetail.modality
                  : "Chưa xác định"}
              </p>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/10 p-3 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Lịch học</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {scheduleDisplay}
              </p>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/10 p-3 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Thời gian</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {formatDate(classDetail.startDate)} -{" "}
                {formatDate(
                  classDetail.plannedEndDate || classDetail.actualEndDate
                )}
              </p>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/10 p-3 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Sĩ số</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {enrollment}/{capacity || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
