import { AlertCircle, ExternalLink } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { CheckStudentExistenceResponse } from '@/store/services/studentApi'

interface ExistingStudentWarningProps {
  data: CheckStudentExistenceResponse
  onViewDetails: () => void
}

export function ExistingStudentWarning({
  data,
  onViewDetails,
}: ExistingStudentWarningProps) {
  const { studentCode, fullName, currentBranches, canAddToCurrentBranch } = data

  return (
    <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="ml-2 space-y-3">
        <div className="text-sm font-medium text-amber-800 dark:text-amber-300">
          Học viên đã tồn tại trên hệ thống
        </div>

        <div className="text-sm space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Họ tên:</span>
            <span className="font-medium">{fullName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Mã học viên:</span>
            <span className="font-mono font-medium">{studentCode}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Chi nhánh hiện tại:</span>
            <div className="flex flex-wrap gap-1">
              {currentBranches?.map((branch) => (
                <Badge key={branch.id} variant="secondary" className="text-xs">
                  {branch.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onViewDetails}
            className="h-auto p-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Xem chi tiết & Đồng bộ
          </Button>
          
          {!canAddToCurrentBranch && (
            <span className="text-xs text-muted-foreground">
              (Học viên đã thuộc chi nhánh này)
            </span>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
