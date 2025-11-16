import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import type { TransferEligibility, TransferOption } from '@/store/services/studentRequestApi'
import type { TransferRequestResponse } from '@/types/academicTransfer'

import TransferEligibilityStep from './TransferEligibilityStep'
import TransferTypeStep from './TransferTypeStep'
import TransferClassSelectionStep from './TransferClassSelectionStep'
import TransferConfirmationStep from './TransferConfirmationStep'
import TransferSuccessDialog from './TransferSuccessDialog'

interface TransferFlowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TransferFlow({ open, onOpenChange }: TransferFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedEnrollment, setSelectedEnrollment] = useState<TransferEligibility | null>(null)
  const [selectedClass, setSelectedClass] = useState<TransferOption | null>(null)
  const [effectiveDate, setEffectiveDate] = useState<string>('')
  const [requestReason, setRequestReason] = useState<string>('')
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [submittedRequest, setSubmittedRequest] = useState<TransferRequestResponse | null>(null)
  const [transferType, setTransferType] = useState<'schedule' | 'branch-modality'>('schedule')
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [confirmationState, setConfirmationState] = useState<{
    canSubmit: boolean
    isLoading: boolean
    submit: () => Promise<void>
  } | null>(null)

  const totalSteps = 4

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      const previousStep = currentStep - 1
      setCurrentStep(previousStep)

      if (previousStep === 1) {
        setSelectedEnrollment(null)
        setSelectedClass(null)
        setTransferType('schedule')
      }

      if (previousStep === 2) {
        setSelectedClass(null)
      }
    }
  }
  useEffect(() => {
    if (currentStep !== 4) {
      setConfirmationState(null)
    }
  }, [currentStep])

  const handleClose = () => {
    if (currentStep === 1) {
      onOpenChange(false)
    }
  }

  const handleSuccess = (request: TransferRequestResponse) => {
    setSubmittedRequest(request)
    setIsSuccessOpen(true)
    onOpenChange(false)
    // Reset state
    setCurrentStep(1)
    setSelectedEnrollment(null)
    setSelectedClass(null)
    setEffectiveDate('')
    setRequestReason('')
    setTransferType('schedule')
    setConfirmationState(null)
  }

  const handleFooterNext = () => {
    if (currentStep === 2) {
      if (transferType === 'branch-modality') {
        setIsContactModalOpen(true)
        return
      }
    }

    handleNext()
  }

  const shouldRenderFooterNext = currentStep < totalSteps && currentStep !== 1 && currentStep !== 3

  const handleSubmitStateChange = useCallback((nextState: {
    canSubmit: boolean
    isLoading: boolean
    submit: () => Promise<void>
  }) => {
    setConfirmationState((prev) => {
      if (
        !prev ||
        prev.canSubmit !== nextState.canSubmit ||
        prev.isLoading !== nextState.isLoading ||
        prev.submit !== nextState.submit
      ) {
        return nextState
      }
      return prev
    })
  }, [])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <TransferEligibilityStep
            selectedEnrollment={selectedEnrollment}
            onSelectEnrollment={setSelectedEnrollment}
            onNext={handleNext}
          />
        )
      case 2:
        return (
          <TransferTypeStep
            currentEnrollment={selectedEnrollment!}
            selectedType={transferType}
            onTypeChange={setTransferType}
            contactModalOpen={isContactModalOpen}
            onContactModalChange={(open) => {
              setIsContactModalOpen(open)
              if (!open) {
                setCurrentStep(1)
                setSelectedEnrollment(null)
                setSelectedClass(null)
                setTransferType('schedule')
              }
            }}
          />
        )
      case 3:
        return (
          <TransferClassSelectionStep
            currentEnrollment={selectedEnrollment!}
            selectedClass={selectedClass}
            onSelectClass={setSelectedClass}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )
      case 4:
        return (
          <TransferConfirmationStep
            currentEnrollment={selectedEnrollment!}
            selectedClass={selectedClass!}
            effectiveDate={effectiveDate}
            requestReason={requestReason}
            onEffectiveDateChange={setEffectiveDate}
            onRequestReasonChange={setRequestReason}
            onSuccess={handleSuccess}
            onSubmitStateChange={handleSubmitStateChange}
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
            <DialogTitle className="text-xl font-semibold">Yêu cầu chuyển lớp</DialogTitle>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Bước {currentStep} của {totalSteps}</span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="py-6">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>

            {currentStep === 4 ? (
              <Button
                onClick={() => confirmationState?.submit()}
                disabled={!confirmationState?.canSubmit || confirmationState?.isLoading}
                className="flex items-center gap-2"
              >
                {confirmationState?.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Nộp yêu cầu'
                )}
              </Button>
            ) : shouldRenderFooterNext ? (
              <Button
                onClick={handleFooterNext}
                className="flex items-center gap-2"
              >
                Tiếp theo
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <TransferSuccessDialog
        open={isSuccessOpen}
        onOpenChange={setIsSuccessOpen}
        request={submittedRequest}
      />
    </>
  )
}
