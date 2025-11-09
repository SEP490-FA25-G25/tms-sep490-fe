# Implementation Plan: Create Class Workflow

**Feature:** Tạo Lớp Học Mới (7-Step Wizard)
**Target Role:** ACADEMIC_AFFAIR
**Estimated Timeline:** 5-7 days (1 developer)
**Last Updated:** November 10, 2025

---

## 📋 Mục Lục

1. [Overview](#1-overview)
2. [File Structure](#2-file-structure)
3. [Implementation Phases](#3-implementation-phases)
4. [Component Breakdown](#4-component-breakdown)
5. [API Integration](#5-api-integration)
6. [State Management Strategy](#6-state-management-strategy)
7. [Testing Strategy](#7-testing-strategy)
8. [Deployment Checklist](#8-deployment-checklist)

---

## 1. Overview

### 1.1 Objectives

Implement một 7-step wizard cho phép Academic Affairs staff tạo lớp học mới với các tính năng:

- ✅ Step-by-step guided workflow với progress indicator
- ✅ Form validation (frontend + backend)
- ✅ Conflict detection và resolution cho resources/teachers
- ✅ Draft persistence (localStorage + URL params)
- ✅ Real-time feedback (loading states, toast notifications)
- ✅ Mobile responsive design
- ✅ Accessibility (WCAG AA)

### 1.2 Technical Stack

**Frontend:**
- React 19 + TypeScript
- React Hook Form + Zod (validation)
- RTK Query (API calls)
- Tailwind CSS + shadcn/ui (UI components)
- date-fns (date manipulation)
- sonner (toast notifications)

**Patterns tham khảo:**
- Student Absence Page: Form handling, API integration, pagination
- Academic Class Detail: Table rendering, dialogs, status badges
- Existing API services: RTK Query structure, error handling

### 1.3 Success Criteria

- [ ] User có thể tạo class từ STEP 1 → STEP 7 without errors
- [ ] Tất cả validation rules được enforce (frontend + backend)
- [ ] Conflict detection hoạt động cho resources và teachers
- [ ] Draft được save tự động và restore khi quay lại
- [ ] Loading states và error messages rõ ràng
- [ ] Mobile responsive (tested on 320px - 1920px)
- [ ] Keyboard navigation hoạt động đầy đủ

---

## 2. File Structure

### 2.1 Proposed Directory Structure

```
src/
├── app/
│   └── academic/
│       └── classes/
│           ├── page.tsx                          # Class list (existing)
│           ├── create/
│           │   ├── page.tsx                      # Main wizard container
│           │   └── components/
│           │       ├── CreateClassWizard.tsx     # Wizard shell với progress
│           │       ├── ProgressIndicator.tsx     # 7-step progress bar
│           │       ├── WizardFooter.tsx          # Back/Save/Next buttons
│           │       ├── Step1BasicInfo.tsx        # STEP 1: Class info form
│           │       ├── Step2ReviewSessions.tsx   # STEP 2: Review sessions
│           │       ├── Step3TimeSlots.tsx        # STEP 3: Assign time slots
│           │       ├── Step4Resources.tsx        # STEP 4: Assign resources
│           │       ├── Step5ATeachers.tsx        # STEP 5A: Teacher selection
│           │       ├── Step5BAssignTeacher.tsx   # STEP 5B: Teacher confirm
│           │       ├── Step6Validate.tsx         # STEP 6: Validation
│           │       ├── Step7Submit.tsx           # STEP 7: Final submit
│           │       ├── ConflictDialog.tsx        # Resource conflict resolver
│           │       ├── SuccessDialog.tsx         # Success message
│           │       └── hooks/
│           │           ├── useWizardNavigation.ts
│           │           ├── useDraftPersistence.ts
│           │           └── useFormPersistence.ts
│           └── [id]/
│               └── page.tsx                      # Class detail (existing)
│
├── store/
│   └── services/
│       └── classCreationApi.ts                   # NEW: RTK Query API service
│
├── utils/
│   ├── dayNames.ts                               # NEW: Vietnamese day names
│   └── validations.ts                            # Existing: Add Zod schemas
│
└── types/
    └── classCreation.ts                          # NEW: TypeScript types
```

### 2.2 New Files to Create

**Priority 1 (Core):**
1. `classCreationApi.ts` - API service
2. `CreateClassWizard.tsx` - Main wizard container
3. `ProgressIndicator.tsx` - Progress bar
4. `Step1BasicInfo.tsx` - First step form
5. `WizardFooter.tsx` - Navigation buttons
6. `useWizardNavigation.ts` - Step navigation hook

**Priority 2 (Steps):**
7. `Step3TimeSlots.tsx` - Time slot assignment
8. `Step4Resources.tsx` - Resource assignment
9. `Step5ATeachers.tsx` - Teacher selection
10. `Step5BAssignTeacher.tsx` - Teacher confirmation
11. `Step6Validate.tsx` - Validation summary
12. `Step7Submit.tsx` - Final submission

**Priority 3 (Supporting):**
13. `ConflictDialog.tsx` - Conflict resolution
14. `SuccessDialog.tsx` - Success message
15. `Step2ReviewSessions.tsx` - Optional review
16. `useDraftPersistence.ts` - Draft auto-save
17. `dayNames.ts` - Day name utilities
18. `classCreation.ts` - Type definitions

**Total:** 18 new files

---

## 3. Implementation Phases

### Phase 1: Foundation (Day 1-2)

**Goal:** Setup cơ bản, STEP 1 hoạt động end-to-end

**Tasks:**
- [ ] Tạo API service (`classCreationApi.ts`)
- [ ] Tạo type definitions (`classCreation.ts`)
- [ ] Implement Progress Indicator component
- [ ] Implement Wizard container với routing
- [ ] Implement STEP 1 form với validation
- [ ] Implement Wizard Footer với navigation
- [ ] Test: User có thể tạo class (STEP 1) và navigate

**Deliverable:** STEP 1 working, progress indicator hiển thị, có thể navigate giữa steps

---

### Phase 2: Core Steps (Day 3-4)

**Goal:** Implement STEP 3, 4, 5 (core assignment steps)

**Tasks:**
- [ ] Implement STEP 3: Time Slots assignment
- [ ] Implement STEP 4: Resources assignment với conflict detection
- [ ] Implement Conflict Dialog
- [ ] Implement STEP 5A: Teacher selection table
- [ ] Implement STEP 5B: Teacher confirmation
- [ ] Test: User có thể assign time slots, resources, teachers

**Deliverable:** STEP 3, 4, 5 working, conflict dialog hoạt động

---

### Phase 3: Validation & Submission (Day 5)

**Goal:** Implement STEP 6, 7 và final workflow

**Tasks:**
- [ ] Implement STEP 6: Validation summary
- [ ] Implement STEP 7: Final submission
- [ ] Implement Success Dialog
- [ ] Implement STEP 2: Review sessions (optional)
- [ ] Test: Complete workflow STEP 1 → 7

**Deliverable:** Full workflow working, validation complete

---

### Phase 4: Polish & Optimization (Day 6-7)

**Goal:** Draft persistence, error handling, responsive design

**Tasks:**
- [ ] Implement draft persistence (localStorage)
- [ ] Implement error boundary và error handling
- [ ] Responsive design testing (mobile, tablet, desktop)
- [ ] Accessibility testing (keyboard, screen reader)
- [ ] Performance optimization (lazy loading, memoization)
- [ ] E2E testing manual

**Deliverable:** Production-ready feature

---

## 4. Component Breakdown

### 4.1 CreateClassWizard (Main Container)

**Purpose:** Wrapper component quản lý workflow state và navigation

**Props:**
```typescript
interface CreateClassWizardProps {
  // No props - read from URL params
}
```

**State:**
```typescript
{
  currentStep: 1 | 2 | 3 | 4 | 5 | 6 | 7
  completedSteps: number[]
  classId: number | null
  classData: Partial<CreateClassFormData>
}
```

**Responsibilities:**
- Render progress indicator
- Render current step component
- Handle step navigation
- Persist/restore draft
- Sync state với URL params

**Component Mapping:**
- Layout: `<DashboardLayout>`
- Progress: `<ProgressIndicator>`
- Step content: Conditional render (Step1, Step2, ..., Step7)
- Footer: `<WizardFooter>`

---

### 4.2 ProgressIndicator

**Purpose:** Visual progress bar cho 7 steps

**Props:**
```typescript
interface ProgressIndicatorProps {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6 | 7
  completedSteps: number[]
  onStepClick?: (step: number) => void  // Navigate to completed steps
}
```

**Visual States:**
- ✅ Complete (green checkmark)
- ● Active (purple circle, larger)
- ○ Incomplete (gray outline)
- Lines: Green (between completed), gray (incomplete)

**Component Mapping:**
- Base: Custom component với Tailwind
- Icons: `<CheckCircle2>` (lucide-react)

**Accessibility:**
- ARIA role: `progressbar`
- ARIA labels: Step names in Vietnamese

---

### 4.3 Step1BasicInfo

**Purpose:** Form nhập thông tin cơ bản lớp học

**Form Fields:**
```typescript
interface CreateClassFormData {
  branchId: number
  courseId: number
  code: string          // Uppercase, numbers, hyphens
  name: string
  modality: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  startDate: string     // ISO date
  scheduleDays: number[] // 0-6 (Sunday-Saturday)
  maxCapacity: number   // 1-1000
}
```

**Validation (Zod):**
```typescript
const createClassSchema = z.object({
  branchId: z.number().positive(),
  courseId: z.number().positive(),
  code: z.string()
    .min(1, "Mã lớp không được để trống")
    .max(50, "Mã lớp tối đa 50 ký tự")
    .regex(/^[A-Z0-9-]+$/, "Mã lớp chỉ chứa chữ hoa, số và dấu gạch ngang"),
  name: z.string()
    .min(1, "Tên lớp không được để trống")
    .max(255, "Tên lớp tối đa 255 ký tự"),
  modality: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']),
  startDate: z.string()
    .refine(date => new Date(date) > new Date(),
      "Ngày bắt đầu phải là ngày trong tương lai"),
  scheduleDays: z.array(z.number().min(0).max(6))
    .min(1, "Phải chọn ít nhất 1 ngày")
    .max(7, "Tối đa 7 ngày"),
  maxCapacity: z.number()
    .min(1, "Sức chứa phải ít nhất 1")
    .max(1000, "Sức chứa tối đa 1000")
})
```

**Component Mapping:**
- Form: `react-hook-form` với `zodResolver`
- Input: `<Input>`, `<Select>`
- Date picker: `<Calendar>` + `<Popover>`
- Radio: `<ToggleGroup>` (modality)
- Checkbox: `<Checkbox>` (schedule days)

**API Call:**
```typescript
POST /api/v1/classes
→ Returns: { classId, code, status: "DRAFT", sessionSummary }
```

**Success Action:**
- Save `classId` to wizard state
- Navigate to STEP 3 (skip STEP 2 auto-review)
- Toast: "Lớp CS101-A-2025 đã được tạo với 36 buổi học"

---

### 4.4 Step3TimeSlots

**Purpose:** Gán time slots cho từng ngày trong tuần

**Pattern-Based Assignment:**
```typescript
interface TimeSlotAssignment {
  dayOfWeek: number     // 0-6
  timeSlotTemplateId: number
}

interface TimeSlotOption {
  id: number
  name: string          // "Buổi sáng (8:00-10:00)"
  startTime: string
  endTime: string
}
```

**UI Layout:**
- Dropdown cho mỗi ngày: `scheduleDays` từ STEP 1
- Preview box: Hiển thị tổng hợp assignments
- Progress: "36/36 buổi đã gán"

**Component Mapping:**
- Dropdown: `<Select>` (shadcn/ui)
- Preview: Simple bordered div (không dùng Card)

**API Call:**
```typescript
POST /api/v1/classes/{classId}/time-slots
{
  assignments: [
    { dayOfWeek: 1, timeSlotTemplateId: 5 },
    { dayOfWeek: 3, timeSlotTemplateId: 5 },
    { dayOfWeek: 5, timeSlotTemplateId: 6 }
  ]
}
→ Returns: { successCount: 36, failedCount: 0 }
```

**Success Action:**
- Toast: "Đã gán khung giờ cho 36/36 buổi học"
- Navigate to STEP 4

---

### 4.5 Step4Resources

**Purpose:** Gán resources (phòng học/online) với conflict detection

**Pattern-Based Assignment:**
```typescript
interface ResourceAssignment {
  dayOfWeek: number
  resourceId: number
}

interface ResourceOption {
  id: number
  name: string          // "Phòng A101"
  capacity: number
  type: 'ROOM' | 'ONLINE_ACCOUNT'
}
```

**Conflict Handling:**
```typescript
interface ResourceConflict {
  sessionId: number
  sessionDate: string
  dayOfWeek: string
  conflictReason: 'CAPACITY_EXCEEDED' | 'BOOKING_CONFLICT' | 'UNKNOWN'
  requestedCapacity: number
  availableCapacity: number
  resourceId: number
  resourceName: string
  conflictingClasses: string[]
}
```

**UI Flow:**
1. User selects resources cho từng ngày
2. Click "Gán Tài Nguyên"
3. API call → If `conflictCount > 0`, show `<ConflictDialog>`
4. User resolves conflicts manually
5. Retry → Success

**Component Mapping:**
- Dropdown: `<Select>`
- Conflict Dialog: `<Dialog>` + `<Table>`

**API Call:**
```typescript
POST /api/v1/classes/{classId}/resources
{
  pattern: [
    { dayOfWeek: 1, resourceId: 101 },
    { dayOfWeek: 3, resourceId: 101 },
    { dayOfWeek: 5, resourceId: 102 }
  ]
}
→ Returns: {
  successCount: 32,
  conflictCount: 4,
  conflicts: [...]
}
```

---

### 4.6 Step5ATeachers

**Purpose:** Xem danh sách teachers available với PRE-CHECK

**Teacher Data:**
```typescript
interface AvailableTeacher {
  teacherId: number
  teacherName: string
  email: string
  skills: string[]
  yearsExperience: number
  availabilityStatus: 'FULLY_AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE'
  availableSessions: number
  totalSessions: number
  availabilityPercentage: number
  conflictBreakdown: {
    noAvailability: number
    teachingConflict: number
    leaveConflict: number
    skillMismatch: number
  }
  conflictingSessions: ConflictSession[]
}
```

**UI Features:**
- Table sorting by availability %
- Badges: ✅ Green (100%), ⚠️ Yellow (1-99%), ❌ Red (0%)
- Expandable rows: Show conflicting sessions
- Radio selection: Choose teacher

**Component Mapping:**
- Table: `<Table>`
- Badges: `<Badge variant="success|warning|destructive">`
- Radio: `<RadioGroup>`
- Expand: `<Collapsible>`

**API Call:**
```typescript
GET /api/v1/classes/{classId}/available-teachers
→ Returns: { data: AvailableTeacher[] }
```

---

### 4.7 Step5BAssignTeacher

**Purpose:** Confirm teacher assignment (full or partial)

**Options:**
- Full Assignment: Assign to all sessions (default)
- Partial Assignment: Assign to specific sessions

**Component Mapping:**
- Radio: `<ToggleGroup>` for full/partial choice
- Info card: Teacher summary (không dùng `<Card>`)

**API Call:**
```typescript
// Full Assignment
POST /api/v1/classes/{classId}/teachers
{
  teacherId: 101
}
→ Returns: {
  assignedCount: 36,
  needsSubstitute: false
}

// Partial Assignment
POST /api/v1/classes/{classId}/teachers
{
  teacherId: 102,
  sessionIds: [1, 2, 3, ..., 12]
}
→ Returns: {
  assignedCount: 12,
  needsSubstitute: true,
  remainingSessions: 24
}
```

**Handling `needsSubstitute`:**
- Show dialog: "24 buổi học chưa có giáo viên"
- Options: [Gán giáo viên khác] → Back to STEP 5A | [Tiếp tục] → STEP 6 (will fail validation)

---

### 4.8 Step6Validate

**Purpose:** Validate class completeness trước khi submit

**Validation Summary:**
```typescript
interface ValidationSummary {
  isValid: boolean
  validationSummary: {
    totalSessions: number
    sessionsWithTimeSlots: number
    sessionsWithResources: number
    sessionsWithTeachers: number
  }
  missingAssignments: {
    sessionId: number
    sessionDate: string
    missingFields: string[]  // ["resource", "teacher"]
  }[]
}
```

**UI Layout:**
- Checklist: ✅ Time slots, ✅ Resources, ✅ Teachers
- If valid: Summary card + "Gửi Duyệt" button enabled
- If invalid: Error list với links to fix steps

**Component Mapping:**
- Checklist: `<div>` với icons
- Error list: `<Alert variant="destructive">`

**API Call:**
```typescript
POST /api/v1/classes/{classId}/validate
→ Returns: ValidationSummary
```

---

### 4.9 Step7Submit

**Purpose:** Final review và submit for approval

**UI Layout:**
- Class summary: All info từ STEP 1-6
- Warning: "Sau khi gửi, lớp học sẽ ở trạng thái 'Chờ duyệt'"
- Checkbox: "Tôi xác nhận thông tin trên là chính xác"
- Buttons: [Quay lại] [Lưu nháp] [Gửi Duyệt]

**API Call:**
```typescript
POST /api/v1/classes/{classId}/submit
→ Returns: {
  status: "SCHEDULED",
  approvalStatus: "PENDING"
}
```

**Success Action:**
- Show `<SuccessDialog>`
- Clear draft from localStorage
- Options: [Xem lớp học] [Về trang chủ] [Tạo lớp mới]

---

## 5. API Integration

### 5.1 RTK Query Service

**File:** `src/store/services/classCreationApi.ts`

```typescript
import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './authApi'

export const classCreationApi = createApi({
  reducerPath: 'classCreationApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    createClass: builder.mutation({
      query: (data) => ({
        url: '/classes',
        method: 'POST',
        body: data
      })
    }),
    assignTimeSlots: builder.mutation({
      query: ({ classId, assignments }) => ({
        url: `/classes/${classId}/time-slots`,
        method: 'POST',
        body: { assignments }
      })
    }),
    assignResources: builder.mutation({
      query: ({ classId, pattern }) => ({
        url: `/classes/${classId}/resources`,
        method: 'POST',
        body: { pattern }
      })
    }),
    getAvailableTeachers: builder.query({
      query: (classId) => `/classes/${classId}/available-teachers`
    }),
    assignTeacher: builder.mutation({
      query: ({ classId, teacherId, sessionIds }) => ({
        url: `/classes/${classId}/teachers`,
        method: 'POST',
        body: { teacherId, sessionIds }
      })
    }),
    validateClass: builder.mutation({
      query: (classId) => ({
        url: `/classes/${classId}/validate`,
        method: 'POST'
      })
    }),
    submitClass: builder.mutation({
      query: (classId) => ({
        url: `/classes/${classId}/submit`,
        method: 'POST'
      })
    }),
    // Optional: Get sessions for STEP 2 review
    getClassSessions: builder.query({
      query: (classId) => `/classes/${classId}/sessions`
    })
  })
})

export const {
  useCreateClassMutation,
  useAssignTimeSlotsMutation,
  useAssignResourcesMutation,
  useGetAvailableTeachersQuery,
  useAssignTeacherMutation,
  useValidateClassMutation,
  useSubmitClassMutation,
  useGetClassSessionsQuery
} = classCreationApi
```

### 5.2 Error Handling Pattern

**Reference:** `studentAbsenceRequestApi.ts`

```typescript
// In component
const [createClass, { isLoading, error }] = useCreateClassMutation()

const handleSubmit = async (data: CreateClassFormData) => {
  try {
    const response = await createClass(data).unwrap()

    if (response.success) {
      toast.success(response.message)
      setClassId(response.data.classId)
      navigateToStep(3)
    }
  } catch (err: any) {
    if (err.status === 400) {
      // Validation errors
      if (err.data?.data && typeof err.data.data === 'object') {
        // Field-level errors
        Object.entries(err.data.data).forEach(([field, message]) => {
          setError(field as any, { message: message as string })
        })
      } else {
        // Business logic error
        toast.error(err.data?.message || 'Có lỗi xảy ra')
      }
    } else if (err.status === 401) {
      // Unauthorized → redirect to login
      navigate('/login')
    } else if (err.status === 403) {
      toast.error('Bạn không có quyền thực hiện thao tác này')
    } else {
      toast.error('Lỗi kết nối. Vui lòng thử lại.')
    }
  }
}
```

---

## 6. State Management Strategy

### 6.1 Wizard State (Context or Local State)

**Option 1: URL Params + Local State (Recommended)**

```typescript
// URL: /academic/classes/create?step=3&classId=123

const useWizardNavigation = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentStep = parseInt(searchParams.get('step') || '1') as WizardStep
  const classId = parseInt(searchParams.get('classId') || '0') || null

  const navigateToStep = (step: WizardStep, classId?: number) => {
    const params = new URLSearchParams()
    params.set('step', step.toString())
    if (classId) params.set('classId', classId.toString())
    setSearchParams(params)
  }

  return { currentStep, classId, navigateToStep }
}
```

**Option 2: React Context (Alternative)**

```typescript
interface WizardContextValue {
  currentStep: WizardStep
  completedSteps: number[]
  classId: number | null
  navigateToStep: (step: WizardStep) => void
  markStepComplete: (step: number) => void
}

const WizardContext = createContext<WizardContextValue>(...)
```

### 6.2 Draft Persistence

**LocalStorage Strategy:**

```typescript
interface ClassDraft {
  step: number
  classId: number | null
  formData: Partial<CreateClassFormData>
  timestamp: number
}

const DRAFT_KEY = 'create-class-draft'
const DRAFT_EXPIRY = 24 * 60 * 60 * 1000  // 24 hours

const saveDraft = (draft: Partial<ClassDraft>) => {
  const existing = loadDraft()
  const updated = {
    ...existing,
    ...draft,
    timestamp: Date.now()
  }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(updated))
}

const loadDraft = (): ClassDraft | null => {
  const stored = localStorage.getItem(DRAFT_KEY)
  if (!stored) return null

  const draft = JSON.parse(stored) as ClassDraft

  // Check expiry
  if (Date.now() - draft.timestamp > DRAFT_EXPIRY) {
    localStorage.removeItem(DRAFT_KEY)
    return null
  }

  return draft
}

const clearDraft = () => {
  localStorage.removeItem(DRAFT_KEY)
}
```

**Auto-save Hook:**

```typescript
const useDraftPersistence = (classId: number | null, formData: any) => {
  useEffect(() => {
    if (!classId) return

    const timeoutId = setTimeout(() => {
      saveDraft({ classId, formData })
    }, 1000)  // Debounce 1s

    return () => clearTimeout(timeoutId)
  }, [classId, formData])
}
```

---

## 7. Testing Strategy

### 7.1 Unit Tests (Vitest)

**Components to Test:**
- `ProgressIndicator`: Renders correct states
- `useWizardNavigation`: Navigation logic
- `useDraftPersistence`: Save/load draft
- Form validation schemas (Zod)

**Example:**
```typescript
describe('ProgressIndicator', () => {
  it('renders 7 steps', () => {
    render(<ProgressIndicator currentStep={1} completedSteps={[]} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(7)
  })

  it('highlights active step', () => {
    render(<ProgressIndicator currentStep={3} completedSteps={[1, 2]} />)
    expect(screen.getByText('Bước 3')).toHaveClass('active')
  })
})
```

### 7.2 Integration Tests

**Scenarios:**
1. **Happy Path**: STEP 1 → 7 without errors
2. **Conflict Path**: STEP 4 với resource conflicts → resolve → continue
3. **Validation Error**: STEP 1 với invalid data → fix → retry
4. **Partial Teacher**: STEP 5B với partial assignment → assign 2nd teacher

### 7.3 Manual Testing Checklist

**STEP 1:**
- [ ] Form validation works (inline + submit)
- [ ] Date picker chỉ cho chọn future dates
- [ ] Schedule days: Minimum 1, maximum 7
- [ ] Success toast hiển thị
- [ ] Navigate to STEP 3 after success

**STEP 3:**
- [ ] Dropdowns hiển thị time slot options
- [ ] Preview updates real-time
- [ ] API call successful → toast + navigate

**STEP 4:**
- [ ] Resource dropdown theo modality
- [ ] Conflict dialog hiển thị nếu có
- [ ] Resolve conflicts → retry successful

**STEP 5A:**
- [ ] Table sorts by availability %
- [ ] Badges color-coded correctly
- [ ] Expand conflicts works
- [ ] Select teacher → enable Next

**STEP 5B:**
- [ ] Full/Partial toggle works
- [ ] `needsSubstitute` dialog shows if partial

**STEP 6:**
- [ ] Validation checklist correct
- [ ] Missing assignments show error

**STEP 7:**
- [ ] Summary displays all info
- [ ] Checkbox required to submit
- [ ] Success dialog shows
- [ ] Draft cleared after submit

**Cross-cutting:**
- [ ] Back button works (data preserved)
- [ ] Draft saves automatically
- [ ] Draft restores on page reload
- [ ] Mobile responsive
- [ ] Keyboard navigation
- [ ] Screen reader accessible

---

## 8. Deployment Checklist

### 8.1 Pre-deployment

- [ ] All unit tests pass
- [ ] Manual testing complete (all scenarios)
- [ ] Code review completed
- [ ] Performance check (bundle size, load time)
- [ ] Accessibility audit (WCAG AA)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing (iOS, Android)

### 8.2 Backend Coordination

- [ ] Confirm all API endpoints deployed
- [ ] Test API calls on staging environment
- [ ] Verify error responses match documentation
- [ ] Check performance targets (<200ms for bulk operations)

### 8.3 Feature Flags (Optional)

```typescript
const FEATURE_CREATE_CLASS_ENABLED = import.meta.env.VITE_FEATURE_CREATE_CLASS === 'true'

// In navigation
{FEATURE_CREATE_CLASS_ENABLED && (
  <Link to="/academic/classes/create">Tạo Lớp Học Mới</Link>
)}
```

### 8.4 Monitoring

**Metrics to Track:**
- Task completion rate (% users finish STEP 1 → 7)
- Average time per step
- Error rate by step
- Conflict resolution success rate
- API response times (track `processingTimeMs`)

**Error Tracking:**
- Sentry/LogRocket integration
- Track validation errors
- Track API errors (400, 500)
- Track browser/device for errors

---

## 9. Risk Mitigation

### 9.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| API endpoint không ready | High | Phối hợp với Backend team, test trên Swagger trước |
| Conflict resolution phức tạp | Medium | Implement mock data để test UI flow trước |
| Draft persistence lỗi | Low | Fallback: Không có draft thì start from scratch |
| Performance issues (36 sessions) | Medium | Lazy load components, optimize re-renders |

### 9.2 UX Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| User không hiểu workflow | High | Clear labels, help text, progress indicator |
| User bỏ dở giữa chừng | Medium | Draft auto-save, confirmation dialog |
| Validation errors khó hiểu | Medium | Vietnamese error messages, field-level errors |
| Mobile UX kém | Medium | Test sớm, adjust layout for small screens |

---

## 10. Next Steps

### Immediate Actions (Today)

1. **Create GitHub Issue** với checklist from this plan
2. **Setup branch**: `feature/create-class-workflow`
3. **Create stub files** cho all components
4. **Start Phase 1**: API service + STEP 1

### Communication

- **Daily standup**: Update progress, blockers
- **Backend sync**: API endpoints, data formats
- **Design review**: After STEP 1 complete, review với team

### Documentation

- Update README với feature description
- Add JSDoc comments cho complex logic
- Create user guide (if needed)

---

**End of Implementation Plan**

**Ready to Start:** ✅
**Estimated Completion:** 5-7 days
**Next:** Create GitHub issue + start coding

