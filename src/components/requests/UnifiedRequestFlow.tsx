import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

// Types
export type FlowType = 'ABSENCE' | 'MAKEUP' | 'TRANSFER'

export interface StepConfig {
  id: number
  title: string
  description: string
  isComplete: boolean
  isAvailable: boolean
}

export interface FlowState {
  currentStep: number
  isSubmitting: boolean
}

// Props for each flow type
export interface AbsenceFlowProps {
  onSuccess: () => void
}

export interface MakeupFlowProps {
  onSuccess: () => void
}

export interface TransferFlowProps {
  onSuccess: () => void
}

export interface UnifiedRequestFlowProps {
  type: FlowType
  onSuccess: () => void
}

// Shared Step Header Component
interface StepHeaderProps {
  step: StepConfig
  stepNumber: number
}

function StepHeader({ step, stepNumber }: StepHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
          step.isComplete
            ? 'bg-primary text-primary-foreground'
            : step.isAvailable
              ? 'border-2 border-primary text-primary'
              : 'border-2 border-muted-foreground/30 text-muted-foreground'
        )}
      >
        {step.isComplete ? '✓' : stepNumber}
      </div>
      <div>
        <h3 className="font-semibold">{step.title}</h3>
        <p className="text-sm text-muted-foreground">{step.description}</p>
      </div>
    </div>
  )
}

// Shared Reason Input Component
interface ReasonInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  error?: string | null
  disabled?: boolean
  minLength?: number
}

export function ReasonInput({
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  minLength = 10
}: ReasonInputProps) {
  return (
    <div className="space-y-2">
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={cn('resize-none', error && 'border-destructive')}
        disabled={disabled}
      />
      <div className="flex items-center justify-between">
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {value.trim().length} / tối thiểu {minLength} ký tự
          </p>
        )}
      </div>
    </div>
  )
}

// Shared Selection Card Component
interface SelectionCardProps<T = any> {
  item: T
  isSelected: boolean
  onSelect: (item: T) => void
  disabled?: boolean
  children: React.ReactNode
}

export function SelectionCard<T = any>({
  item,
  isSelected,
  onSelect,
  disabled = false,
  children
}: SelectionCardProps<T>) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(item)}
      disabled={disabled}
      className={cn(
        'w-full rounded-lg border px-4 py-3 text-left transition',
        !disabled && 'cursor-pointer hover:border-primary/50 hover:bg-muted/30',
        disabled && 'cursor-not-allowed border-dashed opacity-50',
        isSelected && 'border-primary bg-primary/5'
      )}
    >
      {children}
    </button>
  )
}

// Base Flow Component
export function BaseFlowComponent({
  children,
  onSubmit,
  submitButtonText,
  isSubmitDisabled = false,
  isSubmitting = false,
  resetButton = true,
  onReset
}: {
  children: React.ReactNode
  onSubmit: () => void
  submitButtonText: string
  isSubmitDisabled?: boolean
  isSubmitting?: boolean
  resetButton?: boolean
  onReset?: () => void
}) {

  return (
    <div className="space-y-8">
      {children}

      {/* Submit Actions */}
      <div className="flex gap-2">
        <Button
          onClick={onSubmit}
          disabled={isSubmitDisabled || isSubmitting}
        >
          {isSubmitting ? 'Đang gửi...' : submitButtonText}
        </Button>
        {resetButton && onReset && (
          <Button variant="outline" onClick={onReset}>
            Làm lại
          </Button>
        )}
      </div>
    </div>
  )
}

// Section wrapper for consistent spacing
export function Section({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  )
}

// Success state handler hook
export function useSuccessHandler(onSuccess: () => void) {
  const handleSuccess = useCallback(() => {
    toast.success('Đã gửi yêu cầu thành công')
    onSuccess()
  }, [onSuccess])

  return { handleSuccess }
}

// Error handler hook
export function useErrorHandler() {
  const handleError = useCallback((error: unknown) => {
    const message =
      (error as { data?: { message?: string } })?.data?.message ??
      'Không thể gửi yêu cầu. Vui lòng thử lại.'
    toast.error(message)
  }, [])

  return { handleError }
}

// Validation helpers
export const Validation = {
  reason: (value: string, minLength: number = 10): string | null => {
    if (value.trim().length < minLength) {
      return `Lý do phải có tối thiểu ${minLength} ký tự`
    }
    return null
  },

  selection: <T,>(value: T | null): string | null => {
    if (!value) {
      return 'Vui lòng chọn một mục'
    }
    return null
  }
}

// Flow type labels for UI
export const FLOW_LABELS = {
  ABSENCE: 'Xin nghỉ',
  MAKEUP: 'Học bù',
  TRANSFER: 'Chuyển lớp'
} as const

// Export components for individual flows
export { StepHeader }

// Import individual flow components
import AbsenceFlow from './flows/AbsenceFlow'
import MakeupFlow from './flows/MakeupFlow'
import TransferFlow from './flows/TransferFlow'

// Main Unified Request Flow Component
export default function UnifiedRequestFlow({ type, onSuccess }: UnifiedRequestFlowProps) {
  // This will be implemented based on the type
  switch (type) {
    case 'ABSENCE':
      return <AbsenceFlow onSuccess={onSuccess} />
    case 'MAKEUP':
      return <MakeupFlow onSuccess={onSuccess} />
    case 'TRANSFER':
      return <TransferFlow onSuccess={onSuccess} />
    default:
      return <div>Unknown flow type</div>
  }
}