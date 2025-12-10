import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { skipToken } from '@reduxjs/toolkit/query'
import { MapPinIcon } from 'lucide-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useGetMySessionsQuery,
  useGetModalityResourcesQuery,
  useCreateRequestMutation,
  type MySessionDTO,
  type ResourceDTO
} from '@/store/services/teacherRequestApi'
import {
  BaseFlowComponent,
  Section,
  ReasonInput,
  SelectionCard
} from '../UnifiedTeacherRequestFlow'
import { useSuccessHandler, useErrorHandler } from '@/components/requests/utils'

interface ModalityChangeFlowProps {
  onSuccess: () => void
}

const STEPS = [
  { id: 1, title: 'Chọn buổi học', description: 'Chọn buổi học cần thay đổi phương thức', isComplete: false, isAvailable: true },
  { id: 2, title: 'Chọn phòng/phương tiện', description: 'Chọn phòng học hoặc phương tiện mới', isComplete: false, isAvailable: true },
  { id: 3, title: 'Nhập lý do', description: 'Mô tả lý do cần thay đổi phương thức', isComplete: false, isAvailable: true }
]

export default function ModalityChangeFlow({ onSuccess }: ModalityChangeFlowProps) {
  const REASON_MIN_LENGTH = 15
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedSession, setSelectedSession] = useState<MySessionDTO | null>(null)
  const [selectedResource, setSelectedResource] = useState<ResourceDTO | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  // Fetch sessions
  const { data: sessionsResponse, isFetching: isLoadingSessions } = useGetMySessionsQuery({})
  const sessions = useMemo(() => sessionsResponse?.data ?? [], [sessionsResponse])

  // Fetch resources for selected session
  const { data: resourcesResponse, isFetching: isLoadingResources } = useGetModalityResourcesQuery(
    selectedSession ? { sessionId: selectedSession.sessionId ?? selectedSession.id ?? 0 } : skipToken,
    { skip: !selectedSession }
  )
  const resources = useMemo(() => resourcesResponse?.data ?? [], [resourcesResponse])

  const [createRequest, { isLoading: isSubmitting }] = useCreateRequestMutation()
  const { handleSuccess } = useSuccessHandler(onSuccess)
  const { handleError } = useErrorHandler()

  const handleNext = () => {
    if (currentStep === 1 && selectedSession) {
      setCurrentStep(2)
    } else if (currentStep === 2 && selectedResource) {
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    } else if (currentStep === 3) {
      setCurrentStep(2)
    }
  }

  const handleSubmit = async () => {
    if (!selectedSession || !selectedResource) return

    const trimmedReason = reason.trim()
    if (trimmedReason.length < REASON_MIN_LENGTH) {
      setReasonError(`Lý do phải có tối thiểu ${REASON_MIN_LENGTH} ký tự`)
      return
    }

    try {
      await createRequest({
        sessionId: selectedSession.sessionId ?? selectedSession.id ?? 0,
        requestType: 'MODALITY_CHANGE',
        newResourceId: selectedResource.id ?? selectedResource.resourceId,
        reason: trimmedReason
      }).unwrap()

      handleSuccess()
    } catch (error) {
      handleError(error)
    }
  }

  const renderStep1 = () => {
    if (isLoadingSessions) {
      return (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )
    }

    if (sessions.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <span className="text-lg font-semibold text-muted-foreground">14</span>
            </EmptyMedia>
            <EmptyTitle>Không có buổi học phù hợp</EmptyTitle>
            <EmptyDescription>
              Bạn không có buổi dạy nào trong 14 ngày tới để tạo yêu cầu.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    }

    return (
      <div className="space-y-3">
        {sessions.map((session) => {
          const sessionId = session.sessionId ?? session.id ?? 0
          const isSelected = selectedSession?.sessionId === sessionId || selectedSession?.id === sessionId
          
          return (
            <SelectionCard
              key={sessionId}
              item={session}
              isSelected={isSelected}
              onSelect={setSelectedSession}
              disabled={session.hasPendingRequest}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{session.className}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(session.date), 'EEE · dd/MM', { locale: vi })}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.startTime} - {session.endTime} · {session.subjectName}
                  </div>
                  {session.topic && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {session.topic}
                    </div>
                  )}
                </div>
                {session.hasPendingRequest && (
                  <span className="text-xs text-amber-600">Đang có yêu cầu</span>
                )}
              </div>
            </SelectionCard>
          )
        })}
      </div>
    )
  }

  const renderStep2 = () => {
    if (!selectedSession) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Chưa chọn buổi học</EmptyTitle>
            <EmptyDescription>Vui lòng quay lại bước trước để chọn buổi học.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    }

    if (isLoadingResources) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )
    }

    if (resources.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MapPinIcon className="h-8 w-8 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>Không có phòng/phương tiện phù hợp</EmptyTitle>
            <EmptyDescription>
              Không tìm thấy phòng học hoặc phương tiện phù hợp cho buổi học này.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    }

    return (
      <div className="space-y-3">
        {resources.map((resource) => {
          const resourceId = resource.id ?? resource.resourceId ?? 0
          const isSelected = selectedResource?.id === resourceId || selectedResource?.resourceId === resourceId
          
          return (
            <SelectionCard
              key={resourceId}
              item={resource}
              isSelected={isSelected}
              onSelect={setSelectedResource}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{resource.name}</span>
                    {resource.type && (
                      <span className="text-xs text-muted-foreground">({resource.type})</span>
                    )}
                  </div>
                  {resource.capacity && (
                    <div className="text-xs text-muted-foreground">
                      Sức chứa: {resource.capacity} học viên
                    </div>
                  )}
                </div>
              </div>
            </SelectionCard>
          )
        })}
      </div>
    )
  }

  const renderStep3 = () => {
    return (
      <Section>
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Lý do yêu cầu <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground">
            Hãy mô tả rõ khó khăn và mong muốn hỗ trợ để bộ phận Học vụ xử lý nhanh hơn.
          </p>
          <ReasonInput
            value={reason}
            onChange={(value) => {
              setReason(value)
              setReasonError(null)
            }}
            placeholder="Ví dụ: Tôi cần chuyển sang dạy online vì có việc đột xuất..."
            error={reasonError}
            minLength={REASON_MIN_LENGTH}
          />
        </div>

        {selectedSession && (
          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Thông tin buổi học đã chọn
            </p>
            <div className="text-sm">
              <p className="font-medium">{selectedSession.className}</p>
              <p className="text-muted-foreground">
                {format(parseISO(selectedSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })} · {selectedSession.startTime} - {selectedSession.endTime}
              </p>
            </div>
          </div>
        )}

        {selectedResource && (
          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Phòng/phương tiện đã chọn
            </p>
            <div className="text-sm">
              <p className="font-medium">{selectedResource.name}</p>
              {selectedResource.type && (
                <p className="text-muted-foreground">{selectedResource.type}</p>
              )}
            </div>
          </div>
        )}
      </Section>
    )
  }

  return (
    <BaseFlowComponent
      steps={STEPS}
      currentStep={currentStep}
      onNext={handleNext}
      onBack={handleBack}
      onSubmit={handleSubmit}
      isNextDisabled={
        (currentStep === 1 && !selectedSession) ||
        (currentStep === 2 && !selectedResource)
      }
      isSubmitDisabled={reason.trim().length < REASON_MIN_LENGTH}
      isSubmitting={isSubmitting}
    >
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
    </BaseFlowComponent>
  )
}

