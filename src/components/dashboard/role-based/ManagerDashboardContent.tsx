import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  CheckCircle,
  CalendarDays,
  Users,
  Building2,
  PieChart,
} from "lucide-react";
import { useGetManagerDashboardQuery } from "@/store/services/analyticsApi";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

type SummarySnapshot = {
  totalTeachers: number;
  totalStudents: number;
  activeClasses: number;
  pendingApprovals: number;
};

export function ManagerDashboardContent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [summarySnapshot, setSummarySnapshot] =
    useState<SummarySnapshot | null>(null);

  const dateFromParam = searchParams.get("dateFrom");
  const dateToParam = searchParams.get("dateTo");

  const dateFrom = useMemo(
    () => (dateFromParam ? new Date(dateFromParam) : undefined),
    [dateFromParam]
  );
  const dateTo = useMemo(
    () => (dateToParam ? new Date(dateToParam) : undefined),
    [dateToParam]
  );

  const initialDateRange = useMemo(() => {
    if (dateFrom && dateTo) {
      return { from: dateFrom, to: dateTo };
    }
    return undefined;
  }, [dateFrom, dateTo]);

  const handleDateRangeChange = (
    range: { from: Date; to: Date } | undefined
  ) => {
    if (range) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("dateFrom", range.from.toISOString().split("T")[0]);
      newParams.set("dateTo", range.to.toISOString().split("T")[0]);
      setSearchParams(newParams);
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("dateFrom");
      newParams.delete("dateTo");
      setSearchParams(newParams);
    }
  };

  const {
    data: dashboard,
    isLoading,
    isError,
    refetch,
  } = useGetManagerDashboardQuery(
    dateFrom && dateTo
      ? {
          rangeType: "CUSTOM",
          fromDate: dateFrom.toISOString().split("T")[0],
          toDate: dateTo.toISOString().split("T")[0],
        }
      : undefined
  );

  const overview = dashboard?.summary;

  // Snapshot summary ngay lần load đầu, không thay đổi theo bộ lọc ngày
  useEffect(() => {
    if (!summarySnapshot && overview) {
      setSummarySnapshot({
        totalTeachers: overview.teachers.total ?? 0,
        totalStudents: overview.students.activeTotal ?? 0,
        activeClasses: overview.classes.activeTotal ?? 0,
        pendingApprovals: overview.pendingRequests.totalPending ?? 0,
      });
    }
  }, [overview, summarySnapshot]);

  const summary = useMemo(() => {
    if (summarySnapshot) {
      return summarySnapshot;
    }
    return {
      totalTeachers: overview?.teachers.total ?? 0,
      totalStudents: overview?.students.activeTotal ?? 0,
      activeClasses: overview?.classes.activeTotal ?? 0,
      pendingApprovals: overview?.pendingRequests.totalPending ?? 0,
    };
  }, [
    overview?.teachers.total,
    overview?.students.activeTotal,
    overview?.classes.activeTotal,
    overview?.pendingRequests.totalPending,
    summarySnapshot,
  ]);

  const teacherWorkload = dashboard?.teachingWorkload;

  const teacherLoad = useMemo(() => {
    const total = teacherWorkload?.totalTeachers ?? 0;
    const active = teacherWorkload?.teachingTeachers ?? 0;
    return {
      total,
      active,
      idle: Math.max(total - active, 0),
    };
  }, [teacherWorkload?.totalTeachers, teacherWorkload?.teachingTeachers]);

  const branchClassChartData = useMemo(
    () =>
      dashboard?.classesPerBranch
        ?.filter((b) => b.active)
        .map((b) => ({
          name: b.branchName,
          activeClasses: b.activeClasses,
        })) ?? [],
    [dashboard?.classesPerBranch]
  );

  if (isLoading && !dashboard) {
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
              label: "Tổng học viên",
              value: summary.totalStudents,
              helper: "Bao gồm tất cả chi nhánh thuộc phạm vi",
              icon: Activity,
              onClick: () => navigate("/manager/reports"),
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
              label: "Yêu cầu đang chờ phê duyệt",
              value: summary.pendingApprovals,
              helper:
                "Gồm yêu cầu chương trình đào tạo, giáo viên, học viên từ các chi nhánh.",
              icon: CheckCircle,
              onClick: () => navigate("/curriculum?tab=courses"),
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

      {/* Thống kê chi nhánh, lớp học, lịch dạy và tỷ lệ chuyên cần + filter cho toàn bộ biểu đồ */}
      <div className="px-4 lg:px-6 mt-6 mb-4 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Phạm vi thời gian cho biểu đồ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker
              value={initialDateRange}
              onChange={handleDateRangeChange}
              placeholder="Chọn khoảng thời gian"
              className="w-full sm:w-80"
            />
          </div>
        </div>

        {/* Hàng 1: Thống kê chi nhánh & Tóm tắt lớp học */}
        <div className="grid gap-4 lg:grid-cols-[1.5fr_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê chi nhánh và trung tâm</CardTitle>
              <CardDescription>
                Chỉ số chi tiết của các chi nhánh thuộc phạm vi quản lý, được
                nhóm theo trung tâm.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard?.classesPerBranch &&
              dashboard.classesPerBranch.length > 0 ? (
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        Số lớp đang hoạt động theo chi nhánh
                      </span>
                    </div>
                    {dashboard.classesPerBranch.map((b) => (
                      <div
                        key={b.branchId}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="flex-1 truncate">{b.branchName}</span>
                        {b.active ? (
                          <Badge variant="outline">{b.activeClasses} lớp</Badge>
                        ) : (
                          <Badge variant="outline">Không hoạt động</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="h-40 w-full">
                      <ResponsiveContainer>
                        <BarChart
                          data={branchClassChartData}
                          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                          />
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
                            formatter={(
                              value: number,
                              _name: string | number,
                              entry: { name?: string }
                            ) => [`${value} lớp`, entry.name ?? ""]}
                          />
                          <Bar
                            dataKey="activeClasses"
                            fill="#6366f1"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {isLoading
                    ? "Đang tải dữ liệu..."
                    : "Chưa có dữ liệu chi nhánh. Vui lòng liên hệ Admin để được phân công chi nhánh."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tổng số lớp học</CardTitle>
              <CardDescription>
                Số lượng lớp đang hoạt động trong phạm vi bạn quản lý.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Lớp đang hoạt động trong khoảng thời gian đã chọn
                  </span>
                </div>
              </div>
              {branchClassChartData.length > 0 && (
                <div className="mt-4 h-32 w-full">
                  <ResponsiveContainer>
                    <RePieChart>
                      <Pie
                        data={branchClassChartData}
                        dataKey="activeClasses"
                        nameKey="name"
                        innerRadius={30}
                        outerRadius={45}
                        paddingAngle={2}
                      >
                        {branchClassChartData.map((_, index) => (
                          <Cell
                            // đơn giản chia màu theo index, không cần quá cầu kỳ
                            key={index}
                            fill={
                              ["#6366f1", "#22c55e", "#f97316", "#ec4899"][
                                index % 4
                              ]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(
                          value: number,
                          _name: string | number,
                          entry: { name?: string }
                        ) => [`${value} lớp`, entry.name ?? ""]}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
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

        {/* Hàng 2: Tổng quan lịch dạy & Tỷ lệ chuyên cần toàn hệ thống */}
        <div className="grid gap-4 lg:grid-cols-[1.5fr_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Tổng quan lịch dạy (Teaching Workload)</CardTitle>
              <CardDescription>
                Phân bố giáo viên đang dạy và đang available trong khoảng thời
                gian đã chọn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Tổng giáo viên
                      </p>
                      <div className="mt-1 text-2xl font-bold">
                        {teacherLoad.total}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Đang dạy</p>
                      <div className="mt-1 text-2xl font-bold">
                        {teacherLoad.active}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dashboard?.teachingWorkload
                          ? `${dashboard.teachingWorkload.teachingPercent.toFixed(
                              1
                            )}%`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Đang rảnh</p>
                      <div className="mt-1 text-2xl font-bold">
                        {teacherLoad.idle}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dashboard?.teachingWorkload
                          ? `${dashboard.teachingWorkload.availablePercent.toFixed(
                              1
                            )}%`
                          : "-"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Tổng giờ dạy trong khoảng thời gian này:{" "}
                    <span className="font-semibold">
                      {dashboard?.teachingWorkload
                        ? `${dashboard.teachingWorkload.totalTeachingHoursInRange.toFixed(
                            1
                          )} giờ`
                        : "-"}
                    </span>
                  </p>
                </div>
                <div className="flex-1">
                  <div className="h-40 w-full">
                    <ResponsiveContainer>
                      <RePieChart>
                        <Pie
                          data={[
                            {
                              name: "Đang dạy",
                              value:
                                dashboard?.teachingWorkload?.teachingTeachers ??
                                0,
                            },
                            {
                              name: "Đang rảnh",
                              value:
                                dashboard?.teachingWorkload
                                  ?.availableTeachers ?? 0,
                            },
                          ]}
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          <Cell fill="#6366f1" />
                          <Cell fill="#e5e7eb" />
                        </Pie>
                        <Tooltip
                          formatter={(
                            value: number,
                            _name,
                            entry: { name?: string }
                          ) => {
                            const total =
                              (dashboard?.teachingWorkload?.teachingTeachers ??
                                0) +
                              (dashboard?.teachingWorkload?.availableTeachers ??
                                0);
                            const percent =
                              total > 0 ? ((value as number) / total) * 100 : 0;
                            return [
                              `${value} GV (${percent.toFixed(1)}%)`,
                              entry.name ?? "",
                            ];
                          }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tỷ lệ chuyên cần toàn hệ thống</CardTitle>
              <CardDescription>
                Tỷ lệ chuyên cần theo ngày trong khoảng thời gian đã chọn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard?.attendanceTrend &&
              dashboard.attendanceTrend.length > 0 ? (
                <div className="h-40 w-full">
                  <ResponsiveContainer>
                    <ReLineChart data={dashboard.attendanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        tickMargin={8}
                        fontSize={11}
                      />
                      <YAxis
                        tickLine={false}
                        tickMargin={8}
                        fontSize={11}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                      />
                      <Line
                        type="monotone"
                        dataKey="attendanceRate"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </ReLineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Chưa có dữ liệu chuyên cần trong khoảng thời gian này.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Xu hướng ghi danh */}
      <div className="px-4 lg:px-6 mt-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>Xu hướng ghi danh học viên</CardTitle>
              <CardDescription>
                Số lượng học viên ghi danh theo tuần trong khoảng thời gian đã
                chọn.
              </CardDescription>
            </div>
            <PieChart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dashboard?.enrollmentTrend &&
            dashboard.enrollmentTrend.length > 0 ? (
              <div className="h-52 w-full">
                <ResponsiveContainer>
                  <AreaChart data={dashboard.enrollmentTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      tickMargin={8}
                      fontSize={11}
                    />
                    <YAxis tickLine={false} tickMargin={8} fontSize={11} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="enrollments"
                      stroke="#22c55e"
                      fill="#22c55e33"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Chưa có dữ liệu ghi danh cho khoảng thời gian này.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
