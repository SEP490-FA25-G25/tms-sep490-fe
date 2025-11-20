import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Save } from 'lucide-react'
import type { WizardStep } from '@/types/classCreation'
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

interface WizardFooterProps {
  currentStep: WizardStep
  isFirstStep: boolean
  isLastStep: boolean
  isNextDisabled?: boolean
  isSubmitting?: boolean
  onBack?: () => void
  onCancelKeepDraft?: () => void
  onCancelDelete?: () => Promise<void> | void
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
  onCancelKeepDraft,
  onCancelDelete,
  onNext,
  onSaveDraft,
  nextButtonText,
  showSaveDraft = false,
}: WizardFooterProps) {
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const getNextButtonLabel = (): string => {
    if (nextButtonText) return nextButtonText
    if (isLastStep) return 'Gửi Duyệt'
    return 'Tiếp tục'
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t">
      <div className="flex items-center gap-2">
        {!isFirstStep && onBack && (
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
        )}
        {onCancelKeepDraft && (
          <>
            <Button type="button" variant="ghost" onClick={() => setIsCancelOpen(true)} disabled={isSubmitting}>
              Hủy &amp; về danh sách
            </Button>
            <AlertDialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Rời khỏi quá trình tạo lớp?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Chọn một trong hai tùy chọn bên dưới: giữ lại lớp ở trạng thái nháp để quay lại sau hoặc xóa hoàn toàn lớp học này.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    disabled={isSubmitting || isDeleting}
                    onClick={() => {
                      setIsCancelOpen(false)
                      onCancelKeepDraft()
                    }}
                  >
                    Giữ lớp (DRAFT)
                  </AlertDialogCancel>
                  {onCancelDelete && (
                    <AlertDialogAction
                      disabled={isSubmitting || isDeleting}
                      onClick={async () => {
                        setIsDeleting(true)
                        try {
                          await onCancelDelete()
                        } finally {
                          setIsDeleting(false)
                          setIsCancelOpen(false)
                        }
                      }}
                    >
                      {isDeleting ? 'Đang xóa…' : 'Xóa lớp'}
                    </AlertDialogAction>
                  )}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showSaveDraft && onSaveDraft && (
          <Button type="button" variant="ghost" onClick={onSaveDraft} disabled={isSubmitting} className="gap-2">
            <Save className="w-4 h-4" />
            Lưu nháp
          </Button>
        )}

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
