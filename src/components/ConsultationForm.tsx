import { useState } from 'react'
import {
  useGetPublicBranchesQuery,
  useGetPublicCoursesQuery,
  useSubmitConsultationRegistrationMutation,
  type ConsultationRegistrationRequest,
} from '@/store/services/publicApi'

interface FormData {
  fullName: string
  email: string
  phone: string
  branchId: string
  courseId: string
  message: string
}

const initialFormData: FormData = {
  fullName: '',
  email: '',
  phone: '',
  branchId: '',
  courseId: '',
  message: '',
}

export function ConsultationForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Fetch public data
  const { data: branchesData, isLoading: branchesLoading } = useGetPublicBranchesQuery()
  const { data: coursesData, isLoading: coursesLoading } = useGetPublicCoursesQuery()

  // Submit mutation
  const [submitRegistration, { isLoading: isSubmitting }] =
    useSubmitConsultationRegistrationMutation()

  const branches = branchesData?.data || []
  const courses = coursesData?.data || []

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (submitError) setSubmitError(null)
  }

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/
    return phoneRegex.test(phone)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(false)

    // Validation
    if (!formData.fullName.trim()) {
      setSubmitError('Vui lòng nhập họ và tên')
      return
    }
    if (!formData.email.trim()) {
      setSubmitError('Vui lòng nhập email')
      return
    }
    if (!formData.phone.trim()) {
      setSubmitError('Vui lòng nhập số điện thoại')
      return
    }
    if (!validatePhone(formData.phone.trim())) {
      setSubmitError('Số điện thoại không hợp lệ (VD: 0912345678)')
      return
    }
    if (!formData.branchId) {
      setSubmitError('Vui lòng chọn chi nhánh')
      return
    }

    try {
      const request: ConsultationRegistrationRequest = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        branchId: parseInt(formData.branchId),
        courseId: formData.courseId ? parseInt(formData.courseId) : undefined,
        message: formData.message.trim() || undefined,
      }

      await submitRegistration(request).unwrap()
      setSubmitSuccess(true)
      setFormData(initialFormData)

      // Auto hide success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000)
    } catch (error: unknown) {
      console.error('Submit error:', error)
      const err = error as { data?: { message?: string } }
      setSubmitError(err?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Success Message */}
      {submitSuccess && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#dcfce7',
            border: '1px solid #16a34a',
            borderRadius: '0.5rem',
            color: '#166534',
          }}
        >
          🎉 Đăng ký tư vấn thành công! Chúng tôi sẽ liên hệ bạn sớm nhất.
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #dc2626',
            borderRadius: '0.5rem',
            color: '#991b1b',
          }}
        >
          {submitError}
        </div>
      )}

      <div className="lp-form-group">
        <label className="lp-form-label">Họ và tên *</label>
        <input
          type="text"
          name="fullName"
          className="lp-form-input"
          placeholder="Nhập họ và tên"
          value={formData.fullName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="lp-form-group">
        <label className="lp-form-label">Email *</label>
        <input
          type="email"
          name="email"
          className="lp-form-input"
          placeholder="Nhập email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="lp-form-group">
        <label className="lp-form-label">Số điện thoại *</label>
        <input
          type="tel"
          name="phone"
          className="lp-form-input"
          placeholder="Nhập số điện thoại"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>

      <div className="lp-form-group">
        <label className="lp-form-label">Chi nhánh quan tâm *</label>
        <select
          name="branchId"
          className="lp-form-select"
          value={formData.branchId}
          onChange={handleChange}
          required
          disabled={branchesLoading}
        >
          <option value="" disabled>
            {branchesLoading ? 'Đang tải...' : 'Chọn chi nhánh'}
          </option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
              {branch.address ? ` - ${branch.address}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="lp-form-group">
        <label className="lp-form-label">Môn học quan tâm</label>
        <select
          name="courseId"
          className="lp-form-select"
          value={formData.courseId}
          onChange={handleChange}
          disabled={coursesLoading}
        >
          <option value="">
            {coursesLoading ? 'Đang tải...' : 'Chọn môn học'}
          </option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} ({course.code})
            </option>
          ))}
        </select>
      </div>

      <div className="lp-form-group">
        <label className="lp-form-label">Ghi chú</label>
        <textarea
          name="message"
          className="lp-form-input"
          placeholder="Nhập ghi chú (không bắt buộc)"
          value={formData.message}
          onChange={handleChange}
          rows={3}
          style={{ resize: 'vertical', minHeight: '80px' }}
        />
      </div>

      <button
        type="submit"
        className="lp-btn lp-btn-primary"
        style={{ width: '100%', marginTop: '1rem' }}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Đang gửi...' : 'Gửi đăng ký'}
      </button>
    </form>
  )
}
