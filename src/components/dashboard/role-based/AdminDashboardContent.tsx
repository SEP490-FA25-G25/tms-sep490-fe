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
  BarChart3,
  BookOpen,
  Building,
  CalendarDays,
  Users,
} from "lucide-react";
import { useGetAnalyticsQuery } from "@/store/services/analyticsApi";

export function AdminDashboardContent() {
  const navigate = useNavigate();
  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
  } = useGetAnalyticsQuery();

  const overview = analytics?.overview;
  const classAnalytics = analytics?.classAnalytics;

  const todaySummary = useMemo(
    () => ({
      todaySessions: overview?.todaySessions ?? 0,
      todayEnrollments: overview?.todayEnrollments ?? 0,
      activeClasses: overview?.activeClasses ?? 0,
    }),
    [
      overview?.todaySessions,
      overview?.todayEnrollments,
      overview?.activeClasses,
    ]
  );

  const alerts = useMemo(() => {
    if (!overview || !classAnalytics) return [];

    const items: Array<{
      id: string;
      title: string;
      description: string;
      type: "warning" | "info";
    }> = [];

    if (overview.pendingApprovals > 0) {
      items.push({
        id: "pending-approvals",
        title: "Yêu cầu đang chờ phê duyệt",
        description: `${overview.pendingApprovals} yêu cầu đang chờ xử lý (lớp, người dùng, hoặc yêu cầu khác).`,
        type: "warning",
      });
    }

    if (classAnalytics.cancelledClasses > 0) {
      items.push({
        id: "cancelled-classes",
        title: "Lớp đã bị hủy",
        description: `${classAnalytics.cancelledClasses} lớp ở trạng thái Hủy. Kiểm tra nguyên nhân và cập nhật kế hoạch nếu cần.`,
        type: "info",
      });
    }

    if (todaySummary.todaySessions === 0) {
      items.push({
        id: "no-sessions-today",
        title: "Hôm nay không có buổi học nào",
        description:
          "Kiểm tra lại lịch khai giảng và đảm bảo kế hoạch giảng dạy vẫn đúng.",
        type: "info",
      });
    }

    return items.slice(0, 4);
  }, [overview, classAnalytics, todaySummary.todaySessions]);

  if (isLoading && !analytics) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index}>
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
      {/* Tổng quan nhanh */}
      <div className="px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Học viên",
              value: overview?.totalStudents ?? 0,
              helper: "Tổng số học viên trong hệ thống",
              icon: Users,
              onClick: () => navigate("/admin/users?role=STUDENT"),
            },
            {
              label: "Giáo viên",
              value: overview?.totalTeachers ?? 0,
              helper: "Tài khoản giáo viên đang quản lý",
              icon: BookOpen,
              onClick: () => navigate("/admin/users?role=TEACHER"),
            },
            {
              label: "Lớp đang diễn ra",
              value: overview?.activeClasses ?? 0,
              helper: "Số lớp ở trạng thái Đang diễn ra",
              icon: CalendarDays,
              onClick: () => navigate("/admin/classes"),
            },
            {
              label: "Yêu cầu chờ duyệt",
              value: overview?.pendingApprovals ?? 0,
              helper: "Yêu cầu cần AA / quản trị xử lý",
              icon: Activity,
              onClick: () => navigate("/admin/analytics"),
            },
          ].map((card, index) => (
            <Card
              key={index}
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

      {/* Tình hình hôm nay + Biểu đồ nhỏ */}
      <div className="px-4 lg:px-6 mt-4 grid gap-4 lg:grid-cols-[1.5fr_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Tình hình hôm nay</CardTitle>
            <CardDescription>
              Ảnh hưởng trực tiếp đến vận hành trong ngày.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Buổi học hôm nay
                </p>
                <div className="mt-1 text-2xl font-bold">
                  {todaySummary.todaySessions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tổng số buổi theo lịch trong ngày.
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Đăng ký hôm nay</p>
                <div className="mt-1 text-2xl font-bold">
                  {todaySummary.todayEnrollments}
                </div>
                <p className="text-xs text-muted-foreground">
                  Số lượt ghi danh được tạo trong ngày.
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Lớp đang hoạt động
                </p>
                <div className="mt-1 text-2xl font-bold">
                  {todaySummary.activeClasses}
                </div>
                <p className="text-xs text-muted-foreground">
                  Số lớp ở trạng thái Đang diễn ra.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ảnh chụp nhanh hệ thống</CardTitle>
            <CardDescription>
              Tổng quan số trung tâm, chi nhánh, khóa học.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Trung tâm</span>
                <span className="font-semibold flex items-center gap-1">
                  <Building className="h-3 w-3 text-muted-foreground" />
                  {overview?.totalCenters ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Chi nhánh</span>
                <span className="font-semibold">
                  {overview?.totalBranches ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Khóa học</span>
                <span className="font-semibold">
                  {overview?.totalCourses ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Lớp (tất cả trạng thái)
                </span>
                <span className="font-semibold">
                  {overview?.totalClasses ?? 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Việc cần làm ngay */}
      <div className="px-4 lg:px-6 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Việc cần xử lý</CardTitle>
              <CardDescription>
                Các mục nên được ưu tiên kiểm tra để hệ thống vận hành trơn tru.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="flex items-center gap-1 text-xs"
            >
              <BarChart3 className="h-3 w-3" />
              {alerts.length > 0 ? `${alerts.length} mục` : "Không có cảnh báo"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Hiện tại không có cảnh báo nào đặc biệt. Bạn có thể xem thêm chi
                tiết ở tab{" "}
                <span className="font-semibold">Phân tích hệ thống</span>.
              </p>
            )}
            {alerts.map((alert) => (
              <Alert
                key={alert.id}
                variant={alert.type === "warning" ? "destructive" : "default"}
                className="border border-border/60"
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

      {/* Trạng thái lớp học tổng quan */}
      <div className="px-4 lg:px-6 mt-6 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Trạng thái lớp học</CardTitle>
              <CardDescription>
                Tóm tắt số lớp theo trạng thái hiện tại.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {classAnalytics ? (
              <div className="grid gap-4 sm:grid-cols-4">
                {[
                  {
                    label: "Tổng lớp",
                    value: classAnalytics.totalClasses,
                  },
                  {
                    label: "Đang diễn ra",
                    value: classAnalytics.activeClasses,
                  },
                  {
                    label: "Hoàn thành",
                    value: classAnalytics.completedClasses,
                  },
                  {
                    label: "Đã hủy",
                    value: classAnalytics.cancelledClasses,
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    <div className="mt-1 text-xl font-semibold">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Không lấy được dữ liệu lớp học. Vui lòng thử tải lại.
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
    </>
  );
}
