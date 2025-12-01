import type { RequestStatus } from '@/store/services/studentRequestApi'

export const REQUEST_STATUS_META: Record<
  RequestStatus,
  {
    label: string
    badgeClass: string
  }
> = {
  PENDING: { label: 'Chờ duyệt', badgeClass: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200' },
  APPROVED: { label: 'Đã chấp thuận', badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  REJECTED: { label: 'Đã từ chối', badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' },
  CANCELLED: { label: 'Đã hủy', badgeClass: 'bg-slate-100 text-slate-700 ring-1 ring-slate-300' },
}

export const ABSENCE_STATUS_META = REQUEST_STATUS_META
