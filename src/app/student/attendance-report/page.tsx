import type React from "react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { StudentRoute } from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  type StudentAttendanceOverviewClassDTO,
  useGetStudentAttendanceOverviewQuery,
} from "@/store/services/attendanceApi";
import { ClipboardList, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttendanceClassCard } from "@/components/attendance/AttendanceClassCard";

type StatusFilter = 'all' | 'ongoing' | 'completed';

export default function StudentAttendanceReportOverviewPage() {
  const { data, isLoading, isError, refetch } =
    useGetStudentAttendanceOverviewQuery();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const classes: StudentAttendanceOverviewClassDTO[] = useMemo(() => 
    data?.data?.classes ?? [], [data]);

  // Filter classes by status
  const filteredClasses = useMemo(() => classes.filter((item) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'ongoing') return item.status === 'ONGOING';
    if (statusFilter === 'completed') return item.status === 'COMPLETED';
    return true;
  }), [classes, statusFilter]);

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
                <h1 className="text-3xl font-bold tracking-tight">
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
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Không thể tải báo cáo điểm danh
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Vui lòng kiểm tra kết nối và thử lại.
                        </p>
                      </div>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => refetch()}>
                        Thử lại
                      </Button>
                    </div>
                  )}

                  {!isLoading && !isError && classes.length === 0 && (
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <ClipboardList className="h-10 w-10" />
                        </EmptyMedia>
                        <EmptyTitle>Chưa có dữ liệu điểm danh</EmptyTitle>
                        <EmptyDescription>
                          Hệ thống sẽ hiển thị báo cáo ngay khi bạn được xếp vào lớp và có buổi học phát sinh.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
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
                        <Empty>
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <ClipboardList className="h-10 w-10" />
                            </EmptyMedia>
                            <EmptyTitle>Không tìm thấy lớp học</EmptyTitle>
                            <EmptyDescription>
                              Không có lớp học nào phù hợp với bộ lọc đã chọn.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      )}

                      {filteredClasses.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {filteredClasses.map((item) => (
                            <AttendanceClassCard
                              key={item.classId}
                              classCode={item.classCode}
                              className={item.className}
                              startDate={item.startDate}
                              actualEndDate={item.actualEndDate}
                              totalSessions={item.totalSessions}
                              attended={item.attended}
                              absent={item.absent}
                              excused={item.excused}
                              upcoming={item.upcoming}
                              status={item.status}
                              onClick={() =>
                                navigate(
                                  `/student/attendance-report/${item.classId}`
                                )
                              }
                            />
                          ))}
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
