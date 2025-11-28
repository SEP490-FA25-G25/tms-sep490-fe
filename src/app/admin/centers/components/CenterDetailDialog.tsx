"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, MapPin, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { type CenterResponse } from "@/store/services/centerApi";
import {
  useGetBranchesByCenterIdQuery,
  useDeleteBranchMutation,
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
      toast.error((error as { data?: { message?: string } })?.data?.message || "Xóa chi nhánh thất bại");
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl">{center.name}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Mã: {center.code}
                </p>
              </div>
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
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
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
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
                        <tr key={branch.id} className="border-t hover:bg-muted/50">
                          <td className="px-4 py-2 text-sm font-medium">{branch.code}</td>
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
                                variant="ghost"
                                size="sm"
                                onClick={() => setBranchToEdit(branch)}
                              >
                                Sửa
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setBranchToDelete(branch)}
                                className="text-red-600 hover:text-red-700"
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
          </div>
        </DialogContent>
      </Dialog>

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
