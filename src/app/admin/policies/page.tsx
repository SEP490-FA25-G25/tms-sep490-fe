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
  useGetPolicyHistoryQuery,
  type Policy,
  type PolicyHistory,
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

export default function AdminPoliciesPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historySearch, setHistorySearch] = useState("");
  const [historyCategory, setHistoryCategory] = useState("ALL");

  const { data, isLoading } = useGetPoliciesQuery({
    page,
    size: PAGE_SIZE,
    search: search || undefined,
    category: category && category !== "ALL" ? category : undefined,
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

  const formatCurrentValue = (policy: Policy): string => {
    const value = policy.currentValue ?? "";
    const unit = policy.unit ?? "";

    // Dịch unit sang tiếng Việt
    const unitMap: Record<string, string> = {
      days: "ngày",
      day: "ngày",
      times: "lần",
      time: "lần",
      hours: "giờ",
      hour: "giờ",
      characters: "ký tự",
      character: "ký tự",
      minutes: "phút",
      minute: "phút",
      seconds: "giây",
      second: "giây",
      percent: "phần trăm",
      percentage: "phần trăm",
    };

    // Xử lý giá trị boolean
    if (policy.valueType === "BOOLEAN") {
      const lowerValue = value.toLowerCase();
      if (lowerValue === "true") return "Bật";
      if (lowerValue === "false") return "Tắt";
    }

    // Kiểm tra xem value có chứa unit không (ví dụ: "15 characters", "24 hours")
    const valueParts = value.trim().split(/\s+/);
    if (valueParts.length >= 2) {
      const lastPart = valueParts[valueParts.length - 1].toLowerCase();
      if (unitMap[lastPart]) {
        // Unit đã có trong value, tách ra và dịch
        const numericValue = valueParts.slice(0, -1).join(" ");
        const translatedUnit = unitMap[lastPart];
        return `${numericValue} ${translatedUnit}`;
      }
    }

    // Dịch unit từ policy.unit
    const translatedUnit = unit ? unitMap[unit.toLowerCase()] || unit : "";

    // Kết hợp giá trị và unit
    if (translatedUnit) {
      return `${value} ${translatedUnit}`;
    }

    return value;
  };

  const formatDefaultValue = (policy: Policy): string => {
    const value = policy.defaultValue ?? "";
    const unit = policy.unit ?? "";

    // Dịch unit sang tiếng Việt (dùng cùng unitMap)
    const unitMap: Record<string, string> = {
      days: "ngày",
      day: "ngày",
      times: "lần",
      time: "lần",
      hours: "giờ",
      hour: "giờ",
      characters: "ký tự",
      character: "ký tự",
      minutes: "phút",
      minute: "phút",
      seconds: "giây",
      second: "giây",
      percent: "phần trăm",
      percentage: "phần trăm",
    };

    // Xử lý giá trị boolean
    if (policy.valueType === "BOOLEAN") {
      const lowerValue = value.toLowerCase();
      if (lowerValue === "true") return "Bật";
      if (lowerValue === "false") return "Tắt";
    }

    // Kiểm tra xem value có chứa unit không (ví dụ: "15 characters", "24 hours")
    const valueParts = value.trim().split(/\s+/);
    if (valueParts.length >= 2) {
      const lastPart = valueParts[valueParts.length - 1].toLowerCase();
      if (unitMap[lastPart]) {
        // Unit đã có trong value, tách ra và dịch
        const numericValue = valueParts.slice(0, -1).join(" ");
        const translatedUnit = unitMap[lastPart];
        return `${numericValue} ${translatedUnit}`;
      }
    }

    // Dịch unit từ policy.unit
    const translatedUnit = unit ? unitMap[unit.toLowerCase()] || unit : "";

    // Kết hợp giá trị và unit
    if (translatedUnit) {
      return `${value} ${translatedUnit}`;
    }

    return value;
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

  const { data: historyData, isLoading: isHistoryLoading } =
    useGetPolicyHistoryQuery(
      {
        page: historyPage,
        size: 10,
        search: historySearch || undefined,
        category:
          historyCategory && historyCategory !== "ALL"
            ? historyCategory
            : undefined,
      },
      {
        skip: !historyOpen,
      }
    );

  const historyPageData = historyData?.data;
  const histories: PolicyHistory[] = historyPageData?.content ?? [];

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
                      Quản lý chính sách hệ thống
                    </h1>
                    <p className="text-muted-foreground">
                      Thay đổi nhanh các business rule mà không cần deploy lại
                      hệ thống
                    </p>
                  </div>
                </div>

                {/* Filters + actions */}
                <div className="px-4 lg:px-6 space-y-3">
                  <div className="flex flex-wrap gap-3 items-center justify-between">
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
                    <div className="flex flex-wrap gap-3 items-center">
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setHistoryOpen(true);
                          setHistoryPage(0);
                      }}
                    >
                        Xem lịch sử thay đổi
                      </Button>
                    </div>
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
                        <Table className="table-fixed">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[28%]">Key</TableHead>
                              <TableHead className="w-[32%] border-l border-border/60">
                                Tên
                              </TableHead>
                              <TableHead className="w-[12%] border-l border-border/60 text-center">
                                Nhóm
                              </TableHead>
                              <TableHead className="w-[14%] border-l border-border/60">
                                Giá trị hiện tại
                              </TableHead>
                              <TableHead className="w-[10%] border-l border-border/60">
                                Mặc định
                              </TableHead>
                              <TableHead className="w-[12%] border-l border-border/60" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {policies.map((p) => (
                              <TableRow key={p.id}>
                                <TableCell className="font-mono text-xs break-words whitespace-normal align-top">
                                  {p.policyKey}
                                </TableCell>
                                <TableCell className="border-l border-border/60 align-top whitespace-normal break-words">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium text-sm">
                                      {p.policyName}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="border-l border-border/60 align-top text-center">
                                  <Badge variant="outline">
                                    {p.policyCategory}
                                  </Badge>
                                </TableCell>
                                <TableCell className="border-l border-border/60 align-top whitespace-normal break-words">
                                  <div className="flex flex-col text-sm">
                                    <span className="font-mono">
                                      {formatCurrentValue(p)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="border-l border-border/60 align-top whitespace-normal break-words">
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {formatDefaultValue(p)}
                                  </span>
                                </TableCell>
                                <TableCell className="border-l border-border/60 text-right align-top">
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
                <label className="text-sm font-medium">Giá trị mới</label>
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

      <Dialog
        open={historyOpen}
        onOpenChange={(open) => {
          setHistoryOpen(open);
          if (!open) {
            setHistoryPage(0);
          }
        }}
      >
        <DialogContent className="w-[min(95vw,90rem)] max-w-none sm:max-w-5xl lg:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Lịch sử thay đổi chính sách hệ thống</DialogTitle>
          </DialogHeader>

          {historyOpen && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[220px]">
                  <Input
                    placeholder="Tìm theo key hoặc tên policy..."
                    value={historySearch}
                    onChange={(e) => {
                      setHistorySearch(e.target.value);
                      setHistoryPage(0);
                    }}
                    className="w-full"
                  />
                </div>
                <div className="flex-shrink-0">
                  <Select
                    value={historyCategory}
                    onValueChange={(value) => {
                      setHistoryCategory(value);
                      setHistoryPage(0);
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
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
                </div>
              </div>

              <div className="rounded-md border bg-muted/40">
                <div className="overflow-x-auto">
                  {isHistoryLoading ? (
                    <div className="space-y-2 p-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : histories.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      Chưa có lịch sử thay đổi nào cho policy này.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[16%]">Thời gian</TableHead>
                          <TableHead className="w-[20%]">Policy</TableHead>
                          <TableHead className="w-[12%] text-center">
                            Người sửa
                          </TableHead>
                          <TableHead className="w-[10%] text-center">
                            Phiên bản
                          </TableHead>
                          <TableHead className="w-[18%]">Giá trị cũ</TableHead>
                          <TableHead className="w-[18%]">Giá trị mới</TableHead>
                          <TableHead className="w-[16%]">Lý do</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {histories.map((h) => (
                          <TableRow key={h.id}>
                            <TableCell className="text-xs">
                              {h.changedAt
                                ? new Date(h.changedAt).toLocaleString("vi-VN")
                                : "-"}
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium">
                                  {h.policyName ?? "-"}
                                </span>
                                <span className="font-mono text-[11px] text-muted-foreground break-all">
                                  {h.policyKey ?? ""}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-center">
                              {h.changedByName
                                ? h.changedByName
                                : h.changedBy
                                ? `User #${h.changedBy}`
                                : "Hệ thống"}
                            </TableCell>
                            <TableCell className="text-xs text-center">
                              v{h.version}
                            </TableCell>
                            <TableCell className="text-xs break-words">
                              {h.oldValue ?? "-"}
                            </TableCell>
                            <TableCell className="text-xs break-words">
                              {h.newValue}
                            </TableCell>
                            <TableCell className="text-xs break-words">
                              {h.reason ?? "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>

              {historyPageData && historyPageData.totalPages > 1 && (
                <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                  <span>
                    Trang {historyPageData.number + 1} /{" "}
                    {historyPageData.totalPages}
                  </span>
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={historyPageData.first}
                      onClick={() =>
                        setHistoryPage((prev) => Math.max(prev - 1, 0))
                      }
                    >
                      Trước
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={historyPageData.last}
                      onClick={() => setHistoryPage((prev) => prev + 1)}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminRoute>
  );
}
