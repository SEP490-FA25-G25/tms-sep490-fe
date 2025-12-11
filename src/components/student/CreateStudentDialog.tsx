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
import { 
  useCreateStudentMutation, 
  useLazyCheckStudentExistenceQuery,
  useSyncStudentToBranchMutation,
  useGetStudentDetailQuery,
  type CreateStudentResponse, 
  type SkillAssessmentUpdateInput,
  type CheckStudentExistenceResponse,
} from '@/store/services/studentApi'
import { StudentForm, type StudentFormData } from './StudentForm'
import { ExistingStudentWarning } from './ExistingStudentWarning'
import { StudentDetailDrawer } from '@/app/academic/students/components/StudentDetailDrawer'

export interface CreateStudentDialogProps {
  branchId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (studentData: CreateStudentResponse) => void
}

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

  const isExistingStudent = studentData.isExistingStudent || false

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              ✓
            </span>
            {isExistingStudent ? 'Đồng bộ học viên thành công!' : 'Tạo học viên thành công!'}
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
                {!isExistingStudent && studentData.defaultPassword && (
                  <div>
                    <span className="text-muted-foreground text-xs">Mật khẩu</span>
                    <div className="font-mono">{studentData.defaultPassword}</div>
                  </div>
                )}
              </div>
              {isExistingStudent ? (
                <p className="text-muted-foreground text-xs">
                  Học viên đã được thêm vào chi nhánh này. Họ có thể tiếp tục sử dụng tài khoản hiện có.
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Học viên có thể đăng nhập bằng email và mật khẩu mặc định.
                </p>
              )}
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
  
  // Existing student check states
  const [existingStudentData, setExistingStudentData] = useState<CheckStudentExistenceResponse | null>(null)
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)

  const [createStudent, { isLoading: isSubmitting }] = useCreateStudentMutation()
  const [checkExistence] = useLazyCheckStudentExistenceQuery()
  const [syncToBranch, { isLoading: isSyncing }] = useSyncStudentToBranchMutation()
  
  // Fetch student detail for drawer
  const { data: studentDetail, isLoading: isLoadingDetail } = useGetStudentDetailQuery(
    existingStudentData?.studentId || 0,
    { skip: !existingStudentData?.studentId || !showDetailDrawer }
  )

  const handleEmailBlur = async (email: string) => {
    if (!email || email.length < 5) return

    try {
      const result = await checkExistence({
        type: 'EMAIL',
        value: email,
        currentBranchId: branchId,
      }).unwrap()

      if (result.data.exists) {
        setExistingStudentData(result.data)
      } else {
        setExistingStudentData(null)
      }
    } catch (error) {
      console.error('Check existence error:', error)
    }
  }

  const handlePhoneBlur = async (phone: string) => {
    if (!phone || phone.length < 9) return

    try {
      const result = await checkExistence({
        type: 'PHONE',
        value: phone,
        currentBranchId: branchId,
      }).unwrap()

      if (result.data.exists) {
        setExistingStudentData(result.data)
      } else {
        setExistingStudentData(null)
      }
    } catch (error) {
      console.error('Check existence error:', error)
    }
  }

  const handleViewDetails = () => {
    setShowDetailDrawer(true)
  }

  const handleSync = async () => {
    if (!existingStudentData?.studentId) return

    try {
      await syncToBranch({
        studentId: existingStudentData.studentId,
        request: {
          targetBranchId: branchId,
        },
      }).unwrap()

      toast.success('Đã đồng bộ học viên vào chi nhánh này')
      
      setShowDetailDrawer(false)
      setExistingStudentData(null)
      onOpenChange(false)
      
      // Optionally call onSuccess with synced student data
      // Note: We don't call onSuccess here as sync doesn't return full CreateStudentResponse
      // The parent component should refetch the student list
    } catch (error) {
      const err = error as { data?: { message?: string } }
      toast.error(err.data?.message || 'Không thể đồng bộ học viên')
    }
  }

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

      onOpenChange(false)

      setShowSuccessDialog(true)

      onSuccess?.(studentData)
    } catch (error) {
      const err = error as { data?: { message?: string }; status?: number }

      if (err.data?.message) {
        const message = err.data.message
        if (message.includes('STUDENT_ALREADY_IN_BRANCH')) {
          toast.error('Học viên đã thuộc chi nhánh này')
        } else if (message.includes('BRANCH_NOT_FOUND')) {
          toast.error('Chi nhánh không tồn tại')
        } else if (message.includes('BRANCH_ACCESS_DENIED')) {
          toast.error('Bạn không có quyền tạo học viên cho chi nhánh này')
        } else if (message.includes('LEVEL_NOT_FOUND')) {
          toast.error('Mã trình độ không tồn tại trong hệ thống')
        } else if (message.includes('USER_PHONE_ALREADY_EXISTS')) {
          toast.error('Số điện thoại đã được sử dụng bởi tài khoản khác')
        } else {
          toast.error(message)
        }
      } else {
        toast.error('Không thể tạo học viên. Vui lòng thử lại.')
      }
    }
  }

  const handleCancel = () => {
    setExistingStudentData(null)
    onOpenChange(false)
  }

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false)
    setCreatedStudent(null)
  }

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setExistingStudentData(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <>
      <FullScreenModal open={open} onOpenChange={handleDialogOpenChange}>
        <FullScreenModalContent size="xl">
          <FullScreenModalHeader>
            <FullScreenModalTitle>Tạo học viên mới</FullScreenModalTitle>
            <FullScreenModalDescription>
              Thêm học viên mới vào hệ thống. Học viên sẽ có thể đăng nhập và được ghi danh vào lớp học sau khi tạo.
            </FullScreenModalDescription>
          </FullScreenModalHeader>

          <FullScreenModalBody>
            {existingStudentData && (
              <div className="mb-4">
                <ExistingStudentWarning
                  data={existingStudentData}
                  onViewDetails={handleViewDetails}
                />
              </div>
            )}

            <StudentForm
              mode="create"
              branchId={branchId}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={handleCancel}
              submitLabel="Tạo học viên"
              onEmailBlur={handleEmailBlur}
              onPhoneBlur={handlePhoneBlur}
            />
          </FullScreenModalBody>
        </FullScreenModalContent>
      </FullScreenModal>

      {/* Student Detail Drawer for Sync */}
      <StudentDetailDrawer
        open={showDetailDrawer}
        onOpenChange={setShowDetailDrawer}
        student={studentDetail?.data || null}
        isLoading={isLoadingDetail || isSyncing}
        mode="sync"
        onSync={handleSync}
      />

      {/* Success Dialog */}
      <StudentCreatedSuccessDialog
        open={showSuccessDialog}
        onOpenChange={handleSuccessDialogClose}
        studentData={createdStudent}
      />
    </>
  )
}
