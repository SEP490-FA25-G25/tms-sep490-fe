import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Search, UserCircle, Users } from 'lucide-react';
import type { ClassmateDTO } from '@/types/studentClass';
import { ENROLLMENT_STATUSES } from '@/types/studentClass';
import { cn } from '@/lib/utils';
import { ENROLLMENT_STATUS_STYLES, getStatusStyle } from '@/lib/status-colors';

interface ClassmatesTabProps {
  classmates: ClassmateDTO[];
  isLoading: boolean;
  enrollmentSummary: {
    totalEnrolled: number;
    maxCapacity: number;
  };
}

const ClassmatesTab: React.FC<ClassmatesTabProps> = ({ classmates, isLoading, enrollmentSummary }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter classmates based on search term
  const filteredClassmates = useMemo(
    () =>
      classmates.filter((classmate) =>
        classmate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classmate.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [classmates, searchTerm]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Thành viên lớp</h3>
          <p className="text-sm text-muted-foreground">
            {enrollmentSummary.totalEnrolled}/{enrollmentSummary.maxCapacity} học viên ·
            Còn {enrollmentSummary.maxCapacity - enrollmentSummary.totalEnrolled} chỗ trống
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm thành viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        {filteredClassmates.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Họ tên</TableHead>
                <TableHead>MSSV</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày đăng ký</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Điểm danh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClassmates.map((classmate) => (
                <TableRow key={classmate.studentId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {classmate.avatar ? (
                        <img
                          src={classmate.avatar}
                          alt={classmate.fullName}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <UserCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium text-foreground">{classmate.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{classmate.studentCode}</TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", getStatusStyle(ENROLLMENT_STATUS_STYLES, classmate.enrollmentStatus))}>
                      {ENROLLMENT_STATUSES[classmate.enrollmentStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(classmate.enrollmentDate)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {classmate.email || '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {classmate.attendanceRate !== undefined
                      ? `${classmate.attendanceRate.toFixed(1)}%`
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-10">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users className="h-10 w-10" />
                </EmptyMedia>
                <EmptyTitle>
                  {searchTerm ? 'Không tìm thấy thành viên' : 'Chưa có thành viên'}
                </EmptyTitle>
                <EmptyDescription>
                  {searchTerm ? 'Không có thành viên trùng khớp tìm kiếm.' : 'Chưa có thành viên nào trong lớp.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ClassmatesTab;
