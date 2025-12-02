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
import type { ClassStudentDTO } from '@/store/services/classApi'
import { Users } from 'lucide-react'

interface StudentsTabProps {
  students: ClassStudentDTO[]
  isLoading: boolean
  totalStudents: number
  onStudentClick: (studentId: number) => void
}

export function StudentsTab({ students, isLoading, totalStudents, onStudentClick }: StudentsTabProps) {
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
                <TableHead className="min-w-[120px]">Chi nhánh</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Học viên đã ghi danh
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({totalStudents} học viên)
          </span>
        </h3>
      </div>

      {students.length > 0 ? (
        <div className="rounded-lg border overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[180px] font-semibold">Học viên</TableHead>
                <TableHead className="min-w-[180px] font-semibold">Thư điện tử</TableHead>
                <TableHead className="min-w-[120px] font-semibold">Điện thoại</TableHead>
                <TableHead className="min-w-[120px] font-semibold">Chi nhánh</TableHead>
                <TableHead className="min-w-[120px] font-semibold">Ngày ghi danh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student: ClassStudentDTO) => (
                <TableRow key={student.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onStudentClick(student.id)}>
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
                  <TableCell>{student.branchName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(student.enrolledAt).toLocaleDateString('vi-VN')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
