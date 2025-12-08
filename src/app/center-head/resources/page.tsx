"use client";

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Search, PlusCircleIcon, Building2, MonitorPlay, XIcon, ArrowUpDown, Power, PowerOff, ChevronLeft, ChevronRight } from "lucide-react";
import {
    useGetResourcesQuery,
    useDeleteResourceMutation,
    useUpdateResourceStatusMutation,
    type Resource,
    type ResourceType,
} from "@/store/services/resourceApi";
import { ResourceDialog } from "./components/ResourceDialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, MoreHorizontal, Eye } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useGetAllBranchesQuery } from "@/store/services/branchApi";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

const RESOURCE_TYPE_OPTIONS: { label: string; value: ResourceType | "ALL" }[] = [
    { label: "Tất cả loại", value: "ALL" },
    { label: "Phòng học", value: "ROOM" },
    { label: "Tài khoản Zoom", value: "VIRTUAL" },
];

const STATUS_OPTIONS: { label: string; value: "ALL" | "ACTIVE" | "INACTIVE" }[] = [
    { label: "Tất cả trạng thái", value: "ALL" },
    { label: "Hoạt động", value: "ACTIVE" },
    { label: "Ngưng hoạt động", value: "INACTIVE" },
];

export default function CenterHeadResourcesPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [resourceTypeFilter, setResourceTypeFilter] = useState<ResourceType | "ALL">("ALL");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
    const { user, selectedBranchId } = useAuth();

    // Initialize branch filter from selected branch in header
    const [branchFilter, setBranchFilter] = useState<number | "ALL">(() => {
        return selectedBranchId ?? "ALL";
    });

    // Update branch filter if selected branch changes
    useEffect(() => {
        if (selectedBranchId) {
            setBranchFilter(selectedBranchId);
        }
    }, [selectedBranchId]);

    // Sorting states
    const [resourceSorting, setResourceSorting] = useState<SortingState>([]);

    // CRUD States
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<number | null>(null);
    const [resourceToToggleStatus, setResourceToToggleStatus] = useState<Resource | null>(null);

    // Mutations
    const [deleteResource, { isLoading: isDeletingResource }] = useDeleteResourceMutation();
    const [updateResourceStatus, { isLoading: isUpdatingStatus }] = useUpdateResourceStatusMutation();

    const handleAddResource = () => {
        setSelectedResource(null);
        setResourceDialogOpen(true);
    };

    // Handlers
    const handleEditResource = (resource: Resource) => {
        setSelectedResource(resource);
        setResourceDialogOpen(true);
    };

    const confirmDeleteResource = async () => {
        if (resourceToDelete) {
            try {
                await deleteResource(resourceToDelete).unwrap();
                toast.success("Đã xóa tài nguyên thành công");
                setResourceToDelete(null);
            } catch (error: unknown) {
                console.error("Failed to delete resource:", error);
                const apiError = error as { data?: { message?: string }; message?: string };
                const errorMessage =
                    apiError.data?.message || apiError.message || "Xóa thất bại. Vui lòng thử lại.";
                toast.error(errorMessage);
            }
        }
    };

    const confirmToggleResourceStatus = async () => {
        if (resourceToToggleStatus) {
            const newStatus = resourceToToggleStatus.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
            try {
                await updateResourceStatus({ id: resourceToToggleStatus.id, status: newStatus }).unwrap();
                toast.success(newStatus === "ACTIVE" ? "Đã kích hoạt tài nguyên" : "Đã ngưng hoạt động tài nguyên");
                setResourceToToggleStatus(null);
            } catch (error: unknown) {
                console.error("Failed to update resource status:", error);
                const apiError = error as { data?: { message?: string }; message?: string };
                const errorMessage =
                    apiError.data?.message || apiError.message || "Cập nhật trạng thái thất bại. Vui lòng thử lại.";
                toast.error(errorMessage);
            }
        }
    };

    // Fetch branches
    const { data: branches } = useGetAllBranchesQuery();

    // Auto-select branch if user has only one
    useEffect(() => {
        if (branches?.data?.length === 1 && branchFilter === "ALL") {
            setBranchFilter(branches.data[0].id);
        }
    }, [branches, branchFilter]);

    // Fetch resources (không filter search qua API, lọc local để tránh giật)
    const { data: resources, isFetching: isFetchingResources } = useGetResourcesQuery(
        {
            branchId: branchFilter === "ALL" ? undefined : branchFilter,
        }
    );

    // Lọc local để tránh giật khi search
    const filteredResources = useMemo(() => {
        let result = resources ?? [];

        // Filter by search
        if (search.trim()) {
            const searchLower = search.toLowerCase().trim();
            result = result.filter(r =>
                r.name.toLowerCase().includes(searchLower) ||
                r.code.toLowerCase().includes(searchLower)
            );
        }

        // Filter by resource type
        if (resourceTypeFilter !== "ALL") {
            result = result.filter(r => r.resourceType === resourceTypeFilter);
        }

        // Filter by status
        if (statusFilter !== "ALL") {
            result = result.filter(r => r.status === statusFilter);
        }

        return result;
    }, [resources, search, resourceTypeFilter, statusFilter]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = filteredResources.length;
        const rooms = filteredResources.filter(r => r.resourceType === "ROOM").length;
        const virtual = filteredResources.filter(r => r.resourceType === "VIRTUAL").length;
        return { total, rooms, virtual };
    }, [filteredResources]);

    const handleClearFilters = () => {
        setSearch("");
        setResourceTypeFilter("ALL");
        setStatusFilter("ALL");
        // Only clear branch filter if it's not locked by user's branchId
        if (!user?.branchId) {
            setBranchFilter("ALL");
        }
    };

    const hasActiveFilters = search !== "" || resourceTypeFilter !== "ALL" || statusFilter !== "ALL" || (branchFilter !== "ALL" && !user?.branchId);

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

    // Resource Columns
    const resourceColumns: ColumnDef<Resource>[] = [
        {
            accessorKey: "code",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2"
                    >
                        Mã
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="font-medium">{row.getValue("code")}</div>,
        },
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2"
                    >
                        Tên tài nguyên
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.getValue("name")}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                        {row.original.description || "—"}
                    </div>
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
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2"
                    >
                        Chi nhánh
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
        },
        {
            accessorKey: "capacity",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2"
                    >
                        Sức chứa
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
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
            accessorKey: "expiryDate",
            header: "Ngày hết hạn",
            cell: ({ row }) => {
                const date = row.getValue("expiryDate") as string;
                if (!date) return <div className="text-muted-foreground">—</div>;
                return <div>{format(new Date(date), "dd/MM/yyyy")}</div>;
            },
        },
        {
            id: "status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <Badge variant={status === "ACTIVE" ? "success" : "destructive"}>
                        {status === "ACTIVE" ? "Hoạt động" : "Ngưng hoạt động"}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            header: "Hành động",
            cell: ({ row }) => {
                const resource = row.original;
                const isActive = resource.status === "ACTIVE";
                const canDeactivate = !resource.hasFutureSessions;
                // Can only delete if: INACTIVE + no sessions
                const canDelete = !isActive && !resource.hasAnySessions;

                // Build reason for disabled delete
                let deleteDisabledReason = "";
                if (isActive) deleteDisabledReason = "cần ngưng HĐ";
                else if (resource.hasAnySessions) deleteDisabledReason = "đang sử dụng";

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Mở menu hành động</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-1">
                            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/center-head/resources/${resource.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleEditResource(resource)}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Chỉnh sửa
                            </DropdownMenuItem>
                            {/* Toggle Status Button */}
                            {isActive ? (
                                <DropdownMenuItem
                                    onClick={() => canDeactivate && setResourceToToggleStatus(resource)}
                                    disabled={!canDeactivate}
                                    className={canDeactivate
                                        ? "text-orange-600 hover:text-orange-600 hover:bg-orange-50"
                                        : "text-muted-foreground cursor-not-allowed opacity-50"
                                    }
                                >
                                    <PowerOff className="mr-2 h-4 w-4" />
                                    Ngưng hoạt động
                                    {!canDeactivate && <span className="ml-auto text-xs">(có lịch)</span>}
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    onClick={() => setResourceToToggleStatus(resource)}
                                    className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50"
                                >
                                    <Power className="mr-2 h-4 w-4" />
                                    Kích hoạt lại
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => canDelete && setResourceToDelete(resource.id)}
                                disabled={!canDelete}
                                className={canDelete
                                    ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                                    : "text-muted-foreground cursor-not-allowed opacity-50"
                                }
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa
                                {!canDelete && <span className="ml-auto text-xs">({deleteDisabledReason})</span>}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Quản lý Tài nguyên</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Quản lý danh sách phòng học, tài khoản Zoom
                        </p>
                    </div>
                    <Button className="gap-2" onClick={handleAddResource}>
                        <PlusCircleIcon className="h-4 w-4" />
                        Thêm tài nguyên
                    </Button>
                </div>

                {/* Summary Stats */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tổng tài nguyên</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground">Tất cả tài nguyên hiện có</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Phòng học</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.rooms}</div>
                            <p className="text-xs text-muted-foreground">Phòng học vật lý</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Zoom</CardTitle>
                            <MonitorPlay className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.virtual}</div>
                            <p className="text-xs text-muted-foreground">Tài khoản trực tuyến</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative w-[280px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm theo tên hoặc mã..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <Select
                        value={resourceTypeFilter}
                        onValueChange={(value) =>
                            setResourceTypeFilter(value as ResourceType | "ALL")
                        }
                    >
                        <SelectTrigger className="w-40">
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

                    {!user?.branchId && (branches?.data?.length || 0) > 1 && (
                        <Select
                            value={branchFilter.toString()}
                            onValueChange={(value) =>
                                setBranchFilter(value === "ALL" ? "ALL" : parseInt(value))
                            }
                            disabled={!!user?.branchId}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Chi nhánh" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả chi nhánh</SelectItem>
                                {branches?.data?.map((branch) => (
                                    <SelectItem key={branch.id} value={branch.id.toString()}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {hasActiveFilters && (
                        <Button variant="ghost" size="icon" onClick={handleClearFilters}>
                            <XIcon className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Resources Table */}
                <div className="rounded-lg border overflow-hidden">
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
                                                    header.getContext()
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
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => { }}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
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
                            Trang {resourceTable.getState().pagination.pageIndex + 1} / {resourceTable.getPageCount()}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => resourceTable.previousPage()}
                                disabled={!resourceTable.getCanPreviousPage()}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Trước
                            </Button>
                            {Array.from({ length: resourceTable.getPageCount() }, (_, i) => i + 1)
                                .filter(page =>
                                    page === 1 ||
                                    page === resourceTable.getPageCount() ||
                                    Math.abs(page - (resourceTable.getState().pagination.pageIndex + 1)) <= 1
                                )
                                .map((page, idx, arr) => (
                                    <span key={page} className="flex items-center">
                                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                                            <span className="px-2 text-muted-foreground">...</span>
                                        )}
                                        <Button
                                            variant={resourceTable.getState().pagination.pageIndex + 1 === page ? "default" : "outline"}
                                            size="sm"
                                            className="w-8 h-8 p-0"
                                            onClick={() => resourceTable.setPageIndex(page - 1)}
                                        >
                                            {page}
                                        </Button>
                                    </span>
                                ))}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => resourceTable.nextPage()}
                                disabled={!resourceTable.getCanNextPage()}
                            >
                                Sau
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Dialogs */}
                <ResourceDialog
                    open={resourceDialogOpen}
                    onOpenChange={setResourceDialogOpen}
                    resource={selectedResource}
                    branchId={typeof branchFilter === "number" ? branchFilter : (selectedBranchId ?? 0)}
                    branches={branches?.data || []}
                />

                <AlertDialog open={!!resourceToDelete} onOpenChange={(open) => !open && setResourceToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Hành động này sẽ xóa vĩnh viễn tài nguyên này. Không thể hoàn tác.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDeleteResource}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={isDeletingResource}
                            >
                                {isDeletingResource ? "Đang xóa..." : "Xóa"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Toggle Status Confirmation Dialog */}
                <AlertDialog open={!!resourceToToggleStatus} onOpenChange={(open) => !open && setResourceToToggleStatus(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {resourceToToggleStatus?.status === "ACTIVE"
                                    ? "Ngưng hoạt động tài nguyên?"
                                    : "Kích hoạt lại tài nguyên?"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {resourceToToggleStatus?.status === "ACTIVE"
                                    ? "Tài nguyên sẽ không thể được sử dụng cho các buổi học mới sau khi ngưng hoạt động."
                                    : "Tài nguyên sẽ có thể được sử dụng cho các buổi học mới sau khi kích hoạt."}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmToggleResourceStatus}
                                className={resourceToToggleStatus?.status === "ACTIVE"
                                    ? "bg-orange-600 hover:bg-orange-700"
                                    : "bg-emerald-600 hover:bg-emerald-700"}
                                disabled={isUpdatingStatus}
                            >
                                {isUpdatingStatus
                                    ? "Đang xử lý..."
                                    : (resourceToToggleStatus?.status === "ACTIVE" ? "Ngưng hoạt động" : "Kích hoạt")}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}
