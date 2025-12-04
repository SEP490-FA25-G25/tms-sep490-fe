"use client";

import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  Search,
  Users,
  Calendar,
} from "lucide-react";
import {
  useGetTimeSlotsQuery,
  type TimeSlot,
} from "@/store/services/resourceApi";
import { useGetManagerBranchesQuery } from "@/store/services/branchApi";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function ManagerTimeSlotsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [branchFilter, setBranchFilter] = useState<number | "ALL">("ALL");

  const { data: managerBranchesResponse } = useGetManagerBranchesQuery();
  const managerBranches = useMemo(
    () => managerBranchesResponse?.data ?? [],
    [managerBranchesResponse?.data],
  );

  const { data: timeSlots, isFetching } = useGetTimeSlotsQuery(
    {
      branchId: branchFilter === "ALL" ? undefined : branchFilter,
    },
  );

  const managerBranchIds = useMemo(
    () => new Set(managerBranches.map((b) => b.id)),
    [managerBranches],
  );

  const scopedTimeSlots = useMemo(() => {
    if (!timeSlots) return [];
    if (managerBranchIds.size === 0) return timeSlots;
    return timeSlots.filter((ts) => managerBranchIds.has(ts.branchId));
  }, [timeSlots, managerBranchIds]);

  const filteredTimeSlots = useMemo(() => {
    let result: TimeSlot[] = scopedTimeSlots ?? [];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (ts) =>
          ts.name.toLowerCase().includes(q) ||
          ts.branchName.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((ts) => ts.status === statusFilter);
    }

    // sort by branch then startTime
    return [...result].sort((a, b) => {
      if (a.branchName.toLowerCase() < b.branchName.toLowerCase()) return -1;
      if (a.branchName.toLowerCase() > b.branchName.toLowerCase()) return 1;
      if (a.startTime < b.startTime) return -1;
      if (a.startTime > b.startTime) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [scopedTimeSlots, search, statusFilter]);

  const stats = useMemo(() => {
    const total = filteredTimeSlots.length;
    const active = filteredTimeSlots.filter((ts) => ts.status === "ACTIVE")
      .length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [filteredTimeSlots]);

  // group by branch for display
  const groupedByBranch = useMemo(() => {
    const map = new Map<string, TimeSlot[]>();
    filteredTimeSlots.forEach((ts) => {
      const key = ts.branchName || "Chưa có chi nhánh";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ts);
    });
    return Array.from(map.entries());
  }, [filteredTimeSlots]);

  return (
    <DashboardLayout
      title="Quản lý Khung giờ học"
      description="Xem danh sách các khung giờ học theo từng chi nhánh (chỉ xem, không chỉnh sửa)."
    >
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng khung giờ
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Tất cả khung giờ trong phạm vi của bạn
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
              <Calendar className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                Đang có thể được dùng để xếp lịch
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ngưng hoạt động
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground">
                Tạm thời không dùng để mở lớp mới
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên khung giờ hoặc chi nhánh..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9"
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as StatusFilter)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Ngưng hoạt động</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={branchFilter.toString()}
              onValueChange={(value) =>
                setBranchFilter(
                  value === "ALL" ? "ALL" : parseInt(value, 10),
                )
              }
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả chi nhánh</SelectItem>
                {managerBranches.map((b) => (
                  <SelectItem key={b.id} value={b.id.toString()}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table grouped by branch */}
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[220px]">Tên khung giờ</TableHead>
                <TableHead>Giờ học</TableHead>
                <TableHead className="w-[160px]">Trạng thái</TableHead>
                <TableHead className="w-[220px]">Sử dụng</TableHead>
                <TableHead className="w-[200px]">Availability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : groupedByBranch.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không có khung giờ nào phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                groupedByBranch.map(([branchName, slots]) => (
                  <>
                    <TableRow key={branchName} className="bg-muted/40">
                      <TableCell colSpan={5} className="font-semibold">
                        {branchName}
                      </TableCell>
                    </TableRow>
                    {slots.map((ts) => (
                      <TableRow key={ts.id}>
                        <TableCell>
                          <div className="font-medium">{ts.name}</div>
                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {ts.startTime} - {ts.endTime}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              {ts.startTime} - {ts.endTime}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ts.status === "ACTIVE" ? "default" : "destructive"
                            }
                            className={
                              ts.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : ""
                            }
                          >
                            {ts.status === "ACTIVE"
                              ? "Hoạt động"
                              : "Ngưng hoạt động"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>
                                {ts.activeClassesCount ?? 0} lớp đang dùng
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {ts.totalSessionsCount ?? 0} buổi đã/đang diễn
                                ra
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            <span>
                              {ts.hasFutureSessions
                                ? "Có buổi học trong tương lai"
                                : "Không có buổi học tương lai"}
                            </span>
                            <span>
                              {ts.hasTeacherAvailability
                                ? "Được dùng trong lịch rảnh GV"
                                : "Chưa được gắn vào lịch rảnh GV"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Simple pagination by branch section count if needed in future */}
        {/* {false && (
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
              Trang 1 / 1
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Trước
              </Button>
              <Button variant="outline" size="sm" disabled>
                Sau
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )} */}
      </div>
    </DashboardLayout>
  );
}


