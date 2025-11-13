import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, MessageCircle, Copy, Check } from 'lucide-react'
import type { TransferEligibility } from '@/store/services/studentRequestApi'

interface AAContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentEnrollment: TransferEligibility
}

export default function AAContactModal({
  open,
  onOpenChange,
  currentEnrollment,
}: AAContactModalProps) {
  const [copiedEmail, setCopiedEmail] = React.useState(false)
  const [copiedPhone, setCopiedPhone] = React.useState(false)

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('academic@tms.edu.vn')
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    } catch (error) {
      console.error('Failed to copy email:', error)
    }
  }

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText('1900-2024')
      setCopiedPhone(true)
      setTimeout(() => setCopiedPhone(false), 2000)
    } catch (error) {
      console.error('Failed to copy phone:', error)
    }
  }

  const handleEmailClick = () => {
    const subject = encodeURIComponent(`Yêu cầu chuyển lớp - ${currentEnrollment.classCode}`)
    const body = encodeURIComponent(
      `Kính gửi Phòng Học vụ,\n\n` +
      `Tôi là học viên lớp ${currentEnrollment.classCode} - ${currentEnrollment.className}.\n` +
      `Tôi muốn chuyển đến cơ sở hoặc hình thức học tập khác.\n\n` +
      `Thông tin hiện tại:\n` +
      `- Mã lớp: ${currentEnrollment.classCode}\n` +
      `- Tên lớp: ${currentEnrollment.className}\n` +
      `- Cơ sở: ${currentEnrollment.branchName}\n` +
      `- Hình thức: ${currentEnrollment.modality === 'OFFLINE' ? 'Tại lớp' : currentEnrollment.modality === 'ONLINE' ? 'Online' : 'Hybrid'}\n\n` +
      `Mong Phòng Học vụ tư vấn các lựa chọn phù hợp.\n\n` +
      `Trân trọng.`
    )
    window.open(`mailto:academic@tms.edu.vn?subject=${subject}&body=${body}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              Liên hệ Phòng Học vụ
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Để chuyển cơ sở hoặc hình thức học, vui lòng liên hệ trực tiếp để được tư vấn và hỗ trợ tốt nhất
            </DialogDescription>
          </div>

          {/* Current Info */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <div className="text-xs text-muted-foreground mb-2">Thông tin hiện tại của bạn:</div>
            <div className="text-sm space-y-1">
              <div><span className="font-medium">Mã lớp:</span> {currentEnrollment.classCode}</div>
              <div><span className="font-medium">Tên lớp:</span> {currentEnrollment.className}</div>
              <div><span className="font-medium">Cơ sở:</span> {currentEnrollment.branchName}</div>
              <div><span className="font-medium">Hình thức:</span> {
                currentEnrollment.modality === 'OFFLINE' ? 'Tại lớp' :
                currentEnrollment.modality === 'ONLINE' ? 'Online' : 'Hybrid'
              }</div>
            </div>
          </div>

          {/* Contact Options */}
          <div className="space-y-4">
            <div className="text-sm font-medium">Chọn cách liên hệ:</div>

            {/* Email Option */}
            <div className="space-y-3">
              <Button
                onClick={handleEmailClick}
                className="w-full justify-start"
                variant="outline"
              >
                <Mail className="w-4 h-4 mr-3" />
                Gửi email ngay
              </Button>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">academic@tms.edu.vn</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyEmail}
                  className="h-6 px-2 text-muted-foreground hover:text-foreground"
                >
                  {copiedEmail ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedEmail ? 'Đã sao chép' : 'Sao chép'}
                </Button>
              </div>
            </div>

            {/* Phone Option */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">1900-2024 (8:00 - 17:00, Thứ 2-6)</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyPhone}
                  className="h-6 px-2 text-muted-foreground hover:text-foreground"
                >
                  {copiedPhone ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedPhone ? 'Đã sao chép' : 'Sao chép'}
                </Button>
              </div>
            </div>
          </div>

          {/* Preparation Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="text-sm font-medium text-blue-900">Chuẩn bị trước khi liên hệ:</div>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Cơ sở bạn muốn chuyển đến</li>
              <li>• Lý do chuyển đổi (công việc, nhà ở, lịch học)</li>
              <li>• Lịch học mong muốn (sáng/tối/ cuối tuần)</li>
              <li>• Các câu hỏi bạn muốn tư vấn</li>
            </ul>
          </div>

          {/* Response Time */}
          <div className="text-center space-y-1">
            <div className="text-sm">
              <span className="font-medium">Thời gian phản hồi:</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Email: 4-8 giờ làm việc • Hotline: Ngay lập tức (giờ hành chính)
            </div>
            <Badge variant="secondary" className="mt-2">
              Ưu tiên hỗ trợ các yêu cầu chuyển lớp
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}