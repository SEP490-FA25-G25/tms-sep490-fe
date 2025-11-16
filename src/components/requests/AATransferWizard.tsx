import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useSubmitTransferOnBehalfMutation } from '@/store/services/studentRequestApi'
import type { AATransferWizardProps, AATransferWizardData, WizardStep } from '@/types/academicTransfer'
import StudentSearchStep from './wizard/StudentSearchStep'
import CurrentClassSelectionStep from './wizard/CurrentClassSelectionStep'
import TargetClassSelectionStep from './wizard/TargetClassSelectionStep'
import AAConfirmationStep from './wizard/AAConfirmationStep'
import TransferSuccessDialog from './TransferSuccessDialog'

export default function AATransferWizard({
  open,
  onOpenChange,
  onSuccess,
}: AATransferWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('student-search')
  const [wizardData, setWizardData] = useState<AATransferWizardData>({
    selectedStudent: null,
    selectedCurrentClass: null,
    selectedTargetClass: null,
    effectiveDate: '',
    requestReason: '',
    note: '',
  })

  const [submitTransfer, { isLoading, data, error, reset }] = useSubmitTransferOnBehalfMutation()

  const steps = [
    { id: 'student-search', label: 'Tìm học viên' },
    { id: 'current-class', label: 'Lớp hiện tại' },
    { id: 'target-class', label: 'Lớp đích' },
    { id: 'confirmation', label: 'Xác nhận' },
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100

  const handleNext = () => {
    const stepOrder: WizardStep[] = ['student-search', 'current-class', 'target-class', 'confirmation']
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1])
    }
  }

  const handlePrevious = () => {
    const stepOrder: WizardStep[] = ['student-search', 'current-class', 'target-class', 'confirmation']
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1])
    }
  }

  const handleSubmit = async () => {
    if (!wizardData.selectedStudent?.id || !wizardData.selectedCurrentClass?.classId || !wizardData.selectedTargetClass?.classId) {
      return
    }

    try {
      const result = await submitTransfer({
        studentId: wizardData.selectedStudent.id,
        currentClassId: wizardData.selectedCurrentClass.classId,
        targetClassId: wizardData.selectedTargetClass.classId,
        effectiveDate: wizardData.effectiveDate,
        requestReason: wizardData.requestReason.trim(),
        note: wizardData.note.trim(),
      }).unwrap()

      if (result.success) {
        onSuccess?.(result.data)
      }
    } catch {
      // Error is handled by the mutation
    }
  }

  const handleClose = () => {
    if (isLoading) return
    setWizardData({
      selectedStudent: null,
      selectedCurrentClass: null,
      selectedTargetClass: null,
      effectiveDate: '',
      requestReason: '',
      note: '',
    })
    setCurrentStep('student-search')
    reset()
    onOpenChange(false)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'student-search':
        return (
          <StudentSearchStep
            selectedStudent={wizardData.selectedStudent}
            onSelectStudent={(student) => {
              setWizardData(prev => ({ ...prev, selectedStudent: student }))
              handleNext()
            }}
          />
        )
      case 'current-class':
        if (!wizardData.selectedStudent?.id) return null
        return (
          <CurrentClassSelectionStep
            studentId={wizardData.selectedStudent.id}
            selectedClass={wizardData.selectedCurrentClass}
            onSelectClass={(classData) => {
              setWizardData(prev => ({ ...prev, selectedCurrentClass: classData }))
              handleNext()
            }}
          />
        )
      case 'target-class':
        return (
          <TargetClassSelectionStep
            currentClass={wizardData.selectedCurrentClass}
            selectedClass={wizardData.selectedTargetClass}
            onSelectClass={(classData) => {
              setWizardData(prev => ({
                ...prev,
                selectedTargetClass: classData,
                effectiveDate: '',
              }))
              handleNext()
            }}
          />
        )
      case 'confirmation':
        return (
          <AAConfirmationStep
            wizardData={wizardData}
            onEffectiveDateChange={(date) => setWizardData(prev => ({ ...prev, effectiveDate: date }))}
            onRequestReasonChange={(reason) => setWizardData(prev => ({ ...prev, requestReason: reason }))}
            onNoteChange={(note) => setWizardData(prev => ({ ...prev, note }))}
            onPrevious={handlePrevious}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Tạo yêu cầu chuyển lớp thay học viên
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Bước {currentStepIndex + 1} / {steps.length}</span>
                <span>{steps[currentStepIndex]?.label}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
              {renderStep()}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={currentStep === 'student-search' ? handleClose : handlePrevious}
                disabled={isLoading}
              >
                {currentStep === 'student-search' ? 'Đóng' : 'Quay lại'}
              </Button>

              {currentStep !== 'confirmation' && (
                <Button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 'student-search' && !wizardData.selectedStudent) ||
                    (currentStep === 'current-class' && !wizardData.selectedCurrentClass) ||
                    (currentStep === 'target-class' && !wizardData.selectedTargetClass)
                  }
                >
                  Tiếp theo
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <TransferSuccessDialog
        open={!!data?.data}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleClose()
          }
        }}
        request={data?.data}
        userType="aa"
      />
    </>
  )
}
