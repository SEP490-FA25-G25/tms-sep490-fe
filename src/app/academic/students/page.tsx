import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Search, Plus, Users, Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { StudentStatusBadge } from './components/StudentStatusBadge'
import { StudentDetailDrawer } from './components/StudentDetailDrawer'
import {
  useGetStudentsQuery,
  useGetStudentDetailQuery,
  type StudentListItemDTO,
} from '@/store/services/studentApi'
import { useDebounce } from '@/hooks/useDebounce'

// ========== Types ==========
type FilterState = {
  search: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | undefined
  gender: 'MALE' | 'FEMALE' | 'OTHER' | undefined
}

// ========== Component ==========

export default function StudentListPage() {
  // State cho filters
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: undefined,
    gender: undefined,
  })

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
    sort: 'studentCode',
    sortDir: 'asc',
  })

  // RTK Query - Lấy chi tiết học viên (chỉ fetch khi có selectedStudentId)
  const {
    data: studentDetailResponse,
    isLoading: isLoadingDetail,
  } = useGetStudentDetailQuery(selectedStudentId!, {
    skip: !selectedStudentId,
  })

  // Extract data from API response
  // Spring Boot Page response has nested "page" object for pagination info
  const students = studentsResponse?.data?.content || []
  const pageInfo = studentsResponse?.data?.page
  const totalElements = pageInfo?.totalElements || 0
  const totalPages = pageInfo?.totalPages || 1
  const studentDetail = studentDetailResponse?.data

  // Transform studentDetail to match drawer interface
  const drawerStudent = useMemo(() => {
    if (!studentDetail) return null
    return {
      id: studentDetail.id,
      studentCode: studentDetail.studentCode,
      fullName: studentDetail.fullName,
      gender: studentDetail.gender || 'OTHER',
      dob: studentDetail.dateOfBirth || null,
      phone: studentDetail.phone || null,
      email: studentDetail.email || null,
      address: studentDetail.address || null,
      facebookUrl: studentDetail.facebookUrl || null,
      avatarUrl: studentDetail.avatarUrl || null,
      status: studentDetail.status || 'ACTIVE',
      createdAt: studentDetail.createdAt || '',
      enrollments: studentDetail.currentClasses?.map((c, idx) => ({
        id: idx,
        classId: c.id,
        classCode: c.classCode,
        className: c.className,
        courseName: c.courseName,
        status: c.status === 'IN_PROGRESS' ? 'ENROLLED' : c.status === 'COMPLETED' ? 'COMPLETED' : 'ENROLLED',
        enrolledAt: c.startDate,
        leftAt: c.status === 'COMPLETED' ? c.plannedEndDate : null,
      })) || [],
    } as const
  }, [studentDetail])

  // Handlers
  const handleFilterChange = (
    key: keyof FilterState,
    value: string | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, page: 0 })) // Reset về trang đầu khi filter
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

  // Loading state
  const isLoading = isLoadingList && !studentsResponse

  return (
    <DashboardLayout
      title="Quản lý Học viên"
      description="Quản lý thông tin học viên và phân lớp"
      actions={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Thêm học viên
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm học viên..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              handleFilterChange('status', value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="ACTIVE">Hoạt động</SelectItem>
              <SelectItem value="SUSPENDED">Tạm khóa</SelectItem>
              <SelectItem value="INACTIVE">Đã nghỉ</SelectItem>
            </SelectContent>
          </Select>

          {/* Gender Filter */}
          <Select
            value={filters.gender || 'all'}
            onValueChange={(value) =>
              handleFilterChange('gender', value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Giới tính" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="MALE">Nam</SelectItem>
              <SelectItem value="FEMALE">Nữ</SelectItem>
              <SelectItem value="OTHER">Khác</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading indicator when fetching */}
        {isFetchingList && !isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang tải...</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[100px] font-semibold">
                    Mã HV
                  </TableHead>
                  <TableHead className="font-semibold">Họ và tên</TableHead>
                  <TableHead className="min-w-[120px] font-semibold">
                    Điện thoại
                  </TableHead>
                  <TableHead className="min-w-[180px] font-semibold">
                    Email
                  </TableHead>
                  <TableHead className="min-w-[100px] font-semibold">
                    Trạng thái
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
                    <TableCell className="font-medium">
                      {student.fullName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {student.phone || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[180px]">
                      {student.email || '—'}
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
                  className={
                    pagination.page === 0
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }
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
        student={drawerStudent}
        isLoading={isLoadingDetail}
        onEdit={handleEdit}
        onEnroll={handleEnroll}
      />
    </DashboardLayout>
  )
}
