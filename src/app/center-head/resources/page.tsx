"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Search, PlusCircleIcon, Building2, Clock, MonitorPlay, XIcon, ArrowUpDown } from "lucide-react";
import {
    useGetResourcesQuery,
    type Resource,
    type ResourceType,
} from "@/store/services/resourceApi";
import { useGetTimeSlotsQuery, type TimeSlotTemplate } from "@/store/services/timeSlotApi";
import { useGetAllBranchesQuery } from "@/store/services/branchApi";

type TabType = "resources" | "timeslots";

const RESOURCE_TYPE_OPTIONS: { label: string; value: ResourceType | "ALL" }[] = [
    { label: "Tất cả loại", value: "ALL" },
    { label: "Phòng học", value: "ROOM" },
    { label: "Tài khoản Zoom", value: "VIRTUAL" },
];

export default function CenterHeadResourcesPage() {
    const [activeTab, setActiveTab] = useState<TabType>("resources");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [resourceTypeFilter, setResourceTypeFilter] = useState<ResourceType | "ALL">("ALL");
    const [branchFilter, setBranchFilter] = useState<number | "ALL">("ALL");


    // Sorting states
    const [resourceSorting, setResourceSorting] = useState<SortingState>([]);
    const [timeSlotSorting, setTimeSlotSorting] = useState<SortingState>([]);

    // Debounce search
    useEffect(() => {
        const id = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 400);
        return () => clearTimeout(id);
    }, [search]);

    // Fetch branches
    const { data: branches } = useGetAllBranchesQuery();

    // Fetch resources
    const { data: resources, isFetching: isFetchingResources } = useGetResourcesQuery(
        {
            search: debouncedSearch || undefined,
            resourceType: resourceTypeFilter === "ALL" ? undefined : resourceTypeFilter,
            branchId: branchFilter === "ALL" ? undefined : branchFilter,
        },
        { skip: activeTab !== "resources" }
    );

    // Fetch time slots
    const { data: timeSlots, isFetching: isFetchingTimeSlots } = useGetTimeSlotsQuery(
        {
            search: debouncedSearch || undefined,
            branchId: branchFilter === "ALL" ? undefined : branchFilter,
        },
        { skip: activeTab !== "timeslots" }
    );

    const filteredResources = useMemo(() => resources ?? [], [resources]);
    const filteredTimeSlots = useMemo(() => timeSlots ?? [], [timeSlots]);

    // Calculate stats
    const stats = useMemo(() => {
        if (activeTab === "resources") {
            const total = filteredResources.length;
            const rooms = filteredResources.filter(r => r.resourceType === "ROOM").length;
            const virtual = filteredResources.filter(r => r.resourceType === "VIRTUAL").length;
            return { total, rooms, virtual };
        } else {
            return { total: filteredTimeSlots.length };
        }
    }, [filteredResources, filteredTimeSlots, activeTab]);

    const handleClearFilters = () => {
        setSearch("");
        setResourceTypeFilter("ALL");
        setBranchFilter("ALL");
    };

    const hasActiveFilters = search !== "" || resourceTypeFilter !== "ALL" || branchFilter !== "ALL";

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
            id: "status",
            header: "Trạng thái",
            cell: () => (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    Hoạt động
                </Badge>
            ),
        },
    ];

    // TimeSlot Columns
    const timeSlotColumns: ColumnDef<TimeSlotTemplate>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4"
                    >
                        Tên khung giờ
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
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
            cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("branchName")}</div>,
        },
        {
            accessorKey: "startTime",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4"
                    >
                        Bắt đầu
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("startTime")}</div>,
        },
        {
            accessorKey: "endTime",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4"
                    >
                        Kết thúc
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("endTime")}</div>,
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

    const timeSlotTable = useReactTable({
        data: filteredTimeSlots,
        columns: timeSlotColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setTimeSlotSorting,
        state: {
            sorting: timeSlotSorting,
        },
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Quản lý Tài nguyên và Khung giờ học</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Quản lý danh sách phòng học, tài khoản Zoom và các khung giờ học
                        </p>
                    </div>
                    <Button className="gap-2">
                        <PlusCircleIcon className="h-4 w-4" />
                        {activeTab === "resources" ? "Thêm tài nguyên" : "Thêm khung giờ"}
                    </Button>
                </div>

                {/* Summary Stats */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {activeTab === "resources" ? (
                        <>
                            <div className="rounded-lg border border-border/70 bg-muted/10 p-4">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Building2 className="h-4 w-4" />
                                    <span className="text-sm">Tổng tài nguyên</span>
                                </div>
                                <p className="text-2xl font-semibold">{stats.total}</p>
                            </div>
                            <div className="rounded-lg border border-border/70 bg-muted/10 p-4">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Building2 className="h-4 w-4" />
                                    <span className="text-sm">Phòng học</span>
                                </div>
                                <p className="text-2xl font-semibold">{stats.rooms}</p>
                            </div>
                            <div className="rounded-lg border border-border/70 bg-muted/10 p-4">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MonitorPlay className="h-4 w-4" />
                                    <span className="text-sm">Zoom</span>
                                </div>
                                <p className="text-2xl font-semibold">{stats.virtual}</p>
                            </div>
                        </>
                    ) : (
                        <div className="rounded-lg border border-border/70 bg-muted/10 p-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">Tổng khung giờ</span>
                            </div>
                            <p className="text-2xl font-semibold">{stats.total}</p>
                        </div>
                    )}
                </div>

                {/* Tabs & Filters */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <TabsList>
                                <TabsTrigger value="resources">Tài nguyên</TabsTrigger>
                                <TabsTrigger value="timeslots">Khung giờ học</TabsTrigger>
                            </TabsList>

                            {/* Filters */}
                            <div className="flex items-center gap-3 flex-1 flex-wrap">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder={
                                            activeTab === "resources"
                                                ? "Tìm kiếm theo tên hoặc mã..."
                                                : "Tìm kiếm theo tên khung giờ..."
                                        }
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>

                                {activeTab === "resources" && (
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
                                )}

                                <Select
                                    value={branchFilter.toString()}
                                    onValueChange={(value) =>
                                        setBranchFilter(value === "ALL" ? "ALL" : parseInt(value))
                                    }
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

                                {hasActiveFilters && (
                                    <Button variant="ghost" size="icon" onClick={handleClearFilters}>
                                        <XIcon className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Resources Tab Content */}
                        <TabsContent value="resources" className="mt-0">
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
                        </TabsContent>

                        {/* Time Slots Tab Content */}
                        <TabsContent value="timeslots" className="mt-0">
                            <div className="rounded-lg border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        {timeSlotTable.getHeaderGroups().map((headerGroup) => (
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
                                        {isFetchingTimeSlots ? (
                                            [...Array(5)].map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell colSpan={timeSlotColumns.length}>
                                                        <Skeleton className="h-12 w-full" />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : timeSlotTable.getRowModel().rows?.length ? (
                                            timeSlotTable.getRowModel().rows.map((row) => (
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
                                                    colSpan={timeSlotColumns.length}
                                                    className="h-24 text-center text-muted-foreground"
                                                >
                                                    Không có khung giờ nào phù hợp.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                {/* TODO: Add detail dialogs here */}
            </div>
        </DashboardLayout>
    );
}
