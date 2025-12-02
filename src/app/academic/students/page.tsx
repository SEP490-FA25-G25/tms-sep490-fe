import { useState, useMemo } from 'react'
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
  Search,
  Plus,
  Users,
  Loader2,
  Download,
  UserCheck,
  GraduationCap,
  UserX,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { StudentStatusBadge } from './components/StudentStatusBadge'
import { StudentDetailDrawer } from './components/StudentDetailDrawer'
import {
  useGetStudentsQuery,
  useGetStudentDetailQuery,
  useExportStudentsMutation,
  type StudentListItemDTO,
} from '@/store/services/studentApi'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from 'sonner'

// ========== Types ==========
type EnrollmentFilter = 'all' | 'enrolled' | 'not_enrolled'
type SortField = 'studentCode' | 'fullName' | 'lastEnrollmentDate' | 'activeEnrollments' | 'status'
type SortDirection = 'asc' | 'desc'

type FilterState = {
  search: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | undefined
  gender: 'MALE' | 'FEMALE' | 'OTHER' | undefined
  enrollmentStatus: EnrollmentFilter
}

// ========== Sortable Column Header Component ==========
function SortableHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
  className = '',
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

// ========== Component ==========

export default function StudentListPage() {
  // State cho filters
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: undefined,
    gender: undefined,
    enrollmentStatus: 'all',
  })

  // State cho sort - server-side sorting via column headers
  const [sortField, setSortField] = useState<SortField>('studentCode')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  // Debounce search để tránh gọi API liên tục khi user đang gõ
  const debouncedSearch = useDebounce(filters.search, 300)

  // State cho pagination
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
  })

  // State cho drawer chi tiết
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)

  // RTK Query - Lấy danh sách học viên
  const {
    data: studentsResponse,
    isLoading: isLoadingList,
    isFetching: isFetchingList,
    error: listError,
  } = useGetStudentsQuery({
    search: debouncedSearch || undefined,
    status: filters.status,
    gender: filters.gender,
    page: pagination.page,
    size: pagination.size,
    sort: sortField,
    sortDir: sortDir,
  })

  // RTK Query - Lấy chi tiết học viên (chỉ fetch khi có selectedStudentId)
  const { data: studentDetailResponse, isLoading: isLoadingDetail } =
    useGetStudentDetailQuery(selectedStudentId!, {
      skip: !selectedStudentId,
    })

  // RTK Query - Export students
  const [exportStudents, { isLoading: isExporting }] = useExportStudentsMutation()

  // Extract data from API response
  // Spring Boot Page response has nested "page" object for pagination info
  const rawStudents = useMemo(() => studentsResponse?.data?.content || [], [studentsResponse?.data?.content])
  const pageInfo = studentsResponse?.data?.page
  const studentDetail = studentDetailResponse?.data

  // Filter students by enrollment status (frontend filter)
  const students = useMemo(() => {
    if (filters.enrollmentStatus === 'all') return rawStudents
    return rawStudents.filter((student) => {
      if (filters.enrollmentStatus === 'enrolled') {
        return student.activeEnrollments > 0
      }
      return student.activeEnrollments === 0
    })
  }, [rawStudents, filters.enrollmentStatus])

  const totalElements =
    filters.enrollmentStatus === 'all'
      ? pageInfo?.totalElements || 0
      : students.length
  const totalPages =
    filters.enrollmentStatus === 'all'
      ? pageInfo?.totalPages || 1
      : Math.ceil(students.length / pagination.size) || 1

  // Statistics computed from current page data
  const statistics = useMemo(() => {
    const activeCount = rawStudents.filter((s) => s.status === 'ACTIVE').length
    const enrolledCount = rawStudents.filter((s) => s.activeEnrollments > 0).length
    const notEnrolledCount = rawStudents.filter((s) => s.activeEnrollments === 0).length
    return {
      total: pageInfo?.totalElements || rawStudents.length,
      active: activeCount,
      enrolled: enrolledCount,
      notEnrolled: notEnrolledCount,
    }
  }, [rawStudents, pageInfo?.totalElements])

  // Handlers
  const handleFilterChange = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, page: 0 })) // Reset về trang đầu khi filter
  }

  // Handle column header sort - toggle direction if same field, else set new field
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      // New field, default to asc for code/name, desc for dates/counts
      setSortField(field)
      setSortDir(field === 'studentCode' || field === 'fullName' ? 'asc' : 'desc')
    }
    setPagination((prev) => ({ ...prev, page: 0 }))
  }

  const handleRowClick = (student: StudentListItemDTO) => {
    setSelectedStudentId(student.id)
    setDrawerOpen(true)
  }

  const handleEdit = () => {
    // TODO: Mở modal chỉnh sửa thông tin
    console.log('Edit student:', selectedStudentId)
  }

  const handleEnroll = () => {
    // TODO: Mở modal phân lớp
    console.log('Enroll student:', selectedStudentId)
  }

  const handleExport = async () => {
    try {
      const result = await exportStudents({
        search: debouncedSearch || undefined,
        status: filters.status,
        gender: filters.gender,
      }).unwrap()

      // Create download link
      const url = window.URL.createObjectURL(result)
      const link = document.createElement('a')
      link.href = url
      link.download = `danh-sach-hoc-vien-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Xuất danh sách học viên thành công!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Có lỗi xảy ra khi xuất file. Vui lòng thử lại.')
    }
  }

  // Loading state
  const isLoading = isLoadingList && !studentsResponse

  return (
    <DashboardLayout
      title="Quản lý Học viên"
      description="Quản lý thông tin học viên và phân lớp"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Xuất Excel
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm học viên
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Statistics Summary */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng học viên</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-950/30">
                <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground">Tổng số học viên</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.active}</div>
              <p className="text-xs text-muted-foreground">Học viên hoạt động</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang học</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.enrolled}</div>
              <p className="text-xs text-muted-foreground">Học viên đang học</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chưa ghi danh</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <UserX className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.notEnrolled}</div>
              <p className="text-xs text-muted-foreground">Chưa có lớp học</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search - bên trái */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm mã, tên, SĐT, email..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          {/* Filters - bên phải */}
          <div className="flex items-center gap-2 ml-auto">
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                handleFilterChange('status', value === 'all' ? undefined : value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED')
              }
            >
              <SelectTrigger className="h-9 w-auto min-w-[140px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Trạng thái: Tất cả</SelectItem>
                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                <SelectItem value="SUSPENDED">Tạm khóa</SelectItem>
                <SelectItem value="INACTIVE">Đã nghỉ</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.gender || 'all'}
              onValueChange={(value) =>
                handleFilterChange('gender', value === 'all' ? undefined : value as 'MALE' | 'FEMALE' | 'OTHER')
              }
            >
              <SelectTrigger className="h-9 w-auto min-w-[120px]">
                <SelectValue placeholder="Giới tính" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Giới tính: Tất cả</SelectItem>
                <SelectItem value="MALE">Nam</SelectItem>
                <SelectItem value="FEMALE">Nữ</SelectItem>
                <SelectItem value="OTHER">Khác</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.enrollmentStatus}
              onValueChange={(value) =>
                handleFilterChange('enrollmentStatus', value as EnrollmentFilter)
              }
            >
              <SelectTrigger className="h-9 w-auto min-w-[130px]">
                <SelectValue placeholder="Tình trạng học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Ghi danh: Tất cả</SelectItem>
                <SelectItem value="enrolled">Đang học</SelectItem>
                <SelectItem value="not_enrolled">Chưa ghi danh</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Student List */}
        {isLoading || isFetchingList ? (
          /* Table Skeleton */
          <div className="rounded-lg border bg-card overflow-hidden">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[100px] font-semibold">Mã HV</TableHead>
                  <TableHead className="font-semibold">Họ và tên</TableHead>
                  <TableHead className="min-w-[120px] font-semibold">Điện thoại</TableHead>
                  <TableHead className="min-w-[180px] font-semibold">Email</TableHead>
                  <TableHead className="min-w-[80px] font-semibold text-center">Đang học</TableHead>
                  <TableHead className="min-w-[120px] font-semibold">GD gần nhất</TableHead>
                  <TableHead className="min-w-[100px] font-semibold">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(10)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-4 w-6 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : listError ? (
          <div className="text-center py-12 text-destructive">
            <p>Có lỗi xảy ra khi tải danh sách học viên.</p>
            <p className="text-sm mt-2">Vui lòng thử lại sau.</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Không tìm thấy học viên nào phù hợp với tiêu chí của bạn.</p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[100px]">
                    <SortableHeader
                      label="Mã HV"
                      field="studentCode"
                      currentSort={sortField}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Họ và tên"
                      field="fullName"
                      currentSort={sortField}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="min-w-[120px] font-semibold">Điện thoại</TableHead>
                  <TableHead className="min-w-[180px] font-semibold">Email</TableHead>
                  <TableHead className="min-w-[80px]">
                    <SortableHeader
                      label="Đang học"
                      field="activeEnrollments"
                      currentSort={sortField}
                      currentDir={sortDir}
                      onSort={handleSort}
                      className="justify-center"
                    />
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    <SortableHeader
                      label="GD gần nhất"
                      field="lastEnrollmentDate"
                      currentSort={sortField}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="min-w-[100px]">
                    <SortableHeader
                      label="Trạng thái"
                      field="status"
                      currentSort={sortField}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow
                    key={student.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(student)}
                  >
                    <TableCell className="font-mono font-medium">
                      {student.studentCode}
                    </TableCell>
                    <TableCell className="font-medium">{student.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {student.phone || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[180px]">
                      {student.email || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={
                          student.activeEnrollments > 0
                            ? 'text-blue-600 font-medium'
                            : 'text-muted-foreground'
                        }
                      >
                        {student.activeEnrollments || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {student.lastEnrollmentDate
                        ? new Date(student.lastEnrollmentDate).toLocaleDateString('vi-VN')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <StudentStatusBadge status={student.status || 'ACTIVE'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination - luôn hiển thị */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Trang {pagination.page + 1} / {totalPages || 1} · {totalElements} học viên
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.max(0, prev.page - 1),
                    }))
                  }}
                  aria-disabled={pagination.page === 0}
                  className={pagination.page === 0 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages || 1) }, (_, i) => {
                // Show pages around current page
                let pageNum = i
                if ((totalPages || 1) > 5) {
                  if (pagination.page < 3) {
                    pageNum = i
                  } else if (pagination.page > (totalPages || 1) - 4) {
                    pageNum = (totalPages || 1) - 5 + i
                  } else {
                    pageNum = pagination.page - 2 + i
                  }
                }
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setPagination((prev) => ({ ...prev, page: pageNum }))
                      }}
                      isActive={pageNum === pagination.page}
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
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min((totalPages || 1) - 1, prev.page + 1),
                    }))
                  }}
                  aria-disabled={pagination.page >= (totalPages || 1) - 1}
                  className={
                    pagination.page >= (totalPages || 1) - 1
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* Detail Drawer */}
      <StudentDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        student={studentDetail ?? null}
        isLoading={isLoadingDetail}
        onEdit={handleEdit}
        onEnroll={handleEnroll}
      />
    </DashboardLayout>
  )
}
