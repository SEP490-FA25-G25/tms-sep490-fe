/**
 * Teacher Registration Page - Available Classes
 * Pattern: Matches teacher/classes page (DashboardLayout, Tabs, Card grid)
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO, differenceInDays } from 'date-fns'
import {
  useGetAvailableClassesQuery,
  useRegisterForClassMutation,
  type AvailableClassDTO,
} from '@/store/services/teacherRegistrationApi'
import { DashboardLayout } from '@/components/DashboardLayout'
import { TeacherRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  RotateCcwIcon,
  SearchIcon,
  BookOpenIcon,
  SendIcon,
  CheckCircle2Icon,
  UsersIcon,
  MapPinIcon,
  FileTextIcon,
} from 'lucide-react'
import { toast } from '@/components/ui/sonner'

type ModalityFilter = 'ALL' | 'ONLINE' | 'OFFLINE'

const MODALITY_OPTIONS: { value: ModalityFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả hình thức' },
  { value: 'ONLINE', label: 'Trực tuyến' },
  { value: 'OFFLINE', label: 'Tại trung tâm' },
]

const DAY_LABELS: Record<number, string> = {
  0: 'CN',
  1: 'T2',
  2: 'T3',
  3: 'T4',
  4: 'T5',
  5: 'T6',
  6: 'T7',
}

const PAGE_SIZE = 10

// Schedule days display
function ScheduleDaysDisplay({ days }: { days: number[] }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {days.map((day) => (
        <Badge
          key={day}
          variant="outline"
          className="text-xs px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
        >
          {DAY_LABELS[day] || `T${day}`}
        </Badge>
      ))}
    </div>
  )
}

// Modality badge
function ModalityBadge({ modality }: { modality: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    ONLINE: { label: 'Trực tuyến', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    OFFLINE: { label: 'Tại trung tâm', className: 'bg-green-100 text-green-700 border-green-200' },
  }

  const variant = variants[modality] || { label: modality, className: '' }

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  )
}

// Time remaining badge
function TimeRemainingBadge({ closeDate }: { closeDate: string }) {
  const closeDateParsed = parseISO(closeDate)
  const now = new Date()
  const daysLeft = differenceInDays(closeDateParsed, now)

  if (daysLeft < 0) {
    return (
      <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
        Đã hết hạn
      </Badge>
    )
  }

  if (daysLeft === 0) {
    return (
      <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200">
        Hôm nay
      </Badge>
    )
  } else if (daysLeft <= 2) {
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
        Còn {daysLeft} ngày
      </Badge>
    )
  } else {
    return (
      <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
        Còn {daysLeft} ngày
      </Badge>
    )
  }
}

function TeacherRegistrationsContent() {
  const navigate = useNavigate()

  // Tab state
  const [activeTab, setActiveTab] = useState<'available' | 'registered'>('available')

  // Filter states
  const [modalityFilter, setModalityFilter] = useState<ModalityFilter>('ALL')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)

  // Dialog states
  const [selectedClass, setSelectedClass] = useState<AvailableClassDTO | null>(null)
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false)
  const [registerNote, setRegisterNote] = useState('')

  // Fetch data
  const { data: response, isLoading, isFetching } = useGetAvailableClassesQuery()

  const [registerForClass, { isLoading: isRegistering }] = useRegisterForClassMutation()

  const allClasses = response?.data ?? []

  // Filter and separate data
  const availableClasses = useMemo(() => {
    return allClasses
      .filter((cls) => !cls.alreadyRegistered)
      .filter((cls) => {
        if (modalityFilter !== 'ALL' && cls.modality !== modalityFilter) return false
        if (keyword) {
          const kw = keyword.toLowerCase()
          return (
            cls.className.toLowerCase().includes(kw) ||
            cls.classCode.toLowerCase().includes(kw) ||
            cls.subjectName.toLowerCase().includes(kw) ||
            cls.branchName.toLowerCase().includes(kw)
          )
        }
        return true
      })
  }, [allClasses, modalityFilter, keyword])

  const registeredClasses = useMemo(() => {
    return allClasses.filter((cls) => cls.alreadyRegistered)
  }, [allClasses])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(availableClasses.length / PAGE_SIZE))
  const paginatedClasses = useMemo(() => {
    const start = page * PAGE_SIZE
    return availableClasses.slice(start, start + PAGE_SIZE)
  }, [availableClasses, page])

  // Handlers
  const handleClearFilters = () => {
    setModalityFilter('ALL')
    setKeyword('')
    setPage(0)
  }

  const handleOpenRegisterDialog = (cls: AvailableClassDTO) => {
    setSelectedClass(cls)
    setRegisterNote('')
    setRegisterDialogOpen(true)
  }

  const handleRegister = async () => {
    if (!selectedClass) return

    try {
      await registerForClass({
        classId: selectedClass.classId,
        note: registerNote || undefined,
      }).unwrap()

      toast.success('Đăng ký thành công', {
        description: `Bạn đã đăng ký dạy lớp ${selectedClass.className}`,
      })
      setRegisterDialogOpen(false)
      setSelectedClass(null)
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      toast.error('Đăng ký thất bại', {
        description: error?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại',
      })
    }
  }

  const hasActiveFilters = modalityFilter !== 'ALL' || keyword !== ''

  return (
    <div className="space-y-6">
      {/* Tabs with filters on same line */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'available' | 'registered')}>
        {/* Tab Headers with Filters - all on same row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs first */}
          <TabsList className="h-9">
            <TabsTrigger value="available" className="h-7">
              Lớp có thể đăng ký ({availableClasses.length})
            </TabsTrigger>
            <TabsTrigger value="registered" className="h-7">
              Đã đăng ký ({registeredClasses.length})
            </TabsTrigger>
          </TabsList>

          {/* Search - bên trái */}
          {activeTab === 'available' && (
            <>
              <div className="relative w-64">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên lớp, mã lớp, môn học..."
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value)
                    setPage(0)
                  }}
                  className="pl-8 h-9"
                />
              </div>

              {/* Filters - bên phải */}
              <div className="flex items-center gap-2 ml-auto">
                <Select
                  value={modalityFilter}
                  onValueChange={(value) => {
                    setModalityFilter(value as ModalityFilter)
                    setPage(0)
                  }}
                >
                  <SelectTrigger className="h-9 w-auto min-w-[140px]">
                    <SelectValue placeholder="Hình thức" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODALITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
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
                  <RotateCcwIcon className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Available Tab */}
        <TabsContent value="available" className="space-y-4 mt-4">
          {isLoading || isFetching ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              Đang tải...
            </div>
          ) : availableClasses.length === 0 ? (
            <div className="rounded-lg border bg-card py-12 text-center">
              <BookOpenIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Không có lớp nào</h3>
              <p className="text-muted-foreground mt-1">
                Hiện tại không có lớp nào đang mở đăng ký
              </p>
            </div>
          ) : (
            <>
              {/* Data Table */}
              <div className="rounded-lg border overflow-hidden bg-card">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[200px]">Lớp học</TableHead>
                      <TableHead className="w-[150px]">Môn học</TableHead>
                      <TableHead className="w-[120px]">Chi nhánh</TableHead>
                      <TableHead className="w-[100px]">Hình thức</TableHead>
                      <TableHead className="w-[120px]">Lịch học</TableHead>
                      <TableHead className="w-[120px]">Thời gian</TableHead>
                      <TableHead className="w-[100px]">Hạn ĐK</TableHead>
                      <TableHead className="w-20">Đã ĐK</TableHead>
                      <TableHead className="w-[100px] text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClasses.map((cls) => (
                      <TableRow key={cls.classId} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{cls.className}</span>
                            <span className="text-xs text-muted-foreground">{cls.classCode}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{cls.subjectName}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{cls.branchName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ModalityBadge modality={cls.modality} />
                        </TableCell>
                        <TableCell>
                          <ScheduleDaysDisplay days={cls.scheduleDays} />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(parseISO(cls.startDate), 'dd/MM/yyyy')}</div>
                            <div className="text-muted-foreground">
                              → {format(parseISO(cls.plannedEndDate), 'dd/MM/yyyy')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TimeRemainingBadge closeDate={cls.registrationCloseDate} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            <UsersIcon className="h-3 w-3" />
                            {cls.totalRegistrations}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => handleOpenRegisterDialog(cls)}>
                            <SendIcon className="h-4 w-4 mr-1" />
                            Đăng ký
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {availableClasses.length > PAGE_SIZE && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                  <p className="text-muted-foreground">
                    Trang {page + 1} / {totalPages} · {availableClasses.length} lớp
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
                          disabled={page === 0}
                        />
                      </PaginationItem>
                      <span className="hidden sm:contents">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                            setPage((prev) => Math.min(prev + 1, totalPages - 1))
                          }}
                          disabled={page + 1 >= totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Registered Tab */}
        <TabsContent value="registered" className="space-y-4 mt-4">
          {registeredClasses.length === 0 ? (
            <div className="rounded-lg border bg-card py-12 text-center">
              <FileTextIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Chưa có đăng ký</h3>
              <p className="text-muted-foreground mt-1">Bạn chưa đăng ký dạy lớp nào</p>
              <Button className="mt-4" onClick={() => setActiveTab('available')}>
                Xem lớp có thể đăng ký
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden bg-card">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[200px]">Lớp học</TableHead>
                    <TableHead className="w-[150px]">Môn học</TableHead>
                    <TableHead className="w-[120px]">Chi nhánh</TableHead>
                    <TableHead className="w-[100px]">Hình thức</TableHead>
                    <TableHead className="w-[120px]">Lịch học</TableHead>
                    <TableHead className="w-[120px]">Thời gian</TableHead>
                    <TableHead className="w-[100px]">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registeredClasses.map((cls) => (
                    <TableRow key={cls.classId} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{cls.className}</span>
                          <span className="text-xs text-muted-foreground">{cls.classCode}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{cls.subjectName}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{cls.branchName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ModalityBadge modality={cls.modality} />
                      </TableCell>
                      <TableCell>
                        <ScheduleDaysDisplay days={cls.scheduleDays} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(parseISO(cls.startDate), 'dd/MM/yyyy')}</div>
                          <div className="text-muted-foreground">
                            → {format(parseISO(cls.plannedEndDate), 'dd/MM/yyyy')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          <CheckCircle2Icon className="h-3 w-3 mr-1" />
                          Đã đăng ký
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Link to My Registrations for detailed view */}
          {registeredClasses.length > 0 && (
            <div className="text-center">
              <Button variant="outline" onClick={() => navigate('/teacher/registrations/my-registrations')}>
                Xem chi tiết đăng ký của tôi
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Register Dialog */}
      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Đăng ký dạy lớp</DialogTitle>
            <DialogDescription>
              Bạn đang đăng ký dạy lớp{' '}
              <span className="font-semibold">{selectedClass?.className}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedClass && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã lớp:</span>
                  <span className="font-medium">{selectedClass.classCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Môn học:</span>
                  <span>{selectedClass.subjectName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chi nhánh:</span>
                  <span>{selectedClass.branchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hình thức:</span>
                  <ModalityBadge modality={selectedClass.modality} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Lịch học:</span>
                  <ScheduleDaysDisplay days={selectedClass.scheduleDays} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thời gian:</span>
                  <span>
                    {format(parseISO(selectedClass.startDate), 'dd/MM/yyyy')} -{' '}
                    {format(parseISO(selectedClass.plannedEndDate), 'dd/MM/yyyy')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Hạn đăng ký:</span>
                  <TimeRemainingBadge closeDate={selectedClass.registrationCloseDate} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ghi chú (không bắt buộc)</label>
                <Textarea
                  placeholder="Nhập lý do bạn muốn đăng ký dạy lớp này..."
                  value={registerNote}
                  onChange={(e) => setRegisterNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleRegister} disabled={isRegistering}>
              {isRegistering ? 'Đang xử lý...' : 'Xác nhận đăng ký'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function TeacherRegistrationsPage() {
  return (
    <TeacherRoute>
      <DashboardLayout
        title="Đăng ký dạy lớp"
        description="Danh sách các lớp đang mở đăng ký"
        actions={
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RotateCcwIcon className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        }
      >
        <TeacherRegistrationsContent />
      </DashboardLayout>
    </TeacherRoute>
  )
}
