import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { PasswordStrength, PasswordValidationRule } from "@/types/auth"

const passwordRules: PasswordValidationRule[] = [
  {
    regex: /.{8,}/,
    message: "Ít nhất 8 ký tự",
    isValid: false,
  },
  {
    regex: /[A-Z]/,
    message: "Có ít nhất 1 chữ hoa",
    isValid: false,
  },
  {
    regex: /[a-z]/,
    message: "Có ít nhất 1 chữ thường",
    isValid: false,
  },
  {
    regex: /\d/,
    message: "Có ít nhất 1 số",
    isValid: false,
  },
  {
    regex: /[!@#$%^&*(),.?":{}|<>]/,
    message: "Có ít nhất 1 ký tự đặc biệt",
    isValid: false,
  },
]

interface PasswordStrengthIndicatorProps {
  password: string
  showLabel?: boolean
  className?: string
}

export function PasswordStrengthIndicator({
  password,
  showLabel = true,
  className
}: PasswordStrengthIndicatorProps) {
  const [strength, setStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false,
  })

  useEffect(() => {
    const rules = passwordRules.map(rule => ({
      ...rule,
      isValid: rule.regex.test(password),
    }))

    const score = rules.filter(rule => rule.isValid).length
    const feedback = rules.filter(rule => !rule.isValid).map(rule => rule.message)
    const isValid = score >= 3 // Require at least 3 rules to pass

    setStrength({
      score,
      feedback,
      isValid,
    })
  }, [password])

  const getStrengthColor = () => {
    switch (strength.score) {
      case 0:
      case 1:
        return "bg-rose-500"
      case 2:
        return "bg-orange-500"
      case 3:
        return "bg-yellow-500"
      case 4:
      case 5:
        return "bg-emerald-500"
      default:
        return "bg-gray-300"
    }
  }

  const getStrengthText = () => {
    switch (strength.score) {
      case 0:
      case 1:
        return "Yếu"
      case 2:
        return "Trung bình"
      case 3:
        return "Khá"
      case 4:
      case 5:
        return "Mạnh"
      default:
        return ""
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Độ mạnh mật khẩu</span>
          <span className={cn(
            "text-sm font-medium",
            strength.score <= 1 ? "text-rose-500" :
            strength.score === 2 ? "text-orange-500" :
            strength.score === 3 ? "text-yellow-500" :
            "text-emerald-500"
          )}>
            {getStrengthText()}
          </span>
        </div>
      )}

      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              index < strength.score ? getStrengthColor() : "bg-gray-200"
            )}
          />
        ))}
      </div>

      {password && strength.feedback.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Yêu cầu:</p>
          <ul className="space-y-1">
            {passwordRules.map((rule, index) => (
              <li
                key={index}
                className={cn(
                  "text-sm flex items-center gap-2",
                  rule.regex.test(password) ? "text-emerald-600" : "text-gray-500"
                )}
              >
                <span className={cn(
                  "size-3 rounded-full border-2",
                  rule.regex.test(password)
                    ? "bg-emerald-600 border-emerald-600"
                    : "border-gray-300"
                )} />
                {rule.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!strength.isValid && password && (
        <p className="text-xs text-rose-500">
          Mật khẩu phải đáp ứng ít nhất 3 yêu cầu trên
        </p>
      )}
    </div>
  )
}
