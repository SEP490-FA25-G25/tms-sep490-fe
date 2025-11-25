import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ArrowLeftIcon } from 'lucide-react'

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

// Shared Step Header Component (Wizard Style)
interface StepHeaderProps {
  steps: StepConfig[]
  currentStep: number
}

function StepHeader({ steps, currentStep }: StepHeaderProps) {
  const progress = Math.round(((currentStep - 1) / (steps.length - 1)) * 100)

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-muted-foreground">
          Bước {currentStep} / {steps.length}
        </span>
        <span className="font-medium text-primary">
          {steps[currentStep - 1]?.title}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
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

// Shared Note Input Component
interface NoteInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  maxLength?: number
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

export function NoteInput({
  value,
  onChange,
  placeholder = 'Ghi chú thêm (tùy chọn)...',
  disabled = false,
  maxLength = 500
}: NoteInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Ghi chú thêm
        <span className="text-xs text-muted-foreground ml-2">(tùy chọn)</span>
      </label>
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="resize-none"
        disabled={disabled}
        maxLength={maxLength}
      />
      <div className="text-xs text-muted-foreground text-right">
        {value.length}/{maxLength}
      </div>
    </div>
  )
}

// Shared Selection Card Component
interface SelectionCardProps<T = unknown> {
  item: T
  isSelected: boolean
  onSelect: (item: T) => void
  disabled?: boolean
  children: React.ReactNode
}

export function SelectionCard<T>({
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
        isSelected && 'border-primary bg-primary/5 ring-1 ring-primary'
      )}
    >
      {children}
    </button>
  )
}

// Base Flow Component (Wizard Logic)
export function BaseFlowComponent({
  children,
  steps,
  currentStep,
  onNext,
  onBack,
  onSubmit,
  isNextDisabled = false,
  isSubmitDisabled = false,
  isSubmitting = false,
  nextLabel = 'Tiếp tục',
  submitLabel = 'Gửi yêu cầu'
}: {
  children: React.ReactNode
  steps: StepConfig[]
  currentStep: number
  onNext: () => void
  onBack: () => void
  onSubmit: () => void
  isNextDisabled?: boolean
  isSubmitDisabled?: boolean
  isSubmitting?: boolean
  nextLabel?: string
  submitLabel?: string
}) {
  const isLastStep = currentStep === steps.length

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <StepHeader steps={steps} currentStep={currentStep} />

      <div className="flex-1 overflow-y-auto min-h-0 px-1">
        {children}
      </div>

      <div className="mt-6 flex items-center justify-between pt-4 border-t">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={currentStep === 1 || isSubmitting}
          className={cn(currentStep === 1 && 'invisible')}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Quay lại
        </Button>

        {isLastStep ? (
          <Button
            onClick={onSubmit}
            disabled={isSubmitDisabled || isSubmitting}
          >
            {isSubmitting ? 'Đang gửi...' : submitLabel}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={isNextDisabled}
          >
            {nextLabel}
            <ArrowLeftIcon className="ml-2 h-4 w-4 rotate-180" />
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
    <div className={cn('space-y-4 animate-in fade-in slide-in-from-right-4 duration-300', className)}>
      {children}
    </div>
  )
}

// Import individual flow components
import AbsenceFlow from './flows/AbsenceFlow'
import MakeupFlow from './flows/MakeupFlow'
import TransferFlow from './flows/TransferFlow'

// Main Unified Request Flow Component
export default function UnifiedRequestFlow({ type, onSuccess }: UnifiedRequestFlowProps) {
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