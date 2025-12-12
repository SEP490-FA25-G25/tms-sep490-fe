import { useState } from "react";
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
  Users,
  RefreshCw,
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
  useGetClassesQuery,
  useApproveClassMutation,
  useRejectClassMutation,
  type ClassListItemDTO,
} from "@/store/services/classApi";
import { useGetBranchesQuery } from "@/store/services/classCreationApi";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 10;

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

const STATUS_META: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple' }> = {
  PENDING: {
    label: "Chờ duyệt",
    variant: "warning",
  },
  SUBMITTED: {
    label: "Đã gửi duyệt",
    variant: "info",
  },
  APPROVED: {
    label: "Đã duyệt",
    variant: "success",
  },
  SCHEDULED: {
    label: "Đã lên lịch",
    variant: "success",
  },
  REJECTED: {
    label: "Đã từ chối",
    variant: "destructive",
  },
};

const DAY_LABELS: Record<number, string> = {
  0: "CN",
  1: "T2",
  2: "T3",
  3: "T4",
  4: "T5",
  5: "T6",
  6: "T7",
};

const formatScheduleDays = (days?: number[]) => {
  if (!days || days.length === 0) return "Chưa có lịch";
  return days.map(d => DAY_LABELS[d] ?? `T${d}`).join(", ");
};

