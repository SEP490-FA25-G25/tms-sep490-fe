/**
 * AA Teacher Registrations Review Page
 * Pattern: Matches academic/student-requests (DashboardLayout, Summary Cards, Tabs, DataTable)
 */
import { useState, useMemo } from 'react'
import {
  useGetClassesNeedingReviewQuery,
  useDirectAssignTeacherMutation,
  type ClassRegistrationSummaryDTO,
} from '@/store/services/teacherRegistrationApi'
import { useGetTeachersQuery } from '@/store/services/academicTeacherApi'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  RotateCcwIcon,
  ClockIcon,
  CheckCircle2Icon,
  UsersIcon,
  SearchIcon,
  BookOpenIcon,
  UserPlusIcon,
} from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import { DataTable } from './components/DataTable'
import { pendingColumns, assignedColumns } from './components/columns'
import { ClassDetailDialog } from './components/ClassDetailDialog'

type ModalityFilter = 'ALL' | 'ONLINE' | 'OFFLINE'

const MODALITY_OPTIONS: { value: ModalityFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả hình thức' },
  { value: 'ONLINE', label: 'Trực tuyến' },
  { value: 'OFFLINE', label: 'Tại trung tâm' },
]

const PAGE_SIZE = 20

export default function AATeacherRegistrationsPage() {
  const { selectedBranchId } = useAuth()

  // Tab state
  const [activeTab, setActiveTab] = useState<'pending' | 'assigned'>('pending')

  // Pending tab filter states
  const [modalityFilter, setModalityFilter] = useState<ModalityFilter>('ALL')
  const [keyword, setKeyword] = useState('')

  // Pending tab pagination
  const [page, setPage] = useState(0)

  // Assigned tab filter states
  const [assignedModality, setAssignedModality] = useState<ModalityFilter>('ALL')
  const [assignedKeyword, setAssignedKeyword] = useState('')

  // Assigned tab pagination
  const [assignedPage, setAssignedPage] = useState(0)

  // Dialog states
  const [selectedClass, setSelectedClass] = useState<ClassRegistrationSummaryDTO | null>(null)
  const [directAssignDialogOpen, setDirectAssignDialogOpen] = useState(false)
  const [selectedClassForAssign, setSelectedClassForAssign] = useState<ClassRegistrationSummaryDTO | null>(null)
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [assignReason, setAssignReason] = useState('')

  // Fetch data
  const {
    data: classesResponse,
    isLoading,
    isFetching,
  } = useGetClassesNeedingReviewQuery()

  const { data: teachersResponse } = useGetTeachersQuery(
    { branchId: selectedBranchId || undefined },
    { skip: !directAssignDialogOpen }
  )

  const [directAssignTeacher, { isLoading: isAssigning }] = useDirectAssignTeacherMutation()

  const allClasses = classesResponse?.data ?? []
  const teachers = teachersResponse ?? []

  // Filter and separate data
  const pendingClasses = useMemo(() => {
    return allClasses
      .filter((cls) => cls.assignedTeacherId === null)
      .filter((cls) => {
        if (modalityFilter !== 'ALL' && cls.modality !== modalityFilter) return false
        if (keyword) {
          const kw = keyword.toLowerCase()
          return (
            cls.className.toLowerCase().includes(kw) ||
            cls.classCode.toLowerCase().includes(kw) ||
            cls.subjectName.toLowerCase().includes(kw)
          )
        }
        return true
      })
  }, [allClasses, modalityFilter, keyword])

  const assignedClasses = useMemo(() => {
    return allClasses
      .filter((cls) => cls.assignedTeacherId !== null)
      .filter((cls) => {
        if (assignedModality !== 'ALL' && cls.modality !== assignedModality) return false
        if (assignedKeyword) {
          const kw = assignedKeyword.toLowerCase()
          return (
            cls.className.toLowerCase().includes(kw) ||
            cls.classCode.toLowerCase().includes(kw) ||
            cls.subjectName.toLowerCase().includes(kw) ||
            (cls.assignedTeacherName && cls.assignedTeacherName.toLowerCase().includes(kw))
          )
        }
        return true
      })
  }, [allClasses, assignedModality, assignedKeyword])

  // Pagination
  const pendingTotalPages = Math.max(1, Math.ceil(pendingClasses.length / PAGE_SIZE))
  const assignedTotalPages = Math.max(1, Math.ceil(assignedClasses.length / PAGE_SIZE))

  const paginatedPending = useMemo(() => {
    const start = page * PAGE_SIZE
    return pendingClasses.slice(start, start + PAGE_SIZE)
  }, [pendingClasses, page])

  const paginatedAssigned = useMemo(() => {
    const start = assignedPage * PAGE_SIZE
    return assignedClasses.slice(start, start + PAGE_SIZE)
  }, [assignedClasses, assignedPage])

  // Summary stats
  const totalPending = allClasses.filter((c) => !c.assignedTeacherId).length
  const totalAssigned = allClasses.filter((c) => c.assignedTeacherId).length
  const totalRegistrations = allClasses.reduce((sum, c) => sum + c.pendingCount, 0)

  // Handlers
  const handleRowClick = (cls: ClassRegistrationSummaryDTO) => {
    setSelectedClass(cls)
  }

  const handleClearFilters = () => {
    setModalityFilter('ALL')
    setKeyword('')
    setPage(0)
  }

  const handleClearAssignedFilters = () => {
    setAssignedModality('ALL')
    setAssignedKeyword('')
    setAssignedPage(0)
  }

  const handleOpenDirectAssign = (cls: ClassRegistrationSummaryDTO) => {
    setSelectedClassForAssign(cls)
    setSelectedTeacherId('')
    setAssignReason('')
    setDirectAssignDialogOpen(true)
  }

  const handleDirectAssign = async () => {
    if (!selectedClassForAssign || !selectedTeacherId || !assignReason) return

    try {
      await directAssignTeacher({
        classId: selectedClassForAssign.classId,
        teacherId: Number(selectedTeacherId),
        reason: assignReason,
      }).unwrap()
      toast.success('Đã gán giáo viên thành công')
      setDirectAssignDialogOpen(false)
      setSelectedClassForAssign(null)
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      toast.error(error?.data?.message || 'Có lỗi xảy ra khi gán giáo viên')
    }
  }

  const hasActiveFilters = modalityFilter !== 'ALL' || keyword !== ''
  const hasActiveAssignedFilters = assignedModality !== 'ALL' || assignedKeyword !== ''

  return (
    <DashboardLayout
      title="Duyệt đăng ký dạy lớp"
      description="Xem và duyệt đăng ký của giáo viên cho các lớp học"
      actions={
        pendingClasses.length > 0 ? (
          <Button
            onClick={() => {
              const firstPending = pendingClasses[0]
              if (firstPending) handleOpenDirectAssign(firstPending)
            }}
          >
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Gán trực tiếp
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng lớp cần xét</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <BookOpenIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allClasses.length}</div>
              <p className="text-xs text-muted-foreground">Lớp có đăng ký</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chờ gán GV</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <ClockIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPending}</div>
              <p className="text-xs text-muted-foreground">Lớp chưa có giáo viên</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã gán GV</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <CheckCircle2Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAssigned}</div>
              <p className="text-xs text-muted-foreground">Lớp đã có giáo viên</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng đăng ký</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
                <UsersIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRegistrations}</div>
              <p className="text-xs text-muted-foreground">Lượt đăng ký của GV</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs with filters on same line */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'assigned')}>
          {/* Tab Headers with Filters - all on same row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tabs first */}
            <TabsList className="h-9">
              <TabsTrigger value="pending" className="h-7">
                Chờ gán GV ({totalPending})
              </TabsTrigger>
              <TabsTrigger value="assigned" className="h-7">
                Đã gán GV ({totalAssigned})
              </TabsTrigger>
            </TabsList>

            {/* Search - bên trái */}
            {activeTab === 'pending' ? (
              <>
                <div className="relative w-64">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm lớp, mã lớp, môn học..."
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
            ) : (
              <>
                <div className="relative w-64">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm lớp, mã lớp, môn học, GV..."
                    value={assignedKeyword}
                    onChange={(e) => {
                      setAssignedKeyword(e.target.value)
                      setAssignedPage(0)
                    }}
                    className="pl-8 h-9"
                  />
                </div>

                {/* Filters - bên phải */}
                <div className="flex items-center gap-2 ml-auto">
                  <Select
                    value={assignedModality}
                    onValueChange={(value) => {
                      setAssignedModality(value as ModalityFilter)
                      setAssignedPage(0)
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
                    onClick={handleClearAssignedFilters}
                    disabled={!hasActiveAssignedFilters}
                    title="Xóa bộ lọc"
                  >
                    <RotateCcwIcon className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-4 mt-4">
            {/* Data Table */}
            <div className="space-y-4">
              <DataTable
                columns={pendingColumns}
                data={paginatedPending}
                onRowClick={handleRowClick}
                isLoading={isLoading || isFetching}
                emptyMessage="Không có lớp nào đang chờ gán giáo viên."
              />

              {/* Pagination */}
              {pendingClasses.length > PAGE_SIZE && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                  <p className="text-muted-foreground">
                    Trang {page + 1} / {pendingTotalPages} · {pendingClasses.length} lớp
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
                        {Array.from({ length: Math.min(pendingTotalPages, 5) }, (_, i) => {
                          let pageNum = i
                          if (pendingTotalPages > 5 && page > 2) {
                            pageNum = Math.min(page - 2 + i, pendingTotalPages - 1)
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
                            setPage((prev) => Math.min(prev + 1, pendingTotalPages - 1))
                          }}
                          disabled={page + 1 >= pendingTotalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Assigned Tab */}
          <TabsContent value="assigned" className="space-y-4 mt-4">
            {/* Data Table */}
            <div className="space-y-4">
              <DataTable
                columns={assignedColumns}
                data={paginatedAssigned}
                onRowClick={handleRowClick}
                isLoading={isLoading || isFetching}
                emptyMessage="Chưa có lớp nào được gán giáo viên."
              />

              {/* Pagination */}
              {assignedClasses.length > PAGE_SIZE && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                  <p className="text-muted-foreground">
                    Trang {assignedPage + 1} / {assignedTotalPages} · {assignedClasses.length} lớp
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setAssignedPage((prev) => Math.max(prev - 1, 0))
                          }}
                          disabled={assignedPage === 0}
                        />
                      </PaginationItem>
                      <span className="hidden sm:contents">
                        {Array.from({ length: Math.min(assignedTotalPages, 5) }, (_, i) => {
                          let pageNum = i
                          if (assignedTotalPages > 5 && assignedPage > 2) {
                            pageNum = Math.min(assignedPage - 2 + i, assignedTotalPages - 1)
                          }
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setAssignedPage(pageNum)
                                }}
                                isActive={pageNum === assignedPage}
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
                            setAssignedPage((prev) => Math.min(prev + 1, assignedTotalPages - 1))
                          }}
                          disabled={assignedPage + 1 >= assignedTotalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Class Detail Dialog */}
      <ClassDetailDialog
        classData={selectedClass}
        open={selectedClass !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedClass(null)
        }}
      />

      {/* Direct Assign Dialog */}
      <Dialog open={directAssignDialogOpen} onOpenChange={setDirectAssignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gán giáo viên trực tiếp</DialogTitle>
            <DialogDescription>
              Gán giáo viên cho lớp{' '}
              <span className="font-semibold">{selectedClassForAssign?.className}</span> mà không cần
              qua đăng ký.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="teacher">Giáo viên</Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="Chọn giáo viên" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.teacherId} value={String(teacher.teacherId)}>
                      <div className="flex items-center gap-2">
                        <span>{teacher.fullName}</span>
                        <span className="text-muted-foreground">({teacher.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Lý do gán trực tiếp *</Label>
              <Textarea
                id="reason"
                placeholder="Nhập lý do gán giáo viên trực tiếp (bắt buộc)"
                value={assignReason}
                onChange={(e) => setAssignReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDirectAssignDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleDirectAssign}
              disabled={isAssigning || !selectedTeacherId || !assignReason}
            >
              {isAssigning ? 'Đang xử lý...' : 'Gán giáo viên'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
