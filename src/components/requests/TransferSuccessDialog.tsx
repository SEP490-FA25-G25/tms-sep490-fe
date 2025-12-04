import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, ArrowRight, Mail, User } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { TransferRequestResponse } from '@/types/academicTransfer'

interface TransferSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: TransferRequestResponse | null | undefined
  userType?: 'student' | 'aa'
}

export default function TransferSuccessDialog({
  open,
  onOpenChange,
  request,
  userType = 'student',
}: TransferSuccessDialogProps) {
  if (!request) return null

  const isAA = userType === 'aa'

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Đã duyệt</Badge>
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Chờ duyệt</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleViewRequests = () => {
    onOpenChange(false)
    window.location.href = isAA ? '/academic/student-requests' : '/student/requests'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-center text-xl font-semibold">
            <CheckCircle className="h-5 w-5 text-green-500" />
            {isAA ? 'ĐÃ CHUYỂN LỚP THÀNH CÔNG' : 'YÊU CẦU ĐÃ ĐƯỢC GỬI'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center text-base font-medium text-green-600">
            {isAA
              ? 'Yêu cầu đã được phê duyệt và hệ thống đã chuyển học viên sang lớp mới.'
              : 'Yêu cầu chuyển lớp của bạn đã được gửi thành công.'}
          </div>

          <div className="rounded-lg border border-border/70 p-4 text-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Mã yêu cầu</span>
              <span className="font-medium">#{request.id}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Thời gian tạo</span>
              <span>{format(new Date(request.submittedAt), 'HH:mm, dd/MM/yyyy', { locale: vi })}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Trạng thái</span>
              {getStatusBadge(request.status)}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-dashed pt-3">
              <span className="font-medium">Từ:</span>
              <span>{request.currentClass.code} - {request.currentClass.name}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span>{request.targetClass.code} - {request.targetClass.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Ngày hiệu lực: {format(new Date(request.effectiveDate), 'dd/MM/yyyy', { locale: vi })}</span>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900 space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <User className="h-4 w-4" />
              {isAA ? 'Các bước hệ thống đã thực hiện' : 'Các bước tiếp theo'}
            </div>
            <ul className="space-y-2">
              {isAA ? (
                <>
                  <li>• Khóa ghi danh cũ chuyển trạng thái TRANSFERRED.</li>
                  <li>• Tạo ghi danh mới cho lớp đích và chép lịch buổi còn lại.</li>
                  <li>• Gửi thông báo tới học viên và giáo viên liên quan.</li>
                </>
              ) : (
                <>
                  <li>• Kiểm tra email xác nhận từ Phòng Học vụ.</li>
                  <li>• Tiếp tục tham gia lớp hiện tại cho đến ngày hiệu lực.</li>
                  <li>• Tham gia lớp mới đúng lịch đã chọn.</li>
                </>
              )}
            </ul>
          </div>

          {!isAA && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Bạn sẽ nhận được email khi yêu cầu được xử lý</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {isAA ? 'Xử lý yêu cầu khác' : 'Tạo yêu cầu mới'}
            </Button>
            <Button onClick={handleViewRequests} className="flex-1">
              {isAA ? 'Về trang Học vụ' : 'Về trang yêu cầu'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
