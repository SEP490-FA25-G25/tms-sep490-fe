import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { toast } from "sonner";
import {
  useUpdateBranchMutation,
  type BranchResponse,
  type BranchRequest,
} from "@/store/services/branchApi";

const editBranchSchema = z.object({
  code: z.string().min(1, "Mã chi nhánh là bắt buộc"),
  name: z.string().min(1, "Tên chi nhánh là bắt buộc"),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  status: z.string().optional(),
  openingDate: z.string().optional(),
});

type EditBranchFormData = z.infer<typeof editBranchSchema>;

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "INACTIVE", label: "Không hoạt động" },
  { value: "CLOSED", label: "Đã đóng" },
  { value: "PLANNED", label: "Dự kiến" },
];

interface EditBranchDialogProps {
  open: boolean;
  branch: BranchResponse;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditBranchDialog({
  open,
  branch,
  onOpenChange,
  onSuccess,
}: EditBranchDialogProps) {
  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<EditBranchFormData>({
    resolver: zodResolver(editBranchSchema),
    defaultValues: {
      code: branch.code,
      name: branch.name,
      address: branch.address || "",
      city: branch.city || "",
      district: branch.district || "",
      phone: branch.phone || "",
      email: branch.email || "",
      status: branch.status || "ACTIVE",
      openingDate: branch.openingDate ? branch.openingDate.split("T")[0] : "",
    },
  });

  useEffect(() => {
    if (branch) {
      reset({
        code: branch.code,
        name: branch.name,
        address: branch.address || "",
        city: branch.city || "",
        district: branch.district || "",
        phone: branch.phone || "",
        email: branch.email || "",
        status: branch.status || "ACTIVE",
        openingDate: branch.openingDate ? branch.openingDate.split("T")[0] : "",
      });
    }
  }, [branch, reset]);

  const onSubmit = async (data: EditBranchFormData) => {
    try {
      const request: BranchRequest = {
        centerId: branch.centerId,
        code: data.code,
        name: data.name,
        address: data.address || undefined,
        city: data.city || undefined,
        district: data.district || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        status: data.status || "ACTIVE",
        openingDate: data.openingDate || undefined,
      };

      const result = await updateBranch({ id: branch.id, data: request }).unwrap();
      if (!result.success) {
        throw new Error(result.message || "Cập nhật chi nhánh thất bại");
      }
      toast.success("Cập nhật chi nhánh thành công");
      onSuccess();
    } catch (error: unknown) {
      toast.error((error as { data?: { message?: string } })?.data?.message || "Cập nhật chi nhánh thất bại");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Chi nhánh</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Mã chi nhánh <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="code"
                {...register("code")}
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
                className={errors.name ? "border-rose-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-rose-500">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="district">Quận/Huyện</Label>
              <Input id="district" {...register("district")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Thành phố</Label>
              <Input id="city" {...register("city")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input id="address" {...register("address")} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Điện thoại</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                className={errors.email ? "border-rose-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-rose-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="openingDate">Ngày khai trương</Label>
              <Input
                id="openingDate"
                type="date"
                {...register("openingDate")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

