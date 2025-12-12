import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalBody,
  FullScreenModalFooter,
} from "@/components/ui/full-screen-modal";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  useCreateUserMutation,
  useCheckEmailExistsQuery,
  useCheckPhoneExistsQuery,
  type CreateUserRequest,
} from "@/store/services/userApi";
import { useGetBranchesQuery } from "@/store/services/classCreationApi";
import { ROLES } from "@/hooks/useRoleBasedAccess";

// Role mapping from seed data
const ROLE_OPTIONS = [
  { id: 1, code: ROLES.ADMIN, label: "Quản trị viên" },
  { id: 2, code: ROLES.MANAGER, label: "Quản lý" },
  { id: 3, code: ROLES.CENTER_HEAD, label: "Trưởng trung tâm" },
  { id: 4, code: ROLES.SUBJECT_LEADER, label: "Trưởng bộ môn" },
  { id: 5, code: ROLES.ACADEMIC_AFFAIR, label: "Giáo vụ" },
  { id: 6, code: ROLES.TEACHER, label: "Giáo viên" },
  { id: 7, code: ROLES.STUDENT, label: "Học viên" },
  { id: 8, code: ROLES.QA, label: "Kiểm định chất lượng" },
];

const GENDER_VALUES = ["MALE", "FEMALE", "OTHER"] as const;
const STATUS_VALUES = ["ACTIVE", "INACTIVE"] as const;

