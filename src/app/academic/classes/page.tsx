import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Search,
  Plus,
  Calendar,
  ChevronRight,
  PlayCircle,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ChevronsUpDown,
  Check,
  BookOpen
} from 'lucide-react'
import { useGetClassesQuery } from '@/store/services/classApi'
import type { ClassListItemDTO, ClassListRequest, TeacherSummaryDTO } from '@/store/services/classApi'
import { useGetAllCoursesQuery } from '@/store/services/courseApi'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useNavigate } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'

// ========== Types ==========
type SortField = 'startDate' | 'name' | 'code' | 'currentEnrolled' | 'status'
type SortDirection = 'asc' | 'desc'

type FilterState = Omit<ClassListRequest, 'page' | 'size' | 'sort' | 'sortDir' | 'status' | 'approvalStatus'> & {
  unifiedStatus?: string // Gộp status + approvalStatus
}

// ========== Sortable Column Header Component ==========
function SortableHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
  className = ''
}: {
  label: string
  field: SortField
  currentSort: string
  currentDir: SortDirection
  onSort: (field: SortField) => void
  className?: string
}) {
  const isActive = currentSort === field
  
  return (
    <Button
      variant="ghost"
      onClick={() => onSort(field)}
      className={`h-8 px-2 -ml-2 font-semibold hover:bg-muted/50 ${className}`}
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

export default function ClassListPage() {
  const navigate = useNavigate()
  
  // State cho filters
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    courseId: undefined,
    unifiedStatus: undefined,
    modality: undefined,
  })

  // State cho sort - server-side sorting via column headers
  const [sortField, setSortField] = useState<SortField>('startDate')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')

  // Debounce search để tránh gọi API liên tục khi user đang gõ
  const debouncedSearch = useDebounce(filters.search, 300)

  const [pagination, setPagination] = useState({
    page: 0, // Backend uses 0-based pagination
    size: 20, // Backend uses 'size' instead of 'limit'
  })

  // State cho course combobox
  const [courseOpen, setCourseOpen] = useState(false)

  // Fetch courses for filter
  const { data: courses = [] } = useGetAllCoursesQuery()

  // Chuyển đổi unifiedStatus thành status/approvalStatus cho API
  const { apiStatus, apiApprovalStatus } = useMemo(() => {
    const unified = filters.unifiedStatus
    if (!unified) return { apiStatus: undefined, apiApprovalStatus: undefined }
    
    // Map unifiedStatus -> API params
    switch (unified) {
      case 'DRAFT':
        return { apiStatus: 'DRAFT' as const, apiApprovalStatus: undefined }
      case 'PENDING':
        return { apiStatus: undefined, apiApprovalStatus: 'PENDING' as const }
      case 'REJECTED':
        return { apiStatus: undefined, apiApprovalStatus: 'REJECTED' as const }
      case 'SCHEDULED':
        return { apiStatus: 'SCHEDULED' as const, apiApprovalStatus: 'APPROVED' as const }
      case 'ONGOING':
        return { apiStatus: 'ONGOING' as const, apiApprovalStatus: undefined }
      case 'COMPLETED':
        return { apiStatus: 'COMPLETED' as const, apiApprovalStatus: undefined }
      case 'CANCELLED':
        return { apiStatus: 'CANCELLED' as const, apiApprovalStatus: undefined }
      default:
        return { apiStatus: undefined, apiApprovalStatus: undefined }
    }
  }, [filters.unifiedStatus])

  const queryParams = useMemo(() => ({
    search: debouncedSearch || undefined,
    courseId: filters.courseId || undefined,
    status: apiStatus,
    approvalStatus: apiApprovalStatus,
    modality: filters.modality || undefined,
    sort: sortField,
    sortDir: sortDir,
    ...pagination,
  }), [debouncedSearch, filters.courseId, apiStatus, apiApprovalStatus, filters.modality, sortField, sortDir, pagination])

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      (filters.search?.trim() ?? '') !== '' ||
      filters.courseId !== undefined ||
      filters.unifiedStatus !== undefined ||
      filters.modality !== undefined
    )
  }, [filters])

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      search: '',
      courseId: undefined,
      unifiedStatus: undefined,
      modality: undefined,
    })
    setPagination(prev => ({ ...prev, page: 0 }))
  }

  const {
    data: response,
    error
  } = useGetClassesQuery(queryParams, {
    // Force refetch when quay lại màn hình để thấy lớp mới/lưu nháp ngay,
    // không phụ thuộc cache cũ của RTK Query
    refetchOnMountOrArgChange: true,
  })

  // Statistics computed from API response
  const statistics = useMemo(() => {
    const classes = response?.data?.content || []
    const ongoingCount = classes.filter(c => c.status === 'ONGOING').length
    const pendingCount = classes.filter(c => c.approvalStatus === 'PENDING').length
    const completedCount = classes.filter(c => c.status === 'COMPLETED').length
    return {
      total: response?.data?.page?.totalElements || classes.length,
      ongoing: ongoingCount,
      pending: pendingCount,
      completed: completedCount,
    }
  }, [response?.data])

  const handleFilterChange = (key: keyof FilterState, value: string | number | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 0 })) // Reset to first page when filter changes (0-based)
  }

  // Handle column header sort - toggle direction if same field, else set new field with desc
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to desc
      setSortField(field)
      setSortDir('desc')
    }
    setPagination(prev => ({ ...prev, page: 0 }))
  }

  const getCapacityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100
    if (percentage < 80) return 'bg-green-100 text-green-800 border-green-200'
    if (percentage < 95) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-800 border-slate-200'
      case 'SUBMITTED':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'ONGOING':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Bản nháp'
      case 'SUBMITTED':
        return 'Đã gửi duyệt'
      case 'SCHEDULED':
        return 'Đã lên lịch'
      case 'ONGOING':
        return 'Đang diễn ra'
      case 'COMPLETED':
        return 'Đã hoàn thành'
      case 'CANCELLED':
        return 'Đã hủy'
      default:
        return status
    }
  }

  // Gộp hiển thị: ưu tiên approvalStatus; nếu APPROVED thì hiển thị trạng thái vận hành
  const getUnifiedStatus = (status: string, approval?: string | null) => {
    if (approval === 'PENDING') {
      return { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-800 border-amber-200' }
    }
    if (approval === 'REJECTED') {
      return { label: 'Đã từ chối', color: 'bg-red-100 text-red-800 border-red-200' }
    }
    // APPROVED hoặc không có approvalStatus
    return { label: getStatusLabel(status), color: getStatusColor(status) }
  }

  const renderTeachers = (teachers: TeacherSummaryDTO[]) => {
    if (!teachers || teachers.length === 0) {
      return (
        <span className="text-muted-foreground">Chưa phân công</span>
      )
    }

    const displayTeachers = teachers.slice(0, 3)
    const remainingCount = teachers.length - 3

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <div className="flex flex-col gap-0.5">
                {displayTeachers.map((teacher) => (
                  <span key={teacher.id} className="text-sm">
                    {teacher.fullName}
                  </span>
                ))}
                {remainingCount > 0 && (
                  <span className="text-sm text-muted-foreground">
                    +{remainingCount} giáo viên nữa...
                  </span>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold text-sm mb-2">Tất cả giáo viên</p>
              {teachers.map((teacher) => (
                <div key={teacher.id} className="text-sm">
                  <div className="font-medium">{teacher.fullName}</div>
                  <div className="text-xs text-muted-foreground">
                    {teacher.email} • {teacher.sessionCount} buổi học
                  </div>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (error) {
    return (
      <DashboardLayout
        title="Quản lý Lớp học"
        description="Quản lý và xem tất cả các lớp học trong chi nhánh của bạn"
      >
        <div className="rounded-lg border bg-card p-6">
          <div className="text-center text-destructive">
            <p>Không thể tải lớp học. Vui lòng thử lại.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Quản lý Lớp học"
      description="Quản lý và xem tất cả các lớp học trong chi nhánh của bạn"
      actions={
        <Button onClick={() => navigate('/academic/classes/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Lớp học mới
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Statistics Summary */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng lớp học</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-950/30">
                <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground">Tổng số lớp học</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang diễn ra</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <PlayCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.ongoing}</div>
              <p className="text-xs text-muted-foreground">Lớp đang học</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.pending}</div>
              <p className="text-xs text-muted-foreground">Lớp chờ phê duyệt</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã hoàn thành</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.completed}</div>
              <p className="text-xs text-muted-foreground">Lớp đã kết thúc</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search - bên trái */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm mã, tên lớp, khóa học..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          {/* Filters - bên phải */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Course Combobox Filter */}
            <Popover open={courseOpen} onOpenChange={setCourseOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={courseOpen}
                  className="h-9 w-auto min-w-[180px] justify-between"
                >
                  <BookOpen className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  {filters.courseId
                    ? courses.find((course) => course.id === filters.courseId)?.name || 'Chọn khóa học'
                    : 'Khóa học: Tất cả'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Tìm khóa học..." />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy khóa học.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          handleFilterChange('courseId', undefined)
                          setCourseOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            !filters.courseId ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        Tất cả khóa học
                      </CommandItem>
                      {courses.map((course) => (
                        <CommandItem
                          key={course.id}
                          value={`${course.code} ${course.name}`}
                          onSelect={() => {
                            handleFilterChange('courseId', course.id)
                            setCourseOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              filters.courseId === course.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{course.name}</span>
                            <span className="text-xs text-muted-foreground">{course.code}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Select
              value={filters.unifiedStatus || 'all'}
              onValueChange={(value) => handleFilterChange('unifiedStatus', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="h-9 w-auto min-w-[160px]">
                <SelectValue placeholder="Giai đoạn lớp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Giai đoạn: Tất cả</SelectItem>
                <SelectItem value="DRAFT">Bản nháp</SelectItem>
                <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                <SelectItem value="REJECTED">Đã từ chối</SelectItem>
                <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
                <SelectItem value="ONGOING">Đang diễn ra</SelectItem>
                <SelectItem value="COMPLETED">Đã hoàn thành</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.modality || 'all'}
              onValueChange={(value) => handleFilterChange('modality', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="h-9 w-auto min-w-[130px]">
                <SelectValue placeholder="Hình thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hình thức: Tất cả</SelectItem>
                <SelectItem value="ONLINE">Trực tuyến</SelectItem>
                <SelectItem value="OFFLINE">Trực tiếp</SelectItem>
                <SelectItem value="HYBRID">Kết hợp</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              title="Xóa bộ lọc"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Class List */}
        <div>
          {response?.data?.content ? (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[20%]">
                      <SortableHeader
                        label="Lớp học"
                        field="name"
                        currentSort={sortField}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[22%] font-semibold">Khóa học</TableHead>
                    <TableHead className="w-[10%] font-semibold">Tiến trình</TableHead>
                    <TableHead className="w-[18%] font-semibold">Giáo viên</TableHead>
                    <TableHead className="w-[10%]">
                      <SortableHeader
                        label="Sĩ số"
                        field="currentEnrolled"
                        currentSort={sortField}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[12%]">
                      <SortableHeader
                        label="Giai đoạn"
                        field="status"
                        currentSort={sortField}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[8%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {response.data.content.map((classItem: ClassListItemDTO) => {
                    const totalSessions = classItem.totalSessions || 0
                    const completedSessions = classItem.completedSessions || 0
                    const progressPercent = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0

                    return (
                      <TableRow
                        key={classItem.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/academic/classes/${classItem.id}`)}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{classItem.name}</div>
                            <div className="text-sm text-muted-foreground">{classItem.code}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {new Date(classItem.startDate).toLocaleDateString('vi-VN')} - {new Date(classItem.plannedEndDate).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{classItem.courseName}</div>
                            <div className="text-sm text-muted-foreground">{classItem.courseCode}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="space-y-1 cursor-help">
                                  <div className="text-xs text-muted-foreground">
                                    {completedSessions}/{totalSessions}
                                  </div>
                                  <Progress value={progressPercent} className="h-2 w-20" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Đã hoàn thành {completedSessions} trên {totalSessions} buổi</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          {renderTeachers(classItem.teachers)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getCapacityColor(classItem.currentEnrolled, classItem.maxCapacity)}
                          >
                            {classItem.currentEnrolled}/{classItem.maxCapacity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const unified = getUnifiedStatus(classItem.status, classItem.approvalStatus)
                            return (
                              <Badge variant="outline" className={unified.color}>
                                {unified.label}
                              </Badge>
                            )
                          })()}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy lớp học nào phù hợp với tiêu chí của bạn.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {response?.data?.page && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Trang {response.data.page.number + 1} / {response.data.page.totalPages} · {response.data.page.totalElements} lớp học
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setPagination(prev => ({ ...prev, page: prev.page - 1 }))
                    }}
                    aria-disabled={response.data.page.number === 0}
                    className={response.data.page.number === 0 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, response.data.page.totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum = i
                  const totalPages = response.data.page.totalPages
                  const currentPage = response.data.page.number
                  if (totalPages > 5) {
                    if (currentPage < 3) {
                      pageNum = i
                    } else if (currentPage > totalPages - 4) {
                      pageNum = totalPages - 5 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setPagination(prev => ({ ...prev, page: pageNum }))
                        }}
                        isActive={pageNum === response.data.page.number}
                      >
                        {pageNum + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
                    }}
                    aria-disabled={response.data.page.number >= response.data.page.totalPages - 1}
                    className={response.data.page.number >= response.data.page.totalPages - 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
