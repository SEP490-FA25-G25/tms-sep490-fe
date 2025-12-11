"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  useGetManagerBranchByIdQuery,
  useUpdateManagerBranchMutation,
  type ManagerBranchOverview,
  type BranchRequest,
  useGetManagerBranchesQuery,
} from "@/store/services/branchApi";
import {
  useGetManagerTeachersQuery,
  useUpdateTeacherBranchesMutation,
} from "@/store/services/teacherApi";
import {
  useGetManagerStaffQuery,
  useUpdateStaffBranchesMutation,
} from "@/store/services/managerStaffApi";
import type { ManagerStaff } from "@/store/services/managerStaffApi";
import type { ManagerTeacher as ManagerScopeTeacher } from "@/store/services/teacherApi";
import { useGetUsersQuery } from "@/store/services/userApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Mail,
  Phone,
  Users,
  BookOpen,
  Monitor,
  CalendarDays,
} from "lucide-react";
import { BranchFormDialog } from "../components/BranchFormDialog";
import type { UserResponse } from "@/store/services/userApi";
import { toast } from "sonner";

export default function ManagerBranchDetailPage() {
  const { id } = useParams();
  const branchId = Number(id);
  const isValidId = Number.isFinite(branchId);
  const [showForm, setShowForm] = useState(false);
  const [showStaffDialog, setShowStaffDialog] = useState(false);

  const {
    data: branchResponse,
    isLoading: isLoadingBranch,
    isFetching: isFetchingBranch,
    refetch,
  } = useGetManagerBranchByIdQuery(branchId, { skip: !isValidId });
  const branch = branchResponse?.data;

  const { data: centerHeadResponse } =
    useGetUsersQuery({
      page: 0,
      size: 50,
      sort: "fullName,asc",
      role: "CENTER_HEAD",
    });
  const centerHeadOptions: UserResponse[] =
    centerHeadResponse?.data?.content ?? [];

  const [updateBranch, { isLoading: isUpdating }] =
    useUpdateManagerBranchMutation();

  const handleUpdateCenterHead = async (newCenterHeadUserId: number | null) => {
    if (!branch) return;

    if (!branch.centerId) {
      toast.error(
        "Chi nhánh chưa được gán trung tâm, không thể cập nhật Center Head."
      );
      return;
    }

    const payload: BranchRequest = {
      centerId: branch.centerId,
      code: branch.code,
      name: branch.name,
      address: branch.address,
      city: branch.city,
      district: branch.district,
      phone: branch.phone,
      email: branch.email,
      status: branch.status,
      openingDate: undefined,
      centerHeadUserId: newCenterHeadUserId,
    };

    try {
      await updateBranch({ id: branch.id, data: payload }).unwrap();
      toast.success("Cập nhật Center Head cho chi nhánh thành công");
      setShowStaffDialog(false);
      await refetch();
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ??
        "Không thể cập nhật Center Head cho chi nhánh"
      );
    }
  };

  const handleSubmit = async (values: BranchRequest) => {
    try {
      await updateBranch({ id: branchId, data: values }).unwrap();
      toast.success("Cập nhật chi nhánh thành công");
      setShowForm(false);
      await refetch();
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ??
        "Không thể cập nhật chi nhánh"
      );
    }
  };

  const statusVariant =
    branch?.status === "ACTIVE"
      ? "default"
      : branch?.status === "INACTIVE"
        ? "secondary"
        : "outline";

  const isDataLoading = isLoadingBranch || isFetchingBranch || !branch;

  const title = branch ? branch.name : "Chi tiết chi nhánh";
  const description = branch
    ? `${branch.code} • ${branch.centerName ?? "Chưa gán trung tâm"}`
    : "Theo dõi thông tin chi nhánh và đội ngũ giáo viên.";

  return (
    <DashboardLayout
      title={title}
      description={description}
      actions={
        branch ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowStaffDialog(true)}>
              Ngưng hoạt động
            </Button>
            <Button onClick={() => setShowForm(true)}>Chỉnh sửa</Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {isDataLoading ? (
          <BranchDetailSkeleton />
        ) : !branch ? (
          <Card>
            <CardHeader>
              <CardTitle>Không tìm thấy chi nhánh</CardTitle>
              <CardDescription>
                Vui lòng kiểm tra lại đường dẫn hoặc quay lại danh sách.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <BranchSummaryCard branch={branch} statusVariant={statusVariant} />

            <StaffAssignmentDialog
              open={showStaffDialog}
              onOpenChange={setShowStaffDialog}
              branch={branch}
              centerHeadOptions={centerHeadOptions}
              onUpdateCenterHead={handleUpdateCenterHead}
              isUpdatingCenterHead={isUpdating}
            />
          </>
        )}
      </div>

      {branch && (
        <BranchFormDialog
          open={showForm}
          onOpenChange={setShowForm}
          initialData={branch as ManagerBranchOverview}
          onSubmit={handleSubmit}
          isSubmitting={isUpdating}
        />
      )}
    </DashboardLayout>
  );
}

