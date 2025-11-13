import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from "@/lib/utils"
import { Label } from '@/components/ui/label'
import { Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import AAContactModal from './AAContactModal'
import type { TransferEligibility } from '@/store/services/studentRequestApi'

interface TransferTypeStepProps {
  currentEnrollment: TransferEligibility
  onNext: () => void
  onPrevious: () => void
}

export default function TransferTypeStep({
  currentEnrollment,
  onNext,
  onPrevious,
}: TransferTypeStepProps) {
  const [selectedType, setSelectedType] = React.useState<'schedule' | 'branch-modality'>('schedule')
  const [showContactModal, setShowContactModal] = React.useState(false)

  const handleNext = () => {
    if (selectedType === 'schedule') {
      onNext()
    } else {
      // For branch/modality changes, show contact modal
      setShowContactModal(true)
    }
  }

  const handleContactModalClose = () => {
    setShowContactModal(false)
    onPrevious() // Go back to previous step when modal closes
  }

  const getModalityText = (modality: string) => {
    switch (modality) {
      case 'OFFLINE': return 'Tại lớp'
      case 'ONLINE': return 'Online'
      case 'HYBRID': return 'Hybrid'
      default: return modality
    }
  }

  return (
    <div className="space-y-8">
      {/* Current Class Info */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="space-y-1">
          <h3 className="font-medium mb-3">Lớp hiện tại của bạn:</h3>
          <div className="text-sm space-y-1">
            <div><span className="font-medium">{currentEnrollment.classCode}</span> - {currentEnrollment.className}</div>
            <div className="text-muted-foreground">
              {currentEnrollment.branchName} • {getModalityText(currentEnrollment.modality)}
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Type Selection */}
      <div className="space-y-4">
        <h3 className="font-medium">Chọn loại chuyển lớp:</h3>

        <RadioGroup value={selectedType} onValueChange={(value: 'schedule' | 'branch-modality') => setSelectedType(value)}>
          {/* Schedule Only Option */}
          <div className={cn(
            "p-4 border rounded-lg cursor-pointer transition-all",
            selectedType === 'schedule' && "border-primary bg-primary/5"
          )}>
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="schedule" id="schedule" className="mt-1" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="schedule" className="font-medium cursor-pointer">
                    Chỉ thay đổi LỊCH HỌC
                  </Label>
                  <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">Khuyên dùng</Badge>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Cùng cơ sở + Cùng hình thức học</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Xử lý nhanh: 4-8 giờ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Hoàn thành trực tuyến</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    <span className="text-primary font-medium">Tiếp tục ngay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Branch/Modality Change Option */}
          <div className={cn(
            "p-4 border rounded-lg cursor-pointer transition-all",
            selectedType === 'branch-modality' && "border-primary bg-primary/5"
          )}>
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="branch-modality" id="branch-modality" className="mt-1" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="branch-modality" className="font-medium cursor-pointer">
                    Thay đổi CƠ SỞ hoặc HÌNH THỨC học
                  </Label>
                  <Badge variant="secondary">Cần hỗ trợ</Badge>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-orange-600" />
                    <span>Cần hỗ trợ từ Phòng Học vụ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Xử lý nhanh: Ngay lập tức</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    <span className="text-primary font-medium">Liên hệ để được tư vấn</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onPrevious}>
          Quay lại
        </Button>

        {selectedType === 'schedule' && (
          <Button onClick={onNext}>
            Tiếp theo
          </Button>
        )}

        {selectedType === 'branch-modality' && (
          <Button onClick={handleNext}>
            Liên hệ Phòng Học vụ
          </Button>
        )}
      </div>

      {/* Contact Modal */}
      <AAContactModal
        open={showContactModal}
        onOpenChange={handleContactModalClose}
        currentEnrollment={currentEnrollment}
      />
    </div>
  )
}