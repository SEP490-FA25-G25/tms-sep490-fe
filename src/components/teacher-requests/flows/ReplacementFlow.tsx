import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { skipToken } from '@reduxjs/toolkit/query'
import { UserCheckIcon } from 'lucide-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useGetMySessionsQuery,
  useGetReplacementCandidatesQuery,
  useCreateRequestMutation,
  type MySessionDTO,
  type ReplacementCandidateDTO
} from '@/store/services/teacherRequestApi'
import {
  BaseFlowComponent,
  Section,
  ReasonInput,
  SelectionCard
} from '../UnifiedTeacherRequestFlow'
import { useSuccessHandler, useErrorHandler } from '@/components/requests/utils'

interface ReplacementFlowProps {
  onSuccess: () => void
}

const STEPS = [
  { id: 1, title: 'Chọn buổi học', description: 'Chọn buổi học cần nhờ dạy thay', isComplete: false, isAvailable: true },
  { id: 2, title: 'Chọn giáo viên dạy thay', description: 'Chọn giáo viên phù hợp để dạy thay', isComplete: false, isAvailable: true },
  { id: 3, title: 'Nhập lý do', description: 'Mô tả lý do cần nhờ dạy thay', isComplete: false, isAvailable: true }
]

// Helper to get candidate skills display with levels
function getCandidateSkills(candidate: ReplacementCandidateDTO): string {
  // Helper to format skill with level
  const formatSkillWithLevel = (skill: unknown): string | null => {
    if (typeof skill === "string") {
      return skill.trim();
    }

    if (skill && typeof skill === "object") {
      // Extract skill name - can be direct string in "skill" field or nested
      const skillName =
        (typeof (skill as { skill?: unknown }).skill === "string"
          ? (skill as { skill: string }).skill
          : null) ||
        (skill as { name?: string }).name ||
        (skill as { skillName?: string }).skillName ||
        (typeof (skill as { skill?: unknown }).skill === "object" &&
          (skill as { skill?: { name?: string } }).skill?.name);

      // Extract level - can be number (1-5) or string
      const skillLevelRaw =
        (skill as { level?: string | number }).level !== undefined
          ? (skill as { level?: string | number }).level
          : (skill as { skillLevel?: string | number }).skillLevel !== undefined
          ? (skill as { skillLevel?: string | number }).skillLevel
          : (skill as { proficiency?: string | number }).proficiency;

      // Format level: if number, convert to string; if string, use as is
      let skillLevel: string | null = null;
      if (skillLevelRaw !== undefined && skillLevelRaw !== null) {
        if (typeof skillLevelRaw === "number") {
          skillLevel = String(skillLevelRaw);
        } else if (
          typeof skillLevelRaw === "string" &&
          skillLevelRaw.trim().length > 0
        ) {
          skillLevel = skillLevelRaw.trim();
        }
      }

      if (
        skillName &&
        typeof skillName === "string" &&
        skillName.trim().length > 0
      ) {
        if (skillLevel) {
          return `${skillName.trim()} (${skillLevel})`;
        }
        return skillName.trim();
      }
    }

    return null;
  };

  // Try to extract from skills array (prioritize this as it has structured data)
  if (
    candidate.skills &&
    Array.isArray(candidate.skills) &&
    candidate.skills.length > 0
  ) {
    const formattedSkills = candidate.skills
      .map(formatSkillWithLevel)
      .filter((skill): skill is string => skill !== null);

    if (formattedSkills.length > 0) {
      return formattedSkills.join(", ");
    }
  }

  // Try to extract from teacherSkills array
  if (
    candidate.teacherSkills &&
    Array.isArray(candidate.teacherSkills) &&
    candidate.teacherSkills.length > 0
  ) {
    const formattedSkills = candidate.teacherSkills
      .map(formatSkillWithLevel)
      .filter((skill): skill is string => skill !== null);

    if (formattedSkills.length > 0) {
      return formattedSkills.join(", ");
    }
  }

  // Try skillSummary as fallback
  if (candidate.skillSummary && typeof candidate.skillSummary === "string") {
    return candidate.skillSummary.trim();
  }

  return 'Chưa có thông tin'
}

export default function ReplacementFlow({ onSuccess }: ReplacementFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedSession, setSelectedSession] = useState<MySessionDTO | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<ReplacementCandidateDTO | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  // Fetch sessions
  const { data: sessionsResponse, isFetching: isLoadingSessions } = useGetMySessionsQuery({})
  const sessions = useMemo(() => sessionsResponse?.data ?? [], [sessionsResponse])

  // Fetch replacement candidates for selected session
  const { data: candidatesResponse, isFetching: isLoadingCandidates } = useGetReplacementCandidatesQuery(
    selectedSession ? { requestId: 0, sessionId: selectedSession.sessionId ?? selectedSession.id ?? 0 } : skipToken,
    { skip: !selectedSession }
  )
  const candidates = useMemo(() => candidatesResponse?.data ?? [], [candidatesResponse])

  const [createRequest, { isLoading: isSubmitting }] = useCreateRequestMutation()
  const { handleSuccess } = useSuccessHandler(onSuccess)
  const { handleError } = useErrorHandler()

  const handleNext = () => {
    if (currentStep === 1 && selectedSession) {
      setCurrentStep(2)
    } else if (currentStep === 2 && selectedCandidate) {
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
    if (!selectedSession || !selectedCandidate) return

    const trimmedReason = reason.trim()
    if (trimmedReason.length < 10) {
      setReasonError('Lý do phải có tối thiểu 10 ký tự')
      return
    }

    try {
      await createRequest({
        sessionId: selectedSession.sessionId ?? selectedSession.id ?? 0,
        requestType: 'REPLACEMENT',
        replacementTeacherId: selectedCandidate.teacherId,
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

    if (isLoadingCandidates) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )
    }

    if (candidates.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserCheckIcon className="h-8 w-8 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>Không có giáo viên phù hợp</EmptyTitle>
            <EmptyDescription>
              Không tìm thấy giáo viên phù hợp để dạy thay buổi học này.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    }

    return (
      <div className="space-y-3">
        {candidates.map((candidate) => {
          const candidateId = candidate.teacherId ?? 0
          const isSelected = selectedCandidate?.teacherId === candidateId
          const teacherName = candidate.fullName ?? candidate.displayName ?? candidate.teacherName ?? 'Chưa có tên'
          const skills = getCandidateSkills(candidate)
          
          return (
            <SelectionCard
              key={candidateId}
              item={candidate}
              isSelected={isSelected}
              onSelect={setSelectedCandidate}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{teacherName}</span>
                    {candidate.level && (
                      <span className="text-xs text-muted-foreground">({candidate.level})</span>
                    )}
                  </div>
                  {skills && (
                    <div className="text-xs text-muted-foreground">
                      {skills}
                    </div>
                  )}
                  {candidate.email && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {candidate.email}
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
            placeholder="Ví dụ: Tôi có việc đột xuất nên cần nhờ giáo viên khác dạy thay..."
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

        {selectedCandidate && (
          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Giáo viên dạy thay đã chọn
            </p>
            <div className="text-sm">
              <p className="font-medium">
                {selectedCandidate.fullName ?? selectedCandidate.displayName ?? selectedCandidate.teacherName ?? 'Chưa có tên'}
              </p>
              {selectedCandidate.email && (
                <p className="text-muted-foreground">{selectedCandidate.email}</p>
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
        (currentStep === 2 && !selectedCandidate)
      }
      isSubmitDisabled={reason.trim().length < 10}
      isSubmitting={isSubmitting}
    >
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
    </BaseFlowComponent>
  )
}

