"use client";

import { useEffect, useMemo } from "react";
import {
  ActivityIcon,
  BarChartBigIcon,
  BookOpenIcon,
  BuildingIcon,
  CalendarDaysIcon,
  GraduationCapIcon,
  LayersIcon,
  UsersIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { AdminRoute } from "@/components/ProtectedRoute";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGetAnalyticsQuery } from "@/store/services/analyticsApi";

const chartColors = [
  "#6366f1",
  "#f97316",
  "#22c55e",
  "#06b6d4",
  "#f43f5e",
  "#a855f7",
];

const classStatusLabelMap: Record<string, string> = {
  COMPLETED: "Đã hoàn thành",
  DRAFT: "Bản nháp",
  SCHEDULED: "Đã lên lịch",
  ONGOING: "Đang diễn ra",
  SUBMITTED: "Đã gửi phê duyệt",
  CANCELLED: "Đã hủy",
};

const roleLabelMap: Record<string, string> = {
  ADMIN: "Quản trị viên",
  MANAGER: "Quản lý vùng",
  CENTER_HEAD: "Trưởng trung tâm",
  SUBJECT_LEADER: "Trưởng bộ môn",
  ACADEMIC_AFFAIR: "Học vụ",
  TEACHER: "Giáo viên",
  STUDENT: "Học viên",
  QA: "Kiểm định chất lượng",
};