function BranchSummaryCard({
  branch,
  statusVariant,
}: {
  branch: ManagerBranchOverview;
  statusVariant: "default" | "secondary" | "outline";
}) {
  const centerHead = branch.centerHead;
  return (
    <Card className="relative">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">{branch.name}</CardTitle>
            <CardDescription>
              {branch.centerName ?? "Chưa gán trung tâm"}
            </CardDescription>
          </div>
        </div>
        <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>{branch.address || "Chưa cập nhật địa chỉ"}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Thông tin liên hệ
            </p>
            <div className="space-y-2 text-sm">
              {branch.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{branch.phone}</span>
                </div>
              )}
              {branch.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{branch.email}</span>
                </div>
              )}
              {branch.openingDate && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>Khai trương: {new Date(branch.openingDate).toLocaleDateString("vi-VN")}</span>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Center Head phụ trách
            </p>
            {centerHead ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={centerHead.avatarUrl ?? undefined} />
                  <AvatarFallback>
                    {getInitials(centerHead.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{centerHead.fullName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{centerHead.email}</span>
                  </div>
                  {centerHead.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{centerHead.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Chưa gán Center Head cho chi nhánh này.
              </p>
            )}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <StatusTile
            icon={BookOpen}
            title="Lớp học"
            active={branch.classStatus.active}
            total={branch.classStatus.total}
          />
          <StatusTile
            icon={Users}
            title="Giáo viên"
            active={branch.teacherStatus.active}
            total={branch.teacherStatus.total}
          />
          <StatusTile
            icon={Monitor}
            title="Phòng & tài nguyên"
            active={branch.resourceStatus.active}
            total={branch.resourceStatus.total}
          />
        </div>
      </CardContent>
      <Badge
        variant={statusVariant}
        className="absolute right-4 top-4 px-3 py-1 text-xs font-semibold"
      >
        {branch.status === "ACTIVE"
          ? "Hoạt động"
          : branch.status === "INACTIVE"
            ? "Không hoạt động"
            : "Không xác định"}
      </Badge>
    </Card>
  );
}

function StaffAssignmentDialog({
  open,
  onOpenChange,
  branch,
  centerHeadOptions,
  onUpdateCenterHead,
  isUpdatingCenterHead,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: ManagerBranchOverview;
  centerHeadOptions: UserResponse[];
  onUpdateCenterHead: (centerHeadUserId: number | null) => Promise<void>;
  isUpdatingCenterHead: boolean;
}) {
  const [selectedCenterHeadId, setSelectedCenterHeadId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setSelectedCenterHeadId(
        branch.centerHead?.userId ? String(branch.centerHead.userId) : ""
      );
    }
  }, [open, branch.centerHead]);

  const handleSaveCenterHead = async () => {
    const newId =
      selectedCenterHeadId && selectedCenterHeadId !== "none"
        ? Number(selectedCenterHeadId)
        : null;
    await onUpdateCenterHead(newId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(95vw,72rem)] max-w-none sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Quản lý phân bổ nhân sự chi nhánh</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Manager dùng màn hình này để gán Center Head, Academic Staff, QA
            Staff và giáo viên vào chi nhánh sau khi Admin IT đã tạo tài khoản
            và cấp role tương ứng.
          </p>
          <Tabs defaultValue="centerHead" className="space-y-4">
            <TabsList>
              <TabsTrigger value="centerHead">Center Head</TabsTrigger>
              <TabsTrigger value="teachers">Giáo viên</TabsTrigger>
              <TabsTrigger value="academic">Academic Staff</TabsTrigger>
              <TabsTrigger value="qa">QA Staff</TabsTrigger>
            </TabsList>

            <TabsContent value="centerHead" className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ở tab này Manager sẽ chọn 1 Center Head phụ trách chi nhánh từ
                danh sách user có role{" "}
                <span className="font-mono">CENTER_HEAD</span>. Hiện tại luồng
                phân bổ chi tiết đã được hỗ trợ ngay tại đây.
              </p>
              <div className="space-y-3 rounded-md border bg-muted/40 p-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Chọn Center Head phụ trách chi nhánh
                  </p>
                  <Select
                    value={selectedCenterHeadId || "none"}
                    onValueChange={(value) => setSelectedCenterHeadId(value)}
                  >
                    <SelectTrigger className="w-full md:w-80">
                      <SelectValue placeholder="Chọn Center Head" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Không gán Center Head
                      </SelectItem>
                      {centerHeadOptions.map((user) => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          {user.fullName} — {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {branch.centerHead && (
                    <p className="text-xs text-muted-foreground">
                      Đang phụ trách:{" "}
                      <span className="font-medium">
                        {branch.centerHead.fullName}
                      </span>{" "}
                      ({branch.centerHead.email})
                    </p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSaveCenterHead}
                    disabled={isUpdatingCenterHead}
                  >
                    Lưu Center Head
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="teachers" className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Tab này dùng để gán giáo viên cố định hoặc multi-branch cho chi
                nhánh. Logic sẽ tái sử dụng luồng chọn chi nhánh theo dạng
                checkbox giống màn &quot;Quản lý giáo viên&quot; hiện tại.
              </p>
              <TeacherAssignmentSection branch={branch} />
            </TabsContent>

            <TabsContent value="academic" className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Academic Staff được Admin IT tạo tài khoản với role tương ứng,
                sau đó Manager gán phạm vi chi nhánh để hỗ trợ mở lớp, xử lý yêu
                cầu. Mỗi nhân sự có thể phục vụ nhiều chi nhánh.
              </p>
              <StaffAssignmentSection role="ACADEMIC_AFFAIR" branch={branch} />
            </TabsContent>

            <TabsContent value="qa" className="space-y-3">
              <p className="text-sm text-muted-foreground">
                QA Staff vẫn giữ tính độc lập kiểm định, nhưng Manager có thể
                phân bổ QA phụ trách theo chi nhánh/vùng để đảm bảo đủ nguồn lực
                quan sát lớp.
              </p>
              <StaffAssignmentSection role="QA" branch={branch} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatusTile({
  title,
  active,
  total,
  icon: Icon,
}: {
  title: string;
  active: number;
  total: number;
  icon: typeof BookOpen;
}) {
  return (
    <div className="rounded-xl border bg-muted/10 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="mt-2">
        <p className="text-3xl font-semibold">{active}</p>
        <p className="text-xs text-muted-foreground">/ {total} tổng số</p>
      </div>
    </div>
  );
}

function StaffAssignmentSection({
  branch,
  role,
}: {
  branch: ManagerBranchOverview;
  role: "ACADEMIC_AFFAIR" | "QA";
}) {
  const { data: branchesResponse } = useGetManagerBranchesQuery();
  const allBranches = branchesResponse?.data ?? [];

  const { data: staffResponse, isLoading } = useGetManagerStaffQuery({ role });
  const staff: ManagerStaff[] = staffResponse?.data ?? [];

  const [updatingIds, setUpdatingIds] = useState<number[]>([]);
  const [updateStaffBranches] = useUpdateStaffBranchesMutation();

  const isInBranch = (member: ManagerStaff) =>
    member.branchNames?.includes(branch.name);

  const handleToggle = async (member: ManagerStaff, checked: boolean) => {
    if (!allBranches.length) {
      toast.error("Không thể tải danh sách chi nhánh để cập nhật.");
      return;
    }

    const currentBranchIds = allBranches
      .filter((b) => member.branchNames?.includes(b.name))
      .map((b) => b.id);

    const branchId = branch.id;
    let nextBranchIds = currentBranchIds;

    if (checked) {
      if (!nextBranchIds.includes(branchId)) {
        nextBranchIds = [...nextBranchIds, branchId];
      }
    } else {
      nextBranchIds = nextBranchIds.filter((id) => id !== branchId);
    }

    setUpdatingIds((prev) =>
      prev.includes(member.userId) ? prev : [...prev, member.userId]
    );

    try {
      await updateStaffBranches({
        userId: member.userId,
        branchIds: nextBranchIds,
      }).unwrap();
      toast.success("Cập nhật chi nhánh cho nhân sự thành công");
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        "Không thể cập nhật chi nhánh cho nhân sự";
      toast.error(message);
    } finally {
      setUpdatingIds((prev) => prev.filter((id) => id !== member.userId));
    }
  };

  return (
    <div className="space-y-3 rounded-md border bg-muted/40 p-4">
      {isLoading ? (
        <p className="text-xs text-muted-foreground">
          Đang tải danh sách nhân sự...
        </p>
      ) : staff.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Không có nhân sự phù hợp trong phạm vi quản lý của bạn.
        </p>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {staff.map((member) => {
            const checked = isInBranch(member);
            const disabled = updatingIds.includes(member.userId);
            return (
              <label
                key={member.userId}
                className="flex items-start gap-3 rounded-md bg-background p-2 text-sm"
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(value) =>
                    handleToggle(member, value === true)
                  }
                  className="mt-1"
                />
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{member.fullName}</span>
                    {member.status && (
                      <span className="text-xs text-muted-foreground">
                        {member.status}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {member.email}
                  </span>
                  {member.branchNames.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      Chi nhánh hiện tại: {member.branchNames.join(", ")}
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        Tick để gán nhân sự vào chi nhánh{" "}
        <span className="font-semibold">{branch.name}</span>, bỏ tick để gỡ khỏi
        chi nhánh này. Các chi nhánh khác sẽ được giữ nguyên.
      </p>
    </div>
  );
}
function TeacherAssignmentSection({
  branch,
}: {
  branch: ManagerBranchOverview;
}) {
  const { data: branchesResponse } = useGetManagerBranchesQuery();
  const allBranches = branchesResponse?.data ?? [];

  const {
    data: teachersResponse,
    isLoading,
    refetch: refetchTeachers,
  } = useGetManagerTeachersQuery();
  const allTeachers: ManagerScopeTeacher[] = teachersResponse?.data ?? [];

  const [updatingTeacherIds, setUpdatingTeacherIds] = useState<number[]>([]);
  const [updateTeacherBranches] = useUpdateTeacherBranchesMutation();

  const isTeacherInBranch = (teacher: ManagerScopeTeacher) =>
    teacher.branchNames?.includes(branch.name);

  const handleToggleTeacher = async (
    teacher: ManagerScopeTeacher,
    checked: boolean
  ) => {
    if (!allBranches.length) {
      toast.error("Không thể tải danh sách chi nhánh để cập nhật giáo viên.");
      return;
    }

    const currentBranchIds = allBranches
      .filter((b) => teacher.branchNames?.includes(b.name))
      .map((b) => b.id);

    const branchId = branch.id;
    let nextBranchIds = currentBranchIds;

    if (checked) {
      if (!nextBranchIds.includes(branchId)) {
        nextBranchIds = [...nextBranchIds, branchId];
      }
    } else {
      // Validate: chỉ cho phép bỏ gắn nếu giáo viên không có lớp đang dạy hoặc lớp trong tương lai
      // Validation này được thực hiện ở backend
      nextBranchIds = nextBranchIds.filter((id) => id !== branchId);
    }

    // Set updating state trước khi gọi API để disable checkbox
    setUpdatingTeacherIds((prev) =>
      prev.includes(teacher.teacherId) ? prev : [...prev, teacher.teacherId]
    );

    try {
      await updateTeacherBranches({
        teacherId: teacher.teacherId,
        branchIds: nextBranchIds,
      }).unwrap();
      toast.success("Cập nhật chi nhánh cho giáo viên thành công");
      // Refetch để cập nhật danh sách giáo viên (bao gồm cả những giáo viên đã bỏ gắn)
      // Giáo viên vẫn sẽ hiển thị trong danh sách để có thể tích lại
      await refetchTeachers();
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        "Không thể cập nhật chi nhánh cho giáo viên";
      toast.error(message);
      // Refetch để đảm bảo UI đồng bộ với backend (checkbox sẽ tự động revert)
      await refetchTeachers();
    } finally {
      setUpdatingTeacherIds((prev) =>
        prev.filter((id) => id !== teacher.teacherId)
      );
    }
  };

  return (
    <div className="space-y-3 rounded-md border bg-muted/40 p-4">
      {isLoading ? (
        <p className="text-xs text-muted-foreground">
          Đang tải danh sách giáo viên...
        </p>
      ) : allTeachers.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Không có giáo viên nào trong phạm vi quản lý của bạn.
        </p>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {allTeachers.map((teacher) => {
            const checked = isTeacherInBranch(teacher);
            const disabled = updatingTeacherIds.includes(teacher.teacherId);
            return (
              <label
                key={teacher.teacherId}
                className="flex items-start gap-3 rounded-md bg-background p-2 text-sm"
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(value) =>
                    handleToggleTeacher(teacher, value === true)
                  }
                  className="mt-1"
                />
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{teacher.fullName}</span>
                    {teacher.status && (
                      <span className="text-xs text-muted-foreground">
                        {teacher.status}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {teacher.email}
                  </span>
                  {teacher.branchNames.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      Chi nhánh hiện tại: {teacher.branchNames.join(", ")}
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        Tick để gán giáo viên vào chi nhánh{" "}
        <span className="font-semibold">{branch.name}</span>, bỏ tick để gỡ giáo
        viên khỏi chi nhánh này. Các chi nhánh khác của giáo viên sẽ được giữ
        nguyên.
      </p>
    </div>
  );
}

function BranchDetailSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </CardContent>
    </Card>
  );
}

function getInitials(name?: string) {
  if (!name) return "CH";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
