import { useState } from 'react'
import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalDescription,
  FullScreenModalBody,
} from '@/components/ui/full-screen-modal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useCreateStudentMutation, type CreateStudentResponse, type SkillAssessmentUpdateInput } from '@/store/services/studentApi'
import { StudentForm, type StudentFormData } from './StudentForm'

// ========== Types ==========
export interface CreateStudentDialogProps {
  branchId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (studentData: CreateStudentResponse) => void
}

// ========== Success Dialog Component ==========
interface StudentCreatedSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentData: CreateStudentResponse | null
  onEnroll?: () => void
}

export function StudentCreatedSuccessDialog({
  open,
  onOpenChange,
  studentData,
  onEnroll,
}: StudentCreatedSuccessDialogProps) {
  if (!studentData) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              ✓
            </span>
            Tạo học viên thành công!
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 border rounded-lg p-3">
                <div>
                  <span className="text-muted-foreground text-xs">Mã học viên</span>
                  <div className="font-mono font-medium">{studentData.studentCode}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Email</span>
                  <div className="font-medium truncate">{studentData.email}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Họ tên</span>
                  <div className="font-medium">{studentData.fullName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Mật khẩu</span>
                  <div className="font-mono">{studentData.defaultPassword}</div>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                Học viên có thể đăng nhập bằng email và mật khẩu mặc định.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Đóng</AlertDialogCancel>
          {onEnroll && (
            <AlertDialogAction onClick={onEnroll}>
              Ghi danh ngay
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ========== Main Component ==========
export function CreateStudentDialog({
  branchId,
  open,
  onOpenChange,
  onSuccess,
}: CreateStudentDialogProps) {
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdStudent, setCreatedStudent] = useState<CreateStudentResponse | null>(null)

  const [createStudent, { isLoading: isSubmitting }] = useCreateStudentMutation()

  const handleSubmit = async (data: {
    formData: StudentFormData
    skillAssessments: SkillAssessmentUpdateInput[]
  }) => {
    try {
      const result = await createStudent({
        fullName: data.formData.fullName,
        email: data.formData.email,
        phone: data.formData.phone || undefined,
        facebookUrl: data.formData.facebookUrl || undefined,
        address: data.formData.address || undefined,
        avatarUrl: data.formData.avatarUrl || undefined,
        gender: data.formData.gender as 'MALE' | 'FEMALE' | 'OTHER',
        dob: data.formData.dob || undefined,
        branchId,
        skillAssessments: data.skillAssessments.length > 0 ? data.skillAssessments : undefined,
      }).unwrap()

      const studentData = result.data
      setCreatedStudent(studentData)

      // Close the main dialog
      onOpenChange(false)

      // Show success dialog
      setShowSuccessDialog(true)

      // Call onSuccess callback
      onSuccess?.(studentData)
    } catch (error) {
      const err = error as { data?: { message?: string }; status?: number }

      if (err.data?.message) {
        const message = err.data.message
        if (message.includes('EMAIL_ALREADY_EXISTS')) {
          toast.error('Email đã tồn tại trong hệ thống')
        } else if (message.includes('BRANCH_NOT_FOUND')) {
          toast.error('Chi nhánh không tồn tại')
        } else if (message.includes('BRANCH_ACCESS_DENIED')) {
          toast.error('Bạn không có quyền tạo học viên cho chi nhánh này')
        } else if (message.includes('LEVEL_NOT_FOUND')) {
          toast.error('Mã trình độ không tồn tại trong hệ thống')
        } else {
          toast.error(message)
        }
      } else {
        toast.error('Không thể tạo học viên. Vui lòng thử lại.')
      }
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false)
    setCreatedStudent(null)
  }

  return (
    <>
      <FullScreenModal open={open} onOpenChange={onOpenChange}>
        <FullScreenModalContent size="xl">
          <FullScreenModalHeader>
            <FullScreenModalTitle>Tạo học viên mới</FullScreenModalTitle>
            <FullScreenModalDescription>
              Thêm học viên mới vào hệ thống. Học viên sẽ có thể đăng nhập và được ghi danh vào lớp học sau khi tạo.
            </FullScreenModalDescription>
          </FullScreenModalHeader>

          <FullScreenModalBody>
            <StudentForm
              mode="create"
              branchId={branchId}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={handleCancel}
              submitLabel="Tạo học viên"
            />
          </FullScreenModalBody>
        </FullScreenModalContent>
      </FullScreenModal>

      {/* Success Dialog */}
      <StudentCreatedSuccessDialog
        open={showSuccessDialog}
        onOpenChange={handleSuccessDialogClose}
        studentData={createdStudent}
      />
    </>
  )
}
