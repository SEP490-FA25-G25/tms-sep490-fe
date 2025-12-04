"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import {
  useGetManagerTeachersQuery,
  useUpdateTeacherBranchesMutation,
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

function getInitials(name?: string) {
  if (!name) return "GV";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ManagerTeachersPage() {
  const { data: teacherResponse, isLoading: isLoadingTeachers } =
    useGetManagerTeachersQuery();
  const { data: branchResponse } = useGetManagerBranchesQuery();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<ManagerTeacher | null>(
    null
  );
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
  const [branchFilter, setBranchFilter] = useState<string>("all");

  const [updateTeacherBranches, { isLoading: isUpdating }] =
    useUpdateTeacherBranchesMutation();

  const branches = branchResponse?.data ?? [];

  const filteredTeachers = useMemo(() => {
    let source = teacherResponse?.data ?? [];

    if (branchFilter !== "all") {
      source = source.filter((t) => t.branchNames?.includes(branchFilter));
    }

    if (!search.trim()) return source;
    const term = search.toLowerCase();
    return source.filter(
      (t) =>
        t.fullName.toLowerCase().includes(term) ||
        t.email.toLowerCase().includes(term) ||
        (t.employeeCode && t.employeeCode.toLowerCase().includes(term))
    );
  }, [teacherResponse, search, branchFilter]);

  const openAssignDialog = (teacher: ManagerTeacher) => {
    setSelectedTeacher(teacher);
    const currentNames = new Set(teacher.branchNames ?? []);
    const initialSelected = branches
      .filter((b) => currentNames.has(b.name))
      .map((b) => b.id);
    setSelectedBranchIds(initialSelected);
  };

  const closeAssignDialog = () => {
    setSelectedTeacher(null);
    setSelectedBranchIds([]);
  };

  const toggleBranch = (branchId: number, checked: boolean) => {
    setSelectedBranchIds((prev) => {
      if (checked) {
        if (prev.includes(branchId)) return prev;
        return [...prev, branchId];
      }
      return prev.filter((id) => id !== branchId);
    });
  };

  const handleAssign = async () => {
    if (!selectedTeacher) {
      return;
    }
    try {
      await updateTeacherBranches({
        teacherId: selectedTeacher.teacherId,
        branchIds: selectedBranchIds,
      }).unwrap();
      toast.success("Cập nhật chi nhánh cho giáo viên thành công");
      closeAssignDialog();
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        "Không thể cập nhật chi nhánh cho giáo viên";
      toast.error(message);
    }
  };

  return (
    <DashboardLayout
      title="Quản lý giáo viên"
      description="Xem danh sách và gán giáo viên vào các chi nhánh thuộc phạm vi quản lý của bạn."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Tìm theo tên, email hoặc mã nhân viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <div className="flex justify-end">
            <Select
              value={branchFilter}
              onValueChange={(value) => setBranchFilter(value)}
            >
              <SelectTrigger className="w-[220px]">
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
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Giáo viên</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Chi nhánh</TableHead>
                <TableHead className="w-[140px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTeachers ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center">
                    Đang tải danh sách giáo viên...
                  </TableCell>
                </TableRow>
              ) : filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center">
                    Không tìm thấy giáo viên nào trong phạm vi chi nhánh của
                    bạn.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((teacher) => (
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
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="font-medium hover:underline"
                              onClick={() =>
                                navigate(`/manager/teachers/${teacher.teacherId}`)
                              }
                            >
                              {teacher.fullName}
                            </button>
                            {teacher.status && (
                              <Badge
                                variant={
                                  teacher.status === "ACTIVE"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {teacher.status}
                              </Badge>
                            )}
                          </div>
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
                          <p className="text-muted-foreground">
                            ĐT: {teacher.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {teacher.branchNames.length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          Chưa gán chi nhánh
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {teacher.branchNames.map((name) => (
                            <Badge
                              key={name}
                              variant="outline"
                              className="text-xs"
                            >
                              {name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAssignDialog(teacher)}
                      >
                        Gán chi nhánh
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selectedTeacher} onOpenChange={closeAssignDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cập nhật chi nhánh cho giáo viên</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Giáo viên:{" "}
              <span className="font-medium">
                {selectedTeacher?.fullName ?? ""}
              </span>
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Chọn chi nhánh</p>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
                {branches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Không có chi nhánh nào trong phạm vi quản lý của bạn.
                  </p>
                ) : (
                  branches.map((branch) => (
                    <label
                      key={branch.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={selectedBranchIds.includes(branch.id)}
                        onCheckedChange={(checked) =>
                          toggleBranch(branch.id, checked === true)
                        }
                      />
                      <span>{branch.name}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Bỏ chọn chi nhánh để gỡ giáo viên khỏi chi nhánh đó.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAssignDialog}>
              Hủy
            </Button>
            <Button onClick={handleAssign} disabled={isUpdating}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
