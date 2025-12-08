import { useMemo } from 'react'
import { useGetClassSessionsQuery } from '@/store/services/classCreationApi'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Step2ReviewSessionsProps {
  classId: number | null
}

function formatDate(dateString: string) {
  try {
    return format(new Date(dateString), 'EEEE, dd/MM/yyyy', { locale: vi })
  } catch {
    return dateString
  }
}

export function Step2ReviewSessions({ classId }: Step2ReviewSessionsProps) {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetClassSessionsQuery(classId ?? 0, {
    skip: !classId,
    refetchOnMountOrArgChange: true, // Refetch when returning to this step after schedule changes
  })

  const overview = data?.data

  // Group sessions by week
  const weekGroups = useMemo(() => {
    if (!overview?.groupedByWeek?.length) return []

    const sessionMap = new Map(
      overview.sessions.map((session) => [session.sessionId, session])
    )

    return overview.groupedByWeek.map((week) => ({
      ...week,
      sessions: week.sessionIds
        .map((id) => sessionMap.get(id))
        .filter(Boolean)
    }))
  }, [overview])

  if (!classId) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vui lòng hoàn thành Bước 1 trước khi xem lại các buổi học.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Alert variant="destructive">
          <AlertDescription>Không thể tải danh sách buổi học.</AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Thử lại
        </Button>
      </div>
    )
  }

  if (!overview || overview.sessions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert>
          <AlertDescription>Chưa có buổi học nào được tạo.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Xem lại buổi học</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Hệ thống đã tạo {overview.totalSessions} buổi học từ ngày {overview.dateRange.startDate} đến {overview.dateRange.endDate}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 p-4 rounded-lg border bg-muted/30">
        <div>
          <p className="text-sm text-muted-foreground">Tổng buổi</p>
          <p className="text-lg font-medium">{overview.totalSessions}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Số tuần</p>
          <p className="text-lg font-medium">{weekGroups.length}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Bắt đầu</p>
          <p className="text-lg font-medium">{overview.dateRange.startDate}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Kết thúc</p>
          <p className="text-lg font-medium">{overview.dateRange.endDate}</p>
        </div>
      </div>

      {/* Sessions by Week */}
      <div className="space-y-6">
        {weekGroups.map((week) => (
          <div key={week.weekNumber} className="rounded-lg border">
            <div className="px-4 py-3 border-b bg-muted/30">
              <span className="font-medium">Tuần {week.weekNumber}</span>
              <span className="text-sm text-muted-foreground ml-2">
                ({week.weekRange}) • {week.sessions.length} buổi
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead className="w-48">Ngày</TableHead>
                  <TableHead>Nội dung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {week.sessions.map((session) => (
                  <TableRow key={session?.sessionId}>
                    <TableCell className="font-medium">{session?.sequenceNumber}</TableCell>
                    <TableCell>{formatDate(session?.date || '')}</TableCell>
                    <TableCell>{session?.courseSessionName || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    </div>
  )
}
