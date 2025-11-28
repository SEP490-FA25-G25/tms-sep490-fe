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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Activity,
  CheckCircle,
  CalendarDays,
  Users,
  Building2,
} from "lucide-react";
import { useGetManagerAnalyticsQuery } from "@/store/services/analyticsApi";

export function ManagerDashboardContent() {
  const navigate = useNavigate();
  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
  } = useGetManagerAnalyticsQuery();

  const overview = analytics?.overview;
  const classAnalytics = analytics?.classAnalytics;
  const userAnalytics = analytics?.userAnalytics;
  const branchAnalytics = analytics?.branchAnalytics;

  const summary = useMemo(
    () => ({
      totalTeachers: overview?.totalTeachers ?? 0,
      totalStudents: overview?.totalStudents ?? 0,
      activeClasses: overview?.activeClasses ?? 0,
      pendingApprovals: overview?.pendingApprovals ?? 0,
    }),
    [
      overview?.totalTeachers,
      overview?.totalStudents,
      overview?.activeClasses,
      overview?.pendingApprovals,
    ]
  );

  const alerts = useMemo(() => {
    if (!overview || !classAnalytics) return [];

    const items: Array<{
      id: string;
      title: string;
      description: string;
      type: "warning" | "info";
      action?: () => void;
    }> = [];

    if (overview.pendingApprovals > 0) {
      items.push({
        id: "pending-approvals",
        title: "Khóa học / lớp đang chờ phê duyệt",
        description: `${overview.pendingApprovals} mục đang chờ được bạn hoặc bộ phận liên quan duyệt.`,
        type: "warning",
        action: () => navigate("/manager/courses/approve"),
      });
    }

    if (classAnalytics.scheduledClasses ?? 0 > 0) {
      items.push({
        id: "upcoming-classes",
        title: "Lớp sắp khai giảng",
        description:
          "Kiểm tra lại việc phân công giáo viên và chuẩn bị nguồn lực cho các lớp sắp bắt đầu.",
        type: "info",
        action: () => navigate("/manager/courses/approve"),
      });
    }

    return items.slice(0, 4);
  }, [overview, classAnalytics, navigate]);

  const teacherLoad = useMemo(() => {
    const total = userAnalytics?.usersByRole?.TEACHER ?? 0;
    const active = overview?.totalTeachers ?? 0;
    return {
      total,
      active,
      idle: Math.max(total - active, 0),
    };
  }, [overview?.totalTeachers, userAnalytics?.usersByRole]);

  if (isLoading && !analytics) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
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
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      {/* Tổng quan ngắn gọn cho Manager */}
      <div className="px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Khóa học / lớp chờ duyệt",
              value: summary.pendingApprovals,
              helper: "Cần xem lại nội dung / điều kiện mở lớp",
              icon: CheckCircle,
              onClick: () => navigate("/manager/courses/approve"),
            },
            {
              label: "Giáo viên đang hoạt động",
              value: summary.totalTeachers,
              helper: "Đã được gán vào lớp trong hệ thống",
              icon: Users,
              onClick: () => navigate("/manager/teachers"),
            },
            {
              label: "Lớp đang diễn ra",
              value: summary.activeClasses,
              helper: "Trạng thái Đang diễn ra trong vùng của bạn",
              icon: CalendarDays,
              onClick: () => navigate("/manager/reports"),
            },
            {
              label: "Tổng học viên",
              value: summary.totalStudents,
              helper: "Bao gồm tất cả chi nhánh thuộc phạm vi",
              icon: Activity,
              onClick: () => navigate("/manager/reports"),
            },
          ].map((card) => (
            <Card
              key={card.label}
              className="cursor-pointer transition hover:border-primary/50"
              onClick={card.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.label}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.helper}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Việc cần xử lý */}
      <div className="px-4 lg:px-6 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Cần bạn xử lý</CardTitle>
              <CardDescription>
                Danh sách ngắn các mục Manager nên xem trong hôm nay.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="flex items-center gap-1 text-xs"
            >
              <Activity className="h-3 w-3" />
              {alerts.length > 0 ? `${alerts.length} mục` : "Không có cảnh báo"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Chưa có cảnh báo nổi bật. Bạn có thể xem chi tiết hơn ở các tab{" "}
                <span className="font-semibold">Phê duyệt khóa học</span> hoặc{" "}
                <span className="font-semibold">Báo cáo</span>.
              </p>
            )}
            {alerts.map((alert) => (
              <Alert
                key={alert.id}
                variant={alert.type === "warning" ? "destructive" : "default"}
                className="border border-border/60 cursor-pointer"
                onClick={alert.action}
              >
                <AlertTitle className="text-sm font-semibold">
                  {alert.title}
                </AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                  {alert.description}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tổng quan giáo viên */}
      <div className="px-4 lg:px-6 mt-6 mb-4 grid gap-4 lg:grid-cols-[1.5fr_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Tổng quan giáo viên</CardTitle>
            <CardDescription>
              Phân bổ giáo viên giữa đang dạy và đang rảnh.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Tổng giáo viên</p>
                <div className="mt-1 text-2xl font-bold">
                  {teacherLoad.total}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Đang dạy</p>
                <div className="mt-1 text-2xl font-bold">
                  {teacherLoad.active}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Đang rảnh</p>
                <div className="mt-1 text-2xl font-bold">
                  {teacherLoad.idle}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tóm tắt lớp học</CardTitle>
            <CardDescription>
              Dựa trên trạng thái lớp trong hệ thống.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classAnalytics ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tổng lớp</span>
                  <span className="font-semibold">
                    {classAnalytics.totalClasses}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Đang diễn ra</span>
                  <span className="font-semibold">
                    {classAnalytics.activeClasses}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Hoàn thành</span>
                  <span className="font-semibold">
                    {classAnalytics.completedClasses}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Đã hủy</span>
                  <span className="font-semibold">
                    {classAnalytics.cancelledClasses}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Không lấy được dữ liệu lớp học. Vui lòng thử lại sau.
              </p>
            )}
            {isError && (
              <div className="mt-4 text-xs text-destructive">
                Không thể tải dữ liệu tổng quan.{" "}
                <button
                  type="button"
                  className="underline underline-offset-2"
                  onClick={() => refetch()}
                >
                  Thử lại
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Thống kê chi nhánh và trung tâm */}
      <div className="px-4 lg:px-6 mt-6 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Thống kê chi nhánh và trung tâm</CardTitle>
            <CardDescription>
              Chỉ số chi tiết của các chi nhánh thuộc phạm vi quản lý, được nhóm theo trung tâm.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {branchAnalytics && branchAnalytics.branchStats.length > 0 ? (
              (() => {
                // Group branches by center
                const groupedByCenter = branchAnalytics.branchStats.reduce((acc, branch) => {
                  const centerKey = `${branch.centerId}-${branch.centerName}`;
                  if (!acc[centerKey]) {
                    acc[centerKey] = {
                      centerId: branch.centerId,
                      centerName: branch.centerName,
                      branches: [],
                      totals: { students: 0, teachers: 0, classes: 0, activeClasses: 0 },
                    };
                  }
                  acc[centerKey].branches.push(branch);
                  acc[centerKey].totals.students += branch.studentCount;
                  acc[centerKey].totals.teachers += branch.teacherCount;
                  acc[centerKey].totals.classes += branch.classCount;
                  acc[centerKey].totals.activeClasses += branch.activeClassCount;
                  return acc;
                }, {} as Record<string, {
                  centerId: number;
                  centerName: string;
                  branches: typeof branchAnalytics.branchStats;
                  totals: { students: number; teachers: number; classes: number; activeClasses: number };
                }>);

                const centerGroups = Object.values(groupedByCenter);

                return (
                  <div className="space-y-6">
                    {centerGroups.map((center) => (
                      <div key={center.centerId} className="space-y-2">
                        <div className="flex items-center gap-2 pb-2 border-b">
                          <Building2 className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-base">{center.centerName}</h3>
                          <Badge variant="outline" className="ml-auto">
                            {center.branches.length} chi nhánh
                          </Badge>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="text-left p-2 font-semibold">Chi nhánh</th>
                                <th className="text-right p-2 font-semibold">Học viên</th>
                                <th className="text-right p-2 font-semibold">Giáo viên</th>
                                <th className="text-right p-2 font-semibold">Tổng lớp</th>
                                <th className="text-right p-2 font-semibold">Lớp đang diễn ra</th>
                              </tr>
                            </thead>
                            <tbody>
                              {center.branches.map((branch) => (
                                <tr key={branch.branchId} className="border-b hover:bg-muted/50">
                                  <td className="p-2 font-medium">{branch.branchName}</td>
                                  <td className="text-right p-2">{branch.studentCount}</td>
                                  <td className="text-right p-2">{branch.teacherCount}</td>
                                  <td className="text-right p-2">{branch.classCount}</td>
                                  <td className="text-right p-2">
                                    <Badge variant={branch.activeClassCount > 0 ? "default" : "secondary"}>
                                      {branch.activeClassCount}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t font-semibold bg-muted/30">
                                <td className="p-2">Tổng cộng ({center.centerName})</td>
                                <td className="text-right p-2">{center.totals.students}</td>
                                <td className="text-right p-2">{center.totals.teachers}</td>
                                <td className="text-right p-2">{center.totals.classes}</td>
                                <td className="text-right p-2">
                                  <Badge variant={center.totals.activeClasses > 0 ? "default" : "secondary"}>
                                    {center.totals.activeClasses}
                                  </Badge>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    ))}
                    {/* Grand total */}
                    <div className="pt-4 border-t-2">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <tfoot>
                            <tr className="font-semibold bg-primary/10">
                              <td className="p-2">TỔNG CỘNG TẤT CẢ TRUNG TÂM</td>
                              <td className="text-right p-2">
                                {branchAnalytics.branchStats.reduce((sum, b) => sum + b.studentCount, 0)}
                              </td>
                              <td className="text-right p-2">
                                {branchAnalytics.branchStats.reduce((sum, b) => sum + b.teacherCount, 0)}
                              </td>
                              <td className="text-right p-2">
                                {branchAnalytics.branchStats.reduce((sum, b) => sum + b.classCount, 0)}
                              </td>
                              <td className="text-right p-2">
                                <Badge variant="default">
                                  {branchAnalytics.branchStats.reduce((sum, b) => sum + b.activeClassCount, 0)}
                                </Badge>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {isLoading 
                  ? "Đang tải dữ liệu..." 
                  : "Chưa có dữ liệu chi nhánh. Vui lòng liên hệ Admin để được phân công chi nhánh."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
