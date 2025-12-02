"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search } from "lucide-react";
import {
  useGetSubjectDetailQuery,
  type SubjectDetail,
} from "@/store/services/subjectAdminApi";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubjectDetailDialogProps {
  subjectId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusMap: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  ACTIVE: { label: "Hoạt động", variant: "default" },
  INACTIVE: { label: "Không hoạt động", variant: "secondary" },
  DRAFT: { label: "Bản nháp", variant: "outline" },
};

const approvalLabelMap: Record<string, string> = {
  APPROVED: "Đã duyệt",
  PENDING: "Chờ duyệt",
  REJECTED: "Đã từ chối",
};

const courseStatusLabelMap: Record<string, string> = {
  ACTIVE: "Đang mở",
  DRAFT: "Bản nháp",
  INACTIVE: "Ngừng dùng",
  SUBMITTED: "Đã gửi duyệt",
};

export function SubjectDetailDialog({
  subjectId,
  open,
  onOpenChange,
}: SubjectDetailDialogProps) {
  const { data, isFetching } = useGetSubjectDetailQuery(subjectId!, {
    skip: !subjectId || !open,
  });

  const detail: SubjectDetail | undefined = data;

  const statusInfo = detail
    ? statusMap[detail.summary.status] ?? {
        label: detail.summary.status,
        variant: "outline" as const,
      }
    : undefined;

  const [levelSearch, setLevelSearch] = useState("");
  // Dùng chung một filter level cho cả phần Levels và Khóa học
  const [levelFilter, setLevelFilter] = useState<string | "ALL">("ALL");
  const [courseSearch, setCourseSearch] = useState("");
  const [courseApprovalFilter, setCourseApprovalFilter] = useState<
    "ALL" | "APPROVED" | "PENDING" | "REJECTED"
  >("ALL");
  const [courseStatusFilter, setCourseStatusFilter] = useState<
    "ALL" | "ACTIVE" | "DRAFT" | "INACTIVE" | "SUBMITTED"
  >("ALL");

  const filteredLevels = useMemo(() => {
    if (!detail) return [];
    const query = levelSearch.trim().toLowerCase();

    return detail.levels.filter((level) => {
      // Filter theo level được chọn (dùng chung với phần Khóa học)
      if (levelFilter !== "ALL" && level.name !== levelFilter) {
        return false;
      }

      if (!query) return true;

      const name = level.name?.toLowerCase() ?? "";
      const code = level.code?.toLowerCase() ?? "";
      const description = level.description?.toLowerCase() ?? "";
      return (
        name.includes(query) ||
        code.includes(query) ||
        description.includes(query)
      );
    });
  }, [detail, levelSearch, levelFilter]);

  const filteredCourses = useMemo(() => {
    if (!detail) return [];
    const query = courseSearch.trim().toLowerCase();

    return detail.courses.filter((course) => {
      if (courseApprovalFilter !== "ALL") {
        if (course.approvalStatus !== courseApprovalFilter) {
          return false;
        }
      }

      if (courseStatusFilter !== "ALL") {
        if (course.status !== courseStatusFilter) {
          return false;
        }
      }

      if (levelFilter !== "ALL") {
        if ((course.levelName ?? "") !== levelFilter) {
          return false;
        }
      }

      if (!query) return true;

      const combined = `${course.code} ${course.name} ${
        course.levelName ?? ""
      }`.toLowerCase();
      return combined.includes(query);
    });
  }, [
    detail,
    courseSearch,
    courseApprovalFilter,
    courseStatusFilter,
    levelFilter,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-6xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle className="text-2xl flex flex-wrap items-center gap-3">
            <span>{detail?.summary.name || "Chi tiết môn học"}</span>
          </DialogTitle>
          <DialogDescription className="mt-2 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{detail?.summary.code}</Badge>
              {statusInfo && (
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              )}
              {detail?.summary.ownerName && (
                <span className="text-sm text-muted-foreground">
                  Chủ sở hữu:{" "}
                  <span className="font-medium text-foreground">
                    {detail.summary.ownerName}
                  </span>
                </span>
              )}
            </div>

            {detail && (
              <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
                <div className="rounded-full bg-background border px-3 py-1 flex items-center gap-1.5">
                  <span className="text-muted-foreground">Levels</span>
                  <span className="font-medium">
                    {detail.summary.levelCount}
                  </span>
                </div>
                <div className="rounded-full bg-background border px-3 py-1 flex items-center gap-1.5">
                  <span className="text-muted-foreground">Khóa học</span>
                  <span className="font-medium">
                    {detail.summary.courseCount}
                  </span>
                </div>
                <div className="rounded-full bg-background border px-3 py-1 flex items-center gap-1.5">
                  <span className="text-muted-foreground">Chờ duyệt</span>
                  <span className="font-medium text-amber-600">
                    {detail.summary.pendingCourseCount}
                  </span>
                </div>
                <div className="rounded-full bg-background border px-3 py-1 flex items-center gap-1.5">
                  <span className="text-muted-foreground">Đã duyệt</span>
                  <span className="font-medium text-emerald-600">
                    {detail.summary.approvedCourseCount}
                  </span>
                </div>
                <div className="rounded-full bg-background border px-3 py-1 flex items-center gap-1.5">
                  <span className="text-muted-foreground">Bản nháp</span>
                  <span className="font-medium text-slate-600">
                    {detail.summary.draftCourseCount}
                  </span>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        {isFetching ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : detail ? (
          <ScrollArea className="h-[78vh]">
            <div className="space-y-6 px-6 pb-6">
              <section className="space-y-2">
                <h3 className="text-lg font-semibold">Thông tin chung</h3>
                <p className="text-sm text-muted-foreground">
                  {detail.summary.description || "Chưa có mô tả"}
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h3 className="text-lg font-semibold">Levels</h3>
                {detail.levels.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có level nào.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={levelSearch}
                          onChange={(e) => setLevelSearch(e.target.value)}
                          placeholder="Tìm theo tên, mã, mô tả level..."
                          className="pl-9 h-9"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select
                          value={levelFilter}
                          onValueChange={(value) =>
                            setLevelFilter(value as string | "ALL")
                          }
                        >
                          <SelectTrigger className="h-9 w-[170px]">
                            <SelectValue placeholder="Tất cả level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">Tất cả level</SelectItem>
                            {detail.levels.map((level) => (
                              <SelectItem key={level.id} value={level.name}>
                                {level.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {filteredLevels.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        Không có level nào phù hợp với bộ lọc.
                      </p>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {filteredLevels.map((level) => (
                          <div
                            key={level.id}
                            className="rounded-lg border p-3 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{level.name}</div>
                              <Badge variant="outline">{level.code}</Badge>
                            </div>
                            {level.description && (
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                {level.description}
                              </p>
                            )}
                            <div className="mt-2 text-xs text-muted-foreground">
                              <span>
                                Số giờ: {level.expectedDurationHours ?? "-"}h
                              </span>{" "}
                              · <span>Số khóa học: {level.courseCount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>

              <Separator />

              <section className="space-y-3">
                <h3 className="text-lg font-semibold">Khóa học</h3>
                {detail.courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có khóa học nào.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={courseSearch}
                          onChange={(e) => setCourseSearch(e.target.value)}
                          placeholder="Tìm theo mã, tên, level..."
                          className="pl-9 h-9"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select
                          value={levelFilter}
                          onValueChange={(value) =>
                            setLevelFilter(value as string | "ALL")
                          }
                        >
                          <SelectTrigger className="h-9 w-[170px]">
                            <SelectValue placeholder="Tất cả level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">Tất cả level</SelectItem>
                            {detail.levels.map((level) => (
                              <SelectItem key={level.id} value={level.name}>
                                {level.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={courseStatusFilter}
                          onValueChange={(value) =>
                            setCourseStatusFilter(
                              value as
                                | "ALL"
                                | "ACTIVE"
                                | "DRAFT"
                                | "INACTIVE"
                                | "SUBMITTED"
                            )
                          }
                        >
                          <SelectTrigger className="h-9 w-[170px]">
                            <SelectValue placeholder="Trạng thái khóa" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">
                              Tất cả trạng thái
                            </SelectItem>
                            <SelectItem value="ACTIVE">Đang mở</SelectItem>
                            <SelectItem value="DRAFT">Bản nháp</SelectItem>
                            <SelectItem value="INACTIVE">Ngừng dùng</SelectItem>
                            <SelectItem value="SUBMITTED">
                              Đã gửi duyệt
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={courseApprovalFilter}
                          onValueChange={(value) =>
                            setCourseApprovalFilter(
                              value as
                                | "ALL"
                                | "APPROVED"
                                | "PENDING"
                                | "REJECTED"
                            )
                          }
                        >
                          <SelectTrigger className="h-9 w-[190px]">
                            <SelectValue placeholder="Trạng thái duyệt" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">
                              Tất cả trạng thái duyệt
                            </SelectItem>
                            <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                            <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                            <SelectItem value="REJECTED">Đã từ chối</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {filteredCourses.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        Không có khóa học nào phù hợp với bộ lọc.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium">
                                Mã khóa
                              </th>
                              <th className="px-4 py-2 text-left font-medium">
                                Tên khóa
                              </th>
                              <th className="px-4 py-2 text-left font-medium">
                                Level
                              </th>
                              <th className="px-4 py-2 text-left font-medium">
                                Trạng thái
                              </th>
                              <th className="px-4 py-2 text-left font-medium">
                                Trạng thái duyệt
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCourses.map((course) => (
                              <tr key={course.id} className="border-t">
                                <td className="px-4 py-2 font-medium">
                                  {course.code}
                                </td>
                                <td className="px-4 py-2">{course.name}</td>
                                <td className="px-4 py-2 text-muted-foreground">
                                  {course.levelName || "-"}
                                </td>
                                <td className="px-4 py-2">
                                  <Badge variant="outline">
                                    {courseStatusLabelMap[course.status] ??
                                      course.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-2">
                                  <Badge
                                    variant={
                                      course.approvalStatus === "APPROVED"
                                        ? "default"
                                        : course.approvalStatus === "REJECTED"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                  >
                                    {approvalLabelMap[course.approvalStatus] ??
                                      course.approvalStatus}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>
        ) : (
          <div className="p-6 text-sm text-muted-foreground">
            Không thể tải dữ liệu môn học.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
