"use client";

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
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
import { Search, PlusCircleIcon, Clock, ArrowUpDown, Power, PowerOff, RotateCcw } from "lucide-react";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    useGetTimeSlotsQuery,
    useDeleteTimeSlotMutation,
    useUpdateTimeSlotStatusMutation,
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
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_OPTIONS: { label: string; value: "ALL" | "ACTIVE" | "INACTIVE" }[] = [
    { label: "Tất cả trạng thái", value: "ALL" },
    { label: "Hoạt động", value: "ACTIVE" },
    { label: "Ngưng hoạt động", value: "INACTIVE" },
];

export default function CenterHeadTimeSlotsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
    const { selectedBranchId } = useAuth();

    // Sorting states
    const [timeSlotSorting, setTimeSlotSorting] = useState<SortingState>([]);

    // CRUD States
    const [timeSlotDialogOpen, setTimeSlotDialogOpen] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
    const [timeSlotToDelete, setTimeSlotToDelete] = useState<number | null>(null);
    const [timeSlotToToggleStatus, setTimeSlotToToggleStatus] = useState<TimeSlot | null>(null);

    // Mutations
    const [deleteTimeSlot, { isLoading: isDeletingTimeSlot }] = useDeleteTimeSlotMutation();
    const [updateTimeSlotStatus, { isLoading: isUpdatingStatus }] = useUpdateTimeSlotStatusMutation();

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
            } catch (error: unknown) {
                console.error("Failed to delete time slot:", error);
                const apiError = error as { data?: { message?: string }; message?: string };
                const errorMessage =
                    apiError.data?.message || apiError.message || "Xóa thất bại. Vui lòng thử lại.";
                toast.error(errorMessage);
            }
        }
    };

    const confirmToggleTimeSlotStatus = async () => {
        if (timeSlotToToggleStatus) {
            const newStatus = timeSlotToToggleStatus.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
            try {
                await updateTimeSlotStatus({ id: timeSlotToToggleStatus.id, status: newStatus }).unwrap();
                toast.success(newStatus === "ACTIVE" ? "Đã kích hoạt khung giờ" : "Đã ngưng hoạt động khung giờ");
                setTimeSlotToToggleStatus(null);
            } catch (error: unknown) {
                console.error("Failed to update time slot status:", error);
                const apiError = error as { data?: { message?: string }; message?: string };
                const errorMessage =
                    apiError.data?.message || apiError.message || "Cập nhật trạng thái thất bại. Vui lòng thử lại.";
                toast.error(errorMessage);
            }
        }
    };

    // Fetch branches
    // Fetch time slots (không filter search qua API, lọc local để tránh giật)
    const { data: timeSlots, isFetching: isFetchingTimeSlots } = useGetTimeSlotsQuery(
        {
            branchId: selectedBranchId ?? undefined,
        }
    );

    // Lọc local để tránh giật khi search
    const filteredTimeSlots = useMemo(() => {
        let result = timeSlots ?? [];

        // Filter by search
        if (search.trim()) {
            const searchLower = search.toLowerCase().trim();
            result = result.filter(ts =>
                ts.name.toLowerCase().includes(searchLower)
            );
        }

        // Filter by status
        if (statusFilter !== "ALL") {
            result = result.filter(ts => ts.status === statusFilter);
        }

        return result;
    }, [timeSlots, search, statusFilter]);

    // Calculate stats
    const stats = useMemo(() => {
        return { total: filteredTimeSlots.length };
    }, [filteredTimeSlots]);

    const handleClearFilters = () => {
        setSearch("");
        setStatusFilter("ALL");
    };

    const hasActiveFilters = search !== "" || statusFilter !== "ALL";

    // TimeSlot Columns
    const timeSlotColumns: ColumnDef<TimeSlot>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2"
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
                        className="h-8 px-2"
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
                        className="h-8 px-2"
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
                        className="h-8 px-2"
                    >
                        Kết thúc
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("endTime")}</div>,
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
                const timeSlot = row.original;
                const isActive = timeSlot.status === "ACTIVE";
                const canDeactivate = !timeSlot.hasFutureSessions;
                const hasTeacherAvailability =
                    (timeSlot as { hasTeacherAvailability?: boolean }).hasTeacherAvailability ?? false;
                // Can only delete if: INACTIVE + no sessions + no teacher availability
                const canDelete = !isActive && !timeSlot.hasAnySessions && !hasTeacherAvailability;

                // Build reason for disabled delete
                let deleteDisabledReason = "";
                if (isActive) deleteDisabledReason = "cần ngưng HĐ";
                else if (timeSlot.hasAnySessions) deleteDisabledReason = "đang sử dụng";
                else if (hasTeacherAvailability) deleteDisabledReason = "có lịch GV";

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
                            {/* Toggle Status Button */}
                            {isActive ? (
                                <DropdownMenuItem
                                    onClick={() => canDeactivate && setTimeSlotToToggleStatus(timeSlot)}
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
                                    onClick={() => setTimeSlotToToggleStatus(timeSlot)}
                                    className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50"
                                >
                                    <Power className="mr-2 h-4 w-4" />
                                    Kích hoạt lại
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => canDelete && setTimeSlotToDelete(timeSlot.id)}
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

    const timeSlotTable = useReactTable({
        data: filteredTimeSlots,
        columns: timeSlotColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setTimeSlotSorting,
        state: {
            sorting: timeSlotSorting,
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
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm khung giờ..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-9 w-full"
                        />
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <Select
                            value={statusFilter}
                            onValueChange={(value) =>
                                setStatusFilter(value as "ALL" | "ACTIVE" | "INACTIVE")
                            }
                        >
                            <SelectTrigger className="h-9 w-auto min-w-[170px]">
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

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={handleClearFilters}
                            disabled={!hasActiveFilters}
                            title="Xóa bộ lọc"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>
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

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        Trang {timeSlotTable.getState().pagination.pageIndex + 1} / {Math.max(timeSlotTable.getPageCount(), 1)} · {filteredTimeSlots.length} khung giờ
                    </div>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        timeSlotTable.previousPage();
                                    }}
                                    aria-disabled={!timeSlotTable.getCanPreviousPage()}
                                    className={
                                        !timeSlotTable.getCanPreviousPage()
                                            ? "pointer-events-none opacity-50"
                                            : ""
                                    }
                                />
                            </PaginationItem>
                            {Array.from({ length: Math.min(5, Math.max(timeSlotTable.getPageCount(), 1)) }, (_, i) => {
                                let pageNum = i;
                                const totalPages = timeSlotTable.getPageCount();
                                const currentPage = timeSlotTable.getState().pagination.pageIndex;
                                if (totalPages > 5) {
                                    if (currentPage < 3) {
                                        pageNum = i;
                                    } else if (currentPage > totalPages - 4) {
                                        pageNum = totalPages - 5 + i;
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
                                                timeSlotTable.setPageIndex(pageNum);
                                            }}
                                            isActive={pageNum === timeSlotTable.getState().pagination.pageIndex}
                                        >
                                            {pageNum + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            })}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        timeSlotTable.nextPage();
                                    }}
                                    aria-disabled={!timeSlotTable.getCanNextPage()}
                                    className={
                                        !timeSlotTable.getCanNextPage()
                                            ? "pointer-events-none opacity-50"
                                            : ""
                                    }
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>

                {/* Dialogs */}
                <TimeSlotDialog
                    open={timeSlotDialogOpen}
                    onOpenChange={setTimeSlotDialogOpen}
                    timeSlot={selectedTimeSlot}
                    branchId={selectedBranchId ?? 0}
                    branches={[]}
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

                {/* Toggle Status Confirmation Dialog */}
                <AlertDialog open={!!timeSlotToToggleStatus} onOpenChange={(open) => !open && setTimeSlotToToggleStatus(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {timeSlotToToggleStatus?.status === "ACTIVE"
                                    ? "Ngưng hoạt động khung giờ?"
                                    : "Kích hoạt lại khung giờ?"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {timeSlotToToggleStatus?.status === "ACTIVE"
                                    ? "Khung giờ sẽ không thể được sử dụng cho các buổi học mới sau khi ngưng hoạt động."
                                    : "Khung giờ sẽ có thể được sử dụng cho các buổi học mới sau khi kích hoạt."}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmToggleTimeSlotStatus}
                                className={timeSlotToToggleStatus?.status === "ACTIVE"
                                    ? "bg-orange-600 hover:bg-orange-700"
                                    : "bg-emerald-600 hover:bg-emerald-700"}
                                disabled={isUpdatingStatus}
                            >
                                {isUpdatingStatus
                                    ? "Đang xử lý..."
                                    : (timeSlotToToggleStatus?.status === "ACTIVE" ? "Ngưng hoạt động" : "Kích hoạt")}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}
