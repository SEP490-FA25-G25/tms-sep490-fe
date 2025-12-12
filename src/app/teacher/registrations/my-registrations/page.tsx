import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  RefreshCw,
  BookOpen,
  X,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertCircle,
} from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { TeacherRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "@/components/ui/sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  useGetMyRegistrationsQuery,
  useCancelRegistrationMutation,
  type MyRegistrationDTO,
  type RegistrationStatus,
} from "@/store/services/teacherRegistrationApi";

const STATUS_META: Record<
  RegistrationStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Chờ duyệt",
    variant: "secondary",
    icon: <Clock3 className="h-3.5 w-3.5" />,
  },
  APPROVED: {
    label: "Được chọn",
    variant: "default",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  REJECTED: {
    label: "Không được chọn",
    variant: "destructive",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  CANCELLED: {
    label: "Đã hủy",
    variant: "outline",
    icon: <X className="h-3.5 w-3.5" />,
  },
};

const DAY_LABELS: Record<number, string> = {
  1: "T2",
  2: "T3",
  3: "T4",
  4: "T5",
  5: "T6",
  6: "T7",
  7: "CN",
};

const PAGE_SIZE = 10;

function MyRegistrationsContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<MyRegistrationDTO | null>(null);
  const [detailTarget, setDetailTarget] = useState<MyRegistrationDTO | null>(null);

  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useGetMyRegistrationsQuery();

  const [cancelRegistration, { isLoading: isCancelling }] = useCancelRegistrationMutation();

  const registrations = response?.data ?? [];

  // Filter và search
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      const matchesSearch =
        searchTerm === "" ||
        r.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.classCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.subjectName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [registrations, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredRegistrations.length / PAGE_SIZE);
  const paginatedRegistrations = filteredRegistrations.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleCancel = async () => {
    if (!cancelTarget) return;

    try {
      await cancelRegistration(cancelTarget.id).unwrap();
      toast.success("Hủy đăng ký thành công");
      setCancelTarget(null);
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error("Hủy đăng ký thất bại", {
        description: err?.data?.message || "Có lỗi xảy ra",
      });
    }
  };

  const formatScheduleDays = (days: number[]) => {
    return days.map((d) => DAY_LABELS[d] || d).join(", ");
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy", { locale: vi });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "HH:mm dd/MM/yyyy", { locale: vi });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên lớp, mã lớp, môn học..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            <SelectItem value="PENDING">Chờ duyệt</SelectItem>
            <SelectItem value="APPROVED">Được chọn</SelectItem>
            <SelectItem value="REJECTED">Không được chọn</SelectItem>
            <SelectItem value="CANCELLED">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredRegistrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Chưa có đăng ký nào</h3>
            <p className="text-muted-foreground mt-1">
              Bạn chưa đăng ký dạy lớp nào
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lớp học</TableHead>
                  <TableHead className="hidden md:table-cell">Môn học</TableHead>
                  <TableHead className="hidden lg:table-cell">Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="hidden sm:table-cell">Ngày đăng ký</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRegistrations.map((reg) => {
                  const statusMeta = STATUS_META[reg.status];
                  return (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{reg.className}</div>
                          <div className="text-sm text-muted-foreground">
                            {reg.classCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {reg.subjectName}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm">
                          <div>{formatDate(reg.startDate)} - {formatDate(reg.plannedEndDate)}</div>
                          <div className="text-muted-foreground">
                            {formatScheduleDays(reg.scheduleDays)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusMeta.variant} className="gap-1">
                          {statusMeta.icon}
                          {statusMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {formatDateTime(reg.registeredAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailTarget(reg)}
                          >
                            Chi tiết
                          </Button>
                          {reg.canCancel && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setCancelTarget(reg)}
                            >
                              Hủy
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} -{" "}
                {Math.min(currentPage * PAGE_SIZE, filteredRegistrations.length)} trên tổng{" "}
                {filteredRegistrations.length} đăng ký
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailTarget} onOpenChange={() => setDetailTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết đăng ký</DialogTitle>
          </DialogHeader>

          {detailTarget && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{detailTarget.className}</h3>
                    <p className="text-sm text-muted-foreground">{detailTarget.classCode}</p>
                  </div>
                  <Badge variant={STATUS_META[detailTarget.status].variant} className="gap-1">
                    {STATUS_META[detailTarget.status].icon}
                    {STATUS_META[detailTarget.status].label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{detailTarget.subjectName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{detailTarget.branchName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(detailTarget.startDate)} - {formatDate(detailTarget.plannedEndDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatScheduleDays(detailTarget.scheduleDays)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t text-sm">
                  <div className="text-muted-foreground">
                    Đăng ký lúc: {formatDateTime(detailTarget.registeredAt)}
                  </div>
                  {detailTarget.registrationCloseDate && (
                    <div className="text-muted-foreground">
                      Hạn đăng ký: {formatDateTime(detailTarget.registrationCloseDate)}
                    </div>
                  )}
                </div>

                {detailTarget.note && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-1">Ghi chú của bạn:</p>
                    <p className="text-sm text-muted-foreground">{detailTarget.note}</p>
                  </div>
                )}

                {detailTarget.status === "REJECTED" && detailTarget.rejectionReason && (
                  <div className="pt-2 border-t">
                    <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 text-red-700 text-sm">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Lý do không được chọn:</p>
                        <p>{detailTarget.rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailTarget(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy đăng ký</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn hủy đăng ký dạy lớp{" "}
              <span className="font-medium">{cancelTarget?.className}</span>?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Không</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? "Đang hủy..." : "Xác nhận hủy"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function MyRegistrationsPage() {
  return (
    <TeacherRoute>
      <DashboardLayout
        title="Đăng ký của tôi"
        description="Theo dõi trạng thái các đăng ký dạy lớp"
      >
        <MyRegistrationsContent />
      </DashboardLayout>
    </TeacherRoute>
  );
}
