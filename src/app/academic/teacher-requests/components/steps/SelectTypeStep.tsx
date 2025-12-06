import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RequestType } from "@/store/services/teacherRequestApi";

interface SelectTypeStepProps {
  teacherId: number;
  onSelect: (requestType: RequestType) => void;
  onBack: () => void;
}

const requestTypes: Array<{
  value: RequestType;
  label: string;
  description: string;
}> = [
  {
    value: "MODALITY_CHANGE",
    label: "Thay đổi phương thức (Modality Change)",
    description: "Chuyển đổi giữa classroom và online",
  },
  {
    value: "RESCHEDULE",
    label: "Đổi lịch (Reschedule)",
    description: "Thay đổi thời gian của session",
  },
  {
    value: "REPLACEMENT",
    label: "Nhờ dạy thay (Substitute)",
    description: "Yêu cầu giáo viên khác dạy thay session này",
  },
];

export function SelectTypeStep({
  onSelect,
  onBack,
}: SelectTypeStepProps) {
  const [selectedType, setSelectedType] = useState<RequestType | undefined>();

  const handleContinue = () => {
    if (selectedType) {
      onSelect(selectedType);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {requestTypes.map((type) => (
          <div
            key={type.value}
            className={cn(
              "border rounded-lg p-6 transition-colors cursor-pointer",
              selectedType === type.value
                ? "border-primary bg-primary/5"
                : "hover:border-primary/50"
            )}
            onClick={() => setSelectedType(type.value)}
          >
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {selectedType === type.value ? (
                  <Circle className="h-5 w-5 fill-primary text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-base font-medium">{type.label}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {type.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button variant="ghost" onClick={onBack}>
          Quay lại
        </Button>
        <Button onClick={handleContinue} disabled={!selectedType}>
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}

