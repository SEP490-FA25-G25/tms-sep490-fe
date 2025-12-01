"use client";

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Search, PlusCircleIcon, Clock, XIcon, ArrowUpDown } from "lucide-react";
import {
    useGetTimeSlotsQuery,
    useDeleteTimeSlotMutation,
    type TimeSlot,
} from "@/store/services/resourceApi";
import { TimeSlotDialog } from "../resources/components/TimeSlotDialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CenterHeadTimeSlotsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
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
    const [timeSlotSorting, setTimeSlotSorting] = useState<SortingState>([]);

    // CRUD States
    const [timeSlotDialogOpen, setTimeSlotDialogOpen] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
    const [timeSlotToDelete, setTimeSlotToDelete] = useState<number | null>(null);

    // Mutations
    const [deleteTimeSlot, { isLoading: isDeletingTimeSlot }] = useDeleteTimeSlotMutation();

    const handleAddTimeSlot = () => {
        setSelectedTimeSlot(null);
        setTimeSlotDialogOpen(true);
    };

    const handleEditTimeSlot = (timeSlot: TimeSlot) => {
        setSelectedTimeSlot(timeSlot);
        setTimeSlotDialogOpen(true);
    };

    const confirmDeleteTimeSlot = async () => {
        if (timeSlotToDelete) {
            try {
                await deleteTimeSlot(timeSlotToDelete).unwrap();
                toast.success("Đã xóa khung giờ thành công");
                setTimeSlotToDelete(null);
            } catch (error: any) {
                console.error("Failed to delete time slot:", error);
                const errorMessage = error?.data?.message || error?.message || "Xóa thất bại. Vui lòng thử lại.";
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

    // Fetch time slots
    const { data: timeSlots, isFetching: isFetchingTimeSlots } = useGetTimeSlotsQuery(
        {
            search: debouncedSearch || undefined,
            branchId: branchFilter === "ALL" ? undefined : branchFilter,
        }
    );

    const filteredTimeSlots = useMemo(() => timeSlots ?? [], [timeSlots]);

    // Calculate stats
    const stats = useMemo(() => {
        return { total: filteredTimeSlots.length };
    }, [filteredTimeSlots]);

    const handleClearFilters = () => {
        setSearch("");
        // Only clear branch filter if it's not locked by user's branchId
        if (!user?.branchId) {
            setBranchFilter("ALL");
        }
    };

    const hasActiveFilters = search !== "" || (branchFilter !== "ALL" && !user?.branchId);

    // TimeSlot Columns
    const timeSlotColumns: ColumnDef<TimeSlot>[] = [
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
        {
            id: "actions",
            header: "Hành động",
            cell: ({ row }) => {
                const timeSlot = row.original;
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
                            <DropdownMenuItem onClick={() => navigate(`/center-head/timeslots/${timeSlot.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleEditTimeSlot(timeSlot)}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setTimeSlotToDelete(timeSlot.id)}
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
                        <h1 className="text-2xl font-bold">Quản lý Khung giờ học</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Quản lý danh sách các khung giờ học mẫu cho trung tâm
                        </p>
                    </div>
                    <Button className="gap-2" onClick={handleAddTimeSlot}>
                        <PlusCircleIcon className="h-4 w-4" />
                        Thêm khung giờ
                    </Button>
                </div>

                {/* Summary Stats */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tổng khung giờ</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground">Khung giờ học mẫu</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm theo tên khung giờ..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

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

                {/* Time Slots Table */}
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

                {/* Dialogs */}
                <TimeSlotDialog
                    open={timeSlotDialogOpen}
                    onOpenChange={setTimeSlotDialogOpen}
                    timeSlot={selectedTimeSlot}
                    branchId={typeof branchFilter === "number" ? branchFilter : (user?.branchId || 0)}
                    branches={branches?.data || []}
                />

                <AlertDialog open={!!timeSlotToDelete} onOpenChange={(open) => !open && setTimeSlotToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Hành động này sẽ xóa vĩnh viễn khung giờ này. Không thể hoàn tác.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDeleteTimeSlot}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={isDeletingTimeSlot}
                            >
                                {isDeletingTimeSlot ? "Đang xóa..." : "Xóa"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}
