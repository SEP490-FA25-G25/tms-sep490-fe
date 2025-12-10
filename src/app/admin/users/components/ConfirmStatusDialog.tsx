import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { UserResponse } from '@/store/services/userApi'

interface ConfirmStatusDialogProps {
    user: UserResponse | null
    newStatus: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void | Promise<void>
    isLoading?: boolean
}

export function ConfirmStatusDialog({
    user,
    newStatus,
    open,
    onOpenChange,
    onConfirm,
    isLoading = false,
}: ConfirmStatusDialogProps) {
    if (!user || !newStatus) return null

    const isActivating = newStatus === 'ACTIVE'
    const actionText = isActivating ? 'kích hoạt' : 'vô hiệu hóa'
    const actionTextCapitalized = isActivating ? 'Kích hoạt' : 'Vô hiệu hóa'

    const handleConfirm = async () => {
        await onConfirm()
        onOpenChange(false)
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận {actionText} tài khoản</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bạn có chắc chắn muốn <strong>{actionText}</strong> tài khoản của{' '}
                        <strong>{user.fullName}</strong> ({user.email})?
                        {!isActivating && (
                            <>
                                <br />
                                <br />
                                Người dùng sẽ không thể đăng nhập vào hệ thống sau khi bị vô hiệu hóa.
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={
                            isActivating
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        }
                    >
                        {isLoading ? 'Đang xử lý...' : actionTextCapitalized}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
