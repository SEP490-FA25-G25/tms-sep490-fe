import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"
import { useForgotPasswordMutation } from "@/store/services/authApi"

interface ForgotPasswordFormProps {
  className?: string
}

export function ForgotPasswordForm({ className }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<{ email?: string }>({})
  const [isSubmitted, setIsSubmitted] = useState(false)

  const [forgotPassword, { isLoading, error }] = useForgotPasswordMutation()
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors: { email?: string } = {}

    if (!email) {
      newErrors.email = "Vui lòng nhập email"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Vui lòng nhập email hợp lệ"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      const result = await forgotPassword({ email }).unwrap()

      if (result.success) {
        setIsSubmitted(true)
      } else {
        setErrors({ email: result.message || "Gửi yêu cầu thất bại" })
      }
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string }; message?: string }
      const errorMessage = apiError?.data?.message || apiError?.message || "Gửi yêu cầu thất bại. Vui lòng thử lại."
      setErrors({ email: errorMessage })
    }
  }

  const handleBackToLogin = () => {
    navigate("/login")
  }

  if (isSubmitted) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Email đã được gửi</h1>
            <p className="text-muted-foreground text-sm">
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.
              Vui lòng kiểm tra hòm thư và làm theo hướng dẫn.
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

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Quên mật khẩu</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {(() => {
                if (typeof error === 'string') return error
                const apiError = error as { data?: { message?: string } }
                return apiError?.data?.message || "Đã có lỗi xảy ra"
              })()}
            </AlertDescription>
          </Alert>
        )}

        <Field>
          <Field>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) {
                    setErrors({ ...errors, email: undefined })
                  }
                }}
                className={cn("pl-9", errors.email && "border-red-500")}
                required
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </Field>
        </Field>

        <Field>
          <Button
            type="submit"
            variant="default"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
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
