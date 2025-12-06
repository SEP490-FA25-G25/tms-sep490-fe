import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Loader2,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  CheckCircle,
  Clock,
  RotateCcw,
  SearchIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
} from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  useGetRegistrationsQuery,
  useUpdateRegistrationStatusMutation,
  useExportRegistrationsMutation,
  type ConsultationRegistrationResponse,
  type ConsultationStatus,
} from '@/store/services/consultationApi'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useDebounce } from '@/hooks/useDebounce'

// ========== Types ==========
type SortField = 'fullName' | 'createdAt' | 'status' | 'branchName'
type SortDirection = 'asc' | 'desc'

// ========== Status Badge Component (consistent with other pages) ==========
function StatusBadge({ status }: { status: ConsultationStatus }) {
  const variants: Record<ConsultationStatus, { label: string; className: string }> = {
    NEW: { 
      label: 'Mới', 
      className: 'bg-blue-100 text-blue-700 border-blue-200' 
    },
    CONTACTED: { 
      label: 'Đã liên hệ', 
      className: 'bg-amber-100 text-amber-700 border-amber-200' 
    },
    CONVERTED: { 
      label: 'Đã chuyển đổi', 
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200' 
    },
    NOT_INTERESTED: { 
      label: 'Không quan tâm', 
      className: 'bg-slate-100 text-slate-700 border-slate-200' 
    },
  }

  const variant = variants[status]

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  )
}

