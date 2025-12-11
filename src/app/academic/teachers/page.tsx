import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  UserCheck,
  UserX,
  RotateCcw,
  Loader2,
  GraduationCap,
  Users,
} from "lucide-react";
import { useGetTeachersQuery } from "@/store/services/academicTeacherApi";
import { TeacherDetailDrawer } from "./components/TeacherDetailDrawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

type FilterState = {
  search: string;
  hasSkills: boolean | undefined;
};

export default function AcademicTeachersPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    hasSkills: undefined,
  });
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const debouncedSearch = useDebounce(filters.search, 500);

  // Lấy selectedBranchId từ user đang đăng nhập
  const { selectedBranchId } = useAuth();

  // Query teachers với filters
  const {
    data: teachersResponse,
    isLoading,
    isFetching,
  } = useGetTeachersQuery(
    {
      search: debouncedSearch || undefined,
      hasSkills: filters.hasSkills,
      branchId: selectedBranchId || undefined,
    },
    { skip: false }
  );

  const teachers = useMemo(
    () => teachersResponse || [],
    [teachersResponse]
  );

  // Statistics
  const statistics = useMemo(() => {
    const total = teachers.length;
    const withSkills = teachers.filter((t) => t.hasSkills).length;
    const withoutSkills = teachers.filter((t) => !t.hasSkills).length;
    return { total, withSkills, withoutSkills };
  }, [teachers]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return filters.search.trim() !== "" || filters.hasSkills !== undefined;
  }, [filters]);

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: "",
      hasSkills: undefined,
    });
  };

  // Handlers
  const handleFilterChange = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleRowClick = (teacherId: number) => {
    setSelectedTeacherId(teacherId);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedTeacherId(null);
  };

  const isLoadingData = isLoading && !teachersResponse;

  return (
    <DashboardLayout
      title="Quản lý Giáo viên"
      description="Quản lý thông tin giáo viên và kỹ năng"
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng số giáo viên
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{statistics.total}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Có kỹ năng
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {statistics.withSkills}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Chưa có kỹ năng
              </CardTitle>
              <UserX className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-orange-600">
                  {statistics.withoutSkills}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Bộ lọc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên, email, mã nhân viên, số điện thoại..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="w-full md:w-[200px]">
                <label className="text-sm font-medium mb-2 block">
                  Trạng thái kỹ năng
                </label>
                <Select
                  value={
                    filters.hasSkills === undefined
                      ? "all"
                      : filters.hasSkills
                      ? "has"
                      : "none"
                  }
                  onValueChange={(value) => {
                    if (value === "all") {
                      handleFilterChange("hasSkills", undefined);
                    } else {
                      handleFilterChange("hasSkills", value === "has");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="has">Có kỹ năng</SelectItem>
                    <SelectItem value="none">Chưa có kỹ năng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="w-full md:w-auto"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Đặt lại
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Teachers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách giáo viên</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Không tìm thấy giáo viên</p>
                <p className="text-sm">
                  {hasActiveFilters
                    ? "Thử thay đổi bộ lọc để tìm kiếm"
                    : "Chưa có giáo viên nào trong hệ thống"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Giáo viên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mã nhân viên</TableHead>
                      <TableHead>Kỹ năng</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map((teacher) => (
                      <TableRow
                        key={teacher.teacherId}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(teacher.teacherId)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={teacher.avatarUrl || undefined}
                                alt={teacher.fullName}
                              />
                              <AvatarFallback>
                                {teacher.fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {teacher.fullName}
                              </div>
                              {teacher.phone && (
                                <div className="text-sm text-muted-foreground">
                                  {teacher.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{teacher.email}</TableCell>
                        <TableCell>{teacher.employeeCode}</TableCell>
                        <TableCell>
                          {teacher.hasSkills ? (
                            <div className="space-y-1">
                              <Badge variant="secondary">
                                {teacher.totalSkills} kỹ năng
                              </Badge>
                              {teacher.specializations.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {teacher.specializations.map((spec) => (
                                    <Badge
                                      key={spec}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {spec}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Chưa có
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              teacher.status === "ACTIVE"
                                ? "default"
                                : teacher.status === "INACTIVE"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {teacher.status === "ACTIVE"
                              ? "Hoạt động"
                              : teacher.status === "INACTIVE"
                              ? "Không hoạt động"
                              : teacher.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {isFetching && !isLoadingData && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Teacher Detail Drawer */}
      {selectedTeacherId && (
        <TeacherDetailDrawer
          teacherId={selectedTeacherId}
          open={drawerOpen}
          onClose={handleDrawerClose}
        />
      )}
    </DashboardLayout>
  );
}

