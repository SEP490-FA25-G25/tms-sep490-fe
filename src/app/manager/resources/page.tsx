"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Search,
  Building2,
  MonitorPlay,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useGetResourcesQuery,
  type Resource,
  type ResourceType,
} from "@/store/services/resourceApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetManagerBranchesQuery } from "@/store/services/branchApi";

const RESOURCE_TYPE_OPTIONS: { label: string; value: ResourceType | "ALL" }[] = [
  { label: "Tất cả loại", value: "ALL" },
  { label: "Phòng học", value: "ROOM" },
  { label: "Tài khoản Zoom", value: "VIRTUAL" },
];

const STATUS_OPTIONS: { label: string; value: "ALL" | "ACTIVE" | "INACTIVE" }[] =
  [
    { label: "Tất cả trạng thái", value: "ALL" },
    { label: "Hoạt động", value: "ACTIVE" },
    { label: "Ngưng hoạt động", value: "INACTIVE" },
  ];

export default function ManagerResourcesPage() {
  const [search, setSearch] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<
    ResourceType | "ALL"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [branchFilter, setBranchFilter] = useState<number | "ALL">("ALL");

  const [resourceSorting, setResourceSorting] = useState<SortingState>([]);

  // Branches in manager scope
  const { data: managerBranchesResponse } = useGetManagerBranchesQuery();
  const managerBranches = managerBranchesResponse?.data ?? [];

  const { data: resources, isFetching: isFetchingResources } =
    useGetResourcesQuery({
      branchId: branchFilter === "ALL" ? undefined : branchFilter,
    });

  const filteredResources = useMemo(() => {
    let result = resources ?? [];

    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(searchLower) ||
          r.code.toLowerCase().includes(searchLower),
      );
    }

    if (resourceTypeFilter !== "ALL") {
      result = result.filter((r) => r.resourceType === resourceTypeFilter);
    }

    if (statusFilter !== "ALL") {
      result = result.filter((r) => r.status === statusFilter);
    }

    return result;
  }, [resources, search, resourceTypeFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = filteredResources.length;
    const rooms = filteredResources.filter((r) => r.resourceType === "ROOM")
      .length;
    const virtual = filteredResources.filter(
      (r) => r.resourceType === "VIRTUAL",
    ).length;
    return { total, rooms, virtual };
  }, [filteredResources]);

  const resourceTypeBadge = (type: ResourceType) => {
    return type === "ROOM" ? (
      <Badge variant="outline" className="gap-1">
        <Building2 className="h-3 w-3" />
        Phòng học
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">
        <MonitorPlay className="h-3 w-3" />
        Zoom
      </Badge>
    );
  };

  const resourceColumns: ColumnDef<Resource>[] = [
    {
      accessorKey: "code",
      header: ({ column }) => {
        return (
          <button
            type="button"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="-ml-4 inline-flex items-center text-sm font-medium"
          >
            Mã
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("code")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <button
            type="button"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="-ml-4 inline-flex items-center text-sm font-medium"
          >
            Tên tài nguyên
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </button>
        );
      },
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          {row.original.description && row.original.description.trim() && (
            <div className="line-clamp-1 text-xs text-muted-foreground">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "resourceType",
      header: "Loại",
      cell: ({ row }) => resourceTypeBadge(row.getValue("resourceType")),
    },
    {
      accessorKey: "branchName",
      header: ({ column }) => {
        return (
          <button
            type="button"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="-ml-4 inline-flex items-center text-sm font-medium"
          >
            Chi nhánh
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </button>
        );
      },
    },
    {
      accessorKey: "capacity",
      header: ({ column }) => {
        return (
          <button
            type="button"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="-ml-4 inline-flex items-center text-sm font-medium"
          >
            Sức chứa
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </button>
        );
      },
      cell: ({ row }) => {
        const capacity = row.original.capacity;
        const override = row.original.capacityOverride;
        return (
          <div className="text-muted-foreground">
            {capacity || "—"}
            {override && ` (${override})`}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={status === "ACTIVE" ? "default" : "destructive"}
            className={
              status === "ACTIVE"
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : ""
            }
          >
            {status === "ACTIVE" ? "Hoạt động" : "Ngưng hoạt động"}
          </Badge>
        );
      },
    },
  ];

  const resourceTable = useReactTable({
    data: filteredResources,
    columns: resourceColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setResourceSorting,
    state: {
      sorting: resourceSorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <DashboardLayout
      title="Quản lý Tài nguyên"
      description="Xem danh sách phòng học, tài khoản Zoom trong toàn bộ hệ thống (chỉ xem, không chỉnh sửa)."
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng tài nguyên
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Tất cả tài nguyên hiện có
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Phòng học</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rooms}</div>
              <p className="text-xs text-muted-foreground">
                Phòng học vật lý trong hệ thống
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zoom</CardTitle>
              <MonitorPlay className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.virtual}</div>
              <p className="text-xs text-muted-foreground">
                Tài khoản trực tuyến đang được sử dụng
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc mã..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <Select
              value={resourceTypeFilter}
              onValueChange={(value) =>
                setResourceTypeFilter(value as ResourceType | "ALL")
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Loại tài nguyên" />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as "ALL" | "ACTIVE" | "INACTIVE")
              }
            >
              <SelectTrigger className="w-[170px]">
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
                {managerBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Resources Table */}
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              {resourceTable.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isFetchingResources ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={resourceColumns.length}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : resourceTable.getRowModel().rows?.length ? (
                resourceTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={resourceColumns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không có tài nguyên nào phù hợp.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {resourceTable.getPageCount() > 0 && (
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
              Trang {resourceTable.getState().pagination.pageIndex + 1} /{" "}
              {resourceTable.getPageCount()}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => resourceTable.previousPage()}
                disabled={!resourceTable.getCanPreviousPage()}
                className="inline-flex items-center rounded-md border bg-background px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Trước
              </button>
              {Array.from(
                { length: resourceTable.getPageCount() },
                (_, i) => i + 1,
              )
                .filter(
                  (page) =>
                    page === 1 ||
                    page === resourceTable.getPageCount() ||
                    Math.abs(
                      page - (resourceTable.getState().pagination.pageIndex + 1),
                    ) <= 1,
                )
                .map((page, idx, arr) => (
                  <span key={page} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                    <button
                      type="button"
                      onClick={() => resourceTable.setPageIndex(page - 1)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs ${
                        resourceTable.getState().pagination.pageIndex + 1 ===
                        page
                          ? "bg-primary text-primary-foreground"
                          : "bg-background"
                      }`}
                    >
                      {page}
                    </button>
                  </span>
                ))}
              <button
                type="button"
                onClick={() => resourceTable.nextPage()}
                disabled={!resourceTable.getCanNextPage()}
                className="inline-flex items-center rounded-md border bg-background px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
                <ChevronRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


