import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import AAContactModal from './AAContactModal'
import type { TransferEligibility } from '@/store/services/studentRequestApi'

interface TransferTypeStepProps {
  currentEnrollment: TransferEligibility
  selectedType: 'schedule' | 'branch-modality'
  onTypeChange: (value: 'schedule' | 'branch-modality') => void
  contactModalOpen: boolean
  onContactModalChange: (open: boolean) => void
}

export default function TransferTypeStep({
  currentEnrollment,
  selectedType,
  onTypeChange,
  contactModalOpen,
  onContactModalChange,
}: TransferTypeStepProps) {

  const getModalityText = (modality: string) => {
    switch (modality) {
      case 'OFFLINE': return 'Tại lớp'
      case 'ONLINE': return 'Online'
      case 'HYBRID': return 'Hybrid'
      default: return modality
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Class Info */}
      <div className="space-y-2 border-b pb-4">
        <p className="text-xs text-muted-foreground">Lớp hiện tại của bạn</p>
        <p className="font-semibold">{currentEnrollment.classCode}</p>
        <p className="text-sm text-muted-foreground">{currentEnrollment.className}</p>
        <p className="text-sm text-muted-foreground">
          {currentEnrollment.branchName} · {getModalityText(currentEnrollment.modality || '')}
        </p>
      </div>

      {/* Transfer Type Selection */}
      <div className="space-y-3">
        <h3 className="font-medium">Chọn loại chuyển lớp</h3>

        <RadioGroup value={selectedType} onValueChange={(value: 'schedule' | 'branch-modality') => onTypeChange(value)}>
          {/* Schedule Only Option */}
          <div className={cn(
            "rounded-lg border p-4 cursor-pointer transition",
            selectedType === 'schedule' && "border-primary bg-primary/5"
          )}>
            <div className="flex items-start gap-3">
              <RadioGroupItem value="schedule" id="schedule" className="mt-1" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="schedule" className="font-medium cursor-pointer">
                  Chỉ thay đổi lịch học
                </Label>
                <p className="text-sm text-muted-foreground">
                  Cùng cơ sở + cùng hình thức · Xử lý nhanh 4-8 giờ · Hoàn thành trực tuyến
                </p>
              </div>
            </div>
          </div>

          {/* Branch/Modality Change Option */}
          <div className={cn(
            "rounded-lg border p-4 cursor-pointer transition",
            selectedType === 'branch-modality' && "border-primary bg-primary/5"
          )}>
            <div className="flex items-start gap-3">
              <RadioGroupItem value="branch-modality" id="branch-modality" className="mt-1" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="branch-modality" className="font-medium cursor-pointer">
                  Thay đổi cơ sở hoặc hình thức học
                </Label>
                <p className="text-sm text-muted-foreground">
                  Cần hỗ trợ từ Phòng Học vụ · Liên hệ để được tư vấn
                </p>
              </div>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Contact Modal */}
      <AAContactModal
        open={contactModalOpen}
        onOpenChange={onContactModalChange}
        currentEnrollment={currentEnrollment}
      />
    </div>
  )
}
