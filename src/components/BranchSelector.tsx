import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BranchInfo } from "@/store/slices/authSlice";

interface BranchSelectorProps {
  branches: BranchInfo[];
  selectedBranchId: number | null;
  onSelectBranch: (branchId: number) => void;
}

export function BranchSelector({
  branches,
  selectedBranchId,
  onSelectBranch,
}: BranchSelectorProps) {
  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  return (
    <div className="px-2">
      <Select
        value={selectedBranchId?.toString() ?? ""}
        onValueChange={(value) => onSelectBranch(Number(value))}
      >
        <SelectTrigger className="w-full h-9 text-sm">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <SelectValue placeholder="Chọn chi nhánh">
              {selectedBranch?.name ?? "Chọn chi nhánh"}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id.toString()}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
