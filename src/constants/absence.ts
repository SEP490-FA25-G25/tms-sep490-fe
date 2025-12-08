import type { RequestStatus } from '@/store/services/studentRequestApi'

export const REQUEST_STATUS_META: Record<
  RequestStatus,
  {
    label: string
    badgeClass: string
  }
> = {
  PENDING: { label: 'Chờ duyệt', badgeClass: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' },
  APPROVED: { label: 'Đã duyệt', badgeClass: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' },
  REJECTED: { label: 'Đã từ chối', badgeClass: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200' },
  CANCELLED: { label: 'Đã hủy', badgeClass: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' },
}

export const ABSENCE_STATUS_META = REQUEST_STATUS_META
