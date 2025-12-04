import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

interface NavigationGuardContextType {
  isBlocking: boolean;
  setIsBlocking: (blocking: boolean) => void;
  confirmNavigation: (to: string) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType | null>(null);

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [isBlocking, setIsBlocking] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const confirmNavigation = useCallback((to: string) => {
    if (isBlocking) {
      setPendingPath(to);
      setShowConfirm(true);
    } else {
      navigate(to);
    }
  }, [isBlocking, navigate]);

  const handleConfirm = () => {
    setShowConfirm(false);
    setIsBlocking(false);
    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setPendingPath(null);
  };

  return (
    <NavigationGuardContext.Provider value={{ isBlocking, setIsBlocking, confirmNavigation }}>
      {children}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Thay đổi chưa được lưu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có thay đổi chưa được lưu. Vui lòng sử dụng nút <strong>"Lưu & Thoát"</strong> để lưu trước khi rời khỏi trang, hoặc nhấn "Hủy thay đổi" để bỏ qua các thay đổi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Quay lại chỉnh sửa</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-destructive hover:bg-destructive/90">Hủy thay đổi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  const context = useContext(NavigationGuardContext);
  if (!context) {
    throw new Error("useNavigationGuard must be used within NavigationGuardProvider");
  }
  return context;
}
