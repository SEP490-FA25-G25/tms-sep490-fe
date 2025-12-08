import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle, Copy, Printer } from 'lucide-react'
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

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(studentData.defaultPassword)
    toast.success('Đã copy mật khẩu')
  }

  const handleCopyCredentials = () => {
    const credentials = `Mã học viên: ${studentData.studentCode}\nMật khẩu: ${studentData.defaultPassword}`
    navigator.clipboard.writeText(credentials)
    toast.success('Đã copy thông tin đăng nhập')
  }

  const handlePrintCredentials = () => {
    const printContent = `
      <html>
        <head>
          <title>Thông tin đăng nhập học viên</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { border: 2px solid #333; padding: 30px; max-width: 500px; margin: 0 auto; }
            .field { margin: 15px 0; font-size: 16px; }
            .label { font-weight: bold; }
            .value { font-family: monospace; font-size: 18px; color: #0066cc; }
            .warning { margin-top: 30px; padding: 15px; background: #fff3cd; border: 1px solid #ffc107; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>THÔNG TIN ĐĂNG NHẬP HỌC VIÊN</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Họ và tên:</div>
              <div class="value">${studentData.fullName}</div>
            </div>
            <div class="field">
              <div class="label">Email:</div>
              <div class="value">${studentData.email}</div>
            </div>
            <div class="field">
              <div class="label">Mã học viên:</div>
              <div class="value">${studentData.studentCode}</div>
            </div>
            <div class="field">
              <div class="label">Mật khẩu mặc định:</div>
              <div class="value">${studentData.defaultPassword}</div>
            </div>
            ${studentData.skillAssessmentsCreated > 0
        ? `
            <div class="field">
              <div class="label">Số đánh giá kỹ năng:</div>
              <div class="value">${studentData.skillAssessmentsCreated}</div>
            </div>
            `
        : ''
      }
            <div class="warning">
              <strong>⚠️ Lưu ý quan trọng:</strong><br/>
              Học viên cần đổi mật khẩu ngay lần đầu đăng nhập vào hệ thống.
            </div>
          </div>
        </body>
      </html>
    `
    const printWindow = window.open('', '', 'width=600,height=600')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
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
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono font-semibold bg-background px-2 py-1 rounded">
                    {studentData.defaultPassword}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={handleCopyPassword}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {studentData.skillAssessmentsCreated > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Đánh giá kỹ năng:</span>
                  <span className="text-sm font-medium">
                    {studentData.skillAssessmentsCreated} đánh giá
                  </span>
                </div>
              )}

              {/* Password Change Warning */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <strong>⚠️ Lưu ý:</strong> Học viên cần đổi mật khẩu lần đầu đăng nhập
              </div>

              {/* Quick Actions */}
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyCredentials}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy tất cả
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={handlePrintCredentials}
                >
                  <Printer className="h-3 w-3 mr-1" />
                  In thông tin
                </Button>
              </div>
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