export default function CenterHeadApprovalsPage() {
  const navigate = useNavigate();

  // Filter states
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [historySearchKeyword, setHistorySearchKeyword] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<ApprovalStatus>("ALL");
  const [pendingPage, setPendingPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [branchFilter, setBranchFilter] = useState<string>("all");

  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // API hooks
  const { data: branchesResponse } = useGetBranchesQuery();

  // Pending classes query
  const { data: pendingResponse, isLoading: pendingLoading, refetch: refetchPending } = useGetClassesQuery({
    page: pendingPage,
    size: PAGE_SIZE,
    status: "SUBMITTED",
    approvalStatus: "PENDING",
    search: searchKeyword || undefined,
    branchIds: branchFilter !== "all" ? [Number(branchFilter)] : undefined,
    sort: "submittedAt",
    sortDir: "desc",
  });

  // History (approved/rejected) query
  const { data: historyResponse, isLoading: historyLoading, refetch: refetchHistory } = useGetClassesQuery({
    page: historyPage,
    size: PAGE_SIZE,
    approvalStatus: historyStatusFilter === "ALL" ? undefined : historyStatusFilter,
    search: historySearchKeyword || undefined,
    branchIds: branchFilter !== "all" ? [Number(branchFilter)] : undefined,
    sort: "decidedAt",
    sortDir: "desc",
  });

  // Summary queries
  const { data: pendingSummary } = useGetClassesQuery({
    page: 0, size: 1, status: "SUBMITTED", approvalStatus: "PENDING",
  });
  const { data: approvedSummary } = useGetClassesQuery({
    page: 0, size: 1, approvalStatus: "APPROVED",
  });
  const { data: rejectedSummary } = useGetClassesQuery({
    page: 0, size: 1, approvalStatus: "REJECTED",
  });

  const [approveClass, { isLoading: isApproving }] = useApproveClassMutation();
  const [rejectClass, { isLoading: isRejecting }] = useRejectClassMutation();

  // Data
  const pendingClasses = pendingResponse?.data?.content ?? [];
  const historyClasses = historyResponse?.data?.content ?? [];
  const pendingPagination = pendingResponse?.data;
  const historyPagination = historyResponse?.data;

  const pendingTotalPages = pendingPagination?.totalPages ?? 1;
  const historyTotalPages = historyPagination?.totalPages ?? 1;

  // Summary stats
  const summary = {
    pending: pendingSummary?.data?.totalElements ?? 0,
    approved: approvedSummary?.data?.totalElements ?? 0,
    rejected: rejectedSummary?.data?.totalElements ?? 0,
    total: (pendingSummary?.data?.totalElements ?? 0) +
      (approvedSummary?.data?.totalElements ?? 0) +
      (rejectedSummary?.data?.totalElements ?? 0),
  };

  const branches = branchesResponse?.data ?? [];

  // Handlers
  const openApproveDialog = (id: number) => {
    setSelectedClassId(id);
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (id: number) => {
    setSelectedClassId(id);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedClassId) return;
    try {
      await approveClass(selectedClassId).unwrap();
      toast.success("Đã phê duyệt lớp học thành công");
      setApproveDialogOpen(false);
      setSelectedClassId(null);
      refetchPending();
      refetchHistory();
    } catch {
      toast.error("Phê duyệt thất bại. Vui lòng thử lại.");
    }
  };

  const handleReject = async () => {
    if (selectedClassId && rejectReason.trim()) {
      try {
        await rejectClass({ classId: selectedClassId, reason: rejectReason }).unwrap();
        toast.success("Đã từ chối lớp học");
        setRejectDialogOpen(false);
        setSelectedClassId(null);
        refetchPending();
        refetchHistory();
      } catch {
        toast.error("Từ chối thất bại. Vui lòng thử lại.");
      }
    } else {
      toast.error("Vui lòng nhập lý do từ chối");
    }
  };

  const getStatusBadge = (classItem: ClassListItemDTO) => {
    const approvalStatus = classItem.approvalStatus || "";

    if (approvalStatus === "REJECTED") {
      return (
        <Badge variant={STATUS_META.REJECTED.variant}>
          {STATUS_META.REJECTED.label}
        </Badge>
      );
    }

    if (approvalStatus === "APPROVED") {
      return (
        <Badge variant={STATUS_META.APPROVED.variant}>
          {STATUS_META.APPROVED.label}
        </Badge>
      );
    }

    if (approvalStatus === "PENDING") {
      return (
        <Badge variant={STATUS_META.PENDING.variant}>
          {STATUS_META.PENDING.label}
        </Badge>
      );
    }

    return <Badge variant="secondary">{approvalStatus}</Badge>;
  };

  const renderClassRow = (classItem: ClassListItemDTO, isPending: boolean) => (
    <TableRow key={classItem.id} className="hover:bg-muted/50">
      <TableCell className="font-medium">{classItem.code}</TableCell>
      <TableCell>
        <div className="space-y-0.5">
          <div className="font-medium">{classItem.subjectName}</div>
          <div className="text-xs text-muted-foreground">
            {classItem.branchName}
          </div>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {classItem.startDate ? format(new Date(classItem.startDate), "dd/MM/yyyy", { locale: vi }) : "-"}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {formatScheduleDays(classItem.scheduleDays)}
      </TableCell>
      <TableCell className="text-center">
        {classItem.currentEnrolled}/{classItem.maxCapacity}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {classItem.submittedAt ? format(new Date(classItem.submittedAt), "dd/MM/yyyy HH:mm", { locale: vi }) : "-"}
      </TableCell>
      {!isPending && (
        <TableCell className="whitespace-nowrap">
          {classItem.decidedAt ? format(new Date(classItem.decidedAt), "dd/MM/yyyy HH:mm", { locale: vi }) : "-"}
        </TableCell>
      )}
      <TableCell>{getStatusBadge(classItem)}</TableCell>
      {!isPending && (
        <TableCell className="max-w-[200px]">
          {classItem.approvalStatus === "REJECTED" && classItem.rejectionReason ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate block cursor-help text-sm text-muted-foreground">
                    {classItem.rejectionReason}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  <p>{classItem.rejectionReason}</p>
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
                  onClick={() => navigate(`/center-head/classes/${classItem.id}`)}
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
                      onClick={() => openApproveDialog(classItem.id)}
                      disabled={isApproving}
                    >
                      {isApproving && selectedClassId === classItem.id ? (
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
                      onClick={() => openRejectDialog(classItem.id)}
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

  const isLoading = pendingLoading || historyLoading;

  return (
    <DashboardLayout
      title="Phê duyệt lớp học"
      description="Xem xét và phê duyệt các lớp học được gửi từ Academic Affairs."
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
                  <p className="text-xs text-muted-foreground">Lớp chờ xử lý</p>
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
                  <p className="text-xs text-muted-foreground">Lớp được duyệt</p>
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
                  <p className="text-xs text-muted-foreground">Lớp bị từ chối</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng yêu cầu</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                Hàng đợi ({pendingPagination?.totalElements ?? 0})
              </TabsTrigger>
              <TabsTrigger value="history" className="h-7">
                Lịch sử ({historyPagination?.totalElements ?? 0})
              </TabsTrigger>
            </TabsList>

            {activeTab === "pending" ? (
              <>
                <div className="relative w-64">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm mã lớp, môn học..."
                    value={searchKeyword}
                    onChange={(e) => {
                      setSearchKeyword(e.target.value);
                      setPendingPage(0);
                    }}
                    className="pl-8 h-9"
                  />
                </div>
                <Select value={branchFilter} onValueChange={(v) => { setBranchFilter(v); setPendingPage(0); }}>
                  <SelectTrigger className="h-9 w-auto min-w-[160px]">
                    <SelectValue placeholder="Chi nhánh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => refetchPending()} className="ml-auto">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Làm mới
                </Button>
              </>
            ) : (
              <>
                <div className="relative w-64">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm mã lớp, môn học..."
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
                  <Button variant="outline" size="sm" onClick={() => refetchHistory()}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Làm mới
                  </Button>
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
                    <TableHead className="w-[140px]">Mã lớp</TableHead>
                    <TableHead>Môn học / Chi nhánh</TableHead>
                    <TableHead className="w-[100px]">Khai giảng</TableHead>
                    <TableHead className="w-[120px]">Lịch học</TableHead>
                    <TableHead className="w-[80px] text-center">Sĩ số</TableHead>
                    <TableHead className="w-[140px]">Ngày gửi</TableHead>
                    <TableHead className="w-[100px]">Trạng thái</TableHead>
                    <TableHead className="w-[120px] text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : pendingClasses.length > 0 ? (
                    pendingClasses.map((c) => renderClassRow(c, true))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <FileText className="h-8 w-8" />
                          <p>Không có lớp nào đang chờ duyệt</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pendingTotalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <p className="text-muted-foreground">
                  Trang {pendingPage + 1} / {pendingTotalPages} · {pendingPagination?.totalElements ?? 0} lớp
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPendingPage((prev) => Math.max(prev - 1, 0));
                        }}
                        className={pendingPage === 0 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(pendingTotalPages, 5) }, (_, i) => {
                      let pageNum = i;
                      if (pendingTotalPages > 5 && pendingPage > 2) {
                        pageNum = Math.min(pendingPage - 2 + i, pendingTotalPages - 1);
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
                        className={pendingPage + 1 >= pendingTotalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Mã lớp</TableHead>
                    <TableHead>Môn học / Chi nhánh</TableHead>
                    <TableHead className="w-[100px]">Khai giảng</TableHead>
                    <TableHead className="w-[120px]">Lịch học</TableHead>
                    <TableHead className="w-[80px] text-center">Sĩ số</TableHead>
                    <TableHead className="w-[140px]">Ngày gửi</TableHead>
                    <TableHead className="w-[140px]">Ngày xử lý</TableHead>
                    <TableHead className="w-[100px]">Trạng thái</TableHead>
                    <TableHead>Lý do từ chối</TableHead>
                    <TableHead className="w-[80px] text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : historyClasses.length > 0 ? (
                    historyClasses.map((c) => renderClassRow(c, false))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="h-32 text-center">
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
            {historyTotalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <p className="text-muted-foreground">
                  Trang {historyPage + 1} / {historyTotalPages} · {historyPagination?.totalElements ?? 0} lớp
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setHistoryPage((prev) => Math.max(prev - 1, 0));
                        }}
                        className={historyPage === 0 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(historyTotalPages, 5) }, (_, i) => {
                      let pageNum = i;
                      if (historyTotalPages > 5 && historyPage > 2) {
                        pageNum = Math.min(historyPage - 2 + i, historyTotalPages - 1);
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
                        className={historyPage + 1 >= historyTotalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối phê duyệt lớp học</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối để gửi phản hồi cho người tạo lớp.
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
              Bạn có chắc chắn muốn phê duyệt lớp học này? Lớp sẽ chuyển sang trạng thái "Đã lên lịch".
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
