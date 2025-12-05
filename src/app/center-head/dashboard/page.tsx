import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Users,
  GraduationCap,
  FileText,
  Clock,
  AlertTriangle,
  ChevronRight,
  Building2,
} from "lucide-react";
import { useGetManagerDashboardQuery } from "@/store/services/analyticsApi";
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { format, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function CenterHeadDashboardPage() {
  const navigate = useNavigate();

  // Use Manager dashboard API (Center Head uses similar data scoped to their branch)
  const {
    data: dashboard,
    isLoading,
    isError,
  } = useGetManagerDashboardQuery();

  const overview = dashboard?.summary;

  // Summary cards data
  const summaryCards = useMemo(() => {
    return [
      {
        label: "Lớp đang hoạt động",
        value: overview?.classes.activeTotal ?? 0,
        helper: `${Math.abs(overview?.classes.activeChangeVsPrevRangePercent ?? 0)}% so với kỳ trước`,
        icon: CalendarDays,
        trend: (overview?.classes.activeChangeVsPrevRangePercent ?? 0) >= 0 ? "up" : "down",
        onClick: () => navigate("/center-head/classes"),
      },
      {
        label: "Học viên đang theo học",
        value: overview?.students.activeTotal ?? 0,
        helper: `+${overview?.students.newEnrollmentsInRange ?? 0} đăng ký mới trong tuần`,
        icon: GraduationCap,
        onClick: () => navigate("/center-head/classes"),
      },
      {
        label: "Giáo viên",
        value: overview?.teachers.total ?? 0,
        helper: "Thuộc chi nhánh",
        icon: Users,
        onClick: () => navigate("/center-head/teacher-schedules"),
      },
      {
        label: "Báo cáo cần xem",
        value: (overview?.pendingRequests.totalPending ?? 0) + (overview?.qaReports.needManagerReview ?? 0),
        helper: `${overview?.qaReports.needManagerReview ?? 0} báo cáo QA cần duyệt`,
        icon: FileText,
        badge: overview?.qaReports.needManagerReview && overview.qaReports.needManagerReview > 0 
          ? `${overview.qaReports.needManagerReview}` 
          : undefined,
        onClick: () => navigate("/center-head/qa-reports"),
      },
    ];
  }, [overview, navigate]);

  // Teacher workload pie chart data
  const teacherWorkloadData = useMemo(() => {
    const workload = dashboard?.teachingWorkload;
    if (!workload) return [];
    return [
      { name: "Đang giảng dạy", value: workload.teachingTeachers, color: "#6366f1" },
      { name: "Rảnh", value: workload.availableTeachers, color: "#22c55e" },
    ];
  }, [dashboard?.teachingWorkload]);

  // Branch/Class distribution for bar chart
  const branchClassData = useMemo(() => {
    return dashboard?.classesPerBranch
      ?.filter((b) => b.active)
      .map((b) => ({
        name: b.branchName,
        activeClasses: b.activeClasses,
      })) ?? [];
  }, [dashboard?.classesPerBranch]);

  // Upcoming classes (simulate from attendance trend data)
  const upcomingClasses = useMemo(() => {
    // This would ideally come from API, for now we show placeholder
    const today = new Date();
    return Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `Lớp ${["IELTS", "TOEIC", "English Basics", "Speaking Advanced", "Writing"][i]}`,
      startDate: addDays(today, i + 1),
      teacher: `Giáo viên ${i + 1}`,
      room: `Phòng ${101 + i}`,
    }));
  }, []);

  // Attendance summary
  const attendanceSummary = useMemo(() => {
    const trend = dashboard?.attendanceTrend;
    if (!trend || trend.length === 0) {
      return { todayRate: 0, lowAttendanceCount: 0 };
    }
    const latestRate = trend[trend.length - 1]?.attendanceRate ?? 0;
    const lowCount = trend.filter(t => t.attendanceRate < 70).length;
    return { todayRate: latestRate, lowAttendanceCount: lowCount };
  }, [dashboard?.attendanceTrend]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, idx) => (
              <Card key={idx}>
                <CardHeader className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-12" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-80 w-full rounded-xl" />
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Không thể tải dữ liệu</h3>
          <p className="text-muted-foreground mb-4">
            Có lỗi xảy ra khi tải dữ liệu dashboard. Vui lòng thử lại sau.
          </p>
          <Button onClick={() => window.location.reload()}>Tải lại</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bảng điều khiển</h1>
          <p className="text-muted-foreground">
            Tổng quan hoạt động chi nhánh của bạn
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Card
              key={card.label}
              className="cursor-pointer transition hover:border-primary/50 hover:shadow-md"
              onClick={card.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.label}
                </CardTitle>
                <div className="relative">
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                  {card.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {card.badge}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {card.trend === "up" && <span className="text-green-500">↑</span>}
                  {card.trend === "down" && <span className="text-red-500">↓</span>}
                  {card.helper}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Teacher Workload Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Phân bố lịch dạy giáo viên
              </CardTitle>
              <CardDescription>
                Tỷ lệ giáo viên đang giảng dạy trong tuần
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teacherWorkloadData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="h-48 w-48">
                    <ResponsiveContainer>
                      <RePieChart>
                        <Pie
                          data={teacherWorkloadData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {teacherWorkloadData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 flex-1">
                    {teacherWorkloadData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: item.color }} 
                        />
                        <span className="text-sm flex-1">{item.name}</span>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        Tổng giờ dạy/tuần:{" "}
                        <span className="font-semibold text-foreground">
                          {dashboard?.teachingWorkload?.totalTeachingHoursInRange ?? 0}h
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  Chưa có dữ liệu
                </div>
              )}
            </CardContent>
          </Card>

          {/* Classes per Branch Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Số lớp theo chi nhánh
              </CardTitle>
              <CardDescription>
                Phân bố lớp đang hoạt động tại các cơ sở
              </CardDescription>
            </CardHeader>
            <CardContent>
              {branchClassData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer>
                    <BarChart
                      data={branchClassData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        tickMargin={8}
                        fontSize={11}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        tickMargin={8}
                        fontSize={11}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value} lớp`, "Số lớp"]}
                      />
                      <Bar
                        dataKey="activeClasses"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  Chưa có dữ liệu chi nhánh
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row: Upcoming Classes & Attendance */}
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          {/* Upcoming Classes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Lớp chuẩn bị khai giảng
                </CardTitle>
                <CardDescription>
                  Danh sách các lớp sắp bắt đầu trong 7-14 ngày tới
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/center-head/classes")}>
                Xem tất cả
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition cursor-pointer"
                    onClick={() => navigate(`/center-head/classes/${cls.id}`)}
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {cls.teacher} • {cls.room}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {format(cls.startDate, "dd/MM", { locale: vi })}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attendance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Tỷ lệ chuyên cần
              </CardTitle>
              <CardDescription>Thống kê điểm danh hôm nay</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-4xl font-bold text-primary">
                    {attendanceSummary.todayRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tỷ lệ chuyên cần trung bình
                  </p>
                </div>
                
                {attendanceSummary.lowAttendanceCount > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        {attendanceSummary.lowAttendanceCount} lớp cần chú ý
                      </p>
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        Chuyên cần dưới 70%
                      </p>
                    </div>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/center-head/classes")}
                >
                  Xem chi tiết điểm danh
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
