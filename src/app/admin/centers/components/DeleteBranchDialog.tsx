import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type BranchResponse } from "@/store/services/branchApi";
import { AlertTriangle } from "lucide-react";

interface DeleteBranchDialogProps {
  open: boolean;
  branch: BranchResponse;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteBranchDialog({
  open,
  branch,
  onOpenChange,
  onConfirm,
}: DeleteBranchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Xác nhận xóa chi nhánh</DialogTitle>
              <DialogDescription className="mt-2">
                Hành động này không thể hoàn tác
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Bạn có chắc chắn muốn xóa chi nhánh{" "}
            <span className="font-semibold text-foreground">{branch.name}</span>{" "}
            (mã: <span className="font-semibold text-foreground">{branch.code}</span>)?
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tất cả các lớp học, phòng học và tài nguyên liên quan cũng sẽ bị ảnh hưởng.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Xóa chi nhánh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

