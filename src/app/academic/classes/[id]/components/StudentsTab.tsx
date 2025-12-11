import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import type { ClassStudentDTO } from '@/store/services/classApi'
import { Users, Search } from 'lucide-react'

interface StudentsTabProps {
  students: ClassStudentDTO[]
  isLoading: boolean
  totalStudents: number
  onStudentClick: (studentId: number) => void
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function StudentsTab({ students, isLoading, totalStudents, onStudentClick, currentPage, totalPages, onPageChange, searchQuery, onSearchChange }: StudentsTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[180px]">Học viên</TableHead>
                <TableHead className="min-w-[180px]">Thư điện tử</TableHead>
                <TableHead className="min-w-[120px]">Điện thoại</TableHead>
                <TableHead className="min-w-[200px]">Địa chỉ</TableHead>
                <TableHead className="min-w-[120px]">Ngày ghi danh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">
          Học viên đã ghi danh
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({totalStudents} học viên)
          </span>
        </h3>
        
        {/* Search bar */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên, mã, email, SĐT..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {students.length > 0 ? (
        <>
          <div className="rounded-lg border overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[180px] font-semibold">Học viên</TableHead>
                  <TableHead className="min-w-[180px] font-semibold">Thư điện tử</TableHead>
                  <TableHead className="min-w-[120px] font-semibold">Điện thoại</TableHead>
                  <TableHead className="min-w-[200px] font-semibold">Địa chỉ</TableHead>
                  <TableHead className="min-w-[120px] font-semibold">Ngày ghi danh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: ClassStudentDTO) => (
                  <TableRow key={student.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onStudentClick(student.studentId)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.avatarUrl || ''} alt={student.fullName} />
                          <AvatarFallback className="text-xs">
                            {student.fullName?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.fullName}</div>
                          <div className="text-sm text-muted-foreground">{student.studentCode}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{student.email}</TableCell>
                    <TableCell className="text-muted-foreground">{student.phone}</TableCell>
                    <TableCell className="text-muted-foreground">{student.address || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(student.enrolledAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination - consistent with other pages */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Trang {currentPage + 1} / {Math.max(totalPages, 1)} · {totalStudents} học viên
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      onPageChange(currentPage - 1)
                    }}
                    aria-disabled={currentPage === 0}
                    className={currentPage === 0 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, Math.max(totalPages, 1)) }, (_, i) => {
                  // Show pages around current page
                  let pageNum = i
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
                          onPageChange(pageNum)
                        }}
                        isActive={pageNum === currentPage}
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
                      onPageChange(currentPage + 1)
                    }}
                    aria-disabled={currentPage >= Math.max(totalPages, 1) - 1}
                    className={currentPage >= Math.max(totalPages, 1) - 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Chưa có học viên nào ghi danh.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Sử dụng nút "Ghi danh Học viên" ở trên để thêm học viên vào lớp.
          </p>
        </div>
      )}
    </div>
  )
}