export default function AdminAnalyticsPage() {
  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
  } = useGetAnalyticsQuery();

  useEffect(() => {
    if (isError) {
      toast.error("Không thể tải dữ liệu phân tích. Vui lòng thử lại.");
    }
  }, [isError]);

  const overview = analytics?.overview;
  const userAnalytics = analytics?.userAnalytics;
  const classAnalytics = analytics?.classAnalytics;
  const branchStats = analytics?.branchAnalytics?.branchStats;

  const userGrowthData = useMemo(
    () => userAnalytics?.userGrowth ?? [],
    [userAnalytics?.userGrowth]
  );

  const classStatusData = useMemo(
    () =>
      Object.entries(classAnalytics?.classesByStatus ?? {}).map(
        ([status, value], index) => ({
          status,
          label: classStatusLabelMap[status] ?? status.replaceAll("_", " "),
          value,
          fill: chartColors[index % chartColors.length],
        })
      ),
    [classAnalytics?.classesByStatus]
  );

  const topBranches = useMemo(() => {
    const stats = branchStats ?? [];
    return [...stats]
      .sort((a, b) => (b.studentCount ?? 0) - (a.studentCount ?? 0))
      .slice(0, 6)
      .map((branch) => ({
        name: branch.branchName,
        studentCount: branch.studentCount,
        teacherCount: branch.teacherCount,
        classCount: branch.classCount,
        activeClassCount: branch.activeClassCount,
      }));
  }, [branchStats]);

  const roleDistribution = Object.entries(userAnalytics?.usersByRole ?? {}).map(
    ([role, count]) => ({ role, count })
  );

  const SummaryCard = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
  }) => {
    return (
      <Card className="border border-border/50 bg-background/90 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground font-medium">
              {label}
            </span>
            <span className="text-2xl font-semibold text-foreground leading-tight">
              {formatNumber(value)}
            </span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </Card>
    );
  };

  const overviewCards = [
    {
      label: "Tổng người dùng",
      value: overview?.totalUsers ?? 0,
      icon: UsersIcon,
      accent: "slate",
    },
    {
      label: "Học viên",
      value: overview?.totalStudents ?? 0,
      icon: GraduationCapIcon,
      accent: "emerald",
    },
    {
      label: "Giáo viên",
      value: overview?.totalTeachers ?? 0,
      icon: LayersIcon,
      accent: "amber",
    },
    {
      label: "Lớp học đang hoạt động",
      value: overview?.activeClasses ?? 0,
      icon: ActivityIcon,
      accent: "rose",
    },
    {
      label: "Khóa học",
      value: overview?.totalCourses ?? 0,
      icon: BookOpenIcon,
      accent: "sky",
    },
    {
      label: "Trung tâm",
      value: overview?.totalCenters ?? 0,
      icon: BuildingIcon,
      accent: "purple",
    },
    {
      label: "Phiên học hôm nay",
      value: overview?.todaySessions ?? 0,
      icon: CalendarDaysIcon,
      accent: "cyan",
    },
    {
      label: "Đăng ký mới hôm nay",
      value: overview?.todayEnrollments ?? 0,
      icon: BarChartBigIcon,
      accent: "orange",
    },
  ];

  const formatNumber = (value?: number) => (value ?? 0).toLocaleString("vi-VN");

  return (
    <AdminRoute>
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
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="flex flex-col gap-3 px-4 lg:px-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                      Phân tích hệ thống
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      Tổng quan hoạt động toàn hệ thống theo thời gian thực
                    </p>
                  </div>
                  <button
                    onClick={() => refetch()}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Làm mới dữ liệu
                  </button>
                </div>

                {isLoading ? (
                  <div className="space-y-4 px-4 lg:px-6">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-80 w-full" />
                  </div>
                ) : (
                  <>
                    {/* Overview cards */}
                    <div className="grid gap-4 px-4 lg:px-6 sm:grid-cols-2 xl:grid-cols-4">
                      {overviewCards.map((card) => (
                        <SummaryCard
                          key={card.label}
                          label={card.label}
                          value={card.value}
                          icon={card.icon}
                          accent={card.accent}
                        />
                      ))}
                    </div>

                    {/* User & class statistics */}
                    <div className="grid gap-4 px-4 lg:px-6 lg:grid-cols-2">
                      <Card className="border-muted">
                        <CardHeader>
                          <CardTitle>Người dùng theo vai trò</CardTitle>
                          <CardDescription>
                            Tổng người dùng hoạt động:{" "}
                            {formatNumber(userAnalytics?.totalActiveUsers)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {roleDistribution.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                              Chưa có dữ liệu phân bổ vai trò.
                            </p>
                          ) : (
                            roleDistribution.map((role) => (
                              <div
                                key={role.role}
                                className="flex items-center justify-between rounded-lg border px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:bg-muted/40"
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium tracking-wide">
                                    {roleLabelMap[role.role] ??
                                      role.role.replaceAll("_", " ")}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Thành viên trong vai trò
                                  </span>
                                </div>
                                <span className="text-xl font-semibold">
                                  {formatNumber(role.count)}
                                </span>
                              </div>
                            ))
                          )}
                          <div className="flex gap-3 text-sm text-muted-foreground">
                            <Badge variant="secondary">
                              Hoạt động:{" "}
                              {formatNumber(userAnalytics?.totalActiveUsers)}
                            </Badge>
                            <Badge variant="outline">
                              Ngừng hoạt động:{" "}
                              {formatNumber(userAnalytics?.totalInactiveUsers)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-muted">
                        <CardHeader>
                          <CardTitle>Tình trạng lớp học</CardTitle>
                          <CardDescription>
                            Tổng lớp học:{" "}
                            {formatNumber(classAnalytics?.totalClasses)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg border px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:bg-muted/40">
                              <p className="text-muted-foreground text-xs">
                                Đang hoạt động
                              </p>
                              <p className="text-xl font-semibold">
                                {formatNumber(classAnalytics?.activeClasses)}
                              </p>
                            </div>
                            <div className="rounded-lg border px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:bg-muted/40">
                              <p className="text-muted-foreground text-xs">
                                Hoàn thành
                              </p>
                              <p className="text-xl font-semibold">
                                {formatNumber(classAnalytics?.completedClasses)}
                              </p>
                            </div>
                            <div className="rounded-lg border px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:bg-muted/40">
                              <p className="text-muted-foreground text-xs">
                                Bị hủy
                              </p>
                              <p className="text-xl font-semibold">
                                {formatNumber(classAnalytics?.cancelledClasses)}
                              </p>
                            </div>
                            <div className="rounded-lg border px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:bg-muted/40">
                              <p className="text-muted-foreground text-xs">
                                Tỉ lệ đăng ký TB
                              </p>
                              <p className="text-xl font-semibold">
                                {(
                                  (classAnalytics?.averageEnrollmentRate ?? 0) *
                                  100
                                ).toFixed(1)}
                                %
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Tổng lượt đăng ký:{" "}
                            {formatNumber(classAnalytics?.totalEnrollments)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid gap-4 px-4 lg:px-6 xl:grid-cols-3">
                      <Card className="border-muted xl:col-span-2">
                        <CardHeader>
                          <CardTitle>Xu hướng người dùng mới</CardTitle>
                          <CardDescription>
                            Số lượng tài khoản được tạo trong 6 tháng gần nhất
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {userGrowthData.length === 0 ? (
                            <div className="text-muted-foreground text-sm">
                              Chưa có dữ liệu lịch sử.
                            </div>
                          ) : (
                            <ChartContainer
                              config={{
                                count: {
                                  label: "Người dùng mới",
                                  color: "hsl(var(--chart-1))",
                                },
                              }}
                              className="min-h-[280px]"
                            >
                              <LineChart data={userGrowthData}>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  vertical={false}
                                />
                                <XAxis
                                  dataKey="month"
                                  tickLine={false}
                                  axisLine={false}
                                  tickMargin={8}
                                />
                                <YAxis
                                  tickLine={false}
                                  axisLine={false}
                                  tickMargin={8}
                                  allowDecimals={false}
                                />
                                <ChartTooltip
                                  content={
                                    <ChartTooltipContent indicator="dot" />
                                  }
                                />
                                <Line
                                  type="monotone"
                                  dataKey="count"
                                  stroke="var(--color-count)"
                                  strokeWidth={2}
                                  dot={{ r: 4 }}
                                  activeDot={{ r: 6 }}
                                />
                              </LineChart>
                            </ChartContainer>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-muted">
                        <CardHeader>
                          <CardTitle>Tình trạng lớp học</CardTitle>
                          <CardDescription>
                            Phân bố trạng thái hiện tại
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center space-y-4">
                          {classStatusData.length === 0 ? (
                            <div className="text-muted-foreground text-sm">
                              Chưa có dữ liệu trạng thái lớp học.
                            </div>
                          ) : (
                            <ChartContainer
                              config={classStatusData.reduce(
                                (acc, curr) => ({
                                  ...acc,
                                  [curr.status]: {
                                    label: curr.label,
                                    color: curr.fill,
                                  },
                                }),
                                {} as Record<
                                  string,
                                  { label: string; color: string }
                                >
                              )}
                              className="min-h-[280px] w-full flex items-center justify-center"
                            >
                              <PieChart>
                                <Pie
                                  data={classStatusData}
                                  dataKey="value"
                                  nameKey="label"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={90}
                                  paddingAngle={4}
                                >
                                  {classStatusData.map((entry) => (
                                    <Cell
                                      key={entry.status}
                                      fill={entry.fill}
                                    />
                                  ))}
                                </Pie>
                                <ChartTooltip
                                  content={
                                    <ChartTooltipContent labelKey="label" />
                                  }
                                />
                                <ChartLegend
                                  content={
                                    <ChartLegendContent nameKey="status" />
                                  }
                                />
                              </PieChart>
                            </ChartContainer>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Branch performance */}
                    <div className="grid gap-4 px-4 lg:px-6 lg:grid-cols-2">
                      <Card className="border-muted">
                        <CardHeader>
                          <CardTitle>Phân bố học viên theo chi nhánh</CardTitle>
                          <CardDescription>
                            Top chi nhánh có nhiều học viên nhất
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {topBranches.length === 0 ? (
                            <div className="text-muted-foreground text-sm">
                              Chưa có dữ liệu chi nhánh.
                            </div>
                          ) : (
                            <ChartContainer
                              config={{
                                studentCount: {
                                  label: "Học viên",
                                  color: "hsl(var(--chart-3))",
                                },
                              }}
                              className="min-h-[280px]"
                            >
                              <BarChart data={topBranches}>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  vertical={false}
                                />
                                <XAxis
                                  dataKey="name"
                                  tickLine={false}
                                  axisLine={false}
                                  tickMargin={8}
                                />
                                <YAxis
                                  tickLine={false}
                                  axisLine={false}
                                  tickMargin={8}
                                  allowDecimals={false}
                                />
                                <ChartTooltip
                                  content={
                                    <ChartTooltipContent indicator="line" />
                                  }
                                />
                                <Bar
                                  dataKey="studentCount"
                                  radius={[8, 8, 0, 0]}
                                  // Đậm hơn, dùng xanh lá chủ đạo
                                  fill="#16a34a"
                                />
                              </BarChart>
                            </ChartContainer>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-muted">
                        <CardHeader>
                          <CardTitle>Bảng xếp hạng chi nhánh</CardTitle>
                          <CardDescription>
                            Số liệu chi tiết của từng chi nhánh hàng đầu
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {topBranches.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                              Chưa có dữ liệu chi nhánh để hiển thị.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {topBranches.map((branch, index) => (
                                <div
                                  key={branch.name}
                                  className="rounded-lg border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:bg-muted/40"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-semibold">
                                        #{index + 1} {branch.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Học viên:{" "}
                                        {formatNumber(branch.studentCount)}
                                      </p>
                                    </div>
                                    <Badge variant="secondary">
                                      Lớp hoạt động:{" "}
                                      {formatNumber(branch.activeClassCount)}
                                    </Badge>
                                  </div>
                                  <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                                    <span>
                                      Giáo viên:{" "}
                                      {formatNumber(branch.teacherCount)}
                                    </span>
                                    <span>
                                      Tổng lớp:{" "}
                                      {formatNumber(branch.classCount)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminRoute>
  );
}
