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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  useUpdateCenterMutation,
  type CenterResponse,
  type CenterRequest,
} from "@/store/services/centerApi";

const editCenterSchema = z.object({
  code: z.string().min(1, "Mã trung tâm là bắt buộc"),
  name: z.string().min(1, "Tên trung tâm là bắt buộc"),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  address: z.string().optional(),
});

type EditCenterFormData = z.infer<typeof editCenterSchema>;

interface EditCenterDialogProps {
  open: boolean;
  center: CenterResponse;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditCenterDialog({
  open,
  center,
  onOpenChange,
  onSuccess,
}: EditCenterDialogProps) {
  const [updateCenter, { isLoading: isUpdating }] = useUpdateCenterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditCenterFormData>({
    resolver: zodResolver(editCenterSchema),
    defaultValues: {
      code: center.code,
      name: center.name,
      description: center.description || "",
      phone: center.phone || "",
      email: center.email || "",
      address: center.address || "",
    },
  });

  useEffect(() => {
    if (center) {
      reset({
        code: center.code,
        name: center.name,
        description: center.description || "",
        phone: center.phone || "",
        email: center.email || "",
        address: center.address || "",
      });
    }
  }, [center, reset]);

  const onSubmit = async (data: EditCenterFormData) => {
    try {
      const request: CenterRequest = {
        code: data.code,
        name: data.name,
        description: data.description || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
      };

      const result = await updateCenter({ id: center.id, data: request }).unwrap();
      if (!result.success) {
        throw new Error(result.message || "Cập nhật trung tâm thất bại");
      }
      toast.success("Cập nhật trung tâm thành công");
      onSuccess();
    } catch (error: unknown) {
      toast.error((error as { data?: { message?: string } })?.data?.message || "Cập nhật trung tâm thất bại");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Trung tâm</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Mã trung tâm <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                {...register("code")}
                className={errors.code ? "border-red-500" : ""}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">
                Tên trung tâm <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              {...register("description")}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input id="address" {...register("address")} />
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

