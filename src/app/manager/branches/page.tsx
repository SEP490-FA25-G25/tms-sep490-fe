"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
  useCreateManagerBranchMutation,
  useGetManagerBranchesQuery,
  type ManagerBranchOverview,
  type BranchRequest,
} from "@/store/services/branchApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Users,
  BookOpen,
  Monitor,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useGetCentersQuery } from "@/store/services/centerApi";
import { useGetUsersQuery } from "@/store/services/userApi";
import type { CenterResponse } from "@/store/services/centerApi";
import type { UserResponse } from "@/store/services/userApi";
import { BranchFormDialog } from "./components/BranchFormDialog";
import { toast } from "sonner";

export default function ManagerBranchesPage() {
  const [showForm, setShowForm] = useState(false);

  const {
    data: branchResponse,
    isLoading: isLoadingBranches,
    refetch,
  } = useGetManagerBranchesQuery();
  const branches = branchResponse?.data ?? [];

  const { data: centersResponse } = useGetCentersQuery({
    page: 0,
    size: 100,
    sort: "name,asc",
  });
  const centers: CenterResponse[] = centersResponse?.data?.content ?? [];

  const { data: centerHeadResponse, isFetching: isFetchingCenterHeads } =
    useGetUsersQuery({
      page: 0,
      size: 50,
      sort: "fullName,asc",
      role: "CENTER_HEAD",
    });
  const centerHeadOptions: UserResponse[] =
    centerHeadResponse?.data?.content ?? [];

  const [createBranch, { isLoading: isCreating }] =
    useCreateManagerBranchMutation();

  const navigate = useNavigate();
  const handleViewDetail = (branchId: number) => {
    navigate(`/manager/branches/${branchId}`);
  };

  const handleCreate = () => {
    setShowForm(true);
  };

  const handleSubmit = async (values: BranchRequest) => {
    try {
      await createBranch(values).unwrap();
      toast.success("Tạo chi nhánh thành công");
      setShowForm(false);
      await refetch();
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ??
          "Không thể tạo chi nhánh"
      );
    }
  };

  return (
    <DashboardLayout
      title="Quản lý chi nhánh"
      description="Xem và điều hành các chi nhánh thuộc trung tâm của bạn."
      actions={
        <Button onClick={handleCreate} disabled={isCreating}>
          Tạo chi nhánh
        </Button>
      }
    >
      {isLoadingBranches ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : branches.length === 0 ? (
        <Card className="border-dashed text-center py-10">
          <CardHeader>
            <CardTitle>Chưa có chi nhánh nào</CardTitle>
            <CardDescription>
              Bạn hiện chưa được phân công chi nhánh nào. Vui lòng liên hệ
              Admin.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onClick={() => handleViewDetail(branch.id)}
            />
          ))}
        </div>
      )}

      <BranchFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        centers={centers}
        centerHeadOptions={centerHeadOptions}
        loadingCenters={!centers.length}
        loadingCenterHeads={isFetchingCenterHeads}
        onSubmit={handleSubmit}
        isSubmitting={isCreating}
      />
    </DashboardLayout>
  );
}

function BranchCard({
  branch,
  onClick,
}: {
  branch: ManagerBranchOverview;
  onClick: () => void;
}) {
  const centerHead = branch.centerHead;
  const statusVariant =
    branch.status === "ACTIVE"
      ? "default"
      : branch.status === "INACTIVE"
      ? "secondary"
      : "outline";

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      className="flex flex-col cursor-pointer transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`Xem chi tiết ${branch.name}`}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{branch.name}</CardTitle>
            <CardDescription className="text-xs">
              {branch.code} • {branch.centerName ?? "Chưa gán trung tâm"}
            </CardDescription>
          </div>
          <Badge variant={statusVariant}>{branch.status ?? "UNKNOWN"}</Badge>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>{branch.address || "Chưa cập nhật địa chỉ"}</span>
        </div>
        {(branch.city || branch.district) && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {[branch.district, branch.city].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <div className="space-y-3 rounded-lg border p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Center Head
          </p>
          {centerHead ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
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
        <div className="grid grid-cols-3 gap-3">
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
    </Card>
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
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <div>
        <p className="text-2xl font-semibold">{active}</p>
        <p className="text-xs text-muted-foreground">/ {total} tổng số</p>
      </div>
    </div>
  );
}

function getInitials(name?: string) {
  if (!name) return "CH";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
