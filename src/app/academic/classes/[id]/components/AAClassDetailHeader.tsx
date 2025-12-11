import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ClassInfoHeader } from '@/components/class/ClassInfoHeader'
import type { ClassDetailDTO } from '@/store/services/classApi'
import {
  Users,
  ChevronDown,
  FileUp,
  UserPlus,
  AlertCircle,
} from 'lucide-react'

interface AAClassDetailHeaderProps {
  classData: ClassDetailDTO
  onEnrollFromExisting?: () => void
  onEnrollNewStudent?: () => void
  onEnrollFromExcel?: () => void
}

export function AAClassDetailHeader({
  classData,
  onEnrollFromExisting,
  onEnrollNewStudent,
  onEnrollFromExcel,
}: AAClassDetailHeaderProps) {
  const actions = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          Ghi danh Học viên
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onEnrollFromExisting || undefined}>
          <Users className="mr-2 h-4 w-4" />
          Chọn từ học viên có sẵn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEnrollNewStudent || undefined}>
          <UserPlus className="mr-2 h-4 w-4" />
          Tạo học viên mới
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEnrollFromExcel || undefined}>
          <FileUp className="mr-2 h-4 w-4" />
          Nhập từ Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <>
      <ClassInfoHeader classData={classData} actions={actions} />
      
      {/* Rejection Alert - AA-specific */}
      {classData.approvalStatus === 'REJECTED' && classData.rejectionReason && (
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lớp học bị từ chối</AlertTitle>
            <AlertDescription>
              Lý do: {classData.rejectionReason}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  )
}
