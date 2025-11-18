import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { SessionModality } from '@/store/services/studentRequestApi'
import type { DayOfWeek } from '@/store/services/studentScheduleApi'

// Debounced value hook
export function useDebouncedValue<T>(value: T, delay = 800) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Modality label formatter
export function getModalityLabel(modality?: SessionModality) {
  switch (modality) {
    case 'ONLINE': return 'Trực tuyến'
    case 'OFFLINE': return 'Tại trung tâm'
    case 'HYBRID': return 'Kết hợp'
    default: return modality || 'Tại trung tâm'
  }
}

// Capacity text formatter
export function getCapacityText(available?: number | null, max?: number | null) {
  const hasAvailable = typeof available === 'number'
  const hasMax = typeof max === 'number'
  if (hasAvailable && hasMax) {
    return `${available}/${max} chỗ trống`
  }
  if (hasAvailable) {
    return `Còn ${available} chỗ trống`
  }
  if (hasMax) {
    return `Tối đa ${max} chỗ`
  }
  return 'Sức chứa đang cập nhật'
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

// Week days configuration for absence flows
export const WEEK_DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
export const WEEK_DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Thứ 2',
  TUESDAY: 'Thứ 3',
  WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5',
  FRIDAY: 'Thứ 6',
  SATURDAY: 'Thứ 7',
  SUNDAY: 'Chủ nhật'
}