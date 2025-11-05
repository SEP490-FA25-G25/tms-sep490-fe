import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle, Copy } from 'lucide-react'
import { toast } from 'sonner'
import type { CreateStudentResponse } from '@/store/services/studentApi'

interface StudentCreatedSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentData: CreateStudentResponse | null
  onEnrollNow: (studentId: number) => void
  onAddLater: () => void
}

export function StudentCreatedSuccessDialog({
  open,
  onOpenChange,
  studentData,
  onEnrollNow,
  onAddLater,
}: StudentCreatedSuccessDialogProps) {
  if (!studentData) return null

  const handleCopyStudentCode = () => {
    navigator.clipboard.writeText(studentData.studentCode)
    toast.success('Đã copy mã học viên')
  }

  const handleEnrollNow = () => {
    onEnrollNow(studentData.studentId)
    onOpenChange(false)
  }

  const handleAddLater = () => {
    onAddLater()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center gap-4 pb-4">
            {/* Success Icon */}
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>

            {/* Title */}
            <DialogTitle className="text-2xl text-center">
              Tạo học viên thành công!
            </DialogTitle>

            {/* Student Info Card */}
            <div className="w-full border rounded-lg p-4 bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mã học viên:</span>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono font-semibold bg-background px-2 py-1 rounded">
                    {studentData.studentCode}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={handleCopyStudentCode}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mật khẩu mặc định:</span>
                <code className="text-sm font-mono font-semibold bg-background px-2 py-1 rounded">
                  {studentData.defaultPassword}
                </code>
              </div>

              {studentData.skillAssessmentsCreated > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Đánh giá kỹ năng:</span>
                  <span className="text-sm font-medium">
                    {studentData.skillAssessmentsCreated} đánh giá
                  </span>
                </div>
              )}
            </div>

            {/* Question */}
            <DialogDescription className="text-center text-base pt-2">
              Bạn có muốn ghi danh học viên này vào lớp hiện tại không?
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="sm:space-x-0 gap-3">
          <Button
            variant="outline"
            onClick={handleAddLater}
            className="flex-1"
          >
            Quản lý sau
          </Button>
          <Button
            onClick={handleEnrollNow}
            className="flex-1"
          >
            Ghi danh ngay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
