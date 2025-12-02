"use client";

import { useState } from "react";
import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalHeader,
  FullScreenModalBody,
  FullScreenModalTitle,
} from "@/components/ui/full-screen-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, MapPin, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { type CenterResponse } from "@/store/services/centerApi";
import {
  useGetBranchesByCenterIdQuery,
  useDeleteBranchMutation,
  useUpdateBranchMutation,
  type BranchResponse,
} from "@/store/services/branchApi";
import { toast } from "sonner";
import { CreateBranchDialog } from "./CreateBranchDialog";
import { EditBranchDialog } from "./EditBranchDialog";
import { DeleteBranchDialog } from "./DeleteBranchDialog";

interface CenterDetailDialogProps {
  open: boolean;
  center: CenterResponse;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onSuccess: () => void;
}

export function CenterDetailDialog({
  open,
  center,
  onOpenChange,
  onEdit,
  onSuccess,
}: CenterDetailDialogProps) {
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<BranchResponse | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<BranchResponse | null>(
    null
  );

  const {
    data: branchesResponse,
    isLoading: isLoadingBranches,
    refetch: refetchBranches,
  } = useGetBranchesByCenterIdQuery(center.id, { skip: !open });

  const [deleteBranch] = useDeleteBranchMutation();
  const [updateBranch, { isLoading: isUpdatingBranch }] =
    useUpdateBranchMutation();

  // Extract branches from API response
  const branches: BranchResponse[] = branchesResponse?.data ?? [];

  const handleDeleteBranch = async (branchId: number) => {
    try {
      const result = await deleteBranch({
        id: branchId,
        centerId: center.id,
      }).unwrap();
      if (!result.success) {
        throw new Error(result.message || "Xóa chi nhánh thất bại");
      }
      toast.success("Xóa chi nhánh thành công");
      refetchBranches();
      setBranchToDelete(null);
      onSuccess();
    } catch (error: unknown) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ||
          "Xóa chi nhánh thất bại"
      );
    }
  };

  const handleToggleBranchStatus = async (branch: BranchResponse) => {
    const nextStatus = branch.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const result = await updateBranch({
        id: branch.id,
        data: {
          centerId: branch.centerId,
          code: branch.code,
          name: branch.name,
          address: branch.address,
          city: branch.city,
          district: branch.district,
          phone: branch.phone,
          email: branch.email,
          status: nextStatus,
          openingDate: branch.openingDate,
        },
      }).unwrap();

      if (!result.success) {
        throw new Error(
          result.message || "Cập nhật trạng thái chi nhánh thất bại"
        );
      }

      toast.success(
        nextStatus === "ACTIVE"
          ? "Kích hoạt chi nhánh thành công"
          : "Ngưng hoạt động chi nhánh thành công"
      );
      await refetchBranches();
      onSuccess();
    } catch (error: unknown) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ||
          "Cập nhật trạng thái chi nhánh thất bại"
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      ACTIVE: { label: "Hoạt động", variant: "default" },
      INACTIVE: { label: "Không hoạt động", variant: "secondary" },
      CLOSED: { label: "Đã đóng", variant: "destructive" },
      PLANNED: { label: "Dự kiến", variant: "outline" },
    };
    const statusInfo = statusMap[status] || {
      label: status,
      variant: "outline" as const,
    };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <>
      <FullScreenModal open={open} onOpenChange={onOpenChange}>
        <FullScreenModalContent size="2xl">
          <FullScreenModalHeader className="flex items-start justify-between">
            <div>
              <FullScreenModalTitle className="text-2xl">
                {center.name}
              </FullScreenModalTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Mã: {center.code}
              </p>
            </div>
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          </FullScreenModalHeader>

          <FullScreenModalBody className="space-y-6">
            {/* Center Information */}
            <div className="space-y-3">
              <h3 className="font-semibold">Thông tin trung tâm</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {center.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Địa chỉ</p>
                      <p className="text-muted-foreground">{center.address}</p>
                    </div>
                  </div>
                )}
                {center.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">{center.email}</p>
                    </div>
                  </div>
                )}
                {center.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Điện thoại</p>
                      <p className="text-muted-foreground">{center.phone}</p>
                    </div>
                  </div>
                )}
                {center.description && (
                  <div className="col-span-2">
                    <p className="font-medium mb-1">Mô tả</p>
                    <p className="text-muted-foreground">
                      {center.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Branches Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Chi nhánh ({branches.length})</h3>
                <Button
                  onClick={() => setShowCreateBranch(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Thêm chi nhánh
                </Button>
              </div>

              {isLoadingBranches ? (
                <p className="text-sm text-muted-foreground">Đang tải...</p>
              ) : branches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  <p className="text-sm">Chưa có chi nhánh nào</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setShowCreateBranch(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm chi nhánh đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium">
                          Mã
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium">
                          Tên
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium">
                          Địa chỉ
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium">
                          Trạng thái
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-medium">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {branches.map((branch: BranchResponse) => (
                        <tr
                          key={branch.id}
                          className="border-t hover:bg-muted/50"
                        >
                          <td className="px-4 py-2 text-sm font-medium">
                            {branch.code}
                          </td>
                          <td className="px-4 py-2 text-sm">{branch.name}</td>
                          <td className="px-4 py-2 text-sm text-muted-foreground">
                            {branch.address || "-"}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {getStatusBadge(branch.status)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isUpdatingBranch}
                                onClick={() => handleToggleBranchStatus(branch)}
                              >
                                {branch.status === "ACTIVE"
                                  ? "Ngưng hoạt động"
                                  : "Kích hoạt"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setBranchToEdit(branch)}
                              >
                                Sửa
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled
                                className="text-red-400 opacity-40 cursor-not-allowed"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </FullScreenModalBody>
        </FullScreenModalContent>
      </FullScreenModal>

      {/* Branch Dialogs */}
      {showCreateBranch && (
        <CreateBranchDialog
          open={showCreateBranch}
          centerId={center.id}
          onOpenChange={setShowCreateBranch}
          onSuccess={() => {
            setShowCreateBranch(false);
            refetchBranches();
            onSuccess();
          }}
        />
      )}

      {branchToEdit && (
        <EditBranchDialog
          open={!!branchToEdit}
          branch={branchToEdit}
          onOpenChange={(open) => {
            if (!open) setBranchToEdit(null);
          }}
          onSuccess={() => {
            setBranchToEdit(null);
            refetchBranches();
            onSuccess();
          }}
        />
      )}

      {branchToDelete && (
        <DeleteBranchDialog
          open={!!branchToDelete}
          branch={branchToDelete}
          onOpenChange={(open) => {
            if (!open) setBranchToDelete(null);
          }}
          onConfirm={() => {
            handleDeleteBranch(branchToDelete.id);
          }}
        />
      )}
    </>
  );
}
