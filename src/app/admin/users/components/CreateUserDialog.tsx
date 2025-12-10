import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useCreateUserMutation, useCheckEmailExistsQuery, type CreateUserRequest } from '@/store/services/userApi'
import { useGetBranchesQuery } from '@/store/services/classCreationApi'
import { ROLES } from '@/hooks/useRoleBasedAccess'

// Role mapping from seed data
const ROLE_OPTIONS = [
  { id: 1, code: ROLES.ADMIN, label: 'Quản trị viên' },
  { id: 2, code: ROLES.MANAGER, label: 'Quản lý' },
  { id: 3, code: ROLES.CENTER_HEAD, label: 'Trưởng trung tâm' },
  { id: 4, code: ROLES.SUBJECT_LEADER, label: 'Trưởng bộ môn' },
  { id: 5, code: ROLES.ACADEMIC_AFFAIR, label: 'Giáo vụ' },
  { id: 6, code: ROLES.TEACHER, label: 'Giáo viên' },
  { id: 7, code: ROLES.STUDENT, label: 'Học viên' },
  { id: 8, code: ROLES.QA, label: 'Kiểm định chất lượng' },
]

const GENDER_VALUES = ['MALE', 'FEMALE', 'OTHER'] as const
const STATUS_VALUES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const

const createUserSchema = z.object({
  email: z.string().email('Email không hợp lệ').min(1, 'Email là bắt buộc'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  fullName: z.string().min(1, 'Họ tên là bắt buộc'),
  phone: z.string().optional(),
  facebookUrl: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  avatarUrl: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  dob: z.string().optional(),
  gender: z.enum(GENDER_VALUES),
  address: z.string().optional(),
  status: z.enum(STATUS_VALUES),
  roleIds: z.array(z.number()).min(1, 'Chọn ít nhất một vai trò'),
  branchIds: z.array(z.number()).optional(),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const [emailToCheck, setEmailToCheck] = useState<string | null>(null)
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation()
  const { data: branchesResponse } = useGetBranchesQuery(undefined, { skip: !open })

  // Check email exists
  useCheckEmailExistsQuery(emailToCheck || '', { skip: !emailToCheck })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      gender: 'MALE',
      status: 'ACTIVE',
      roleIds: [],
      branchIds: [],
    },
  })

  const selectedRoleIds = watch('roleIds') || []
  const selectedBranchIds = watch('branchIds') || []
  const email = watch('email')

  const branches = branchesResponse?.data || []

  const handleEmailBlur = () => {
    if (email && email.includes('@')) {
      setEmailToCheck(email)
    }
  }

  const toggleRole = (roleId: number) => {
    const current = selectedRoleIds
    if (current.includes(roleId)) {
      setValue('roleIds', current.filter((id) => id !== roleId))
    } else {
      setValue('roleIds', [...current, roleId])
    }
  }

  const toggleBranch = (branchId: number) => {
    const current = selectedBranchIds
    if (current.includes(branchId)) {
      setValue('branchIds', current.filter((id) => id !== branchId))
    } else {
      setValue('branchIds', [...current, branchId])
    }
  }

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      const request: CreateUserRequest = {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone || undefined,
        facebookUrl: data.facebookUrl || undefined,
        avatarUrl: data.avatarUrl || undefined,
        dob: data.dob || undefined,
        gender: data.gender,
        address: data.address || undefined,
        status: data.status,
        roleIds: data.roleIds,
        branchIds: data.branchIds && data.branchIds.length > 0 ? data.branchIds : undefined,
      }

      await createUser(request).unwrap()
      toast.success('Tạo người dùng thành công')
      reset()
      onOpenChange(false)
    } catch (error: unknown) {
      toast.error((error as { data?: { message?: string } })?.data?.message || 'Tạo người dùng thất bại. Vui lòng thử lại.')
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo người dùng mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register('email')}
              onBlur={handleEmailBlur}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Mật khẩu <span className="text-destructive">*</span>
            </Label>
            <Input id="password" type="password" placeholder="Tối thiểu 8 ký tự" {...register('password')} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Họ tên <span className="text-destructive">*</span>
            </Label>
            <Input id="fullName" placeholder="Nguyễn Văn A" {...register('fullName')} />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
          </div>

          {/* Phone & Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" placeholder="0912345678" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">
                Giới tính <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch('gender')}
                onValueChange={(value) => setValue('gender', value as 'MALE' | 'FEMALE' | 'OTHER')}
              >
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Nam</SelectItem>
                  <SelectItem value="FEMALE">Nữ</SelectItem>
                  <SelectItem value="OTHER">Khác</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
            </div>
          </div>

          {/* DOB & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dob">Ngày sinh</Label>
              <Input id="dob" type="date" {...register('dob')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">
                Trạng thái <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED')}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                  <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
                  <SelectItem value="SUSPENDED">Tạm khóa</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
            </div>
          </div>

          {/* Facebook URL */}
          <div className="space-y-2">
            <Label htmlFor="facebookUrl">Facebook URL</Label>
            <Input id="facebookUrl" placeholder="https://facebook.com/..." {...register('facebookUrl')} />
            {errors.facebookUrl && <p className="text-sm text-destructive">{errors.facebookUrl.message}</p>}
          </div>

          {/* Avatar URL */}
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input id="avatarUrl" placeholder="https://example.com/avatar.jpg" {...register('avatarUrl')} />
            {errors.avatarUrl && <p className="text-sm text-destructive">{errors.avatarUrl.message}</p>}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input id="address" placeholder="Địa chỉ thường trú" {...register('address')} />
          </div>

          {/* Roles */}
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
            {errors.roleIds && <p className="text-sm text-destructive">{errors.roleIds.message}</p>}
          </div>

          {/* Branches */}
          {branches.length > 0 && (
            <div className="space-y-2">
              <Label>Chi nhánh (tùy chọn)</Label>
              <div className="grid grid-cols-2 gap-2 rounded-md border p-3 max-h-32 overflow-y-auto">
                {branches.map((branch) => (
                  <div key={branch.id} className="flex items-center space-x-2">
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isCreating}>
              Hủy
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Đang tạo...' : 'Tạo người dùng'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