// ========== Sortable Header Component ==========
function SortableHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string
  field: SortField
  currentSort: SortField
  currentDir: SortDirection
  onSort: (field: SortField) => void
}) {
  const isActive = currentSort === field

  return (
    <Button
      variant="ghost"
      onClick={() => onSort(field)}
      className="h-8 px-2 font-semibold hover:bg-muted/50"
    >
      {label}
      {isActive ? (
        currentDir === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  )
}

// ========== Update Status Dialog ==========
function UpdateStatusDialog({
  registration,
  open,
  onOpenChange,
  onSuccess,
}: {
  registration: ConsultationRegistrationResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [status, setStatus] = useState<ConsultationStatus | ''>('')
  const [note, setNote] = useState('')

  const [updateStatus, { isLoading }] = useUpdateRegistrationStatusMutation()

  const handleSubmit = async () => {
    if (!registration || !status) return

    try {
      await updateStatus({
        id: registration.id,
        data: { status, note: note.trim() || undefined },
      }).unwrap()

      toast.success('Cập nhật trạng thái thành công')
      onSuccess()
      onOpenChange(false)
      setStatus('')
      setNote('')
    } catch {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.')
    }
  }

  // Reset form when dialog opens with new registration
  const handleOpenChange = (open: boolean) => {
    if (open && registration) {
      setStatus(registration.status)
      setNote(registration.note || '')
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cập nhật trạng thái</DialogTitle>
          <DialogDescription>
            Cập nhật trạng thái xử lý cho đăng ký của{' '}
            <strong>{registration?.fullName}</strong>
          </DialogDescription>
        </DialogHeader>

        {registration && (
          <div className="space-y-4 py-4">
            {/* Customer Info Summary */}
            <div className="rounded-lg bg-muted p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {registration.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {registration.phone}
              </div>
              {registration.courseName && (
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Quan tâm: {registration.courseName}
                </div>
              )}
              {registration.message && (
                <div className="pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-1">Ghi chú từ khách hàng:</div>
                  <div className="text-foreground whitespace-pre-wrap">{registration.message}</div>
                </div>
              )}
            </div>

            {/* Status Selection */}
            <div className="space-y-2">
              <Label>Trạng thái mới *</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ConsultationStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">Mới</SelectItem>
                  <SelectItem value="CONTACTED">Đã liên hệ</SelectItem>
                  <SelectItem value="CONVERTED">Đã chuyển đổi</SelectItem>
                  <SelectItem value="NOT_INTERESTED">Không quan tâm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                placeholder="Nhập ghi chú xử lý..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !status}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cập nhật
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ========== Main Page Component ==========
export default function ConsultationRegistrationsPage() {
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<ConsultationStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')
  const [selectedRegistration, setSelectedRegistration] =
    useState<ConsultationRegistrationResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const debouncedSearch = useDebounce(search, 300)
  const pageSize = 20

  const { data, isLoading, isFetching, refetch } = useGetRegistrationsQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    size: pageSize,
  })

  const [exportRegistrations, { isLoading: isExporting }] = useExportRegistrationsMutation()

  const registrations = data?.data?.content || []
  const totalPages = data?.data?.totalPages || 0
  const totalElements = data?.data?.totalElements || 0

  // Filter by search (client-side)
  const filteredRegistrations = debouncedSearch
    ? registrations.filter(
        (r) =>
          r.fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          r.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          r.phone.includes(debouncedSearch)
      )
    : registrations

  // Sort (client-side)
  const sortedRegistrations = [...filteredRegistrations].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case 'fullName':
        comparison = a.fullName.localeCompare(b.fullName, 'vi')
        break
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
      case 'branchName':
        comparison = a.branchName.localeCompare(b.branchName, 'vi')
        break
    }
    return sortDir === 'asc' ? comparison : -comparison
  })

  // Count by status from current data
  const countNew = registrations.filter((r) => r.status === 'NEW').length
  const countContacted = registrations.filter((r) => r.status === 'CONTACTED').length
  const countConverted = registrations.filter((r) => r.status === 'CONVERTED').length

  const hasActiveFilters = statusFilter !== 'all' || search !== ''

  const handleClearFilters = () => {
    setStatusFilter('all')
    setSearch('')
    setPage(0)
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir(field === 'createdAt' ? 'desc' : 'asc')
    }
  }

  const handleUpdateClick = (registration: ConsultationRegistrationResponse) => {
    setSelectedRegistration(registration)
    setIsDialogOpen(true)
  }

  const handleExport = async () => {
    try {
      const result = await exportRegistrations({
        status: statusFilter === 'all' ? undefined : statusFilter,
      }).unwrap()

      // Create download link
      const url = window.URL.createObjectURL(result)
      const link = document.createElement('a')
      link.href = url
      link.download = `dang-ky-tu-van-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Xuất danh sách đăng ký tư vấn thành công!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Có lỗi xảy ra khi xuất file. Vui lòng thử lại.')
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi })
  }

  return (
    <DashboardLayout
      title="Đăng ký tư vấn"
      description="Quản lý các đăng ký tư vấn từ khách hàng tiềm năng"
      actions={
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Xuất Excel
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Statistics Summary */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng đăng ký</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-950/30">
                <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalElements}</div>
              <p className="text-xs text-muted-foreground">Tổng số đăng ký</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mới</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{countNew}</div>
              <p className="text-xs text-muted-foreground">Chờ liên hệ</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã liên hệ</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <Phone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{countContacted}</div>
              <p className="text-xs text-muted-foreground">Đang theo dõi</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã chuyển đổi</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{countConverted}</div>
              <p className="text-xs text-muted-foreground">Thành công</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search - bên trái */}
          <div className="relative w-64">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm tên, SĐT, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="pl-8 h-9"
            />
          </div>

          {/* Filters - bên phải */}
          <div className="flex items-center gap-2 ml-auto">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as ConsultationStatus | 'all')
                setPage(0)
              }}
            >
              <SelectTrigger className="h-9 w-auto min-w-[160px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="NEW">Mới</SelectItem>
                <SelectItem value="CONTACTED">Đã liên hệ</SelectItem>
                <SelectItem value="CONVERTED">Đã chuyển đổi</SelectItem>
                <SelectItem value="NOT_INTERESTED">Không quan tâm</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              title="Xóa bộ lọc"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden bg-card">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sortedRegistrations.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Chưa có đăng ký tư vấn nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>
                    <SortableHeader
                      label="Họ tên"
                      field="fullName"
                      currentSort={sortField}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Chi nhánh"
                      field="branchName"
                      currentSort={sortField}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>Khóa học quan tâm</TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Trạng thái"
                      field="status"
                      currentSort={sortField}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Ngày đăng ký"
                      field="createdAt"
                      currentSort={sortField}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRegistrations.map((reg) => (
                  <TableRow 
                    key={reg.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleUpdateClick(reg)}
                  >
                    <TableCell className="font-medium">{reg.fullName}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {reg.phone}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {reg.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{reg.branchName}</TableCell>
                    <TableCell>
                      {reg.courseName ? (
                        <span className="text-sm">
                          {reg.courseName}
                          <span className="text-muted-foreground ml-1">({reg.courseCode})</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={reg.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(reg.createdAt)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            Trang {page + 1} / {Math.max(totalPages, 1)} · {totalElements} đăng ký
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setPage((prev) => Math.max(prev - 1, 0))
                  }}
                  aria-disabled={page === 0 || isFetching}
                  className={page === 0 || isFetching ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {/* Show page numbers only on larger screens */}
              <span className="hidden sm:contents">
                {Array.from({ length: Math.min(Math.max(totalPages, 1), 5) }, (_, i) => {
                  // Show first 5 pages or pages around current page
                  let pageNum = i
                  if (totalPages > 5 && page > 2) {
                    pageNum = Math.min(page - 2 + i, totalPages - 1)
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setPage(pageNum)
                        }}
                        isActive={pageNum === page}
                      >
                        {pageNum + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
              </span>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setPage((prev) => Math.min(prev + 1, Math.max(totalPages - 1, 0)))
                  }}
                  aria-disabled={page + 1 >= totalPages || isFetching}
                  className={page + 1 >= totalPages || isFetching ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* Update Status Dialog */}
      <UpdateStatusDialog
        registration={selectedRegistration}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => refetch()}
      />
    </DashboardLayout>
  )
}
