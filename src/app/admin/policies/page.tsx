"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminRoute } from "@/components/ProtectedRoute";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetPoliciesQuery,
  useUpdatePolicyMutation,
  type Policy,
} from "@/store/services/policyApi";
import { toast } from "sonner";
import { Search } from "lucide-react";

const PAGE_SIZE = 20;

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "Tất cả nhóm" },
  { value: "REQUEST", label: "Yêu cầu học viên" },
  { value: "ATTENDANCE", label: "Điểm danh" },
  { value: "CLASS", label: "Lớp học" },
  { value: "SESSION", label: "Buổi học" },
  { value: "TEACHER", label: "Giáo viên" },
  { value: "LICENSE", label: "Giấy phép" },
];

const SCOPE_OPTIONS = [
  { value: "ALL", label: "Tất cả scope" },
  { value: "GLOBAL", label: "Toàn hệ thống" },
  { value: "BRANCH", label: "Theo chi nhánh" },
  { value: "COURSE", label: "Theo khóa học" },
  { value: "CLASS", label: "Theo lớp học" },
];

export default function AdminPoliciesPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [scope, setScope] = useState("ALL");
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");

  const { data, isLoading, isFetching } = useGetPoliciesQuery({
    page,
    size: PAGE_SIZE,
    search: search || undefined,
    category: category && category !== "ALL" ? category : undefined,
    scope: scope && scope !== "ALL" ? scope : undefined,
  });

  const [updatePolicy, { isLoading: isUpdating }] = useUpdatePolicyMutation();

  const pageData = data?.data;
  const policies = pageData?.content ?? [];

  const normalizeBooleanValue = (
    value?: string | null,
    fallback: string = "true"
  ) => {
    if (!value) return fallback;
    const lower = value.toLowerCase();
    return lower === "true" || lower === "false" ? lower : fallback;
  };

  const handleOpenEdit = (policy: Policy) => {
    const initialValue =
      policy.valueType === "BOOLEAN"
        ? normalizeBooleanValue(policy.currentValue ?? policy.defaultValue)
        : policy.currentValue ?? "";
    setEditingPolicy(policy);
    setNewValue(initialValue);
    setReason("");
  };

  const handleSave = async () => {
    if (!editingPolicy) return;
    try {
      await updatePolicy({
        id: editingPolicy.id,
        body: { newValue, reason: reason || undefined },
      }).unwrap();
      toast.success("Cập nhật policy thành công");
      setEditingPolicy(null);
    } catch (err: unknown) {
      const anyErr = err as { data?: { message?: string } };
      toast.error(anyErr?.data?.message || "Cập nhật policy thất bại");
    }
  };

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
                {/* Header */}
                <div className="px-4 lg:px-6">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">
                      Quản lý Policy hệ thống
                    </h1>
                    <p className="text-muted-foreground">
                      Thay đổi nhanh các business rule mà không cần deploy lại
                      hệ thống
                    </p>
                  </div>
                </div>

                {/* Filters */}
                <div className="px-4 lg:px-6 space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Tìm theo key hoặc tên policy..."
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setPage(0);
                        }}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={category}
                      onValueChange={(v) => {
                        setCategory(v);
                        setPage(0);
                      }}
                    >
                      <SelectTrigger className="w-[190px]">
                        <SelectValue placeholder="Nhóm policy" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={scope}
                      onValueChange={(v) => {
                        setScope(v);
                        setPage(0);
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Scope" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCOPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Table */}
                <div className="px-4 lg:px-6">
                  <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="overflow-x-auto">
                      {isLoading ? (
                        <div className="space-y-2 p-4">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                          ))}
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Key</TableHead>
                              <TableHead>Tên</TableHead>
                              <TableHead>Nhóm</TableHead>
                              <TableHead>Scope</TableHead>
                              <TableHead>Giá trị hiện tại</TableHead>
                              <TableHead>Mặc định</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {policies.map((p) => (
                              <TableRow key={p.id}>
                                <TableCell className="font-mono text-xs max-w-[260px] break-words">
                                  {p.policyKey}
                                </TableCell>
                                <TableCell className="max-w-[260px]">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium text-sm">
                                      {p.policyName}
                                    </span>
                                    {p.description && (
                                      <span className="text-xs text-muted-foreground line-clamp-2">
                                        {p.description}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {p.policyCategory}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{p.scope}</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col text-sm">
                                    <span className="font-mono">
                                      {p.currentValue}
                                      {p.unit ? ` ${p.unit}` : ""}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      Kiểu: {p.valueType}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {p.defaultValue}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenEdit(p)}
                                  >
                                    Chỉnh sửa
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {policies.length === 0 && !isLoading && (
                              <TableRow>
                                <TableCell
                                  colSpan={7}
                                  className="py-8 text-center text-sm text-muted-foreground"
                                >
                                  Không có policy nào phù hợp bộ lọc
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <Dialog
        open={!!editingPolicy}
        onOpenChange={(open) => {
          if (!open) setEditingPolicy(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật policy: </DialogTitle>
          </DialogHeader>
          {editingPolicy && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {editingPolicy.policyName}
                </p>
                {editingPolicy.description && (
                  <p className="text-xs text-muted-foreground">
                    {editingPolicy.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Giá trị mới ({editingPolicy.valueType})
                </label>
                {editingPolicy.valueType === "BOOLEAN" ? (
                  <Select
                    value={newValue || undefined}
                    onValueChange={(value) => setNewValue(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn giá trị" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Bật</SelectItem>
                      <SelectItem value="false">Tắt</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Mặc định: {editingPolicy.defaultValue}
                  {editingPolicy.unit ? ` ${editingPolicy.unit}` : ""}
                  {editingPolicy.minValue !== null &&
                    editingPolicy.minValue !== undefined &&
                    editingPolicy.maxValue !== null &&
                    editingPolicy.maxValue !== undefined && (
                      <>
                        {" "}
                        — Khoảng cho phép: {editingPolicy.minValue} -{" "}
                        {editingPolicy.maxValue}
                      </>
                    )}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Lý do thay đổi (tùy chọn)
                </label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Mùa cao điểm, cần tăng lead time"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingPolicy(null)}
                >
                  Hủy
                </Button>
                <Button onClick={handleSave} disabled={isUpdating}>
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminRoute>
  );
}
