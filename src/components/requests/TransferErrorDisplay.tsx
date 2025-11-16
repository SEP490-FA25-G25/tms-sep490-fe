
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Phone, ArrowRight } from 'lucide-react'
import { parseTransferError, getErrorSeverityColor, getErrorSeverityIcon } from '@/utils/transferErrors'
import { cn } from '@/lib/utils'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'

interface TransferErrorDisplayProps {
  error: FetchBaseQueryError | SerializedError | undefined
  onRetry?: () => void
  onContact?: () => void
  onNavigate?: (destination: string) => void
  className?: string
}

export default function TransferErrorDisplay({
  error,
  onRetry,
  onContact,
  onNavigate,
  className = '',
}: TransferErrorDisplayProps) {
  const parsedError = parseTransferError(error)

  const handleAction = () => {
    switch (parsedError.action?.type) {
      case 'retry':
        onRetry?.()
        break
      case 'contact':
        onContact?.()
        break
      case 'navigate':
        onNavigate?.(parsedError.action.destination || '')
        break
      case 'none':
      default:
        // No action
        break
    }
  }

  const getActionButton = () => {
    if (!parsedError.action || parsedError.action.type === 'none') {
      return null
    }

    const { type, label } = parsedError.action

    switch (type) {
      case 'retry':
        return (
          <Button onClick={handleAction} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            {label || 'Thử lại'}
          </Button>
        )
      case 'contact':
        return (
          <Button onClick={handleAction} variant="outline" size="sm">
            <Phone className="w-4 h-4 mr-2" />
            {label || 'Liên hệ hỗ trợ'}
          </Button>
        )
      case 'navigate':
        return (
          <Button onClick={handleAction} variant="outline" size="sm">
            {label || 'Xem chi tiết'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <div className={cn("text-sm p-4 rounded-lg border", getErrorSeverityColor(parsedError.severity), className)}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getErrorSeverityIcon(parsedError.severity)}</span>
            <span className="font-medium">{parsedError.userMessage}</span>
          </div>

          {/* Show action button if available */}
          {getActionButton() && (
            <div className="pt-1">
              {getActionButton()}
            </div>
          )}

          {/* Show error code for debugging (only in development) */}
          {import.meta.env.DEV && parsedError.code !== 'UNKNOWN_ERROR' && (
            <div className="text-xs opacity-60 mt-1">
              Mã lỗi: {parsedError.code}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}