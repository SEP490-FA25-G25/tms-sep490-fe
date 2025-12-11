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
import type {
  BranchRequest,
  ManagerBranchOverview,
} from "@/store/services/branchApi";

interface BranchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ManagerBranchOverview;
  onSubmit: (values: BranchRequest) => Promise<void>;
  isSubmitting: boolean;
}

type FormValues = {
  code: string;
  name: string;
  address?: string;
  district?: string;
  city?: string;
  phone?: string;
  email?: string;
  status?: string;
};

export function BranchFormDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isSubmitting,
}: BranchFormDialogProps) {
  const { register, handleSubmit, reset, setValue, watch } =
    useForm<FormValues>({
      defaultValues: {
        code: initialData?.code ?? "",
        name: initialData?.name ?? "",
        address: initialData?.address ?? "",
        district: initialData?.district ?? "",
        city: initialData?.city ?? "",
        phone: initialData?.phone ?? "",
        email: initialData?.email ?? "",
        status: initialData?.status ?? "ACTIVE",
      },
    });

  useEffect(() => {
    if (initialData) {
      reset({
        code: initialData.code ?? "",
        name: initialData.name ?? "",
        address: initialData.address ?? "",
        district: initialData.district ?? "",
        city: initialData.city ?? "",
        phone: initialData.phone ?? "",
        email: initialData.email ?? "",
        status: initialData.status ?? "ACTIVE",
      });
    } else {
      reset({
        code: "",
        name: "",
        address: "",
        district: "",
        city: "",
        phone: "",
        email: "",
        status: "ACTIVE",
      });
    }
  }, [initialData, reset]);

  const onInternalSubmit = async (data: FormValues) => {
    const payload: BranchRequest = {
      centerId: 0, // Will be ignored by backend, uses default center
      code: data.code.trim(),
      name: data.name.trim(),
      address: data.address?.trim() || undefined,
      district: data.district?.trim() || undefined,
      city: data.city?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      email: data.email?.trim() || undefined,
      status: data.status || "ACTIVE",
      openingDate: undefined,
    };
    await onSubmit(payload);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Chỉnh sửa chi nhánh" : "Tạo chi nhánh mới"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onInternalSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Mã chi nhánh <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="VD: HN01"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">
                Tên chi nhánh <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="VD: Chi nhánh Hà Nội 01"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Tỉnh / Thành phố</Label>
              <Input
                id="city"
                {...register("city")}
                placeholder="VD: Hà Nội"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">Quận / Huyện</Label>
              <Input
                id="district"
                {...register("district")}
                placeholder="VD: Cầu Giấy"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ chi tiết</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="VD: Số 123, Đường ABC..."
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Điện thoại</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="VD: 0243xxxxxxx"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
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

          <div className="space-y-2">
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
                <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
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
              disabled={isSubmitting || !watch("code") || !watch("name")}
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
