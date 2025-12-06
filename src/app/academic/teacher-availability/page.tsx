import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    type ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    type SortingState,
    useReactTable,
} from "@tanstack/react-table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Download, Mail, Search, ArrowUpDown, Users, CheckCircle, Clock, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { toast } from "sonner";
import {
    useGetAvailabilityCampaignsQuery,
    useGetTeacherAvailabilityStatusQuery,
    useLazyExportTeacherAvailabilityStatusQuery,
    useSendBulkRemindersMutation,
    useGetTeacherAvailabilityQuery,
    type TeacherStatusDTO,
} from "@/store/services/teacherAvailabilityApi";
import { useGetAllBranchesQuery } from "@/store/services/branchApi";
import { useGetTimeSlotsQuery } from "@/store/services/resourceApi";
import { format } from "date-fns";
import { CampaignDialog } from "./components/CampaignDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AvailabilityMatrix } from "@/app/teacher/availability/components/AvailabilityMatrix";

const AvailabilityCampaignPage = () => {
    const { selectedBranchId: authBranchId, branches: userBranches } = useAuth();
    const { data: campaigns = [] } = useGetAvailabilityCampaignsQuery();
    const { data: branchesResponse } = useGetAllBranchesQuery();
    const branches = useMemo(() => branchesResponse?.data || [], [branchesResponse?.data]);
    const { data: timeSlots = [] } = useGetTimeSlotsQuery({});

    const [selectedCampaignId, setSelectedCampaignId] = useState<number | undefined>(undefined);
    // Initialize from auth context's selected branch
    const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(authBranchId || undefined);

    // Sync with auth context when it changes (e.g., user switches branch)
    useEffect(() => {
        if (authBranchId) {
            setSelectedBranchId(authBranchId);
        }
    }, [authBranchId]);

    // Filter branches dropdown to only show user's accessible branches
    const availableBranches = useMemo(() => {
        if (!userBranches || userBranches.length === 0) return branches;
        const userBranchIds = new Set(userBranches.map(b => b.id));
        return branches.filter(b => userBranchIds.has(b.id));
    }, [branches, userBranches]);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewingTeacherId, setViewingTeacherId] = useState<number | null>(null);

    const { data: teacherStatusesData, isFetching } = useGetTeacherAvailabilityStatusQuery(
        { campaignId: selectedCampaignId, branchId: selectedBranchId },
        { skip: !selectedCampaignId && !selectedBranchId && campaigns.length === 0 }
    );

    const { data: teacherAvailability } = useGetTeacherAvailabilityQuery(viewingTeacherId!, {
        skip: !viewingTeacherId,
    });

    const teacherStatuses = useMemo(() => teacherStatusesData || [], [teacherStatusesData]);
    const [triggerExport, { isFetching: isExporting }] = useLazyExportTeacherAvailabilityStatusQuery();

    const [sendBulkReminders, { isLoading: isBulkReminding }] = useSendBulkRemindersMutation();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const selectedCampaign = useMemo(() =>
        campaigns.find(c => c.id === selectedCampaignId),
        [campaigns, selectedCampaignId]);

    const filteredCampaigns = useMemo(() =>
        campaigns.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [campaigns, searchTerm]);

    // Stats
    const stats = useMemo(() => {
        const total = teacherStatuses.length;
        const updated = teacherStatuses.filter(t => t.status === "UP_TO_DATE").length;
        const outdated = total - updated;
        return { total, updated, outdated };
    }, [teacherStatuses]);

    const handleExport = async () => {
        try {
            const blob = await triggerExport(selectedCampaignId).unwrap();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `teacher_availability_status_${format(new Date(), "yyyyMMdd")}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Xuất báo cáo thành công");
        } catch {
            toast.error("Lỗi khi xuất báo cáo");
        }
    };

    // Table Columns
    const columns = useMemo<ColumnDef<TeacherStatusDTO>[]>(() => [
        {
            accessorKey: "fullName",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2"
                    >
                        Giáo viên
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.fullName}</div>
                    <div className="text-xs text-muted-foreground">{row.original.email}</div>
                </div>
            ),
        },
        {
            accessorKey: "contractType",
            header: "Loại HĐ",
            cell: ({ row }) => (
                <Badge variant="outline">{row.original.contractType}</Badge>
            ),
            filterFn: "equals",
        },
        {
            accessorKey: "lastUpdated",
            header: "Cập nhật cuối",
            cell: ({ row }) => {
                const date = row.original.lastUpdated;
                return date ? format(new Date(date), "dd/MM/yyyy HH:mm") : "Chưa cập nhật";
            },
        },
        {
            accessorKey: "totalSlots",
            header: "Tổng slot",
            cell: ({ row }) => (
                <div className="font-medium">{row.original.totalSlots}</div>
            ),
        },
        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const isUpToDate = row.original.status === "UP_TO_DATE";
                return (
                    <Badge
                        variant={isUpToDate ? "default" : "destructive"}
                        className={isUpToDate ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                    >
                        {isUpToDate ? "Đã cập nhật" : "Chưa cập nhật"}
                    </Badge>
                );
            },
            filterFn: "equals",
        },
        {
            id: "actions",
            cell: ({ row }) => {
                return (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewingTeacherId(row.original.teacherId)}
                    >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Xem chi tiết</span>
                    </Button>
                );
            },
        },
    ], []);

    const table = useReactTable({
        data: teacherStatuses,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        state: {
            sorting,
            globalFilter,
            columnFilters,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    return (
        <DashboardLayout
            title="Quản lý lịch rảnh giáo viên"
            description="Theo dõi và quản lý các đợt cập nhật lịch rảnh của giáo viên"
        >
            <div className="flex h-[calc(100vh-16rem)] gap-4">
                {/* Left Panel: Campaign List */}
                <Card className="w-1/3 min-w-[320px] flex flex-col overflow-hidden min-h-0">
                    <CardHeader className="pb-3 border-b shrink-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Đợt cập nhật</CardTitle>
                            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-1" />
                                Tạo mới
                            </Button>
                        </div>
                        <div className="relative mt-2">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm đợt cập nhật..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </CardHeader>
                    <ScrollArea className="flex-1 h-full" type="always">
                        <div className="flex flex-col pb-4">
                            {filteredCampaigns.map((campaign) => (
                                <div
                                    key={campaign.id}
                                    className={`flex flex-col gap-1 p-4 border-b cursor-pointer transition-colors hover:bg-muted/50 ${selectedCampaignId === campaign.id ? "bg-muted border-l-4 border-l-primary" : ""
                                        }`}
                                    onClick={() => setSelectedCampaignId(campaign.id)}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium line-clamp-1">{campaign.name}</span>
                                        {campaign.isActive ? (
                                            <Badge variant="success" className="text-[10px] px-1 py-0 h-5">Mở</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">Đóng</Badge>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-muted-foreground">
                                            Hạn: {format(new Date(campaign.deadline), "dd/MM/yyyy HH:mm")}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">
                                            {campaign.targetAudience}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            {filteredCampaigns.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    Không tìm thấy đợt cập nhật nào.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Right Panel: Details */}
                <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
                    {selectedCampaign || !selectedCampaignId ? ( // Show if selected or if initial state (to allow filtering all)
                        <>
                            <CardHeader className="pb-3 border-b bg-muted/10 shrink-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">
                                            {selectedCampaign ? selectedCampaign.name : "Tất cả giáo viên"}
                                        </CardTitle>
                                        {selectedCampaign && (
                                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                <span>Hạn chót: {format(new Date(selectedCampaign.deadline), "dd/MM/yyyy HH:mm")}</span>
                                                <span>•</span>
                                                <span>Đối tượng: {selectedCampaign.targetAudience}</span>
                                            </div>
                                        )}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                                        <Download className="w-4 h-4 mr-2" />
                                        {isExporting ? "Đang xuất..." : "Xuất báo cáo"}
                                    </Button>
                                </div>
                            </CardHeader>

                            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
                                <div className="p-6 pb-0 space-y-6 shrink-0">
                                    {/* Stats */}
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <Card className="bg-background">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Tổng giáo viên</CardTitle>
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{stats.total}</div>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-background">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Đã cập nhật</CardTitle>
                                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{stats.updated}</div>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-background">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Chưa cập nhật</CardTitle>
                                                <Clock className="h-4 w-4 text-rose-600" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center justify-between">
                                                    <div className="text-2xl font-bold">{stats.outdated}</div>
                                                    {stats.outdated > 0 && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-xs border-rose-200 hover:bg-rose-50 hover:text-rose-700 text-rose-600"
                                                            onClick={async () => {
                                                                const outdatedTeachers = teacherStatuses
                                                                    .filter(t => t.status === "OUTDATED")
                                                                    .map(t => t.teacherId);

                                                                try {
                                                                    await sendBulkReminders(outdatedTeachers).unwrap();
                                                                    toast.success(`Đã gửi nhắc nhở cho ${outdatedTeachers.length} giáo viên`);
                                                                } catch {
                                                                    toast.error("Lỗi khi gửi nhắc nhở hàng loạt");
                                                                }
                                                            }}
                                                            disabled={isBulkReminding}
                                                        >
                                                            <Mail className="w-3 h-3 mr-1.5" />
                                                            {isBulkReminding ? "Đang gửi..." : "Nhắc nhở tất cả"}
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Filters */}
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <h3 className="text-lg font-semibold">Danh sách giáo viên</h3>
                                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                            {/* Only show branch filter if user has multiple branches */}
                                            {availableBranches.length > 1 && (
                                                <Select
                                                    value={selectedBranchId?.toString() || "all"}
                                                    onValueChange={(value) => setSelectedBranchId(value === "all" ? undefined : Number(value))}
                                                >
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="Tất cả chi nhánh" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                                                        {availableBranches.map((branch) => (
                                                            <SelectItem key={branch.id} value={branch.id.toString()}>
                                                                {branch.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}

                                            <Select
                                                value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
                                                onValueChange={(value) =>
                                                    table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value)
                                                }
                                            >
                                                <SelectTrigger className="w-[150px]">
                                                    <SelectValue placeholder="Trạng thái" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                                    <SelectItem value="UP_TO_DATE">Đã cập nhật</SelectItem>
                                                    <SelectItem value="OUTDATED">Chưa cập nhật</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {selectedCampaign?.targetAudience === "ALL" && (
                                                <Select
                                                    value={(table.getColumn("contractType")?.getFilterValue() as string) ?? "all"}
                                                    onValueChange={(value) =>
                                                        table.getColumn("contractType")?.setFilterValue(value === "all" ? undefined : value)
                                                    }
                                                >
                                                    <SelectTrigger className="w-[150px]">
                                                        <SelectValue placeholder="Loại hợp đồng" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Tất cả HĐ</SelectItem>
                                                        <SelectItem value="full-time">Full-time</SelectItem>
                                                        <SelectItem value="part-time">Part-time</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}

                                            <div className="relative w-full md:w-64">
                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Tìm kiếm giáo viên..."
                                                    value={globalFilter}
                                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                                    className="pl-8"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 pt-0">
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                {table.getHeaderGroups().map((headerGroup) => (
                                                    <TableRow key={headerGroup.id}>
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
                                                {table.getRowModel().rows?.length ? (
                                                    table.getRowModel().rows.map((row) => (
                                                        <TableRow
                                                            key={row.id}
                                                            data-state={row.getIsSelected() && "selected"}
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
                                                            colSpan={columns.length}
                                                            className="h-24 text-center"
                                                        >
                                                            {isFetching ? "Đang tải dữ liệu..." : "Không có dữ liệu."}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Pagination - Fixed at bottom */}
                                <div className="p-4 border-t mt-auto shrink-0 bg-background">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => table.previousPage()}
                                                disabled={!table.getCanPreviousPage()}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                Trước
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => table.nextPage()}
                                                disabled={!table.getCanNextPage()}
                                            >
                                                Sau
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <p>Chọn một đợt cập nhật để xem chi tiết.</p>
                        </div>
                    )}
                </Card>

                <CampaignDialog
                    open={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                />

                <Dialog open={!!viewingTeacherId} onOpenChange={(open) => !open && setViewingTeacherId(null)}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Chi tiết lịch rảnh giáo viên</DialogTitle>
                        </DialogHeader>
                        {teacherAvailability ? (
                            <AvailabilityMatrix
                                timeSlots={timeSlots}
                                availabilityData={teacherAvailability}
                                onChange={() => { }}
                                readOnly={true}
                            />
                        ) : (
                            <div className="p-8 text-center">Đang tải...</div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default AvailabilityCampaignPage;
