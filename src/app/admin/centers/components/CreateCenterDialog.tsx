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
  useCreateCenterMutation,
  type CenterRequest,
} from "@/store/services/centerApi";

const createCenterSchema = z.object({
  code: z.string().min(1, "Mã trung tâm là bắt buộc"),
  name: z.string().min(1, "Tên trung tâm là bắt buộc"),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  address: z.string().optional(),
});

type CreateCenterFormData = z.infer<typeof createCenterSchema>;

interface CreateCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCenterDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCenterDialogProps) {
  const [createCenter, { isLoading: isCreating }] = useCreateCenterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCenterFormData>({
    resolver: zodResolver(createCenterSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const onSubmit = async (data: CreateCenterFormData) => {
    try {
      const request: CenterRequest = {
        code: data.code,
        name: data.name,
        description: data.description || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
      };

      const result = await createCenter(request).unwrap();
      if (!result.success) {
        throw new Error(result.message || "Tạo trung tâm thất bại");
      }
      toast.success("Tạo trung tâm thành công");
      reset();
      onSuccess();
    } catch (error: unknown) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ||
          "Tạo trung tâm thất bại"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo Trung tâm Mới</DialogTitle>
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
                placeholder="VD: CT01"
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
                placeholder="VD: Trung tâm Hà Nội"
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
              placeholder="Mô tả về trung tâm..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Điện thoại</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="VD: 0243xxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="VD: center@example.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="VD: Số 123, Đường ABC, Quận XYZ, Hà Nội"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Đang tạo..." : "Tạo trung tâm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
