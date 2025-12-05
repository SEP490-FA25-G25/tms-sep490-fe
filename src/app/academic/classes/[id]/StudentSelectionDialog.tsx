import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalDescription,
  FullScreenModalBody,
  FullScreenModalFooter,
} from "@/components/ui/full-screen-modal";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, UserPlus } from "lucide-react";
import { useGetAvailableStudentsQuery } from "@/store/services/classApi";
import { useEnrollExistingStudentsMutation } from "@/store/services/enrollmentApi";
import { useGetStudentDetailQuery } from "@/store/services/studentApi";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { StudentDetailDrawer } from "@/app/academic/students/components/StudentDetailDrawer";
import { Badge } from "@/components/ui/badge";

interface StudentSelectionDialogProps {
  classId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function StudentSelectionDialog({
  classId,
  open,
  onOpenChange,
  onSuccess,
}: StudentSelectionDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(
    new Set()
  );
  const [page, setPage] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const { data: response, isLoading } = useGetAvailableStudentsQuery(
    { classId, search, page, size: 15 },
    { skip: !open }
  );

  const { data: studentDetailResponse, isLoading: isLoadingStudentDetail } = useGetStudentDetailQuery(
    selectedStudentId!,
    { skip: selectedStudentId === null }
  );

  const [enrollStudents, { isLoading: isEnrolling }] =
    useEnrollExistingStudentsMutation();

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedStudents(new Set());
      setPage(0);
      setSelectedStudentId(null);
    }
  }, [open]);

  const students = useMemo(
    () => response?.data?.content ?? [],
    [response?.data?.content]
  );
  const pagination = response?.data?.page;

  const toggleStudent = (studentId: number) => {
    const newSet = new Set(selectedStudents);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudents(newSet);
  };

  const toggleAll = () => {
    const newSet = new Set(selectedStudents);
    const allSelected = students.every((s) => newSet.has(s.id));

    if (allSelected) {
      students.forEach((s) => newSet.delete(s.id));
    } else {
      students.forEach((s) => newSet.add(s.id));
    }
    setSelectedStudents(newSet);
  };

  const isAllSelected =
    students.length > 0 &&
    students.every((s) => selectedStudents.has(s.id));

  const handleEnroll = async () => {
    if (selectedStudents.size === 0) {
      toast.error("Vui lòng chọn ít nhất một học sinh");
      return;
    }

    try {
      const result = await enrollStudents({
        classId,
        studentIds: Array.from(selectedStudents),
      }).unwrap();

      toast.success(
        `Đã ghi danh thành công ${result.data.successfulEnrollments} học sinh`
      );

      handleClose();
      onSuccess();
    } catch (error: unknown) {
      console.error("Enrollment error:", error);
      toast.error((error as { data?: { message?: string } })?.data?.message || "Ghi danh thất bại");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <FullScreenModal open={open} onOpenChange={onOpenChange}>
        <FullScreenModalContent size="2xl" className="p-0 gap-0">
          <FullScreenModalHeader className="px-6 py-4 border-b">
            <FullScreenModalTitle className="text-lg font-semibold">
              Chọn học sinh để ghi danh
            </FullScreenModalTitle>
            <FullScreenModalDescription className="text-sm">
              Danh sách được sắp xếp theo độ phù hợp với yêu cầu trình độ của lớp. Click vào học sinh để xem chi tiết.
            </FullScreenModalDescription>
          </FullScreenModalHeader>

          {/* Search */}
          <div className="flex items-center gap-3 px-6 py-3 border-b bg-muted/30 shrink-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, mã học sinh, email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-9 h-9"
              />
            </div>
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearch("")}
                className="h-9 px-3"
              >
                Xóa
              </Button>
            )}
          </div>

          {/* Table Content */}
          <FullScreenModalBody className="p-0 flex-1 overflow-auto min-h-0">
            {isLoading ? (
              <div className="space-y-2 p-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-muted/50 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : students.length > 0 ? (
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 pl-6">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Chọn tất cả"
                      />
                    </TableHead>
                    <TableHead className="font-medium min-w-[200px]">Học sinh</TableHead>
                    <TableHead className="w-28 font-medium">Mã HS</TableHead>
                    <TableHead className="font-medium min-w-[180px]">Liên hệ</TableHead>
                    <TableHead className="font-medium w-28 text-center">Trạng thái</TableHead>
                    <TableHead className="font-medium w-24 text-center">Số lớp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                      <TableRow
                        key={student.id}
                        className={cn(
                          "cursor-pointer transition-colors",
                          selectedStudents.has(student.id) && "bg-primary/5"
                        )}
                        onClick={() => setSelectedStudentId(student.id)}
                      >
                        <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedStudents.has(student.id)}
                            onCheckedChange={() => toggleStudent(student.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarImage src={student.avatarUrl || ""} alt={student.fullName} />
                              <AvatarFallback className={cn(
                                "text-xs font-medium",
                                selectedStudents.has(student.id) ? "bg-primary/20 text-primary" : "bg-muted"
                              )}>
                                {getInitials(student.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="font-medium text-sm truncate hover:text-primary">
                              {student.fullName}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="font-mono text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                            {student.studentCode}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5 text-sm">
                            {student.email && (
                              <p className="text-xs text-muted-foreground truncate max-w-[160px]" title={student.email}>
                                {student.email}
                              </p>
                            )}
                            {student.phone && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {student.phone}
                              </p>
                            )}
                            {!student.email && !student.phone && (
                              <span className="text-xs text-muted-foreground/50">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={
                            student.accountStatus === 'ACTIVE' ? 'default' :
                            student.accountStatus === 'SUSPENDED' ? 'destructive' : 'secondary'
                          } className={cn(
                            "text-xs",
                            student.accountStatus === 'ACTIVE' && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          )}>
                            {student.accountStatus === 'ACTIVE' ? 'Hoạt động' :
                             student.accountStatus === 'SUSPENDED' ? 'Tạm khóa' : 'Không hoạt động'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium",
                            student.activeEnrollments > 0 
                              ? "bg-blue-100 text-blue-700" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            {student.activeEnrollments}
                          </span>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <div className="bg-muted/30 p-4 rounded-full mb-4">
                  <UserPlus className="h-8 w-8 opacity-40" />
                </div>
                <p className="font-medium text-foreground mb-1">
                  Không tìm thấy học sinh
                </p>
                <p className="text-sm max-w-xs">
                  {search 
                    ? "Thử thay đổi từ khóa tìm kiếm" 
                    : "Không có học sinh nào có thể ghi danh vào lớp này"}
                </p>
                {search && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setSearch("")}
                    className="mt-2"
                  >
                    Xóa tìm kiếm
                  </Button>
                )}
              </div>
            )}
          </FullScreenModalBody>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="border-t px-6 py-2 bg-muted/20 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Tổng {pagination.totalElements} học sinh
                </span>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page > 0) setPage(page - 1);
                        }}
                        className={cn("h-8", page === 0 && "pointer-events-none opacity-50")}
                      />
                    </PaginationItem>
                    <div className="flex items-center px-3 text-sm text-muted-foreground">
                      {page + 1} / {pagination.totalPages}
                    </div>
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < pagination.totalPages - 1) setPage(page + 1);
                        }}
                        className={cn(
                          "h-8",
                          page >= pagination.totalPages - 1 &&
                          "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}

          {/* Footer */}
          <FullScreenModalFooter className="px-6 py-4 border-t shrink-0">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                {selectedStudents.size > 0 ? (
                  <span className="text-primary font-medium flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-semibold">
                      {selectedStudents.size}
                    </span>
                    học sinh được chọn
                  </span>
                ) : (
                  <span className="opacity-70">Chưa chọn học sinh nào</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Hủy bỏ
                </Button>
                <Button
                  onClick={handleEnroll}
                  disabled={selectedStudents.size === 0 || isEnrolling}
                >
                  {isEnrolling ? "Đang xử lý..." : `Ghi danh${selectedStudents.size > 0 ? ` (${selectedStudents.size})` : ""}`}
                </Button>
              </div>
            </div>
          </FullScreenModalFooter>
        </FullScreenModalContent>
      </FullScreenModal>

      {/* Student Detail Drawer */}
      <StudentDetailDrawer
        open={selectedStudentId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedStudentId(null);
        }}
        student={studentDetailResponse?.data ?? null}
        isLoading={isLoadingStudentDetail}
        hideEnrollButton
      />
    </>
  );
}
