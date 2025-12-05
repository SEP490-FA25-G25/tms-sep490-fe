import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type CenterResponse } from "@/store/services/centerApi";
import { AlertTriangle } from "lucide-react";

interface DeleteCenterDialogProps {
  open: boolean;
  center: CenterResponse;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteCenterDialog({
  open,
  center,
  onOpenChange,
  onConfirm,
}: DeleteCenterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <DialogTitle>Xác nhận xóa trung tâm</DialogTitle>
              <DialogDescription className="mt-2">
                Hành động này không thể hoàn tác
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Bạn có chắc chắn muốn xóa trung tâm{" "}
            <span className="font-semibold text-foreground">
              {center.name}
            </span>{" "}
            (mã: <span className="font-semibold text-foreground">{center.code}</span>)?
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tất cả các chi nhánh thuộc trung tâm này cũng sẽ bị xóa.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Xóa trung tâm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

