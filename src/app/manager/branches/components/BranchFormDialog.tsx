"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type {
  BranchRequest,
  ManagerBranchOverview,
} from "@/store/services/branchApi";
import { useCheckBranchEmailExistsQuery } from "@/store/services/branchApi";

// Schema validation cho form
const branchSchema = z.object({
  code: z
    .string()
    .min(1, "Mã chi nhánh là bắt buộc")
    .refine(
      (val) => val.trim().length > 0,
      "Mã chi nhánh không được chỉ chứa khoảng trắng"
    )
    .refine(
      (val) => /^[A-Za-z0-9_-]+$/.test(val.trim()),
      "Mã chi nhánh chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới"
    ),
  name: z
    .string()
    .min(1, "Tên chi nhánh là bắt buộc")
    .refine(
      (val) => val.trim().length > 0,
      "Tên chi nhánh không được chỉ chứa khoảng trắng"
    ),
  address: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === "" || /^(0[2-9])[0-9]{8,9}$/.test(val),
      "Số điện thoại phải bắt đầu bằng 0 và có 10-11 chữ số"
    ),
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === "" || z.string().email().safeParse(val).success,
      "Email không hợp lệ"
    ),
  status: z.string(),
  openingDate: z
    .date()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // Optional, nếu không có thì OK
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return val >= today;
      },
      "Ngày khai trương phải là ngày hôm nay hoặc trong tương lai"
    ),
});

type FormValues = z.infer<typeof branchSchema>;

interface BranchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ManagerBranchOverview;
  onSubmit: (values: BranchRequest) => Promise<void>;
  isSubmitting: boolean;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function BranchFormDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isSubmitting,
}: BranchFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(branchSchema),
    mode: "onChange",
    defaultValues: {
      code: initialData?.code ?? "",
      name: initialData?.name ?? "",
      address: initialData?.address ?? "",
      district: initialData?.district ?? "",
      city: initialData?.city ?? "",
      phone: initialData?.phone ?? "",
      email: initialData?.email ?? "",
      status: initialData?.status ?? "ACTIVE",
      openingDate: initialData?.openingDate ? new Date(initialData.openingDate) : undefined,
    },
  });

  const emailValue = watch("email");
  const debouncedEmail = useDebounce(emailValue || "", 500);

  // Check email exists query
  const shouldCheckEmail = useMemo(() => {
    return debouncedEmail.trim().length > 0 && z.string().email().safeParse(debouncedEmail).success;
  }, [debouncedEmail]);

  const { data: emailCheckResult, isFetching: isCheckingEmail } = useCheckBranchEmailExistsQuery(
    { email: debouncedEmail, excludeId: initialData?.id },
    { skip: !shouldCheckEmail }
  );

  const emailExists = emailCheckResult?.data === true;

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
        openingDate: initialData.openingDate ? new Date(initialData.openingDate) : undefined,
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
        openingDate: undefined,
      });
    }
  }, [initialData, reset]);

  const onInternalSubmit = async (data: FormValues) => {
    if (emailExists) {
      return; // Không submit nếu email đã tồn tại
    }
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
      openingDate: data.openingDate ? format(data.openingDate, "yyyy-MM-dd") : undefined,
    };
    await onSubmit(payload);
  };

  const hasErrors = Object.keys(errors).length > 0 || emailExists;

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
                className={errors.code ? "border-rose-500" : ""}
              />
              {errors.code && (
                <p className="text-sm text-rose-500">{errors.code.message}</p>
              )}
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
                className={errors.name ? "border-rose-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-rose-500">{errors.name.message}</p>
              )}
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
                className={errors.phone ? "border-rose-500" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-rose-500">{errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email chi nhánh</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="VD: branch@example.com"
                  disabled={isSubmitting}
                  className={errors.email || emailExists ? "border-rose-500" : ""}
                />
                {isCheckingEmail && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    Đang kiểm tra...
                  </span>
                )}
              </div>
              {errors.email && (
                <p className="text-sm text-rose-500">{errors.email.message}</p>
              )}
              {emailExists && !errors.email && (
                <p className="text-sm text-rose-500">Email này đã được sử dụng</p>
              )}
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
                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ngày khai trương</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !watch("openingDate") && "text-muted-foreground"
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch("openingDate")
                    ? format(watch("openingDate")!, "dd/MM/yyyy", { locale: vi })
                    : "Chọn ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watch("openingDate")}
                  onSelect={(date) => setValue("openingDate", date, { shouldValidate: true })}
                  initialFocus
                  locale={vi}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
              </PopoverContent>
            </Popover>
            {errors.openingDate && (
              <p className="text-sm text-rose-500">{errors.openingDate.message}</p>
            )}
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
              disabled={isSubmitting || hasErrors || !watch("code") || !watch("name") || isCheckingEmail}
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
