import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react"
import { useResetPasswordMutation } from "@/store/services/authApi"
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator"

interface ResetPasswordFormProps {
  className?: string
}

export function ResetPasswordForm({ className }: ResetPasswordFormProps) {
  const [searchParams] = useSearchParams()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string; token?: string }>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null)

  const [resetPassword, { isLoading, error }] = useResetPasswordMutation()
  const navigate = useNavigate()

  const token = searchParams.get("token")

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false)
      setErrors({ token: "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn" })
    } else {
      setIsTokenValid(true)
    }
  }, [token])

  const validateForm = () => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {}

    if (!newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới"
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Mật khẩu phải có ít nhất 8 ký tự"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới"
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !token) return

    try {
      const result = await resetPassword({
        token,
        newPassword,
        confirmPassword,
      }).unwrap()

      if (result.success) {
        setIsSubmitted(true)
      } else {
        setErrors({ newPassword: result.message || "Đặt lại mật khẩu thất bại" })
      }
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại."

      if (errorMessage.includes("token") || errorMessage.includes("hết hạn")) {
        setIsTokenValid(false)
        setErrors({ token: errorMessage })
      } else {
        setErrors({ newPassword: errorMessage })
      }
    }
  }

  const handleBackToLogin = () => {
    navigate("/login")
  }

  if (isTokenValid === false) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Link không hợp lệ</h1>
            <p className="text-muted-foreground text-sm">
              {errors.token || "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={handleBackToLogin}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại đăng nhập
          </Button>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Mật khẩu đã được đặt lại</h1>
            <p className="text-muted-foreground text-sm">
              Mật khẩu của bạn đã được cập nhật thành công.
              Bạn có thể đăng nhập với mật khẩu mới.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleBackToLogin}
            className="w-full"
          >
            Đăng nhập ngay
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Nhập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        {errors.token && (
          <Alert variant="destructive">
            <AlertDescription>{errors.token}</AlertDescription>
          </Alert>
        )}

        {error && !errors.token && (
          <Alert variant="destructive">
            <AlertDescription>
              {typeof error === 'string' ? error : error?.data?.message || "Đã có lỗi xảy ra"}
            </AlertDescription>
          </Alert>
        )}

        <Field>
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (errors.newPassword) {
                    setErrors({ ...errors, newPassword: undefined })
                  }
                }}
                className={cn("pr-10 pl-9", errors.newPassword && "border-red-500")}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-red-500 mt-1">{errors.newPassword}</p>
            )}
          </div>

          {newPassword && (
            <PasswordStrengthIndicator
              password={newPassword}
              showLabel={true}
            />
          )}
        </Field>

        <Field>
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: undefined })
                  }
                }}
                className={cn("pr-10 pl-9", errors.confirmPassword && "border-red-500")}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
            )}
          </div>
        </Field>

        <Field>
          <Button
            type="submit"
            variant="default"
            disabled={isLoading || !token}
            className="w-full"
          >
            {isLoading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </Button>
        </Field>

        <Button
          type="button"
          variant="ghost"
          onClick={handleBackToLogin}
          className="w-full"
          disabled={isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại đăng nhập
        </Button>
      </FieldGroup>
    </form>
  )
}