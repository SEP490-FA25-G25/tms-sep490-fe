"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import {
  useGetSubjectSummariesQuery,
  type SubjectStatus,
  type SubjectSummary,
} from "@/store/services/subjectAdminApi";
import { SubjectDetailDialog } from "./components/SubjectDetailDialog";

const STATUS_OPTIONS: { label: string; value: SubjectStatus | "ALL" }[] = [
  { label: "Tất cả trạng thái", value: "ALL" },
  { label: "Đang hoạt động", value: "ACTIVE" },
  { label: "Không hoạt động", value: "INACTIVE" },
  { label: "Bản nháp", value: "DRAFT" },
];

export default function AdminSubjectsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubjectStatus | "ALL">(
    "ALL"
  );
  const [selectedSubject, setSelectedSubject] = useState<SubjectSummary | null>(
    null
  );
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search để tránh spam API khi gõ
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(id);
  }, [search]);

  const { data: subjects, isFetching } = useGetSubjectSummariesQuery(
    statusFilter === "ALL"
      ? { search: debouncedSearch || undefined }
      : { search: debouncedSearch || undefined, status: statusFilter }
  );

  const statusBadge = (status: SubjectStatus) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="default">Hoạt động</Badge>;
      case "INACTIVE":
        return <Badge variant="secondary">Không hoạt động</Badge>;
      default:
        return <Badge variant="outline">Bản nháp</Badge>;
    }
  };

  const filteredSubjects = useMemo(() => subjects ?? [], [subjects]);

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
                <div className="px-4 lg:px-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">
                        Quản lý Môn học
                      </h1>
                      <p className="text-muted-foreground mt-1">
                        Tổng quan các môn học, level và khóa học trong hệ thống
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-4 lg:px-6 space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Tìm kiếm theo tên hoặc mã môn học..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={statusFilter}
                      onValueChange={(value) =>
                        setStatusFilter(value as SubjectStatus | "ALL")
                      }
                    >
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Danh sách môn học</CardTitle>
                      <CardDescription>
                        Tổng số: {filteredSubjects.length} môn học
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isFetching ? (
                        <div className="space-y-3">
                          {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                          ))}
                        </div>
                      ) : filteredSubjects.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          Không có môn học nào phù hợp.
                        </div>
                      ) : (
                        <ScrollArea className="max-h-[600px]">
                          <table className="w-full text-sm">
                            <thead className="bg-muted sticky top-0 z-10">
                              <tr>
                                <th className="px-4 py-2 text-left font-medium">
                                  Mã
                                </th>
                                <th className="px-4 py-2 text-left font-medium">
                                  Tên môn học
                                </th>
                                <th className="px-4 py-2 text-left font-medium">
                                  Chủ sở hữu
                                </th>
                                <th className="px-4 py-2 text-left font-medium">
                                  Levels
                                </th>
                                <th className="px-4 py-2 text-left font-medium">
                                  Khóa học
                                </th>
                                <th className="px-4 py-2 text-left font-medium">
                                  Approval
                                </th>
                                <th className="px-4 py-2 text-left font-medium">
                                  Trạng thái
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredSubjects.map((subject) => (
                                <tr
                                  key={subject.id}
                                  className="border-t hover:bg-muted/50 cursor-pointer"
                                  onClick={() => setSelectedSubject(subject)}
                                >
                                  <td className="px-4 py-3 font-medium">
                                    {subject.code}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="font-semibold">
                                      {subject.name}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {subject.description || "—"}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {subject.ownerName || "—"}
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {subject.levelCount}
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">
                                    Tổng: {subject.courseCount}{" "}
                                    <span className="text-xs text-muted-foreground">
                                      (Chờ duyệt: {subject.pendingCourseCount} ·
                                      Đã duyệt: {subject.approvedCourseCount})
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {subject.pendingCourseCount > 0 ? (
                                      <Badge variant="destructive">
                                        Có {subject.pendingCourseCount} khóa
                                        chờ duyệt
                                      </Badge>
                                    ) : (
                                      <Badge variant="default">
                                        Không có khóa chờ duyệt
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {statusBadge(subject.status)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <SubjectDetailDialog
        subjectId={selectedSubject?.id ?? null}
        open={!!selectedSubject}
        onOpenChange={(open) => {
          if (!open) setSelectedSubject(null);
        }}
      />
    </AdminRoute>
  );
}

