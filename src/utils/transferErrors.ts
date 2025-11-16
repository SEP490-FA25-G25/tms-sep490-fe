export interface TransferError {
  code: string
  message: string
  userMessage: string
  severity: 'error' | 'warning' | 'info'
  action?: {
    type: 'retry' | 'contact' | 'navigate' | 'none'
    label?: string
    destination?: string
  }
}

export const TRANSFER_ERROR_CODES: Record<string, Omit<TransferError, 'code'>> = {
  // Business Rule Errors
  TRF_QUOTA_EXCEEDED: {
    message: 'Transfer quota exceeded. Maximum 1 transfer per course.',
    userMessage: 'Bạn đã dùng hết hạn mức chuyển lớp cho khóa học này. Mỗi khóa học chỉ được chuyển 1 lần.',
    severity: 'error',
    action: {
      type: 'contact',
      label: 'Liên hệ Phòng Học vụ'
    }
  },
  TRF_PENDING_EXISTS: {
    message: 'You already have a pending transfer request.',
    userMessage: 'Bạn đang có yêu cầu chuyển lớp đang chờ duyệt. Vui lòng chờ kết quả trước khi tạo yêu cầu mới.',
    severity: 'warning',
    action: {
      type: 'navigate',
      label: 'Xem yêu cầu của tôi',
      destination: '/student/requests'
    }
  },
  TRF_CLASS_FULL: {
    message: 'Target class is full.',
    userMessage: 'Lớp bạn muốn chuyển đã đủ sĩ số. Vui lòng chọn lớp khác hoặc liên hệ Phòng Học vụ.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },
  TRF_INVALID_DATE: {
    message: 'No session on effective date.',
    userMessage: 'Ngày hiệu lực bạn chọn không phải là ngày học của lớp đích. Vui lòng chọn ngày khác.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },
  TRF_PAST_DATE: {
    message: 'Effective date must be in the future.',
    userMessage: 'Ngày hiệu lực phải là ngày trong tương lai. Vui lòng chọn lại ngày.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },
  TRF_TIER_VIOLATION: {
    message: 'You can only change schedule. Contact AA for branch/modality changes.',
    userMessage: 'Bạn chỉ có thể thay đổi lịch học. Để chuyển cơ sở hoặc hình thức học, vui lòng liên hệ Phòng Học vụ.',
    severity: 'warning',
    action: {
      type: 'contact',
      label: 'Liên hệ Phòng Học vụ'
    }
  },
  TRF_SAME_CLASS: {
    message: 'Cannot transfer to the same class.',
    userMessage: 'Không thể chuyển đến cùng một lớp. Vui lòng chọn lớp khác.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },
  TRF_DIFFERENT_COURSE: {
    message: 'Target class must be for the same course.',
    userMessage: 'Chỉ được chuyển lớp trong cùng một khóa học. Vui lòng chọn lớp cùng khóa học.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },
  TRF_CLASS_STATUS: {
    message: 'Target class must be SCHEDULED or ONGOING.',
    userMessage: 'Lớp bạn muốn chuyển chưa bắt đầu hoặc đã kết thúc. Vui lòng chọn lớp đang hoạt động.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },
  TRF_CONCURRENT_UPDATE: {
    message: 'Target class became full. Please select another class.',
    userMessage: 'Lớp vừa đầy chỗ do người khác đăng ký. Vui lòng chọn lớp khác.',
    severity: 'warning',
    action: {
      type: 'retry'
    }
  },

  // Validation Errors
  VALIDATION_FAILED: {
    message: 'Validation failed.',
    userMessage: 'Thông tin không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },
  REQUEST_REASON_TOO_SHORT: {
    message: 'Reason must be at least 10 characters.',
    userMessage: 'Lý do chuyển lớp phải có tối thiểu 10 ký tự.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },

  // System Errors
  NETWORK_ERROR: {
    message: 'Network error occurred.',
    userMessage: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
    severity: 'warning',
    action: {
      type: 'retry'
    }
  },
  UNAUTHORIZED: {
    message: 'Unauthorized access.',
    userMessage: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
    severity: 'error',
    action: {
      type: 'navigate',
      label: 'Đăng nhập lại',
      destination: '/login'
    }
  },
  FORBIDDEN: {
    message: 'Access forbidden.',
    userMessage: 'Bạn không có quyền thực hiện thao tác này.',
    severity: 'error',
    action: {
      type: 'none'
    }
  },
  NOT_FOUND: {
    message: 'Resource not found.',
    userMessage: 'Không tìm thấy thông tin lớp học. Vui lòng tải lại trang và thử lại.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },
  INTERNAL_SERVER_ERROR: {
    message: 'Internal server error.',
    userMessage: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau vài phút.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  }
}

interface FetchError {
  status: string | number
  data?: {
    success?: boolean
    message?: string
    data?: Record<string, unknown>
  }
  error?: {
    message?: string
  }
}

export function parseTransferError(error: unknown): TransferError {
  // Handle network errors
  if (!error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred.',
      userMessage: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
      severity: 'error',
      action: { type: 'retry' }
    }
  }

  // Type guard
  const isFetchError = (err: unknown): err is FetchError =>
    typeof err === 'object' && err !== null && 'status' in err

  // Handle fetch/base query errors
  if (isFetchError(error)) {
    if (error.status === 'FETCH_ERROR' || error.status === 'TIMEOUT_ERROR') {
      return {
        code: 'NETWORK_ERROR',
        message: error.error?.message || 'Network error',
        userMessage: TRANSFER_ERROR_CODES.NETWORK_ERROR.userMessage,
        severity: TRANSFER_ERROR_CODES.NETWORK_ERROR.severity,
        action: TRANSFER_ERROR_CODES.NETWORK_ERROR.action
      }
    }

    if (error.status === 401) {
      return {
        code: 'UNAUTHORIZED',
        message: error.data?.message || 'Unauthorized',
        userMessage: TRANSFER_ERROR_CODES.UNAUTHORIZED.userMessage,
        severity: TRANSFER_ERROR_CODES.UNAUTHORIZED.severity,
        action: TRANSFER_ERROR_CODES.UNAUTHORIZED.action
      }
    }

    if (error.status === 403) {
      return {
        code: 'FORBIDDEN',
        message: error.data?.message || 'Forbidden',
        userMessage: TRANSFER_ERROR_CODES.FORBIDDEN.userMessage,
        severity: TRANSFER_ERROR_CODES.FORBIDDEN.severity,
        action: TRANSFER_ERROR_CODES.FORBIDDEN.action
      }
    }

    if (error.status === 404) {
      return {
        code: 'NOT_FOUND',
        message: error.data?.message || 'Not found',
        userMessage: TRANSFER_ERROR_CODES.NOT_FOUND.userMessage,
        severity: TRANSFER_ERROR_CODES.NOT_FOUND.severity,
        action: TRANSFER_ERROR_CODES.NOT_FOUND.action
      }
    }

    if (error.status === 409) {
      return {
        code: 'TRF_CONCURRENT_UPDATE',
        message: error.data?.message || 'Conflict',
        userMessage: TRANSFER_ERROR_CODES.TRF_CONCURRENT_UPDATE.userMessage,
        severity: TRANSFER_ERROR_CODES.TRF_CONCURRENT_UPDATE.severity,
        action: TRANSFER_ERROR_CODES.TRF_CONCURRENT_UPDATE.action
      }
    }

    if (error.status === 500) {
      return {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.data?.message || 'Internal server error',
        userMessage: TRANSFER_ERROR_CODES.INTERNAL_SERVER_ERROR.userMessage,
        severity: TRANSFER_ERROR_CODES.INTERNAL_SERVER_ERROR.severity,
        action: TRANSFER_ERROR_CODES.INTERNAL_SERVER_ERROR.action
      }
    }

    // Handle API response errors (400 with business rule errors)
    if (error.data?.success === false && error.data.message) {
      const errorCode = error.data.message // Backend sends error code in message field
      if (TRANSFER_ERROR_CODES[errorCode]) {
        return {
          code: errorCode,
          message: error.data.message,
          userMessage: TRANSFER_ERROR_CODES[errorCode].userMessage,
          severity: TRANSFER_ERROR_CODES[errorCode].severity,
          action: TRANSFER_ERROR_CODES[errorCode].action
        }
      }

      // Handle validation errors with field details
      if (error.data.data && typeof error.data.data === 'object') {
        const validationFields = Object.keys(error.data.data)
        if (validationFields.includes('requestReason')) {
          return {
            code: 'REQUEST_REASON_TOO_SHORT',
            message: error.data.message,
            userMessage: TRANSFER_ERROR_CODES.REQUEST_REASON_TOO_SHORT.userMessage,
            severity: TRANSFER_ERROR_CODES.REQUEST_REASON_TOO_SHORT.severity,
            action: TRANSFER_ERROR_CODES.REQUEST_REASON_TOO_SHORT.action
          }
        }

        return {
          code: 'VALIDATION_FAILED',
          message: error.data.message,
          userMessage: 'Thông tin không hợp lệ: ' + Object.values(error.data.data).join(', '),
          severity: TRANSFER_ERROR_CODES.VALIDATION_FAILED.severity,
          action: TRANSFER_ERROR_CODES.VALIDATION_FAILED.action
        }
      }
    }
  }

  // Handle generic JavaScript errors
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      userMessage: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
      severity: 'error',
      action: { type: 'retry' }
    }
  }

  // Fallback for string errors
  if (typeof error === 'string') {
    return {
      code: 'UNKNOWN_ERROR',
      message: error,
      userMessage: error || 'Đã xảy ra lỗi. Vui lòng thử lại.',
      severity: 'error',
      action: { type: 'retry' }
    }
  }

  // Final fallback
  return {
    code: 'UNKNOWN_ERROR',
    message: 'Unknown error occurred.',
    userMessage: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
    severity: 'error',
    action: { type: 'retry' }
  }
}

export function getErrorSeverityColor(severity: TransferError['severity']) {
  switch (severity) {
    case 'error':
      return 'text-red-700 bg-red-50 border-red-200'
    case 'warning':
      return 'text-orange-700 bg-orange-50 border-orange-200'
    case 'info':
      return 'text-blue-700 bg-blue-50 border-blue-200'
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200'
  }
}

export function getErrorSeverityIcon(severity: TransferError['severity']) {
  switch (severity) {
    case 'error':
      return '❌'
    case 'warning':
      return '⚠️'
    case 'info':
      return 'ℹ️'
    default:
      return 'ℹ️'
  }
}