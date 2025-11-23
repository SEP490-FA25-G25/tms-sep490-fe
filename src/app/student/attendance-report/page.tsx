import type React from "react";
import { useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { StudentRoute } from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  type StudentAttendanceOverviewClassDTO,
  useGetStudentAttendanceOverviewQuery,
  attendanceApi,
} from "@/store/services/attendanceApi";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  ONGOING: {
    label: "Đang học",
    className: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  COMPLETED: {
    label: "Đã kết thúc",
    className: "text-slate-700 bg-slate-50 border-slate-200",
  },
  UPCOMING: {
    label: "Sắp diễn ra",
    className: "text-sky-700 bg-sky-50 border-sky-200",
  },
};

function getStatusMeta(status?: string | null) {
  if (!status) return null;
  return (
    STATUS_LABELS[status] ?? {
      label: status,
      className: "text-slate-700 bg-slate-50 border-slate-200",
    }
  );
}

function getAttendanceRate(attended: number, absent: number) {
  const totalCompleted = attended + absent;
  if (!totalCompleted || totalCompleted <= 0) return 0;
  return (attended / totalCompleted) * 100;
}

function getAttendanceRateClass(rate: number) {
  if (rate >= 80) return "text-emerald-700";
  if (rate >= 60) return "text-amber-700";
  return "text-rose-700";
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd/MM/yyyy");
}

type StatusFilter = 'all' | 'ongoing' | 'completed';

export default function StudentAttendanceReportOverviewPage() {
  const { data, isLoading, isError, refetch } =
    useGetStudentAttendanceOverviewQuery();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const classes: StudentAttendanceOverviewClassDTO[] =
    data?.data?.classes ?? [];

  // Filter classes by status
  const filteredClasses = classes.filter((item) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'ongoing') return item.status === 'ONGOING';
    if (statusFilter === 'completed') return item.status === 'COMPLETED';
    return true;
  });

  const handlePrefetch = (classId: number) => {
    dispatch(
      attendanceApi.endpoints.getStudentAttendanceReport.initiate(
        { classId },
        { forceRefetch: false }
      )
    );
  };

  return (
    <StudentRoute>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <main className="flex flex-1 flex-col">
            <header className="flex flex-col gap-2 border-b border-border px-6 py-5">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Báo cáo điểm danh
                </h1>
                <p className="text-sm text-muted-foreground">
                  Xem tổng quan tình trạng điểm danh theo từng lớp bạn đang
                  hoặc đã tham gia.
                </p>
              </div>
            </header>

            <div className="flex flex-1 flex-col">
              {(isLoading || isError || classes.length === 0) && (
                <section className="flex flex-col gap-4 px-6 py-6">
                  {isLoading && (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, index) => (
                        <Skeleton
                          key={index}
                          className="h-24 w-full rounded-2xl"
                        />
                      ))}
                    </div>
                  )}

                  {isError && !isLoading && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
                      <p className="font-semibold text-destructive">
                        Không thể tải báo cáo điểm danh.
                      </p>
                      <p className="mt-1 text-destructive/90">
                        Vui lòng kiểm tra kết nối và thử lại. Nếu lỗi tiếp diễn,
                        hãy liên hệ bộ phận hỗ trợ.
                      </p>
                      <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-3 inline-flex items-center rounded-md border border-destructive/40 bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Thử tải lại
                      </button>
                    </div>
                  )}

                  {!isLoading && !isError && classes.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
                      <p className="text-base font-medium text-foreground">
                        Chưa có dữ liệu điểm danh
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Hệ thống sẽ hiển thị báo cáo ngay khi bạn được xếp vào
                        lớp và có buổi học phát sinh.
                      </p>
                    </div>
                  )}
                </section>
              )}

              {!isLoading && !isError && classes.length > 0 && (
                <section className="flex flex-col gap-6 px-6 py-6">
                    {/* Classes Detail Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Chi tiết theo lớp</h2>
                        <ToggleGroup
                          type="single"
                          value={statusFilter}
                          onValueChange={(value) => {
                            if (value) setStatusFilter(value as StatusFilter);
                          }}
                          className="border rounded-lg p-1"
                        >
                          <ToggleGroupItem value="all" className="text-sm">
                            Tất cả
                          </ToggleGroupItem>
                          <ToggleGroupItem value="ongoing" className="text-sm">
                            Đang học
                          </ToggleGroupItem>
                          <ToggleGroupItem value="completed" className="text-sm">
                            Đã kết thúc
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>

                      {filteredClasses.length === 0 && (
                        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            Không có lớp học nào phù hợp với bộ lọc đã chọn
                          </p>
                        </div>
                      )}

                      {filteredClasses.length > 0 && (
                        <div className="grid gap-3">
                        {filteredClasses.map((item) => {
                        const statusMeta = getStatusMeta(item.status);
                        const rate = getAttendanceRate(
                          item.attended,
                          item.absent
                        );
                        return (
                          <article
                            key={item.classId}
                            className="group flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() =>
                              navigate(
                                `/student/my-classes/${item.classId}?tab=sessions`
                              )
                            }
                            onMouseEnter={() => handlePrefetch(item.classId)}
                            tabIndex={0}
                            role="button"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                navigate(
                                  `/student/my-classes/${item.classId}?tab=sessions`
                                );
                              }
                            }}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-1">
                                <h2 className="text-base font-semibold text-foreground">
                                  {item.className}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                  Ngày bắt đầu:{" "}
                                  <span className="font-medium text-foreground">
                                    {formatDate(item.startDate)}
                                  </span>
                                  <span className="mx-1">·</span>
                                  Ngày kết thúc:{" "}
                                  <span className="font-medium text-foreground">
                                    {formatDate(item.actualEndDate)}
                                  </span>
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1 text-right">
                                <p
                                  className={cn(
                                    "text-2xl font-semibold",
                                    getAttendanceRateClass(rate)
                                  )}
                                >
                                  {rate.toFixed(1)}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.attended + item.absent}/
                                  {item.totalSessions} buổi đã học
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                Tổng số buổi:{" "}
                                <span className="font-medium text-foreground">
                                  {item.totalSessions}
                                </span>
                              </span>
                              <span className="h-1 w-1 rounded-full bg-border" />
                              <span>
                                Có mặt:{" "}
                                <span className="font-medium text-emerald-700">
                                  {item.attended}
                                </span>
                              </span>
                              <span className="h-1 w-1 rounded-full bg-border" />
                              <span>
                                Vắng:{" "}
                                <span className="font-medium text-rose-700">
                                  {item.absent}
                                </span>
                              </span>
                              <span className="h-1 w-1 rounded-full bg-border" />
                              <span>
                                Sắp tới:{" "}
                                <span className="font-medium text-sky-700">
                                  {item.upcoming}
                                </span>
                              </span>

                              {statusMeta && (
                                <>
                                  <span className="h-1 w-1 rounded-full bg-border" />
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "border px-2 py-0.5 text-[11px] font-medium",
                                      statusMeta.className
                                    )}
                                  >
                                    {statusMeta.label}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </article>
                        );
                      })}
                        </div>
                      )}
                    </div>
                  </section>
                )}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </StudentRoute>
  );
}
