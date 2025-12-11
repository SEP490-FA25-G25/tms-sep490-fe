import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RequestType } from "@/store/services/teacherRequestApi";

interface SelectTypeStepProps {
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
    <div className="space-y-6">
      <div className="space-y-2">
        <Select
          value={selectedType}
          onValueChange={(value: RequestType) => setSelectedType(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn loại yêu cầu" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Loại yêu cầu</SelectLabel>
              {requestTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{type.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {type.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Chọn đúng loại để hiển thị thông tin cần điền tương ứng.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
        <div>
          <Button variant="ghost" onClick={onBack}>
            Quay lại
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleContinue} disabled={!selectedType}>
            Tiếp tục
          </Button>
        </div>
      </div>
    </div>
  );
}

