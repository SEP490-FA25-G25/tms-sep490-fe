import { useState, useEffect } from "react";
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
import { Search, UserPlus, Info } from "lucide-react";
import { useGetAvailableStudentsQuery } from "@/store/services/classApi";
import { useEnrollExistingStudentsMutation } from "@/store/services/enrollmentApi";
import type { AvailableStudentDTO } from "@/store/services/classApi";
import { toast } from "sonner";
import { ReplacementAssessmentsPopover } from "@/components/ReplacementAssessmentsPopover";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

  const { data: response, isLoading } = useGetAvailableStudentsQuery(
    { classId, search, page, size: 20 },
    { skip: !open } // Only fetch when dialog is open
  );

  const [enrollStudents, { isLoading: isEnrolling }] =
    useEnrollExistingStudentsMutation();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedStudents(new Set());
      setPage(0);
    }
  }, [open]);

  const students = response?.data?.content || [];
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

  const selectAll = () => {
    const newSet = new Set(selectedStudents);
    students.forEach((student) => newSet.add(student.id));
    setSelectedStudents(newSet);
  };

  const clearSelection = () => {
    setSelectedStudents(new Set());
  };

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
        `Đã ghi danh thành công ${result.data.successfulEnrollments} trên ${result.data.totalAttempted} học sinh vào lớp ${result.data.className}`
      );

      handleClose();
      onSuccess();
    } catch (error: unknown) {
      console.error("Enrollment error:", error);
      const err = error as { data?: { message?: string } };
      const errorMessage = err?.data?.message || "Ghi danh học sinh thất bại";
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    setSearch("");
    setSelectedStudents(new Set());
    setPage(0);
    onOpenChange(false);
  };

  const getMatchPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1:
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-200"
          >
            Phù hợp hoàn hảo
          </Badge>
        );
      case 2:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-200"
          >
            Phù hợp một phần
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-200"
          >
            Không phù hợp
          </Badge>
        );
    }
  };

  return (
    <FullScreenModal open={open} onOpenChange={onOpenChange}>
      <FullScreenModalContent>
        <FullScreenModalHeader>
          <FullScreenModalTitle>Chọn học sinh để ghi danh</FullScreenModalTitle>
          <FullScreenModalDescription>
            Học sinh được sắp xếp theo mức độ phù hợp của bài kiểm tra kỹ năng.
            Các học sinh phù hợp hoàn hảo sẽ xuất hiện đầu tiên.
          </FullScreenModalDescription>
        </FullScreenModalHeader>

        <FullScreenModalBody className="flex flex-col space-y-4 p-0">
          {/* Search & Actions */}
          <div className="flex items-center gap-3 px-6 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, email, điện thoại, hoặc mã học sinh..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={selectAll}>
              Chọn tất cả
            </Button>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Xóa lựa chọn
            </Button>
          </div>

          {/* Selection Summary */}
          {selectedStudents.size > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 mx-6">
              <div className="flex items-center gap-2 text-sm text-blue-900">
                <Info className="h-4 w-4" />
                <span className="font-medium">
                  Đã chọn {selectedStudents.size} học sinh
                </span>
              </div>
            </div>
          )}

          {/* Students Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-muted/50 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : students.length > 0 ? (
            <div className="flex-1 flex flex-col overflow-hidden px-6">
              <div className="flex-1 rounded-lg border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] sticky top-0 bg-background"></TableHead>
                      <TableHead className="min-w-[200px] sticky top-0 bg-background">
                        Mức độ phù hợp
                      </TableHead>
                      <TableHead className="min-w-[200px] sticky top-0 bg-background">
                        Học sinh
                      </TableHead>
                      <TableHead className="min-w-[250px] sticky top-0 bg-background">
                        Email
                      </TableHead>
                      <TableHead className="min-w-[150px] sticky top-0 bg-background">
                        Điện thoại
                      </TableHead>
                      <TableHead className="min-w-[200px] sticky top-0 bg-background">
                        Bài kiểm tra đánh giá
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student: AvailableStudentDTO) => (
                      <TableRow
                        key={student.id}
                        className={
                          selectedStudents.has(student.id)
                            ? "bg-blue-50"
                            : undefined
                        }
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student.id)}
                            onChange={() => toggleStudent(student.id)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getMatchPriorityBadge(
                              student.classMatchInfo?.matchPriority ||
                                student.matchPriority
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {student.fullName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {student.studentCode}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.phone}</TableCell>
                        <TableCell>
                          <ReplacementAssessmentsPopover
                            assessments={
                              student.replacementSkillAssessments || []
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="flex items-center justify-between pt-4 pb-4">
                  <div className="text-sm text-muted-foreground">
                    Hiển thị {students.length} trên {pagination.totalElements}{" "}
                    học sinh
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setPage(page - 1)
                          }}
                          disabled={pagination.number === 0}
                        />
                      </PaginationItem>
                      {Array.from({ length: pagination.totalPages }, (_, i) => i).map((pageNum) => (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              setPage(pageNum)
                            }}
                            isActive={pageNum === pagination.number}
                          >
                            {pageNum + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setPage(page + 1)
                          }}
                          disabled={pagination.number >= pagination.totalPages - 1}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy học sinh nào phù hợp.</p>
              {search && (
                <p className="text-sm mt-2">
                  Thử điều chỉnh tiêu chí tìm kiếm của bạn.
                </p>
              )}
            </div>
          )}
        </FullScreenModalBody>

        <FullScreenModalFooter>
          <Button variant="outline" onClick={handleClose}>
            Hủy bỏ
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={selectedStudents.size === 0 || isEnrolling}
          >
            {isEnrolling
              ? "Đang ghi danh..."
              : `Ghi danh ${
                  selectedStudents.size > 0 ? `(${selectedStudents.size})` : ""
                } học sinh`}
          </Button>
        </FullScreenModalFooter>
      </FullScreenModalContent>
    </FullScreenModal>
  );
}
