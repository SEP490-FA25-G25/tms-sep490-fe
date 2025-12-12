import { useState, useMemo } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
    SearchIcon,
    Clock,
    CheckCircle2,
    XCircle,
    FileText,
    Eye,
    CheckCircle,
    Loader2,
    BookOpen,
} from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    useGetAllCoursesQuery,
    useApproveCourseMutation,
    useRejectCourseMutation
} from "@/store/services/courseApi";
import type { CourseDTO } from "@/store/services/courseApi";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 10;

type ApprovalStatus = "SUBMITTED" | "APPROVED" | "REJECTED" | "ALL";

const STATUS_META: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple' }> = {
    SUBMITTED: {
        label: "Chờ duyệt",
        variant: "warning",
    },
    PENDING_ACTIVATION: {
        label: "Chờ kích hoạt",
        variant: "info",
    },
    APPROVED: {
        label: "Đã duyệt",
        variant: "success",
    },
    ACTIVE: {
        label: "Hoạt động",
        variant: "success",
    },
    REJECTED: {
        label: "Đã từ chối",
        variant: "destructive",
    },
};

export default function CourseApprovalPage() {
    const navigate = useNavigate();

    // Filter states
    const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [historySearchKeyword, setHistorySearchKeyword] = useState("");
    const [historyStatusFilter, setHistoryStatusFilter] = useState<ApprovalStatus>("ALL");
    const [pendingPage, setPendingPage] = useState(0);
    const [historyPage, setHistoryPage] = useState(0);

    // Dialog states
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    // API hooks
    const { data: courses, isLoading } = useGetAllCoursesQuery();
    const [approveCourse, { isLoading: isApproving }] = useApproveCourseMutation();
    const [rejectCourse, { isLoading: isRejecting }] = useRejectCourseMutation();

    // Filter courses
    const allCourses = useMemo(() => courses || [], [courses]);

    // Pending courses (status = SUBMITTED)
    const pendingCourses = useMemo(() => {
        return allCourses
            .filter(c => c.status === "SUBMITTED")
            .filter(c => {
                if (!searchKeyword) return true;
                const keyword = searchKeyword.toLowerCase();
                return (
                    c.code?.toLowerCase().includes(keyword) ||
                    c.name?.toLowerCase().includes(keyword) ||
                    c.requesterName?.toLowerCase().includes(keyword) ||
                    c.subjectName?.toLowerCase().includes(keyword)
                );
            });
    }, [allCourses, searchKeyword]);

    // History courses (approved, rejected, active)
    const historyCourses = useMemo(() => {
        return allCourses
            .filter(c => {
                const status = c.status || "";
                const approvalStatus = c.approvalStatus || "";

                // Include: ACTIVE, PENDING_ACTIVATION, or REJECTED
                if (status === "SUBMITTED") return false;
                if (status === "DRAFT" && approvalStatus !== "REJECTED") return false;

                // Filter by status if selected
                if (historyStatusFilter !== "ALL") {
                    if (historyStatusFilter === "APPROVED") {
                        return status === "ACTIVE" || status === "PENDING_ACTIVATION" || approvalStatus === "APPROVED";
                    }
                    if (historyStatusFilter === "REJECTED") {
                        return approvalStatus === "REJECTED";
                    }
                }

                return true;
            })
            .filter(c => {
                if (!historySearchKeyword) return true;
                const keyword = historySearchKeyword.toLowerCase();
                return (
                    c.code?.toLowerCase().includes(keyword) ||
                    c.name?.toLowerCase().includes(keyword) ||
                    c.requesterName?.toLowerCase().includes(keyword) ||
                    c.subjectName?.toLowerCase().includes(keyword)
                );
            });
    }, [allCourses, historyStatusFilter, historySearchKeyword]);

    // Pagination
    const pendingTotalPages = Math.ceil(pendingCourses.length / PAGE_SIZE);
    const historyTotalPages = Math.ceil(historyCourses.length / PAGE_SIZE);

    const paginatedPendingCourses = pendingCourses.slice(
        pendingPage * PAGE_SIZE,
        (pendingPage + 1) * PAGE_SIZE
    );
    const paginatedHistoryCourses = historyCourses.slice(
        historyPage * PAGE_SIZE,
        (historyPage + 1) * PAGE_SIZE
    );

    // Summary stats
    const summary = useMemo(() => {
        const pending = allCourses.filter(c => c.status === "SUBMITTED").length;
        const approved = allCourses.filter(c =>
            c.status === "ACTIVE" || c.status === "PENDING_ACTIVATION" || c.approvalStatus === "APPROVED"
        ).length;
        const rejected = allCourses.filter(c => c.approvalStatus === "REJECTED").length;

        return { pending, approved, rejected, total: pending + approved + rejected };
    }, [allCourses]);

    // Handlers
    const openApproveDialog = (id: number) => {
        setSelectedCourseId(id);
        setApproveDialogOpen(true);
    };

    const openRejectDialog = (id: number) => {
        setSelectedCourseId(id);
        setRejectReason("");
        setRejectDialogOpen(true);
    };

    const handleApprove = async () => {
        if (!selectedCourseId) return;
        try {
            await approveCourse(selectedCourseId).unwrap();
            toast.success("Đã phê duyệt khóa học thành công");
            setApproveDialogOpen(false);
            setSelectedCourseId(null);
        } catch {
            toast.error("Phê duyệt thất bại. Vui lòng thử lại.");
        }
    };

    const handleReject = async () => {
        if (selectedCourseId && rejectReason.trim()) {
            try {
                await rejectCourse({ id: selectedCourseId, reason: rejectReason }).unwrap();
                toast.success("Đã từ chối khóa học");
                setRejectDialogOpen(false);
                setSelectedCourseId(null);
            } catch {
                toast.error("Từ chối thất bại. Vui lòng thử lại.");
            }
        } else {
            toast.error("Vui lòng nhập lý do từ chối");
        }
    };

    const getStatusBadge = (course: CourseDTO) => {
        const status = course.status || "";
        const approvalStatus = course.approvalStatus || "";

        if (approvalStatus === "REJECTED") {
            return (
                <Badge variant={STATUS_META.REJECTED.variant}>
                    {STATUS_META.REJECTED.label}
                </Badge>
            );
        }

        if (status === "PENDING_ACTIVATION") {
            return (
                <Badge variant={STATUS_META.PENDING_ACTIVATION.variant}>
                    {STATUS_META.PENDING_ACTIVATION.label}
                </Badge>
            );
        }

        const meta = STATUS_META[status] || { label: status, variant: "secondary" as const };
        return (
            <Badge variant={meta.variant}>
                {meta.label}
            </Badge>
        );
    };

    const renderCourseRow = (course: CourseDTO, isPending: boolean) => (
        <TableRow key={course.id} className="hover:bg-muted/50">
            <TableCell className="font-medium">{course.code}</TableCell>
            <TableCell>
                <div className="space-y-0.5">
                    <div className="font-medium">{course.name}</div>
                    <div className="text-xs text-muted-foreground">
                        {course.subjectName} • {course.levelName}
                    </div>
                </div>
            </TableCell>
            <TableCell>{course.requesterName || "N/A"}</TableCell>
            <TableCell className="whitespace-nowrap">
                {course.submittedAt ? format(new Date(course.submittedAt), "dd/MM/yyyy HH:mm", { locale: vi }) : "-"}
            </TableCell>
            {!isPending && (
                <TableCell className="whitespace-nowrap">
                    {course.decidedAt ? format(new Date(course.decidedAt), "dd/MM/yyyy HH:mm", { locale: vi }) : "-"}
                </TableCell>
            )}
            <TableCell>{getStatusBadge(course)}</TableCell>
            {!isPending && (
                <TableCell className="max-w-[200px]">
                    {course.approvalStatus === "REJECTED" && course.rejectionReason ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="truncate block cursor-help text-sm text-muted-foreground">
                                        {course.rejectionReason}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-sm">
                                    <p>{course.rejectionReason}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    )}
                </TableCell>
            )}
            <TableCell>
                <div className="flex items-center gap-1 justify-end">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => navigate(`/curriculum/courses/${course.id}`)}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Xem chi tiết</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {isPending && (
                        <>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                            onClick={() => openApproveDialog(course.id)}
                                            disabled={isApproving}
                                        >
                                            {isApproving && selectedCourseId === course.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <CheckCircle className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Phê duyệt</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                            onClick={() => openRejectDialog(course.id)}
                                            disabled={isRejecting}
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Từ chối</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );

    return (
        <DashboardLayout
            title="Quản lý yêu cầu phê duyệt khóa học"
            description="Xem xét và phê duyệt các khóa học được gửi từ Subject Leader."
        >
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-8 w-12" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{summary.pending}</div>
                                    <p className="text-xs text-muted-foreground">Yêu cầu chờ xử lý</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Đã phê duyệt</CardTitle>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-8 w-12" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{summary.approved}</div>
                                    <p className="text-xs text-muted-foreground">Khóa học được duyệt</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Đã từ chối</CardTitle>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/30">
                                <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-8 w-12" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{summary.rejected}</div>
                                    <p className="text-xs text-muted-foreground">Khóa học bị từ chối</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tổng yêu cầu</CardTitle>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-8 w-12" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{summary.total}</div>
                                    <p className="text-xs text-muted-foreground">Tổng số yêu cầu</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pending" | "history")} className="space-y-4">
                    {/* Tab Headers with Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        <TabsList className="h-9">
                            <TabsTrigger value="pending" className="h-7">
                                Hàng đợi ({pendingCourses.length})
                            </TabsTrigger>
                            <TabsTrigger value="history" className="h-7">
                                Lịch sử ({historyCourses.length})
                            </TabsTrigger>
                        </TabsList>

                        {activeTab === "pending" ? (
                            <div className="relative w-64">
                                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm mã, tên khóa học, người gửi..."
                                    value={searchKeyword}
                                    onChange={(e) => {
                                        setSearchKeyword(e.target.value);
                                        setPendingPage(0);
                                    }}
                                    className="pl-8 h-9"
                                />
                            </div>
                        ) : (
                            <>
                                <div className="relative w-64">
                                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Tìm mã, tên khóa học, người gửi..."
                                        value={historySearchKeyword}
                                        onChange={(e) => {
                                            setHistorySearchKeyword(e.target.value);
                                            setHistoryPage(0);
                                        }}
                                        className="pl-8 h-9"
                                    />
                                </div>

                                <div className="flex items-center gap-2 ml-auto">
                                    <Select
                                        value={historyStatusFilter}
                                        onValueChange={(value) => {
                                            setHistoryStatusFilter(value as ApprovalStatus);
                                            setHistoryPage(0);
                                        }}
                                    >
                                        <SelectTrigger className="h-9 w-auto min-w-[140px]">
                                            <SelectValue placeholder="Trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                                            <SelectItem value="APPROVED">Đã phê duyệt</SelectItem>
                                            <SelectItem value="REJECTED">Đã từ chối</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Pending Tab */}
                    <TabsContent value="pending" className="space-y-4 mt-4">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px]">Mã khóa học</TableHead>
                                        <TableHead>Khóa học</TableHead>
                                        <TableHead>Người gửi</TableHead>
                                        <TableHead className="w-[140px]">Ngày gửi</TableHead>
                                        <TableHead className="w-[100px]">Trạng thái</TableHead>
                                        <TableHead className="w-[120px] text-right">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : paginatedPendingCourses.length > 0 ? (
                                        paginatedPendingCourses.map((course) => renderCourseRow(course, true))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center">
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <FileText className="h-8 w-8" />
                                                    <p>Không có yêu cầu nào đang chờ duyệt</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                Trang {pendingPage + 1} / {Math.max(pendingTotalPages, 1)} · {pendingCourses.length} yêu cầu
                            </div>
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setPendingPage((prev) => Math.max(prev - 1, 0));
                                            }}
                                            aria-disabled={pendingPage === 0}
                                            className={pendingPage === 0 ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: Math.min(5, Math.max(pendingTotalPages, 1)) }, (_, i) => {
                                        let pageNum = i;
                                        if (pendingTotalPages > 5) {
                                            if (pendingPage < 3) {
                                                pageNum = i;
                                            } else if (pendingPage > pendingTotalPages - 4) {
                                                pageNum = pendingTotalPages - 5 + i;
                                            } else {
                                                pageNum = pendingPage - 2 + i;
                                            }
                                        }
                                        return (
                                            <PaginationItem key={pageNum}>
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setPendingPage(pageNum);
                                                    }}
                                                    isActive={pageNum === pendingPage}
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
                                                setPendingPage((prev) => Math.min(prev + 1, pendingTotalPages - 1));
                                            }}
                                            aria-disabled={pendingPage >= pendingTotalPages - 1}
                                            className={pendingPage >= pendingTotalPages - 1 ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history" className="space-y-4 mt-4">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px]">Mã khóa học</TableHead>
                                        <TableHead>Khóa học</TableHead>
                                        <TableHead>Người gửi</TableHead>
                                        <TableHead className="w-[140px]">Ngày gửi</TableHead>
                                        <TableHead className="w-[140px]">Ngày xử lý</TableHead>
                                        <TableHead className="w-[110px]">Trạng thái</TableHead>
                                        <TableHead>Lý do từ chối</TableHead>
                                        <TableHead className="w-[80px] text-right">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : paginatedHistoryCourses.length > 0 ? (
                                        paginatedHistoryCourses.map((course) => renderCourseRow(course, false))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-32 text-center">
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <FileText className="h-8 w-8" />
                                                    <p>Không có lịch sử phê duyệt</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                Trang {historyPage + 1} / {Math.max(historyTotalPages, 1)} · {historyCourses.length} yêu cầu
                            </div>
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setHistoryPage((prev) => Math.max(prev - 1, 0));
                                            }}
                                            aria-disabled={historyPage === 0}
                                            className={historyPage === 0 ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: Math.min(5, Math.max(historyTotalPages, 1)) }, (_, i) => {
                                        let pageNum = i;
                                        if (historyTotalPages > 5) {
                                            if (historyPage < 3) {
                                                pageNum = i;
                                            } else if (historyPage > historyTotalPages - 4) {
                                                pageNum = historyTotalPages - 5 + i;
                                            } else {
                                                pageNum = historyPage - 2 + i;
                                            }
                                        }
                                        return (
                                            <PaginationItem key={pageNum}>
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setHistoryPage(pageNum);
                                                    }}
                                                    isActive={pageNum === historyPage}
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
                                                setHistoryPage((prev) => Math.min(prev + 1, historyTotalPages - 1));
                                            }}
                                            aria-disabled={historyPage >= historyTotalPages - 1}
                                            className={historyPage >= historyTotalPages - 1 ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Từ chối phê duyệt khóa học</DialogTitle>
                        <DialogDescription>
                            Vui lòng nhập lý do từ chối để gửi phản hồi cho người tạo khóa học.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Nhập lý do từ chối..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isRejecting || !rejectReason.trim()}
                        >
                            {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Xác nhận từ chối
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Dialog */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận phê duyệt</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn phê duyệt khóa học này không? Khóa học sẽ được kích hoạt từ ngày hiệu lực.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={handleApprove}
                            disabled={isApproving}
                        >
                            {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Xác nhận phê duyệt
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
