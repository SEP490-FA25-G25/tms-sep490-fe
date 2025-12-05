import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalDescription,
  FullScreenModalBody,
} from '@/components/ui/full-screen-modal'
import { toast } from 'sonner'
import {
  useUpdateStudentMutation,
  useDeleteSkillAssessmentMutation,
  type StudentDetailDTO,
  type UpdateStudentRequest,
  type SkillAssessmentUpdateInput,
} from '@/store/services/studentApi'
import { StudentForm, type StudentFormData } from '@/components/student/StudentForm'

// ========== Types ==========
export interface StudentEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: StudentDetailDTO | null
  onSuccess?: () => void
}

// ========== Main Component ==========
export function StudentEditDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
}: StudentEditDialogProps) {
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation()
  const [deleteSkillAssessment, { isLoading: isDeleting }] = useDeleteSkillAssessmentMutation()

  const handleSubmit = async (data: {
    formData: StudentFormData
    skillAssessments: SkillAssessmentUpdateInput[]
    assessmentsToDelete?: number[]
  }) => {
    if (!student) return

    try {
      // Delete marked assessments first
      if (data.assessmentsToDelete && data.assessmentsToDelete.length > 0) {
        for (const assessmentId of data.assessmentsToDelete) {
          await deleteSkillAssessment({
            studentId: student.id,
            assessmentId,
          }).unwrap()
        }
      }

      // Prepare update request
      const updateData: UpdateStudentRequest = {
        email: data.formData.email.trim(),
        fullName: data.formData.fullName.trim(),
        phone: data.formData.phone?.trim() || undefined,
        facebookUrl: data.formData.facebookUrl?.trim() || undefined,
        address: data.formData.address?.trim() || undefined,
        avatarUrl: data.formData.avatarUrl?.trim() || undefined,
        gender: data.formData.gender as 'MALE' | 'FEMALE' | 'OTHER',
        dateOfBirth: data.formData.dob || undefined,
        status: data.formData.status,
        skillAssessments: data.skillAssessments.map((a) => ({
          id: a.id,
          skill: a.skill,
          levelId: a.levelId,
          score: a.score,
          assessmentDate: a.assessmentDate,
          assessmentType: a.assessmentType,
          note: a.note,
          assessedByUserId: a.assessedByUserId,
        })),
      }

      await updateStudent({
        studentId: student.id,
        data: updateData,
      }).unwrap()

      toast.success('Cập nhật thông tin học viên thành công')
      onOpenChange(false)
      onSuccess?.()
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } }
      const errorMessage = err?.data?.message || 'Cập nhật thất bại'

      if (errorMessage.includes('EMAIL_ALREADY_EXISTS')) {
        toast.error('Email đã tồn tại trong hệ thống')
      } else if (errorMessage.includes('STUDENT_NOT_FOUND')) {
        toast.error('Không tìm thấy học viên')
      } else {
        toast.error(errorMessage)
      }
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const isLoading = isUpdating || isDeleting

  if (!student) return null

  return (
    <FullScreenModal open={open} onOpenChange={onOpenChange}>
      <FullScreenModalContent size="xl">
        <FullScreenModalHeader>
          <FullScreenModalTitle>Chỉnh sửa thông tin học viên</FullScreenModalTitle>
          <FullScreenModalDescription>
            Cập nhật thông tin cá nhân và đánh giá kỹ năng của học viên{' '}
            <span className="font-mono font-medium">{student.studentCode}</span>.
          </FullScreenModalDescription>
        </FullScreenModalHeader>

        <FullScreenModalBody>
          <StudentForm
            mode="edit"
            branchId={student.branchId}
            initialData={student}
            onSubmit={handleSubmit}
            isSubmitting={isLoading}
            onCancel={handleCancel}
            submitLabel="Lưu thay đổi"
          />
        </FullScreenModalBody>
      </FullScreenModalContent>
    </FullScreenModal>
  )
}
