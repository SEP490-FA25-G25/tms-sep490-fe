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
    type SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { Search, PlusCircleIcon, Building2, MonitorPlay, XIcon, ArrowUpDown } from "lucide-react";
import {
    useGetResourcesQuery,
    useDeleteResourceMutation,
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

export default function CenterHeadResourcesPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [resourceTypeFilter, setResourceTypeFilter] = useState<ResourceType | "ALL">("ALL");
    const { user } = useAuth();

    // Initialize branch filter from user's branch if available
    const [branchFilter, setBranchFilter] = useState<number | "ALL">(() => {
        return user?.branchId ? user.branchId : "ALL";
    });

    // Update branch filter if user data loads later
    useEffect(() => {
        if (user?.branchId) {
            setBranchFilter(user.branchId);
        }
    }, [user]);

    // Sorting states
    const [resourceSorting, setResourceSorting] = useState<SortingState>([]);

    // CRUD States
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<number | null>(null);

    // Mutations
    const [deleteResource, { isLoading: isDeletingResource }] = useDeleteResourceMutation();

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

    // Debounce search
    useEffect(() => {
        const id = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 400);
        return () => clearTimeout(id);
    }, [search]);

    // Fetch branches
    const { data: branches } = useGetAllBranchesQuery();

    // Auto-select branch if user has only one
    useEffect(() => {
        if (branches?.data?.length === 1 && branchFilter === "ALL") {
            setBranchFilter(branches.data[0].id);
        }
    }, [branches, branchFilter]);

    // Fetch resources
    const { data: resources, isFetching: isFetchingResources } = useGetResourcesQuery(
        {
            search: debouncedSearch || undefined,
            resourceType: resourceTypeFilter === "ALL" ? undefined : resourceTypeFilter,
            branchId: branchFilter === "ALL" ? undefined : branchFilter,
        }
    );

    const filteredResources = useMemo(() => resources ?? [], [resources]);

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
        // Only clear branch filter if it's not locked by user's branchId
        if (!user?.branchId) {
            setBranchFilter("ALL");
        }
    };

    const hasActiveFilters = search !== "" || resourceTypeFilter !== "ALL" || (branchFilter !== "ALL" && !user?.branchId);

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
                        className="-ml-4"
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
                        className="-ml-4"
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
                        className="-ml-4"
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
                        className="-ml-4"
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
                    <Badge variant={status === "ACTIVE" ? "default" : "destructive"} className={status === "ACTIVE" ? "bg-green-600 hover:bg-green-700" : ""}>
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
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Mở menu hành động</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1">
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
                            <DropdownMenuItem
                                onClick={() => setResourceToDelete(resource.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa
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
        onSortingChange: setResourceSorting,
        state: {
            sorting: resourceSorting,
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
                    <div className="relative flex-1 min-w-[200px]">
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
                        <SelectTrigger className="w-[180px]">
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

                {/* Dialogs */}
                <ResourceDialog
                    open={resourceDialogOpen}
                    onOpenChange={setResourceDialogOpen}
                    resource={selectedResource}
                    branchId={typeof branchFilter === "number" ? branchFilter : (user?.branchId || 0)}
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
            </div>
        </DashboardLayout>
    );
}
