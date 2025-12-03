'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useChangePasswordMutation } from '@/store/services/authApi';
import { cn } from '@/lib/utils';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'Ít nhất 8 ký tự', test: (p) => p.length >= 8 },
  { label: 'Ít nhất 1 chữ hoa (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'Ít nhất 1 chữ thường (a-z)', test: (p) => /[a-z]/.test(p) },
  { label: 'Ít nhất 1 số (0-9)', test: (p) => /\d/.test(p) },
];

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const allRequirementsMet = passwordRequirements.every((req) =>
    req.test(formData.newPassword)
  );

  const passwordsMatch =
    formData.newPassword === formData.confirmPassword &&
    formData.confirmPassword.length > 0;

  const validateForm = (): boolean => {
    if (!formData.currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return false;
    }
    if (!formData.newPassword) {
      toast.error('Vui lòng nhập mật khẩu mới');
      return false;
    }
    if (!allRequirementsMet) {
      toast.error('Mật khẩu mới chưa đáp ứng yêu cầu');
      return false;
    }
    if (!passwordsMatch) {
      toast.error('Mật khẩu xác nhận không khớp');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const response = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      }).unwrap();

      if (response.success) {
        toast.success('Đổi mật khẩu thành công');
        // Reset form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        onOpenChange(false);
      } else {
        toast.error(response.message || 'Đổi mật khẩu thất bại');
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { message?: string } })?.data?.message ||
        'Đổi mật khẩu thất bại';
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Đổi mật khẩu
          </DialogTitle>
          <DialogDescription>
            Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                placeholder="Nhập mật khẩu hiện tại"
                value={formData.currentPassword}
                onChange={(e) =>
                  handleInputChange('currentPassword', e.target.value)
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                placeholder="Nhập mật khẩu mới"
                value={formData.newPassword}
                onChange={(e) =>
                  handleInputChange('newPassword', e.target.value)
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {/* Password Requirements */}
          {formData.newPassword && (
            <Alert variant="default" className="bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Yêu cầu mật khẩu:</p>
                <ul className="space-y-1">
                  {passwordRequirements.map((req, index) => {
                    const isMet = req.test(formData.newPassword);
                    return (
                      <li
                        key={index}
                        className={cn(
                          'flex items-center gap-2 text-sm',
                          isMet ? 'text-green-600' : 'text-muted-foreground'
                        )}
                      >
                        {isMet ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        {req.label}
                      </li>
                    );
                  })}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu mới"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange('confirmPassword', e.target.value)
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {formData.confirmPassword && !passwordsMatch && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Mật khẩu xác nhận không khớp
              </p>
            )}
            {passwordsMatch && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Mật khẩu khớp
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !allRequirementsMet || !passwordsMatch}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Đổi mật khẩu'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
