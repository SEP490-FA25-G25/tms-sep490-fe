"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CenterResponse } from "@/store/services/centerApi";
import type {
  BranchRequest,
  ManagerBranchOverview,
} from "@/store/services/branchApi";
import type { UserResponse } from "@/store/services/userApi";

interface BranchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ManagerBranchOverview;
  centers: CenterResponse[];
  centerHeadOptions: UserResponse[];
  loadingCenters: boolean;
  loadingCenterHeads: boolean;
  onSubmit: (values: BranchRequest) => Promise<void>;
  isSubmitting: boolean;
}

type FormValues = {
  centerId: string;
  code: string;
  name: string;
  address?: string;
  district?: string;
  city?: string;
  phone?: string;
  email?: string;
  status?: string;
  centerHeadUserId?: string;
};

export function BranchFormDialog({
  open,
  onOpenChange,
  initialData,
  centers,
  centerHeadOptions,
  loadingCenters,
  loadingCenterHeads,
  onSubmit,
  isSubmitting,
}: BranchFormDialogProps) {
  const { register, handleSubmit, reset, setValue, watch } =
    useForm<FormValues>({
      defaultValues: {
        centerId: initialData?.centerId?.toString() ?? "",
        code: initialData?.code ?? "",
        name: initialData?.name ?? "",
        address: initialData?.address ?? "",
        district: initialData?.district ?? "",
        city: initialData?.city ?? "",
        phone: initialData?.phone ?? "",
        email: initialData?.email ?? "",
        status: initialData?.status ?? "ACTIVE",
        centerHeadUserId: initialData?.centerHead?.userId?.toString() ?? "",
      },
    });

  useEffect(() => {
    if (initialData) {
      reset({
        centerId: initialData.centerId?.toString() ?? "",
        code: initialData.code ?? "",
        name: initialData.name ?? "",
        address: initialData.address ?? "",
        district: initialData.district ?? "",
        city: initialData.city ?? "",
        phone: initialData.phone ?? "",
        email: initialData.email ?? "",
        status: initialData.status ?? "ACTIVE",
        centerHeadUserId: initialData.centerHead?.userId?.toString() ?? "",
      });
    } else {
      reset({
        centerId: "",
        code: "",
        name: "",
        address: "",
        district: "",
        city: "",
        phone: "",
        email: "",
        status: "ACTIVE",
        centerHeadUserId: "",
      });
    }
  }, [initialData, reset]);

  const onInternalSubmit = async (data: FormValues) => {
    const payload: BranchRequest = {
      centerId: Number(data.centerId),
      code: data.code.trim(),
      name: data.name.trim(),
      address: data.address?.trim() || undefined,
      district: data.district?.trim() || undefined,
      city: data.city?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      email: data.email?.trim() || undefined,
      status: data.status || "ACTIVE",
      openingDate: undefined,
      centerHeadUserId: data.centerHeadUserId
        ? Number(data.centerHeadUserId)
        : undefined,
    };
    await onSubmit(payload);
  };

  const selectedCenterId = watch("centerId");

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Chỉnh sửa chi nhánh" : "Tạo chi nhánh mới"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onInternalSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>
                Thuộc trung tâm <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedCenterId || undefined}
                onValueChange={(value) => setValue("centerId", value)}
                disabled={loadingCenters || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trung tâm" />
                </SelectTrigger>
                <SelectContent>
                  {centers
                    .filter((center) => center && center.id != null)
                    .map((center) => (
                      <SelectItem key={center.id} value={center.id.toString()}>
                        {center.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">
                Mã chi nhánh <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="VD: HN01"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="name">
              Tên chi nhánh <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="VD: Chi nhánh Hà Nội 01"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="city">Tỉnh / Thành phố</Label>
              <Input
                id="city"
                {...register("city")}
                placeholder="VD: Hà Nội"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="district">Quận / Huyện</Label>
              <Input
                id="district"
                {...register("district")}
                placeholder="VD: Cầu Giấy"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="address">Địa chỉ chi tiết</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="VD: Số 123, Đường ABC..."
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="phone">Điện thoại</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="VD: 0243xxxxxxx"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="VD: branch@example.com"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Trạng thái</Label>
              <Select
                value={watch("status") ?? "ACTIVE"}
                onValueChange={(value) => setValue("status", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                  <SelectItem value="INACTIVE">Tạm ngưng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Center Head phụ trách</Label>
              <Select
                value={watch("centerHeadUserId") || "none"}
                onValueChange={(value) =>
                  setValue("centerHeadUserId", value === "none" ? "" : value)
                }
                disabled={loadingCenterHeads || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn Center Head (tuỳ chọn)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Chưa gán</SelectItem>
                  {centerHeadOptions
                    .filter((user) => user && user.id != null)
                    .map((user: UserResponse & { branches?: string[] }) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.fullName}{" "}
                        {Array.isArray(user.branches) &&
                        user.branches.length > 0
                          ? `• ${user.branches.join(", ")}`
                          : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !watch("centerId") ||
                !watch("code") ||
                !watch("name")
              }
            >
              {isSubmitting
                ? initialData
                  ? "Đang lưu..."
                  : "Đang tạo..."
                : initialData
                ? "Lưu thay đổi"
                : "Tạo chi nhánh"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