const createUserSchema = z.object({
  email: z.string().email("Email không hợp lệ").min(1, "Email là bắt buộc"),
  fullName: z
    .string()
    .min(1, "Họ tên là bắt buộc")
    .refine(
      (val) => val.trim().length > 0,
      "Họ tên không được chỉ chứa khoảng trắng"
    ),
  phone: z
    .string()
    .regex(/^(0[3|5|7|8|9])[0-9]{8}$/, "Số điện thoại phải có 10-11 chữ số")
    .optional()
    .or(z.literal("")),
  facebookUrl: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  avatarUrl: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  dob: z
    .string()
    .optional()
    .refine(
      (val) => !val || new Date(val) < new Date(),
      "Ngày sinh phải là ngày trong quá khứ"
    ),
  gender: z.enum(GENDER_VALUES),
  address: z.string().optional(),
  status: z.enum(STATUS_VALUES),
  roleIds: z.array(z.number()).min(1, "Chọn ít nhất một vai trò"),
  branchIds: z.array(z.number()).optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
}: CreateUserDialogProps) {
  const [emailToCheck, setEmailToCheck] = useState<string | null>(null);
  const [phoneToCheck, setPhoneToCheck] = useState<string | null>(null);
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const { data: branchesResponse } = useGetBranchesQuery(undefined, {
    skip: !open,
  });

  // Check email có tồn tại chưa
  const { data: emailExistsData } = useCheckEmailExistsQuery(
    emailToCheck || "",
    { skip: !emailToCheck }
  );
  const emailExists = emailExistsData?.data === true;

  // Check phone có tồn tại chưa
  const { data: phoneExistsData } = useCheckPhoneExistsQuery(
    phoneToCheck || "",
    { skip: !phoneToCheck }
  );
  const phoneExists = phoneExistsData?.data === true;

  console.log("Phone check:", { phoneToCheck, phoneExistsData, phoneExists });
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    mode: "onChange",
    defaultValues: {
      gender: "MALE",
      status: "ACTIVE",
      roleIds: [],
      branchIds: [],
    },
  });

  const selectedRoleIds = watch("roleIds") || [];
  const selectedBranchIds = watch("branchIds") || [];
  const email = watch("email");
  const phone = watch("phone");

  const branches = branchesResponse?.data || [];

  // Debounce email check - tự động check khi email thay đổi
  useEffect(() => {
    if (!email || !email.includes("@") || errors.email) {
      setEmailToCheck(null);
      return;
    }

    const timer = setTimeout(() => {
      setEmailToCheck(email);
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [email, errors.email]);

  // Debounce phone check - tự động check khi phone thay đổi
  useEffect(() => {
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    if (!phone || !phoneRegex.test(phone) || errors.phone) {
      setPhoneToCheck(null);
      return;
    }

    const timer = setTimeout(() => {
      setPhoneToCheck(phone);
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [phone, errors.phone]);

  const handleEmailBlur = () => {
    if (email && email.includes("@") && !errors.email) {
      setEmailToCheck(email);
    }
  };

  const toggleRole = (roleId: number) => {
    const current = selectedRoleIds;
    if (current.includes(roleId)) {
      setValue(
        "roleIds",
        current.filter((id) => id !== roleId)
      );
    } else {
      setValue("roleIds", [...current, roleId]);
    }
  };

  const toggleBranch = (branchId: number) => {
    const current = selectedBranchIds;
    if (current.includes(branchId)) {
      setValue(
        "branchIds",
        current.filter((id) => id !== branchId)
      );
    } else {
      setValue("branchIds", [...current, branchId]);
    }
  };

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      const defaultPassword = "12345678";
      const request: CreateUserRequest = {
        email: data.email,
        password: defaultPassword,
        fullName: data.fullName,
        phone: data.phone || undefined,
        facebookUrl: data.facebookUrl || undefined,
        avatarUrl: data.avatarUrl || undefined,
        dob: data.dob || undefined,
        gender: data.gender,
        address: data.address || undefined,
        status: data.status,
        roleIds: data.roleIds,
        branchIds:
          data.branchIds && data.branchIds.length > 0
            ? data.branchIds
            : undefined,
      };

      await createUser(request).unwrap();
      toast.success("Tạo người dùng thành công");
      reset();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ||
          "Tạo người dùng thất bại. Vui lòng thử lại."
      );
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <FullScreenModal open={open} onOpenChange={handleClose}>
      <FullScreenModalContent size="xl">
        <FullScreenModalHeader>
          <FullScreenModalTitle>Tạo người dùng mới</FullScreenModalTitle>
        </FullScreenModalHeader>

        <FullScreenModalBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Top layout: avatar left, fields right (match student form) */}
            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
              {/* Avatar + upload */}
              <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/40 p-4">
                <Avatar className="h-20 w-20 border">
                  <AvatarFallback>
                    {watch("fullName")?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  Tải ảnh
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  JPG, PNG. Max 5MB
                </p>
                <div className="w-full space-y-2">
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    placeholder="https://example.com/avatar.jpg"
                    {...register("avatarUrl")}
                  />
                  {errors.avatarUrl && (
                    <p className="text-sm text-destructive">
                      {errors.avatarUrl.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                {/* Họ tên */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Họ và tên <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    {...register("fullName")}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    {...register("email")}
                    onBlur={handleEmailBlur}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                  {!errors.email && emailExists && (
                    <p className="text-sm text-destructive">Email đã tồn tại</p>
                  )}
                </div>

                {/* Giới tính + Số điện thoại */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">
                      Giới tính <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={watch("gender")}
                      onValueChange={(value) =>
                        setValue("gender", value as "MALE" | "FEMALE" | "OTHER")
                      }
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Nam</SelectItem>
                        <SelectItem value="FEMALE">Nữ</SelectItem>
                        <SelectItem value="OTHER">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-sm text-destructive">
                        {errors.gender.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      placeholder="0912345678"
                      {...register("phone")}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">
                        {errors.phone.message}
                      </p>
                    )}
                    {!errors.phone && phoneExists && (
                      <p className="text-sm text-destructive">
                        Số điện thoại đã tồn tại
                      </p>
                    )}
                  </div>
                </div>

                {/* Ngày sinh + Địa chỉ */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Ngày sinh</Label>
                    <Input id="dob" type="date" {...register("dob")} />
                    {errors.dob && (
                      <p className="text-sm text-destructive">
                        {errors.dob.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Địa chỉ</Label>
                    <Input
                      id="address"
                      placeholder="Địa chỉ thường trú"
                      {...register("address")}
                    />
                  </div>
                </div>

                {/* Facebook URL */}
                <div className="space-y-2">
                  <Label htmlFor="facebookUrl">Facebook URL</Label>
                  <Input
                    id="facebookUrl"
                    placeholder="https://facebook.com/username"
                    {...register("facebookUrl")}
                  />
                  {errors.facebookUrl && (
                    <p className="text-sm text-destructive">
                      {errors.facebookUrl.message}
                    </p>
                  )}
                </div>

                {/* Trạng thái & note */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">
                      Trạng thái <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={watch("status")}
                      onValueChange={(value) =>
                        setValue("status", value as "ACTIVE" | "INACTIVE")
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                        <SelectItem value="INACTIVE">
                          Không hoạt động
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-sm text-destructive">
                        {errors.status.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1 rounded-lg border bg-muted/40 p-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      Mã người dùng và mật khẩu mặc định
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mã người dùng tự động tạo sau khi lưu. Mật khẩu mặc định:
                      12345678.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Roles & Branches */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Vai trò <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                  {ROLE_OPTIONS.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoleIds.includes(role.id)}
                        onCheckedChange={() => toggleRole(role.id)}
                      />
                      <Label
                        htmlFor={`role-${role.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {role.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.roleIds && (
                  <p className="text-sm text-destructive">
                    {errors.roleIds.message}
                  </p>
                )}
              </div>

              {branches.length > 0 && (
                <div className="space-y-2">
                  <Label>Chi nhánh (tùy chọn)</Label>
                  <div className="grid grid-cols-2 gap-2 rounded-md border p-3 max-h-32 overflow-y-auto">
                    {branches.map((branch) => (
                      <div
                        key={branch.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`branch-${branch.id}`}
                          checked={selectedBranchIds.includes(branch.id)}
                          onCheckedChange={() => toggleBranch(branch.id)}
                        />
                        <Label
                          htmlFor={`branch-${branch.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {branch.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <FullScreenModalFooter className="px-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isCreating}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Đang tạo..." : "Tạo người dùng"}
              </Button>
            </FullScreenModalFooter>
          </form>
        </FullScreenModalBody>
      </FullScreenModalContent>
    </FullScreenModal>
  );
}
