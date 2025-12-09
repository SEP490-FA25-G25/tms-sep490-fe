import { useState, useMemo, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { skipToken } from '@reduxjs/toolkit/query'
import { CalendarIcon, ClockIcon, MapPinIcon } from 'lucide-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  useGetMySessionsQuery,
  useGetRescheduleSlotsQuery,
  useGetRescheduleResourcesQuery,
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

interface RescheduleFlowProps {
  onSuccess: () => void
}

const STEPS = [
  { id: 1, title: 'Chọn buổi học', description: 'Chọn buổi học cần đổi lịch', isComplete: false, isAvailable: true },
  { id: 2, title: 'Chọn ngày mới', description: 'Chọn ngày mới cho buổi học', isComplete: false, isAvailable: true },
  { id: 3, title: 'Chọn khung giờ mới', description: 'Chọn khung giờ mới cho buổi học', isComplete: false, isAvailable: true },
  { id: 4, title: 'Chọn phòng/phương tiện', description: 'Chọn phòng học hoặc phương tiện mới', isComplete: false, isAvailable: true },
  { id: 5, title: 'Nhập lý do', description: 'Mô tả lý do cần đổi lịch', isComplete: false, isAvailable: true }
]

export default function RescheduleFlow({ onSuccess }: RescheduleFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedSession, setSelectedSession] = useState<MySessionDTO | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<number | undefined>(undefined)
  const [selectedResource, setSelectedResource] = useState<ResourceDTO | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  // Fetch sessions
  const { data: sessionsResponse, isFetching: isLoadingSessions } = useGetMySessionsQuery({})
  const sessions = useMemo(() => sessionsResponse?.data ?? [], [sessionsResponse])

  // Fetch slots for selected date
  const selectedDateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined
  const { data: slotsResponse, isFetching: isLoadingSlots } = useGetRescheduleSlotsQuery(
    selectedSession && selectedDateString
      ? {
          sessionId: selectedSession.sessionId ?? selectedSession.id ?? 0,
          date: selectedDateString,
          // teacherId is optional - backend will get it from auth token for teachers
        }
      : skipToken,
    { skip: !selectedSession || !selectedDate }
  )
  const slots = useMemo(() => slotsResponse?.data ?? [], [slotsResponse])

  // Fetch resources for selected date and timeslot
  const { data: resourcesResponse, isFetching: isLoadingResources } = useGetRescheduleResourcesQuery(
    selectedSession && selectedDateString && selectedTimeSlotId
      ? {
          sessionId: selectedSession.sessionId ?? selectedSession.id ?? 0,
          date: selectedDateString,
          timeSlotId: selectedTimeSlotId,
          // teacherId is optional - backend will get it from auth token for teachers
        }
      : skipToken,
    { skip: !selectedSession || !selectedDate || !selectedTimeSlotId }
  )
  const resources = useMemo(() => resourcesResponse?.data ?? [], [resourcesResponse])

  const [createRequest, { isLoading: isSubmitting }] = useCreateRequestMutation()
  const { handleSuccess } = useSuccessHandler(onSuccess)
  const { handleError } = useErrorHandler()

  // Reset timeslot and resource when date changes
  useEffect(() => {
    if (selectedDate) {
      setSelectedTimeSlotId(undefined)
      setSelectedResource(null)
    }
  }, [selectedDate])

  // Reset resource when timeslot changes
  useEffect(() => {
    if (selectedTimeSlotId) {
      setSelectedResource(null)
    }
  }, [selectedTimeSlotId])

  const handleNext = () => {
    if (currentStep === 1 && selectedSession) {
      setCurrentStep(2)
    } else if (currentStep === 2 && selectedDate) {
      setCurrentStep(3)
    } else if (currentStep === 3 && selectedTimeSlotId) {
      setCurrentStep(4)
    } else if (currentStep === 4 && selectedResource) {
      setCurrentStep(5)
    }
  }

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    } else if (currentStep === 3) {
      setCurrentStep(2)
    } else if (currentStep === 4) {
      setCurrentStep(3)
    } else if (currentStep === 5) {
      setCurrentStep(4)
    }
  }

  const handleSubmit = async () => {
    if (!selectedSession || !selectedDate || !selectedTimeSlotId || !selectedResource) return

    const trimmedReason = reason.trim()
    if (trimmedReason.length < 10) {
      setReasonError('Lý do phải có tối thiểu 10 ký tự')
      return
    }

    try {
      await createRequest({
        sessionId: selectedSession.sessionId ?? selectedSession.id ?? 0,
        requestType: 'RESCHEDULE',
        newDate: format(selectedDate, 'yyyy-MM-dd'),
        newTimeSlotId: selectedTimeSlotId,
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

    return (
      <Section>
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Chọn ngày mới <span className="text-destructive">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })
                ) : (
                  <span>Chọn ngày</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {selectedSession && (
          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Buổi học hiện tại
            </p>
            <div className="text-sm">
              <p className="font-medium">{selectedSession.className}</p>
              <p className="text-muted-foreground">
                {format(parseISO(selectedSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })} · {selectedSession.startTime} - {selectedSession.endTime}
              </p>
            </div>
          </div>
        )}
      </Section>
    )
  }

  const renderStep3 = () => {
    if (!selectedSession || !selectedDate) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Chưa chọn đầy đủ thông tin</EmptyTitle>
            <EmptyDescription>Vui lòng quay lại các bước trước để chọn buổi học và ngày mới.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    }

    if (isLoadingSlots) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )
    }

    if (slots.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClockIcon className="h-8 w-8 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>Không có khung giờ phù hợp</EmptyTitle>
            <EmptyDescription>
              Không tìm thấy khung giờ phù hợp cho ngày đã chọn. Vui lòng chọn ngày khác.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    }

    return (
      <Section>
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Chọn khung giờ mới <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedTimeSlotId ? String(selectedTimeSlotId) : ""}
            onValueChange={(value) => setSelectedTimeSlotId(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn khung giờ..." />
            </SelectTrigger>
            <SelectContent>
              {slots
                .filter((slot) => {
                  const slotId = slot.timeSlotTemplateId ?? slot.timeSlotId ?? slot.id;
                  return slotId != null && slotId !== 0;
                })
                .map((slot) => {
                  const slotId = slot.timeSlotTemplateId ?? slot.timeSlotId ?? slot.id;
                  const label =
                    slot.label ||
                    slot.name ||
                    slot.displayLabel ||
                    slot.timeSlotLabel ||
                    `${slot.startTime || slot.startAt} - ${slot.endTime || slot.endAt}` ||
                    `Slot ${slotId}`;

                  return (
                    <SelectItem
                      key={slotId}
                      value={String(slotId)}
                    >
                      {label}
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
        </div>

        {selectedDate && (
          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Ngày đã chọn
            </p>
            <div className="text-sm">
              <p className="font-medium">
                {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
              </p>
            </div>
          </div>
        )}
      </Section>
    )
  }

  const renderStep4 = () => {
    if (!selectedSession || !selectedDate || !selectedTimeSlotId) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Chưa chọn đầy đủ thông tin</EmptyTitle>
            <EmptyDescription>Vui lòng quay lại các bước trước để chọn đầy đủ thông tin.</EmptyDescription>
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
              Không tìm thấy phòng học hoặc phương tiện phù hợp cho khung giờ đã chọn.
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

  const renderStep5 = () => {
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
            placeholder="Ví dụ: Tôi cần đổi lịch vì có việc đột xuất..."
            error={reasonError}
            minLength={10}
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

        {selectedDate && selectedTimeSlotId && (
          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Lịch mới đề xuất
            </p>
            <div className="text-sm">
              <p className="font-medium">
                {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
              </p>
              <p className="text-muted-foreground">
                {(() => {
                  const selectedSlot = slots.find(
                    (s) => (s.timeSlotTemplateId ?? s.timeSlotId ?? s.id) === selectedTimeSlotId
                  )
                  return (
                    selectedSlot?.label ||
                    selectedSlot?.name ||
                    selectedSlot?.displayLabel ||
                    selectedSlot?.timeSlotLabel ||
                    `${selectedSlot?.startTime || selectedSlot?.startAt} - ${selectedSlot?.endTime || selectedSlot?.endAt}` ||
                    'Chưa có thông tin'
                  )
                })()}
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
        (currentStep === 2 && !selectedDate) ||
        (currentStep === 3 && !selectedTimeSlotId) ||
        (currentStep === 4 && !selectedResource)
      }
      isSubmitDisabled={reason.trim().length < 10}
      isSubmitting={isSubmitting}
    >
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}
      {currentStep === 5 && renderStep5()}
    </BaseFlowComponent>
  )
}

