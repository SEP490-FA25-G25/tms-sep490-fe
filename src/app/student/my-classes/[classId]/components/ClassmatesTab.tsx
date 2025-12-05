import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUpDown, Loader2, Search, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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

const PAGE_SIZE = 10;

// Helper function to get initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(-2); // Lấy 2 ký tự cuối (thường là tên trong tiếng Việt)
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ClassmatesTab: React.FC<ClassmatesTabProps> = ({ classmates, isLoading, enrollmentSummary: _enrollmentSummary }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'fullName', desc: false }, // Default: sort by name A-Z
  ]);
  const [page, setPage] = useState(0);

  // Filter classmates based on search term
  const filteredClassmates = useMemo(
    () =>
      classmates.filter((classmate) =>
        classmate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classmate.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [classmates, searchTerm]
  );

  // Define columns for the table
  const columns: ColumnDef<ClassmateDTO>[] = useMemo(() => [
    {
      id: 'student',
      accessorKey: 'fullName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Học viên
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const classmate = row.original;
        return (
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={classmate.avatar || undefined} alt={classmate.fullName} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(classmate.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground truncate">{classmate.fullName}</p>
              <p className="text-sm text-muted-foreground font-mono">{classmate.studentCode}</p>
              {/* Mobile: Show status inline */}
              <div className="sm:hidden mt-1 flex flex-wrap items-center gap-2">
                <Badge className={cn("text-xs", getStatusStyle(ENROLLMENT_STATUS_STYLES, classmate.enrollmentStatus))}>
                  {ENROLLMENT_STATUSES[classmate.enrollmentStatus]}
                </Badge>
              </div>
              <p className="md:hidden text-xs text-muted-foreground mt-0.5">
                {formatDate(classmate.enrollmentDate)}
              </p>
            </div>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'enrollmentStatus',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 hidden sm:flex"
        >
          Trạng thái
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge className={cn("text-xs", getStatusStyle(ENROLLMENT_STATUS_STYLES, row.original.enrollmentStatus))}>
          {ENROLLMENT_STATUSES[row.original.enrollmentStatus]}
        </Badge>
      ),
      meta: { className: 'hidden sm:table-cell' },
      enableSorting: true,
    },
    {
      accessorKey: 'enrollmentDate',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 hidden md:flex"
        >
          Ngày đăng ký
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.enrollmentDate)}
        </span>
      ),
      meta: { className: 'hidden md:table-cell' },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.original.enrollmentDate).getTime();
        const dateB = new Date(rowB.original.enrollmentDate).getTime();
        return dateA - dateB;
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.email || '—'}
        </span>
      ),
      meta: { className: 'hidden lg:table-cell' },
      enableSorting: false,
    },
  ], []);

  // Paginate filtered data
  const totalPages = Math.ceil(filteredClassmates.length / PAGE_SIZE);
  const paginatedClassmates = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredClassmates.slice(start, start + PAGE_SIZE);
  }, [filteredClassmates, page]);

  // Reset to first page when search changes
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(0);
  };

  const table = useReactTable({
    data: paginatedClassmates,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Thành viên lớp</h3>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm thành viên..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card className="overflow-hidden py-0">
        {filteredClassmates.length > 0 ? (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50">
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as { className?: string } | undefined;
                    return (
                      <TableHead key={header.id} className={meta?.className}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                return (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as { className?: string } | undefined;
                      return (
                        <TableCell key={cell.id} className={meta?.className}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
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

      {/* Pagination */}
      {filteredClassmates.length > PAGE_SIZE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            Trang {page + 1} / {totalPages}
          </span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((prev) => Math.max(prev - 1, 0));
                  }}
                  disabled={page === 0}
                />
              </PaginationItem>
              {/* Show page numbers only on sm+ screens, limit to 5 pages */}
              <span className="hidden sm:contents">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum = i;
                  if (totalPages > 5 && page > 2) {
                    pageNum = Math.min(page - 2 + i, totalPages - 1);
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(pageNum);
                        }}
                        isActive={pageNum === page}
                      >
                        {pageNum + 1}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
              </span>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((prev) => Math.min(prev + 1, totalPages - 1));
                  }}
                  disabled={page + 1 >= totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default ClassmatesTab;
