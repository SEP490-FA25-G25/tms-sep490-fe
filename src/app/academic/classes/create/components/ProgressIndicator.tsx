import { Fragment } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import type { WizardStep } from '@/types/classCreation'
import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  currentStep: WizardStep
  completedSteps: number[]
  onStepClick?: (step: number) => void
}

interface StepInfo {
  step: number
  label: string
  shortLabel: string
}

const WIZARD_STEPS: StepInfo[] = [
  { step: 1, label: 'Thông tin cơ bản', shortLabel: 'Thông tin' },
  { step: 2, label: 'Xem lại buổi học', shortLabel: 'Xem lại' },
  { step: 3, label: 'Lịch học', shortLabel: 'Lịch học' },
  { step: 4, label: 'Tài nguyên', shortLabel: 'Tài nguyên' },
  { step: 5, label: 'Giáo viên', shortLabel: 'Giáo viên' },
  { step: 6, label: 'Kiểm tra', shortLabel: 'Kiểm tra' },
  { step: 7, label: 'Xác nhận', shortLabel: 'Xác nhận' },
]

export function ProgressIndicator({
  currentStep,
  completedSteps,
  onStepClick,
}: ProgressIndicatorProps) {
  const isStepCompleted = (stepNumber: number) =>
    completedSteps.includes(stepNumber) || stepNumber < currentStep

  const getStepState = (stepNumber: number): 'completed' | 'active' | 'incomplete' => {
    if (isStepCompleted(stepNumber)) return 'completed'
    if (stepNumber === currentStep) return 'active'
    return 'incomplete'
  }

  const isClickable = (stepNumber: number): boolean => {
    // Can click on completed steps or current step
    return isStepCompleted(stepNumber) || stepNumber === currentStep
  }

  const handleStepClick = (stepNumber: number) => {
    if (isClickable(stepNumber) && onStepClick) {
      onStepClick(stepNumber)
    }
  }

  return (
    <div className="w-full px-4 py-6">
      <div
        className="mx-auto flex w-full max-w-5xl items-center"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={7}
        aria-label={`Bước ${currentStep} của 7`}
      >
        <div className="flex w-full items-center gap-4">
          {WIZARD_STEPS.map((stepInfo, index) => {
            const state = getStepState(stepInfo.step)
            const clickable = isClickable(stepInfo.step)
            const isLast = index === WIZARD_STEPS.length - 1

            return (
              <Fragment key={stepInfo.step}>
                <div className="flex flex-col items-center gap-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleStepClick(stepInfo.step)}
                    disabled={!clickable}
                    className={cn(
                      'flex size-10 items-center justify-center rounded-full border-2 transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2',
                      state === 'completed' && 'border-green-500 bg-green-500 text-white',
                      state === 'active' && 'border-primary text-primary',
                      state === 'incomplete' && 'border-muted text-muted-foreground',
                      clickable ? 'cursor-pointer hover:border-primary hover:text-primary' : 'cursor-not-allowed opacity-70'
                    )}
                    aria-label={`Bước ${stepInfo.step}: ${stepInfo.label}`}
                    aria-current={state === 'active' ? 'step' : undefined}
                  >
                    {state === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>

                  <div>
                    <div
                      className={cn(
                        'text-xs font-semibold uppercase tracking-wide',
                        state === 'active' && 'text-primary',
                        state === 'completed' && 'text-green-600',
                        state === 'incomplete' && 'text-muted-foreground'
                      )}
                    >
                      <span className="hidden sm:inline">{stepInfo.label}</span>
                      <span className="sm:hidden">{stepInfo.shortLabel}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Bước {stepInfo.step}</p>
                  </div>
                </div>

                {!isLast && (
                  <div className="flex-1">
                    <div
                      className={cn(
                        'h-[2px] w-full rounded-full transition-colors',
                        isStepCompleted(stepInfo.step) ? 'bg-green-500' : 'bg-muted'
                      )}
                    />
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
