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
  useCreateBranchMutation,
  type BranchRequest,
} from "@/store/services/branchApi";

const createBranchSchema = z.object({
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

type CreateBranchFormData = z.infer<typeof createBranchSchema>;

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "INACTIVE", label: "Không hoạt động" },
  { value: "CLOSED", label: "Đã đóng" },
  { value: "PLANNED", label: "Dự kiến" },
];

interface CreateBranchDialogProps {
  open: boolean;
  centerId: number;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateBranchDialog({
  open,
  centerId,
  onOpenChange,
  onSuccess,
}: CreateBranchDialogProps) {
  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateBranchFormData>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: {
      code: "",
      name: "",
      address: "",
      city: "",
      district: "",
      phone: "",
      email: "",
      status: "ACTIVE",
      openingDate: "",
    },
  });

  const onSubmit = async (data: CreateBranchFormData) => {
    try {
      const request: BranchRequest = {
        centerId,
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

      const result = await createBranch(request).unwrap();
      if (!result.success) {
        throw new Error(result.message || "Tạo chi nhánh thất bại");
      }
      toast.success("Tạo chi nhánh thành công");
      reset();
      onSuccess();
    } catch (error: unknown) {
      toast.error((error as { data?: { message?: string } })?.data?.message || "Tạo chi nhánh thất bại");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo Chi nhánh Mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Mã chi nhánh <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="VD: CN01"
                className={errors.code ? "border-red-500" : ""}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">
                Tên chi nhánh <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="VD: Chi nhánh Cầu Giấy"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
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
            <Input
              id="address"
              {...register("address")}
              placeholder="Địa chỉ chi tiết"
            />
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
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
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
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Đang tạo..." : "Tạo chi nhánh"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

