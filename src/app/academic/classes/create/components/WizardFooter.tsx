import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Save } from 'lucide-react'
import type { WizardStep } from '@/types/classCreation'

interface WizardFooterProps {
  currentStep: WizardStep
  isFirstStep: boolean
  isLastStep: boolean
  isNextDisabled?: boolean
  isSubmitting?: boolean
  onBack?: () => void
  onNext?: () => void
  onSaveDraft?: () => void
  nextButtonText?: string
  showSaveDraft?: boolean
}

export function WizardFooter({
  isFirstStep,
  isLastStep,
  isNextDisabled = false,
  isSubmitting = false,
  onBack,
  onNext,
  onSaveDraft,
  nextButtonText,
  showSaveDraft = false,
}: WizardFooterProps) {
  const getNextButtonLabel = (): string => {
    if (nextButtonText) return nextButtonText
    if (isLastStep) return 'Gửi Duyệt'
    return 'Tiếp tục'
  }

  return (
    <div className="flex items-center justify-between gap-4 pt-6 border-t">
      {/* Back Button */}
      <div>
        {!isFirstStep && onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
        )}
      </div>

      {/* Right Side Buttons */}
      <div className="flex items-center gap-3">
        {/* Save Draft Button (optional) */}
        {showSaveDraft && onSaveDraft && (
          <Button
            type="button"
            variant="ghost"
            onClick={onSaveDraft}
            disabled={isSubmitting}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Lưu nháp
          </Button>
        )}

        {/* Next/Submit Button */}
        {onNext && (
          <Button
            type="submit"
            onClick={onNext}
            disabled={isNextDisabled || isSubmitting}
            className="gap-2 min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                Đang xử lý...
              </>
            ) : (
              <>
                {getNextButtonLabel()}
                {!isLastStep && <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
