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
    message: 'Hạn mức chuyển lớp đã hết. Tối đa 1 lần chuyển cho mỗi khóa học.',
    userMessage: 'Bạn đã dùng hết hạn mức chuyển lớp cho khóa học này. Mỗi khóa học chỉ được chuyển 1 lần.',
    severity: 'error',
    action: {
      type: 'contact',
      label: 'Liên hệ Phòng Học vụ'
    }
  },
  TRF_PENDING_EXISTS: {
    message: 'Bạn đã có yêu cầu chuyển lớp đang chờ xử lý.',
    userMessage: 'Bạn đang có yêu cầu chuyển lớp đang chờ duyệt. Vui lòng chờ kết quả trước khi tạo yêu cầu mới.',
    severity: 'warning',
    action: {
      type: 'navigate',
      label: 'Xem yêu cầu của tôi',
      destination: '/student/requests'
    }
  },
  TRF_CLASS_FULL: {
    message: 'Lớp mục tiêu đã đầy.',
    userMessage: 'Lớp bạn muốn chuyển đã đủ sĩ số. Vui lòng chọn lớp khác hoặc liên hệ Phòng Học vụ.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },
  TRF_INVALID_DATE: {
    message: 'Không có buổi học vào ngày có hiệu lực.',
    userMessage: 'Ngày hiệu lực bạn chọn không phải là ngày học của lớp đích. Vui lòng chọn ngày khác.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },
  TRF_PAST_DATE: {
    message: 'Ngày hiệu lực phải là ngày trong tương lai.',
    userMessage: 'Ngày hiệu lực phải là ngày trong tương lai. Vui lòng chọn lại ngày.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },
  TRF_TIER_VIOLATION: {
    message: 'Bạn chỉ có thể thay đổi lịch học. Liên hệ Phòng Học vụ để thay đổi cơ sở/hình thức học.',
    userMessage: 'Bạn chỉ có thể thay đổi lịch học. Để chuyển cơ sở hoặc hình thức học, vui lòng liên hệ Phòng Học vụ.',
    severity: 'warning',
    action: {
      type: 'contact',
      label: 'Liên hệ Phòng Học vụ'
    }
  },
  TRF_SAME_CLASS: {
    message: 'Không thể chuyển đến cùng một lớp.',
    userMessage: 'Không thể chuyển đến cùng một lớp. Vui lòng chọn lớp khác.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },
  TRF_DIFFERENT_COURSE: {
    message: 'Lớp mục tiêu phải thuộc cùng một khóa học.',
    userMessage: 'Chỉ được chuyển lớp trong cùng một khóa học. Vui lòng chọn lớp cùng khóa học.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },
  TRF_CLASS_STATUS: {
    message: 'Lớp mục tiêu phải có trạng thái SCHEDULED hoặc ONGOING.',
    userMessage: 'Lớp bạn muốn chuyển chưa bắt đầu hoặc đã kết thúc. Vui lòng chọn lớp đang hoạt động.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },
  TRF_CONCURRENT_UPDATE: {
    message: 'Lớp mục tiêu đã đầy. Vui lòng chọn lớp khác.',
    userMessage: 'Lớp vừa đầy chỗ do người khác đăng ký. Vui lòng chọn lớp khác.',
    severity: 'warning',
    action: {
      type: 'retry'
    }
  },

  // Validation Errors
  VALIDATION_FAILED: {
    message: 'Xác thực thất bại.',
    userMessage: 'Thông tin không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },
  REQUEST_REASON_TOO_SHORT: {
    message: 'Lý do phải có ít nhất 10 ký tự.',
    userMessage: 'Lý do chuyển lớp phải có tối thiểu 10 ký tự.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },

  // System Errors
  NETWORK_ERROR: {
    message: 'Đã xảy ra lỗi mạng.',
    userMessage: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
    severity: 'warning',
    action: {
      type: 'retry'
    }
  },
  UNAUTHORIZED: {
    message: 'Truy cập chưa được xác thực.',
    userMessage: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
    severity: 'error',
    action: {
      type: 'navigate',
      label: 'Đăng nhập lại',
      destination: '/login'
    }
  },
  FORBIDDEN: {
    message: 'Truy cập bị cấm.',
    userMessage: 'Bạn không có quyền thực hiện thao tác này.',
    severity: 'error',
    action: {
      type: 'none'
    }
  },
  NOT_FOUND: {
    message: 'Không tìm thấy tài nguyên.',
    userMessage: 'Không tìm thấy thông tin lớp học. Vui lòng tải lại trang và thử lại.',
    severity: 'error',
    action: {
      type: 'retry'
    }
  },
  INTERNAL_SERVER_ERROR: {
    message: 'Lỗi máy chủ nội bộ.',
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
  if (!error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Đã xảy ra lỗi không xác định.',
      userMessage: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
      severity: 'error',
      action: { type: 'retry' },
    }
  }

  const isFetchError = (err: unknown): err is FetchError =>
    typeof err === 'object' && err !== null && 'status' in err

  if (isFetchError(error)) {
    const { status, data, error: fetchErr } = error

    if (status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR') {
      return {
        code: 'NETWORK_ERROR',
        message: fetchErr?.message || 'Lỗi mạng',
        userMessage: TRANSFER_ERROR_CODES.NETWORK_ERROR.userMessage,
        severity: TRANSFER_ERROR_CODES.NETWORK_ERROR.severity,
        action: TRANSFER_ERROR_CODES.NETWORK_ERROR.action,
      }
    }

    if (status === 401) {
      return {
        code: 'UNAUTHORIZED',
        message: data?.message || 'Chưa được xác thực',
        userMessage: TRANSFER_ERROR_CODES.UNAUTHORIZED.userMessage,
        severity: TRANSFER_ERROR_CODES.UNAUTHORIZED.severity,
        action: TRANSFER_ERROR_CODES.UNAUTHORIZED.action,
      }
    }

    if (status === 403) {
      return {
        code: 'FORBIDDEN',
        message: data?.message || 'Bị cấm truy cập',
        userMessage: TRANSFER_ERROR_CODES.FORBIDDEN.userMessage,
        severity: TRANSFER_ERROR_CODES.FORBIDDEN.severity,
        action: TRANSFER_ERROR_CODES.FORBIDDEN.action,
      }
    }

    if (status === 404) {
      return {
        code: 'NOT_FOUND',
        message: data?.message || 'Không tìm thấy',
        userMessage: TRANSFER_ERROR_CODES.NOT_FOUND.userMessage,
        severity: TRANSFER_ERROR_CODES.NOT_FOUND.severity,
        action: TRANSFER_ERROR_CODES.NOT_FOUND.action,
      }
    }

    if (status === 409) {
      return {
        code: 'TRF_CONCURRENT_UPDATE',
        message: data?.message || 'Conflict',
        userMessage: TRANSFER_ERROR_CODES.TRF_CONCURRENT_UPDATE.userMessage,
        severity: TRANSFER_ERROR_CODES.TRF_CONCURRENT_UPDATE.severity,
        action: TRANSFER_ERROR_CODES.TRF_CONCURRENT_UPDATE.action,
      }
    }

    if (status === 500) {
      return {
        code: 'INTERNAL_SERVER_ERROR',
        message: data?.message || 'Lỗi máy chủ nội bộ',
        userMessage: TRANSFER_ERROR_CODES.INTERNAL_SERVER_ERROR.userMessage,
        severity: TRANSFER_ERROR_CODES.INTERNAL_SERVER_ERROR.severity,
        action: TRANSFER_ERROR_CODES.INTERNAL_SERVER_ERROR.action,
      }
    }

    if (data?.success === false && data.message) {
      const errorCode = data.message
      if (TRANSFER_ERROR_CODES[errorCode]) {
        return {
          code: errorCode,
          message: data.message,
          userMessage: TRANSFER_ERROR_CODES[errorCode].userMessage,
          severity: TRANSFER_ERROR_CODES[errorCode].severity,
          action: TRANSFER_ERROR_CODES[errorCode].action,
        }
      }

      if (data.data && typeof data.data === 'object') {
        const validationFields = Object.keys(data.data)
        if (validationFields.includes('requestReason')) {
          return {
            code: 'REQUEST_REASON_TOO_SHORT',
            message: data.message,
            userMessage: TRANSFER_ERROR_CODES.REQUEST_REASON_TOO_SHORT.userMessage,
            severity: TRANSFER_ERROR_CODES.REQUEST_REASON_TOO_SHORT.severity,
            action: TRANSFER_ERROR_CODES.REQUEST_REASON_TOO_SHORT.action,
          }
        }

        return {
          code: 'VALIDATION_FAILED',
          message: data.message,
          userMessage: 'Thông tin không hợp lệ: ' + Object.values(data.data).join(', '),
          severity: TRANSFER_ERROR_CODES.VALIDATION_FAILED.severity,
          action: TRANSFER_ERROR_CODES.VALIDATION_FAILED.action,
        }
      }
    }
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Đã xảy ra lỗi không xác định.',
      userMessage: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
      severity: 'error',
      action: { type: 'retry' },
    }
  }

  if (typeof error === 'string') {
    return {
      code: 'UNKNOWN_ERROR',
      message: error,
      userMessage: error || 'Đã xảy ra lỗi. Vui lòng thử lại.',
      severity: 'error',
      action: { type: 'retry' },
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'Đã xảy ra lỗi không xác định.',
    userMessage: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
    severity: 'error',
    action: { type: 'retry' },
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
