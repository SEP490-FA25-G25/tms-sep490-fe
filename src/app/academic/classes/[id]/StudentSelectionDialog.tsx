import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalDescription,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalBody,
  FullScreenModalFooter,
} from "@/components/ui/full-screen-modal";
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
import { Search, UserPlus, Filter, Check } from "lucide-react";
import { useGetAvailableStudentsQuery } from "@/store/services/classApi";
import { useEnrollExistingStudentsMutation } from "@/store/services/enrollmentApi";
import { toast } from "sonner";
import { ReplacementAssessmentsPopover } from "@/components/ReplacementAssessmentsPopover";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

  const { data: response, isLoading } = useGetAvailableStudentsQuery(
    { classId, search, page, size: 20 },
    { skip: !open }
  );

  const [enrollStudents, { isLoading: isEnrolling }] =
    useEnrollExistingStudentsMutation();

  useEffect(() => {
    if (open) {
      setSearch("");
      setPriorityFilter("all");
      setSelectedStudents(new Set());
      setPage(0);
    }
  }, [open]);

  const students = response?.data?.content || [];
  const pagination = response?.data?.page;

  const filteredStudents = useMemo(() => {
    if (priorityFilter === "all") return students;
    return students.filter((s) => {
      const priority = s.classMatchInfo?.matchPriority || s.matchPriority;
      return priority.toString() === priorityFilter;
    });
  }, [students, priorityFilter]);

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
    } catch (error: any) {
      console.error("Enrollment error:", error);
      toast.error(error?.data?.message || "Ghi danh thất bại");
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
    <FullScreenModal open={open} onOpenChange={onOpenChange}>
      <FullScreenModalContent className="bg-muted/10 p-0 gap-0">
        <FullScreenModalHeader className="bg-background border-b px-6 py-4 space-y-1">
          <FullScreenModalTitle className="text-xl font-semibold tracking-tight">
            Chọn học sinh để ghi danh
          </FullScreenModalTitle>
          <FullScreenModalDescription className="text-muted-foreground text-sm">
            Học sinh được sắp xếp theo mức độ phù hợp của bài kiểm tra kỹ năng.
          </FullScreenModalDescription>
        </FullScreenModalHeader>

        <FullScreenModalBody className="p-0 flex flex-col h-full overflow-hidden bg-background">
          <div className="flex flex-col sm:flex-row gap-4 p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-20">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, mã học sinh, email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-9 bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={priorityFilter}
                onValueChange={(val) => setPriorityFilter(val)}
              >
                <SelectTrigger className="w-[180px] bg-background">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Mức độ phù hợp" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mức độ</SelectItem>
                  <SelectItem value="1">Phù hợp hoàn hảo</SelectItem>
                  <SelectItem value="2">Phù hợp một phần</SelectItem>
                  <SelectItem value="3">Không phù hợp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="space-y-4 p-6">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-muted/50 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : filteredStudents.length > 0 ? (
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent border-b border-border/50">
                    <TableHead className="w-[50px] pl-6">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Select all"
                        className="translate-y-[2px]"
                      />
                    </TableHead>
                    <TableHead className="min-w-[300px] font-medium">Học sinh</TableHead>
                    <TableHead className="w-[200px] font-medium">Độ phù hợp</TableHead>
                    <TableHead className="min-w-[200px] font-medium">Đánh giá kỹ năng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow
                      key={student.id}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-muted/40 border-b border-border/40",
                        selectedStudents.has(student.id) && "bg-primary/5 hover:bg-primary/10"
                      )}
                      onClick={() => toggleStudent(student.id)}
                    >
                      <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedStudents.has(student.id)}
                          onCheckedChange={() => toggleStudent(student.id)}
                          className="translate-y-[2px]"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border/50">
                            <AvatarFallback className={cn(
                              "text-xs font-medium",
                              selectedStudents.has(student.id) ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                              {getInitials(student.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-sm text-foreground">
                              {student.fullName}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="font-mono">{student.studentCode}</span>
                              <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                              <span>{student.email}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getMatchPriorityBadge(
                          student.classMatchInfo?.matchPriority ||
                          student.matchPriority
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <ReplacementAssessmentsPopover
                          assessments={student.replacementSkillAssessments || []}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground animate-in fade-in-50">
                <div className="bg-muted/30 p-4 rounded-full mb-4">
                  <UserPlus className="h-8 w-8 opacity-40" />
                </div>
                <h3 className="font-medium text-lg text-foreground mb-1">
                  Không tìm thấy học sinh
                </h3>
                <p className="text-sm max-w-xs mx-auto text-muted-foreground/80">
                  Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để tìm thấy kết quả phù hợp.
                </p>
                {(search || priorityFilter !== "all") && (
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearch("");
                      setPriorityFilter("all");
                    }}
                    className="mt-2 h-auto p-0 text-primary"
                  >
                    Xóa tất cả bộ lọc
                  </Button>
                )}
              </div>
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 0) setPage(page - 1);
                      }}
                      className={cn(page === 0 && "pointer-events-none opacity-50")}
                    />
                  </PaginationItem>
                  <div className="flex items-center px-4 text-sm font-medium text-muted-foreground">
                    Trang {page + 1} / {pagination.totalPages}
                  </div>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < pagination.totalPages - 1) setPage(page + 1);
                      }}
                      className={cn(
                        page >= pagination.totalPages - 1 &&
                        "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </FullScreenModalBody>

        <FullScreenModalFooter className="bg-background border-t px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedStudents.size > 0 ? (
              <span className="text-primary font-medium flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {selectedStudents.size}
                </span>
                học sinh được chọn
              </span>
            ) : (
              <span className="opacity-70">Chưa chọn học sinh nào</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              Hủy bỏ
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={selectedStudents.size === 0 || isEnrolling}
              className="min-w-[120px] shadow-sm"
            >
              {isEnrolling ? "Đang xử lý..." : "Ghi danh"}
            </Button>
          </div>
        </FullScreenModalFooter>
      </FullScreenModalContent>
    </FullScreenModal>
  );
}
