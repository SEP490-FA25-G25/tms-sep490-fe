"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import {
  useGetManagerTeachersQuery,
  type ManagerTeacher,
} from "@/store/services/teacherApi";
import { useGetManagerBranchesQuery } from "@/store/services/branchApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function getInitials(name?: string) {
  if (!name) return "GV";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const PAGE_SIZE = 10;

export default function CenterHeadTeacherSchedulesPage() {
  const navigate = useNavigate();

  const { data: teacherResponse, isLoading: isLoadingTeachers } =
    useGetManagerTeachersQuery();
  const { data: branchResponse } = useGetManagerBranchesQuery();

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const branches = branchResponse?.data ?? [];

  const filteredTeachers = useMemo(() => {
    let source = teacherResponse?.data ?? [];

    // Filter by branch
    if (branchFilter !== "all") {
      source = source.filter((t) => t.branchNames?.includes(branchFilter));
    }

    // Filter by status
    if (statusFilter !== "all") {
      source = source.filter((t) => t.status === statusFilter);
    }

    // Search filter
    if (search.trim()) {
      const term = search.toLowerCase();
      source = source.filter(
        (t) =>
          t.fullName.toLowerCase().includes(term) ||
          t.email.toLowerCase().includes(term) ||
          (t.employeeCode && t.employeeCode.toLowerCase().includes(term))
      );
    }

    return source;
  }, [teacherResponse, search, branchFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTeachers.length / PAGE_SIZE);
  const paginatedTeachers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTeachers.slice(start, start + PAGE_SIZE);
  }, [filteredTeachers, currentPage]);

  // Summary stats
  const stats = useMemo(() => {
    const all = teacherResponse?.data ?? [];
    return {
      total: all.length,
      active: all.filter((t) => t.status === "ACTIVE").length,
      inactive: all.filter((t) => t.status !== "ACTIVE").length,
    };
  }, [teacherResponse]);

  const handleViewSchedule = (teacher: ManagerTeacher) => {
    navigate(`/center-head/teacher-schedules/${teacher.teacherId}`);
  };

  return (
    <DashboardLayout
      title="Lịch dạy giáo viên"
      description="Xem danh sách và lịch dạy của giáo viên thuộc chi nhánh."
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng giáo viên</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Thuộc phạm vi chi nhánh
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                Giáo viên có trạng thái Active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tạm ngưng</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground">
                Giáo viên không hoạt động
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Tìm theo tên, email hoặc mã nhân viên..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1"
          />
          <Select
            value={branchFilter}
            onValueChange={(value) => {
              setBranchFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tất cả chi nhánh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chi nhánh</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.name}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="ACTIVE">Hoạt động</SelectItem>
              <SelectItem value="INACTIVE">Ngưng hoạt động</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Teacher Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Giáo viên</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Chi nhánh</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[140px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTeachers ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Không tìm thấy giáo viên nào.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTeachers.map((teacher) => (
                  <TableRow key={teacher.teacherId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={teacher.avatarUrl} />
                          <AvatarFallback>
                            {getInitials(teacher.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="font-medium">{teacher.fullName}</p>
                          {teacher.employeeCode && (
                            <p className="text-xs text-muted-foreground">
                              Mã NV: {teacher.employeeCode}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{teacher.email}</p>
                        {teacher.phone && (
                          <p className="text-muted-foreground">ĐT: {teacher.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {teacher.branchNames.length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          Chưa gán
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {teacher.branchNames.slice(0, 2).map((name) => (
                            <Badge key={name} variant="outline" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                          {teacher.branchNames.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{teacher.branchNames.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={teacher.status === "ACTIVE" ? "default" : "secondary"}
                      >
                        {teacher.status === "ACTIVE" ? "Hoạt động" : "Ngưng"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewSchedule(teacher)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Xem lịch
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Trang {currentPage} / {Math.max(totalPages, 1)} · {filteredTeachers.length} giáo viên
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }}
                  aria-disabled={currentPage === 1}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, Math.max(totalPages, 1)) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage < 4) {
                    pageNum = i + 1;
                  } else if (currentPage > totalPages - 3) {
                    pageNum = totalPages - 5 + i + 1;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                }
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(pageNum);
                      }}
                      isActive={pageNum === currentPage}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((p) => Math.min(Math.max(totalPages, 1), p + 1));
                  }}
                  aria-disabled={currentPage >= Math.max(totalPages, 1)}
                  className={currentPage >= Math.max(totalPages, 1) ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </DashboardLayout>
  );
}
