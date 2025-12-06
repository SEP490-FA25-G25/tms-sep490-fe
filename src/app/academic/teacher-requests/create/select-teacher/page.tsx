import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, SearchIcon, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useGetTeachersForStaffQuery,
} from "@/store/services/teacherRequestApi";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export default function SelectTeacherPage() {
  const navigate = useNavigate();
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | undefined>();
  const [searchKeyword, setSearchKeyword] = useState("");

  const {
    data: teachersResponse,
    isLoading,
    error,
    refetch,
  } = useGetTeachersForStaffQuery();

  const teachers = teachersResponse?.data ?? [];

  // Filter teachers by search keyword
  const filteredTeachers = teachers.filter((teacher) => {
    if (!searchKeyword.trim()) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      teacher.fullName?.toLowerCase().includes(keyword) ||
      teacher.email?.toLowerCase().includes(keyword) ||
      teacher.employeeCode?.toLowerCase().includes(keyword)
    );
  });

  const handleContinue = () => {
    if (!selectedTeacherId) return;
    navigate(`/academic/teacher-requests/create/select-type?teacherId=${selectedTeacherId}`);
  };

  return (
    <DashboardLayout
      title="Tạo yêu cầu cho giáo viên"
      description="Chọn giáo viên để tạo yêu cầu thay mặt"
    >
      <div className="flex flex-col gap-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Chọn giáo viên</h1>
          <Button
            variant="ghost"
            onClick={() => navigate("/academic/teacher-requests")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm giáo viên theo tên, email, mã nhân viên..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Teachers List */}
        <div className="rounded-lg border overflow-hidden bg-card">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8">
              <Empty className="border border-destructive/40 text-destructive">
                <EmptyHeader>
                  <EmptyTitle>Không thể tải danh sách giáo viên</EmptyTitle>
                  <EmptyDescription>
                    Vui lòng kiểm tra kết nối và thử lại.
                  </EmptyDescription>
                </EmptyHeader>
                <Button variant="outline" onClick={() => refetch()}>
                  Thử tải lại
                </Button>
              </Empty>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {searchKeyword
                ? "Không tìm thấy giáo viên phù hợp với từ khóa tìm kiếm."
                : "Không có giáo viên nào trong cùng chi nhánh."}
            </div>
          ) : (
            <div className="divide-y">
              {filteredTeachers.map((teacher) => (
                <div
                  key={teacher.teacherId}
                  className={cn(
                    "p-4 transition-colors cursor-pointer hover:bg-muted/50",
                    selectedTeacherId === teacher.teacherId &&
                      "bg-primary/5 border-l-4 border-l-primary"
                  )}
                  onClick={() => setSelectedTeacherId(teacher.teacherId)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{teacher.fullName}</div>
                      <div className="text-sm text-muted-foreground">
                        {teacher.email}
                        {teacher.employeeCode && (
                          <span className="ml-2">· {teacher.employeeCode}</span>
                        )}
                      </div>
                    </div>
                    {selectedTeacherId === teacher.teacherId && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={() => navigate("/academic/teacher-requests")}
          >
            Hủy
          </Button>
          <Button onClick={handleContinue} disabled={!selectedTeacherId}>
            Tiếp tục
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

