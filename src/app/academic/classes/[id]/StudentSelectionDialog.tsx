import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Search, UserPlus, Check } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { StudentDetailDrawer } from "@/app/academic/students/components/StudentDetailDrawer";

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
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(
    new Set()
  );
  const [page, setPage] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const { data: response, isLoading } = useGetAvailableStudentsQuery(
    { classId, search, page, size: 10 },
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
      setPriorityFilter("all");
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

  const filteredStudents = useMemo(() => {
    if (priorityFilter === "all") return students;
    return students.filter((s) => {
      const priority = s.classMatchInfo?.matchPriority || s.matchPriority;
      return priority.toString() === priorityFilter;
    });
  }, [priorityFilter, students]);

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
    const allSelected = filteredStudents.every((s) => newSet.has(s.id));

    if (allSelected) {
      filteredStudents.forEach((s) => newSet.delete(s.id));
    } else {
      filteredStudents.forEach((s) => newSet.add(s.id));
    }
    setSelectedStudents(newSet);
  };

  const isAllSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedStudents.has(s.id));

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

  const getMatchPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1:
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-700 hover:bg-green-100 border-transparent gap-1"
          >
            <Check className="h-3 w-3" />
            Phù hợp hoàn hảo
          </Badge>
        );
      case 2:
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-transparent"
          >
            Phù hợp một phần
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground border-dashed">
            Không phù hợp
          </Badge>
        );
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="text-lg font-semibold">
              Chọn học sinh để ghi danh
            </DialogTitle>
            <DialogDescription className="text-sm">
              Học sinh được sắp xếp theo mức độ phù hợp của bài kiểm tra kỹ năng.
            </DialogDescription>
          </DialogHeader>

          {/* Search & Filter */}
          <div className="flex items-center gap-3 px-6 py-3 border-b bg-muted/30 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, mã học sinh..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-9 h-9"
              />
            </div>
            <Select
              value={priorityFilter}
              onValueChange={(val) => setPriorityFilter(val)}
            >
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Độ phù hợp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="1">Phù hợp hoàn hảo</SelectItem>
                <SelectItem value="2">Phù hợp một phần</SelectItem>
                <SelectItem value="3">Không phù hợp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-auto min-h-0">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-muted/50 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : filteredStudents.length > 0 ? (
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 pl-6">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="font-medium">Họ và tên</TableHead>
                    <TableHead className="w-28 font-medium">Mã HS</TableHead>
                    <TableHead className="w-40 font-medium text-right pr-6">Độ phù hợp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
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
                      <TableCell className="pr-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.avatarUrl || ""} alt={student.fullName} />
                          <AvatarFallback className={cn(
                            "text-xs",
                            selectedStudents.has(student.id) ? "bg-primary/20 text-primary" : "bg-muted"
                          )}>
                            {getInitials(student.fullName)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-sm hover:text-primary hover:underline">
                          {student.fullName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {student.studentCode}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {getMatchPriorityBadge(
                          student.classMatchInfo?.matchPriority ||
                          student.matchPriority
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <div className="bg-muted/30 p-3 rounded-full mb-3">
                  <UserPlus className="h-6 w-6 opacity-40" />
                </div>
                <p className="font-medium text-foreground mb-1">
                  Không tìm thấy học sinh
                </p>
                <p className="text-sm">
                  Thử thay đổi từ khóa hoặc bộ lọc
                </p>
                {(search || priorityFilter !== "all") && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setPriorityFilter("all");
                    }}
                    className="mt-1"
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="border-t px-6 py-2 bg-muted/20 shrink-0">
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
          )}

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t shrink-0 sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedStudents.size > 0 ? (
                <span className="text-primary font-medium flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {selectedStudents.size}
                  </span>
                  học sinh được chọn
                </span>
              ) : (
                <span className="opacity-70">Chưa chọn học sinh nào</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={handleEnroll}
                disabled={selectedStudents.size === 0 || isEnrolling}
              >
                {isEnrolling ? "Đang xử lý..." : "Ghi danh"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
