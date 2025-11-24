import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useDeleteClassMutation } from '@/store/services/classApi'
import { useWizardNavigation } from './hooks/useWizardNavigation'
import { ProgressIndicator } from './ProgressIndicator'
import { Step1BasicInfo } from './Step1BasicInfo'
import { Step2ReviewSessions } from './Step2ReviewSessions'
import { Step3TimeSlots } from './Step3TimeSlots'
import { Step4Resources } from './Step4Resources'
import { Step5AssignTeacher } from './Step5AssignTeacher'
import { Step6Validation } from './Step6Validation'
import { Step7Submit } from './Step7Submit'

/**
 * Main wizard container for Create Class workflow
 * Manages step navigation and renders appropriate step component
 */
interface CreateClassWizardProps {
  classId?: number
  mode?: 'create' | 'edit' // explicit mode to avoid guessing by classId
}

export function CreateClassWizard({ classId: propClassId, mode: modeProp }: CreateClassWizardProps = {}) {
  // Chốt mode ngay khi mount để không đổi khi classId được sinh ra sau Step 1 (create flow)
  const [mode] = useState<'create' | 'edit'>(() => modeProp ?? (propClassId ? 'edit' : 'create'))
  const navigate = useNavigate()
  const {
    currentStep,
    classId,
    completedSteps,
    navigateToStep,
    markStepComplete,
  } = useWizardNavigation(propClassId)
  const [timeSlotSelections, setTimeSlotSelections] = useState<Record<number, number>>({})
  const [deleteClass] = useDeleteClassMutation()

  // Handle Step 1 success - create class and navigate to Step 2 for review
  const handleStep1Success = (newClassId: number) => {
    markStepComplete(1)
    navigateToStep(2, newClassId)
  }
  const handleCancelKeepDraft = () => {
    navigate('/academic/classes')
  }
  const handleCancelDelete = async () => {
    if (!classId) {
      toast.error('Không tìm thấy lớp nháp để xóa.')
      return
    }
    try {
      await deleteClass(classId).unwrap()
      toast.success('Lớp nháp đã được xóa.')
      navigate('/academic/classes')
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message || 'Không thể xóa lớp. Vui lòng thử lại.'
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{mode === 'edit' ? 'Chỉnh sửa Lớp Học' : 'Tạo Lớp Học Mới'}</h1>
          <p className="text-muted-foreground mt-2">
            Hoàn thành 7 bước để tạo lớp học mới và gửi duyệt
          </p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={(step) => {
            // Only allow clicking on completed steps or current step
            if (completedSteps.includes(step) || step === currentStep) {
              navigateToStep(step as 1 | 2 | 3 | 4 | 5 | 6 | 7)
            }
          }}
        />

        {/* Step Content */}
        <div className="mt-8 bg-card rounded-lg border p-8 shadow-sm">
          {currentStep === 1 && <Step1BasicInfo classId={classId} onSuccess={handleStep1Success} onCancel={handleCancelKeepDraft} />}

          {currentStep === 2 && (
            <Step2ReviewSessions
              classId={classId}
              onBack={() => navigateToStep(1, classId ?? undefined)}
              onContinue={() => {
                markStepComplete(2)
                navigateToStep(3)
              }}
              onCancelKeepDraft={handleCancelKeepDraft}
              onCancelDelete={handleCancelDelete}
            />
          )}

          {currentStep === 3 && (
            <Step3TimeSlots
              classId={classId}
              onBack={() => navigateToStep(2)}
              onContinue={() => {
                markStepComplete(3)
                navigateToStep(4)
              }}
              onSaveSelections={(selections) => setTimeSlotSelections(selections)}
              onCancelKeepDraft={handleCancelKeepDraft}
              onCancelDelete={handleCancelDelete}
            />
          )}

          {currentStep === 4 && (
            <Step4Resources
              classId={classId}
              timeSlotSelections={timeSlotSelections}
              onBack={() => navigateToStep(3)}
              onContinue={() => {
                markStepComplete(4)
                navigateToStep(5)
              }}
              onCancelKeepDraft={handleCancelKeepDraft}
              onCancelDelete={handleCancelDelete}
            />
          )}

          {currentStep === 5 && (
            <Step5AssignTeacher
              classId={classId}
              onBack={() => navigateToStep(4)}
              onContinue={() => {
                markStepComplete(5)
                navigateToStep(6)
              }}
              onCancelKeepDraft={handleCancelKeepDraft}
              onCancelDelete={handleCancelDelete}
            />
          )}

          {currentStep === 6 && (
            <Step6Validation
              classId={classId}
              onBack={() => navigateToStep(5)}
              onContinue={() => {
                markStepComplete(6)
                navigateToStep(7)
              }}
              onCancelKeepDraft={handleCancelKeepDraft}
              onCancelDelete={handleCancelDelete}
            />
          )}

          {currentStep === 7 && (
            <Step7Submit
              classId={classId}
              onBack={() => navigateToStep(6)}
              onCancelKeepDraft={handleCancelKeepDraft}
              onCancelDelete={handleCancelDelete}
              onFinish={() => {
                markStepComplete(7)
                navigate('/academic/classes')
              }}
            />
          )}
        </div>

      </div>
    </div>
  )
}
